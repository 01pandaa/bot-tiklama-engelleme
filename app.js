const elements = {
  siteSelect: document.getElementById('siteSelect'),
  refreshBtn: document.getElementById('refreshBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  welcomeTitle: document.getElementById('welcomeTitle'),
  dashboardSubtitle: document.getElementById('dashboardSubtitle'),
  dashboardAlert: document.getElementById('dashboardAlert'),
  systemState: document.getElementById('systemState'),
  totalVisits: document.getElementById('totalVisits'),
  suspiciousVisits: document.getElementById('suspiciousVisits'),
  botVisits: document.getElementById('botVisits'),
  blockedIps: document.getElementById('blockedIps'),
  totalTrend: document.getElementById('totalTrend'),
  suspiciousTrend: document.getElementById('suspiciousTrend'),
  botRate: document.getElementById('botRate'),
  navSuspiciousCount: document.getElementById('navSuspiciousCount'),
  period: document.getElementById('period'),
  chartSubtitle: document.getElementById('chartSubtitle'),
  chartYLabels: document.getElementById('chartYLabels'),
  chartLabels: document.getElementById('chartLabels'),
  chartFillPath: document.getElementById('chartFillPath'),
  chartLinePath: document.getElementById('chartLinePath'),
  scoreRing: document.getElementById('scoreRing'),
  securityScore: document.getElementById('securityScore'),
  securityDot: document.getElementById('securityDot'),
  securityState: document.getElementById('securityState'),
  securityNote: document.getElementById('securityNote'),
  riskFilter: document.getElementById('riskFilter'),
  clickTable: document.getElementById('clickTable'),
  resultsSummary: document.getElementById('resultsSummary'),
  showAllBtn: document.getElementById('showAllBtn'),
  siteStatus: document.getElementById('siteStatus'),
  siteName: document.getElementById('siteName'),
  siteDomain: document.getElementById('siteDomain'),
  siteLastSeen: document.getElementById('siteLastSeen'),
  blockedCountCard: document.getElementById('blockedCountCard'),
  blockedSummary: document.getElementById('blockedSummary')
};

const state = {
  sites: [],
  site: null,
  rows: [],
  blocked: [],
  periodDays: 7,
  filter: 'suspicious',
  visibleLimit: 5,
  loading: false
};

const numberFormat = new Intl.NumberFormat('tr-TR');
const dateFormat = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
const dayFormat = new Intl.DateTimeFormat('tr-TR', { weekday: 'short', day: '2-digit', month: '2-digit' });

function formatNumber(value) {
  return numberFormat.format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date);
}

function getStoredSiteId() {
  try {
    return new URLSearchParams(location.search).get('site') || localStorage.getItem('clickshield_selected_site');
  } catch (_) {
    return new URLSearchParams(location.search).get('site');
  }
}

function storeSiteId(id) {
  try {
    localStorage.setItem('clickshield_selected_site', id);
  } catch (_) {
    // Storage may be disabled by the browser; the URL remains the source of truth.
  }
}

function showAlert(message) {
  if (!elements.dashboardAlert) return;
  elements.dashboardAlert.textContent = message;
  elements.dashboardAlert.hidden = false;
}

function clearAlert() {
  if (!elements.dashboardAlert) return;
  elements.dashboardAlert.textContent = '';
  elements.dashboardAlert.hidden = true;
}

function setUser(user) {
  const name = user?.user_metadata?.full_name || 'Müşteri';
  const email = user?.email || '';
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const userAvatar = document.getElementById('userAvatar');
  if (userName) userName.textContent = name;
  if (userEmail) userEmail.textContent = email;
  if (userAvatar) userAvatar.textContent = (name || email || 'M').trim().charAt(0).toUpperCase();
  if (elements.welcomeTitle) elements.welcomeTitle.textContent = `Hoş geldin, ${name} 👋`;
}

function setMetric(element, value) {
  if (element) element.textContent = value == null ? '—' : formatNumber(value);
}

function resetMetrics() {
  setMetric(elements.totalVisits, null);
  setMetric(elements.suspiciousVisits, null);
  setMetric(elements.botVisits, null);
  setMetric(elements.blockedIps, null);
  setMetric(elements.blockedCountCard, null);
  if (elements.totalTrend) elements.totalTrend.textContent = '—';
  if (elements.suspiciousTrend) elements.suspiciousTrend.textContent = '—';
  if (elements.botRate) elements.botRate.textContent = '—';
  if (elements.navSuspiciousCount) {
    elements.navSuspiciousCount.textContent = '0';
    elements.navSuspiciousCount.hidden = true;
  }
}

function setSiteCard(site, latestVisit) {
  if (!site) {
    if (elements.siteName) elements.siteName.textContent = '—';
    if (elements.siteDomain) elements.siteDomain.textContent = 'Site seçilmedi';
    if (elements.siteLastSeen) elements.siteLastSeen.textContent = '';
    if (elements.siteStatus) elements.siteStatus.textContent = '● Bekleniyor';
    return;
  }

  if (elements.siteName) elements.siteName.textContent = site.name || 'Adsız site';
  if (elements.siteDomain) elements.siteDomain.textContent = site.domain || 'Domain belirtilmemiş';
  if (elements.siteLastSeen) elements.siteLastSeen.textContent = latestVisit ? `Son veri: ${formatDate(latestVisit.occurred_at)}` : 'Henüz veri yok';
  if (elements.siteStatus) {
    elements.siteStatus.textContent = site.active ? '● Aktif' : '● Pasif';
    elements.siteStatus.className = `ok-pill ${site.active ? '' : 'inactive-pill'}`;
  }
}

function populateSites() {
  if (!elements.siteSelect) return;
  elements.siteSelect.replaceChildren();
  if (!state.sites.length) {
    elements.siteSelect.append(new Option('Önce site ekle', ''));
    elements.siteSelect.disabled = true;
    return;
  }

  elements.siteSelect.disabled = false;
  state.sites.forEach((site) => {
    const option = new Option(site.name || site.domain || 'Adsız site', site.id);
    option.title = site.domain || '';
    elements.siteSelect.append(option);
  });
  if (state.site) elements.siteSelect.value = state.site.id;
}

function setSelectedSite(site) {
  state.site = site || null;
  if (!site) {
    resetMetrics();
    setSiteCard(null);
    if (elements.dashboardSubtitle) elements.dashboardSubtitle.textContent = 'Henüz takip edilen site yok. Sitelerim sayfasından yeni site ekleyebilirsin.';
    if (elements.systemState) elements.systemState.lastChild.textContent = ' Site bekleniyor';
    renderRows([]);
    drawChart([]);
    updateScore(null);
    showAlert('Dashboard verilerini görmek için önce Sitelerim sayfasından bir site eklemelisin.');
    return;
  }

  storeSiteId(site.id);
  const url = new URL(location.href);
  url.searchParams.set('site', site.id);
  history.replaceState(null, '', url);
  if (elements.siteSelect) elements.siteSelect.value = site.id;
  if (elements.dashboardSubtitle) elements.dashboardSubtitle.textContent = `${site.domain || site.name} · son 24 saatlik ziyaret özeti`;
  if (elements.systemState) elements.systemState.lastChild.textContent = site.active ? ' Sistem aktif' : ' Site pasif';
  setSiteCard(site, null);
  clearAlert();
}

async function loadSites() {
  const { data, error } = await client
    .from('sites')
    .select('id,name,domain,site_key,active,created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error('Siteler yüklenemedi.');

  state.sites = data || [];
  const selectedId = getStoredSiteId();
  const selected = state.sites.find((site) => site.id === selectedId) || state.sites[0] || null;
  populateSites();
  setSelectedSite(selected);
}

function assertResult(result, message) {
  if (result.error) throw new Error(message);
  return result;
}

function periodStart(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function loadSiteData() {
  if (!state.site) return;
  state.loading = true;
  clearAlert();
  if (elements.refreshBtn) {
    elements.refreshBtn.disabled = true;
    elements.refreshBtn.textContent = 'Yükleniyor…';
  }

  const last24Hours = periodStart(1);
  const chartFrom = periodStart(state.periodDays);
  const siteId = state.site.id;

  try {
    const [totalResult, suspiciousResult, botResult, blockedResult, visitsResult, chartResult] = await Promise.all([
      client.from('visits').select('id', { count: 'exact', head: true }).eq('site_id', siteId).gte('occurred_at', last24Hours),
      client.from('visits').select('id', { count: 'exact', head: true }).eq('site_id', siteId).gte('occurred_at', last24Hours).in('risk_level', ['high', 'medium']),
      client.from('visits').select('id', { count: 'exact', head: true }).eq('site_id', siteId).gte('occurred_at', last24Hours).eq('is_bot', true),
      client.from('blocked_ips').select('id,ip_address,reason,created_at', { count: 'exact' }).eq('site_id', siteId).order('created_at', { ascending: false }),
      client.from('visits').select('id,ip_address,occurred_at,referrer,page_url,device_type,country,region,city,risk_score,risk_level,is_bot,google_click_id,session_id').eq('site_id', siteId).gte('occurred_at', last24Hours).order('occurred_at', { ascending: false }).limit(200),
      client.from('visits').select('occurred_at,risk_level,is_bot').eq('site_id', siteId).gte('occurred_at', chartFrom).order('occurred_at', { ascending: true }).limit(5000)
    ]);

    assertResult(totalResult, 'Toplam ziyaretler alınamadı.');
    assertResult(suspiciousResult, 'Şüpheli ziyaretler alınamadı.');
    assertResult(botResult, 'Bot ziyaretleri alınamadı.');
    assertResult(blockedResult, 'Koruma listesi alınamadı.');
    assertResult(visitsResult, 'Ziyaret kayıtları alınamadı.');
    assertResult(chartResult, 'Grafik verileri alınamadı.');

    const total = totalResult.count || 0;
    const suspicious = suspiciousResult.count || 0;
    const bots = botResult.count || 0;
    const blocked = blockedResult.count || 0;
    state.rows = visitsResult.data || [];
    state.blocked = blockedResult.data || [];

    setMetric(elements.totalVisits, total);
    setMetric(elements.suspiciousVisits, suspicious);
    setMetric(elements.botVisits, bots);
    setMetric(elements.blockedIps, blocked);
    setMetric(elements.blockedCountCard, blocked);
    if (elements.totalTrend) elements.totalTrend.textContent = 'Güncel';
    if (elements.suspiciousTrend) elements.suspiciousTrend.textContent = total ? `${((suspicious / total) * 100).toFixed(1).replace('.', ',')}% oran` : '0% oran';
    if (elements.botRate) elements.botRate.textContent = total ? `${((bots / total) * 100).toFixed(1).replace('.', ',')}%` : '0%';
    if (elements.navSuspiciousCount) {
      elements.navSuspiciousCount.textContent = formatNumber(suspicious);
      elements.navSuspiciousCount.hidden = suspicious === 0;
    }
    if (elements.blockedSummary) elements.blockedSummary.textContent = blocked ? `${formatNumber(blocked)} IP koruma listesinde kayıtlı.` : 'Şüpheli bir IP’yi listene eklediğinde burada görebilirsin.';
    if (elements.dashboardSubtitle) elements.dashboardSubtitle.textContent = `${state.site.domain || state.site.name} · son 24 saatlik ziyaret özeti`;
    setSiteCard(state.site, state.rows[0]);
    updateScore({ total, suspicious, bots });
    renderRows(state.rows);
    drawChart(chartResult.data || []);
  } catch (error) {
    showAlert(error.message || 'Dashboard verileri yüklenemedi.');
  } finally {
    state.loading = false;
    if (elements.refreshBtn) {
      elements.refreshBtn.disabled = false;
      elements.refreshBtn.textContent = '↻ Yenile';
    }
  }
}

function riskLabel(level) {
  return level === 'high' ? 'Yüksek' : level === 'medium' ? 'Orta' : 'Düşük';
}

function riskClass(level) {
  return level === 'high' || level === 'medium' ? level : 'low';
}

function locationLabel(row) {
  return [row.city, row.region, row.country].filter(Boolean).join(', ') || 'Bilinmiyor';
}

function sourceLabel(row) {
  if (row.google_click_id) return 'Google Ads';
  if (!row.referrer) return 'Direkt';
  try {
    return new URL(row.referrer).hostname.replace(/^www\./, '') || 'Yönlendiren site';
  } catch (_) {
    return 'Yönlendiren site';
  }
}

function cell(text, className) {
  const td = document.createElement('td');
  td.textContent = text == null || text === '' ? '—' : String(text);
  if (className) td.className = className;
  return td;
}

function renderRows(rows) {
  if (!elements.clickTable) return;
  const filtered = (rows || []).filter((row) => {
    if (state.filter === 'bot') return row.is_bot === true;
    if (state.filter === 'all') return true;
    return row.risk_level === 'high' || row.risk_level === 'medium' || row.is_bot === true;
  });
  const visibleRows = filtered.slice(0, state.visibleLimit);
  const blockedSet = new Set(state.blocked.map((item) => String(item.ip_address)));
  elements.clickTable.replaceChildren();

  if (!visibleRows.length) {
    const row = document.createElement('tr');
    const empty = cell(state.rows.length ? 'Bu filtrede ziyaret bulunamadı.' : 'Henüz ziyaret verisi yok.');
    empty.colSpan = 7;
    empty.className = 'empty-cell';
    row.append(empty);
    elements.clickTable.append(row);
  } else {
    visibleRows.forEach((item) => {
      const row = document.createElement('tr');
      const ipCell = cell(item.ip_address || 'Bilinmiyor');
      const ip = document.createElement('strong');
      ip.textContent = item.ip_address || 'Bilinmiyor';
      ipCell.replaceChildren(ip);
      row.append(ipCell, cell(formatDate(item.occurred_at)), cell(locationLabel(item)), cell(sourceLabel(item)));

      const scoreCell = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `badge ${riskClass(item.risk_level)}`;
      badge.textContent = `${riskLabel(item.risk_level)} · ${Number.isFinite(Number(item.risk_score)) ? item.risk_score : 0}`;
      scoreCell.append(badge);
      row.append(scoreCell);

      const status = item.is_bot ? 'Bot' : (item.risk_level === 'low' ? 'Normal' : 'Şüpheli');
      row.append(cell(status, 'status'));

      const actionCell = document.createElement('td');
      const button = document.createElement('button');
      button.className = 'block';
      button.type = 'button';
      button.textContent = !item.ip_address ? 'IP yok' : blockedSet.has(String(item.ip_address)) ? 'Listede' : 'Listeye ekle';
      button.disabled = !item.ip_address || blockedSet.has(String(item.ip_address));
      button.addEventListener('click', () => blockIp(item));
      actionCell.append(button);
      row.append(actionCell);
      elements.clickTable.append(row);
    });
  }

  if (elements.resultsSummary) {
    elements.resultsSummary.textContent = filtered.length ? `${formatNumber(filtered.length)} kayıttan 1–${formatNumber(visibleRows.length)} gösteriliyor` : 'Gösterilecek kayıt yok.';
  }
  if (elements.showAllBtn) {
    elements.showAllBtn.hidden = filtered.length <= state.visibleLimit;
    elements.showAllBtn.textContent = state.visibleLimit > 5 ? 'Daha az göster ↑' : 'Daha fazla göster →';
  }
}

async function blockIp(row) {
  const ip = String(row.ip_address || '').trim();
  if (!ip || !state.site || state.loading) return;
  if (!window.confirm(`${ip} adresini ${state.site.name || 'bu site'} için koruma listesine eklemek istiyor musun?`)) return;

  const { error } = await client.from('blocked_ips').insert({
    site_id: state.site.id,
    ip_address: ip,
    reason: 'Panelden manuel olarak işaretlendi'
  });
  if (error && error.code !== '23505') {
    showAlert('IP koruma listesine eklenemedi. Supabase izinlerini kontrol et.');
    return;
  }
  await loadSiteData();
}

function updateScore(stats) {
  if (!stats || !stats.total) {
    if (elements.securityScore) elements.securityScore.textContent = '—';
    if (elements.securityState) elements.securityState.textContent = 'Veri bekleniyor';
    if (elements.securityNote) elements.securityNote.textContent = 'Güvenlik göstergesi için en az bir ziyaret kaydı gerekir.';
    if (elements.scoreRing) elements.scoreRing.style.background = 'conic-gradient(#e9edf3 0 100%)';
    return;
  }

  const suspiciousRate = stats.suspicious / stats.total;
  const botRate = stats.bots / stats.total;
  const score = Math.max(0, Math.min(100, Math.round(100 - suspiciousRate * 70 - botRate * 30)));
  const stateLabel = score >= 80 ? 'İyi durumda' : score >= 60 ? 'Dikkat gerekli' : 'İnceleme gerekli';
  if (elements.securityScore) elements.securityScore.textContent = String(score);
  if (elements.securityState) elements.securityState.textContent = stateLabel;
  if (elements.securityDot) elements.securityDot.className = score >= 80 ? 'good' : score >= 60 ? 'warning' : 'danger';
  if (elements.scoreRing) elements.scoreRing.style.background = `conic-gradient(#2563eb 0 ${score}%, #e9edf3 ${score}% 100%)`;
  if (elements.securityNote) elements.securityNote.textContent = `Son 24 saatte ${formatNumber(stats.total)} ziyaretin ${formatNumber(stats.suspicious)} tanesi şüpheli sinyal taşıyor.`;
}

function chartDays(days) {
  const now = new Date();
  const result = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    result.push({ key: dateKey(date), date, count: 0 });
  }
  return result;
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function drawChart(rows) {
  const days = chartDays(state.periodDays);
  const byKey = new Map(days.map((item) => [item.key, item]));
  (rows || []).forEach((row) => {
    const date = new Date(row.occurred_at);
    if (Number.isNaN(date.getTime())) return;
    const item = byKey.get(dateKey(date));
    if (item) item.count += 1;
  });

  const values = days.map((item) => item.count);
  const max = Math.max(...values, 1);
  const width = 700;
  const height = 190;
  const points = values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - (value / max) * (height - 12);
    return [Number(x.toFixed(2)), Number(y.toFixed(2))];
  });
  const line = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x},${y}`).join(' ');
  const fill = `${line} L${width},${height} L0,${height} Z`;
  if (elements.chartLinePath) elements.chartLinePath.setAttribute('d', line);
  if (elements.chartFillPath) elements.chartFillPath.setAttribute('d', fill);
  if (elements.chartSubtitle) elements.chartSubtitle.textContent = `Son ${state.periodDays} gün · alınan ziyaret kayıtları`;

  if (elements.chartYLabels) {
    const labels = [max, Math.ceil(max * 0.75), Math.ceil(max * 0.5), Math.ceil(max * 0.25), 0];
    elements.chartYLabels.replaceChildren(...labels.map((value) => {
      const span = document.createElement('span');
      span.textContent = formatNumber(value);
      return span;
    }));
  }
  if (elements.chartLabels) {
    elements.chartLabels.replaceChildren(...days.map((item, index) => {
      const span = document.createElement('span');
      span.textContent = state.periodDays === 30 && index % 5 !== 0 && index !== days.length - 1 ? '' : dayFormat.format(item.date);
      return span;
    }));
  }
}

async function start() {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) {
    location.replace('login.html');
    return;
  }
  setUser(data.session.user);

  try {
    await loadSites();
    if (state.site) await loadSiteData();
  } catch (error) {
    resetMetrics();
    renderRows([]);
    drawChart([]);
    showAlert(error.message || 'Dashboard verileri yüklenemedi.');
  }
}

elements.siteSelect?.addEventListener('change', async (event) => {
  const selected = state.sites.find((site) => site.id === event.target.value);
  if (!selected || state.loading) return;
  setSelectedSite(selected);
  await loadSiteData();
});

elements.period?.addEventListener('change', async (event) => {
  state.periodDays = Number(event.target.value) || 7;
  state.visibleLimit = 5;
  if (state.site && !state.loading) await loadSiteData();
});

elements.riskFilter?.addEventListener('change', (event) => {
  state.filter = event.target.value;
  state.visibleLimit = 5;
  renderRows(state.rows);
});

elements.showAllBtn?.addEventListener('click', () => {
  state.visibleLimit = state.visibleLimit > 5 ? 5 : 50;
  renderRows(state.rows);
});

elements.refreshBtn?.addEventListener('click', () => {
  if (state.site && !state.loading) loadSiteData();
});

elements.logoutBtn?.addEventListener('click', async () => {
  await client.auth.signOut();
  location.replace('login.html');
});

resetMetrics();
start();
