import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-site-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const MAX_BODY_BYTES = 64 * 1024;
const campaignParams = [
  "gclid", "wbraid", "gbraid", "msclkid", "fbclid", "ttclid",
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
});

function textValue(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const valueTrimmed = value.trim();
  return valueTrimmed ? valueTrimmed.slice(0, max) : null;
}

function cleanUrl(raw: unknown, keepCampaign = false): string | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const source = new URL(raw);
    if (!['http:', 'https:'].includes(source.protocol)) return null;
    const clean = new URL(source.origin);
    clean.pathname = source.pathname || '/';
    if (keepCampaign) {
      campaignParams.forEach((key) => {
        const value = source.searchParams.get(key);
        if (value) clean.searchParams.set(key, value.slice(0, 300));
      });
    }
    return clean.toString().slice(0, 2000);
  } catch (_) {
    return null;
  }
}

function riskFor(userAgent: string | null, page: string | null, sessionId: string | null): number {
  let score = 0;
  if (!userAgent || /bot|crawler|spider|headless|curl|wget|python-requests/i.test(userAgent)) score += 70;
  if (!page) score += 10;
  if (!sessionId) score += 10;
  return Math.min(score, 100);
}

function firstForwardedIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
  const candidate = forwarded.split(",")[0]?.trim() || null;
  if (!candidate || candidate.length > 64 || !/^[0-9a-f:.]+$/i.test(candidate)) return null;
  return candidate;
}

async function geolocate(ip: string | null): Promise<Record<string, unknown>> {
  if (!ip) return {};
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: controller.signal });
    if (!response.ok) return {};
    const data = await response.json();
    if (!data.success) return {};
    return {
      country: typeof data.country === "string" ? data.country.slice(0, 100) : null,
      region: typeof data.region === "string" ? data.region.slice(0, 100) : null,
      city: typeof data.city === "string" ? data.city.slice(0, 100) : null,
      latitude: typeof data.latitude === "number" ? data.latitude : null,
      longitude: typeof data.longitude === "number" ? data.longitude : null,
      isp: typeof data.connection?.isp === "string" ? data.connection.isp.slice(0, 200) : null,
      asn: data.connection?.asn != null ? String(data.connection.asn).slice(0, 50) : null,
    };
  } catch (_) {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const siteKey = request.headers.get("x-site-key")?.trim() || "";
  if (!/^[a-f0-9]{24}$/i.test(siteKey)) return json({ error: "Invalid site key" }, 400);

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) return json({ error: "Payload too large" }, 413);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return json({ error: "Invalid payload" }, 400);

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: site, error: siteError } = await db
    .from("sites")
    .select("id,active")
    .eq("site_key", siteKey)
    .maybeSingle();
  if (siteError || !site || !site.active) return json({ error: "Invalid site key" }, 403);

  const page = cleanUrl(body.page, true);
  const referrer = cleanUrl(body.referrer);
  const userAgent = textValue(body.userAgent, 1000);
  const sessionId = textValue(body.sessionId, 100);
  const deviceType = ["mobile", "tablet", "desktop"].includes(String(body.deviceType))
    ? String(body.deviceType)
    : "unknown";
  const googleClickId = textValue(body.gclid || body.wbraid || body.gbraid, 200);
  const score = riskFor(userAgent, page, sessionId);
  const riskLevel = score >= 70 ? "high" : score >= 35 ? "medium" : "low";
  const geo = await geolocate(firstForwardedIp(request));

  const { error } = await db.from("visits").insert({
    site_id: site.id,
    ip_address: firstForwardedIp(request),
    user_agent: userAgent,
    referrer,
    page_url: page,
    device_type: deviceType,
    country: geo.country ?? request.headers.get("x-country") ?? null,
    region: geo.region ?? null,
    city: geo.city ?? null,
    latitude: geo.latitude ?? null,
    longitude: geo.longitude ?? null,
    isp: geo.isp ?? null,
    asn: geo.asn ?? null,
    session_id: sessionId,
    google_click_id: googleClickId,
    risk_score: score,
    risk_level: riskLevel,
    is_bot: score >= 70,
  });
  if (error) return json({ error: "Could not record visit" }, 500);
  return json({ ok: true });
});
