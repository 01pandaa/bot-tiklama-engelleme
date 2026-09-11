/* ClickShield website tracker v0.3.0
   The site key is public and identifies the site; it is not a secret.
   The server derives the visitor IP. The browser never reads or exposes it.
*/
(function () {
  if (window.BotClickProtection) return;

  const script = document.currentScript || document.querySelector('script[data-site-key]');
  const siteKey = script?.getAttribute('data-site-key')?.trim();
  if (!siteKey) return;

  const api = script?.getAttribute('data-endpoint') ||
    'https://snfjcdknsfwjnxrggypc.supabase.co/functions/v1/collect-visit';
  const sessionKey = 'clickshield_session';
  const sessionStartedKey = 'clickshield_session_started';
  const SESSION_WINDOW_MS = 30 * 60 * 1000;
  const allowedCampaignParams = [
    'gclid', 'wbraid', 'gbraid', 'msclkid', 'fbclid', 'ttclid',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'
  ];

  function createId() {
    try {
      if (crypto.randomUUID) return crypto.randomUUID();
    } catch (_) {
      // Fall back for older browsers or restricted privacy contexts.
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  function getSessionId() {
    let id = null;
    let started = 0;
    try {
      id = localStorage.getItem(sessionKey);
      started = Number(localStorage.getItem(sessionStartedKey) || 0);
      if (!id || !started || Date.now() - started > SESSION_WINDOW_MS) {
        id = createId();
        localStorage.setItem(sessionKey, id);
        localStorage.setItem(sessionStartedKey, String(Date.now()));
      }
    } catch (_) {
      id = id || createId();
    }
    return id;
  }

  function safeUrl(raw, keepCampaignParams = false) {
    if (!raw) return null;
    try {
      const url = new URL(raw, location.href);
      const clean = new URL(url.origin);
      clean.pathname = url.pathname || '/';
      if (keepCampaignParams) {
        allowedCampaignParams.forEach((key) => {
          const value = url.searchParams.get(key);
          if (value) clean.searchParams.set(key, value.slice(0, 300));
        });
      }
      return clean.toString();
    } catch (_) {
      return null;
    }
  }

  const params = new URLSearchParams(location.search);
  const campaign = {};
  allowedCampaignParams.forEach((key) => {
    const value = params.get(key);
    if (value) campaign[key] = value.slice(0, 300);
  });

  const payload = {
    eventType: 'page_view',
    page: safeUrl(location.href, true),
    referrer: safeUrl(document.referrer),
    userAgent: navigator.userAgent,
    language: navigator.language || null,
    screen: `${screen.width}x${screen.height}`,
    deviceType: innerWidth < 768 ? 'mobile' : innerWidth < 1024 ? 'tablet' : 'desktop',
    sessionId: getSessionId(),
    ...campaign,
    // Keep the existing field so the current Edge Function remains compatible.
    gclid: campaign.gclid || null
  };

  fetch(api, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Site-Key': siteKey },
    body: JSON.stringify(payload),
    keepalive: true,
    credentials: 'omit'
  }).catch(() => {
    // Tracking must never interrupt the customer's website.
  });

  window.BotClickProtection = {
    version: '0.3.0',
    siteKey,
    getEvent: () => ({ ...payload })
  };
})();
