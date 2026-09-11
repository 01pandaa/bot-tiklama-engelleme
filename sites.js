const elements = {
  siteList: document.getElementById('siteList'),
  siteSelect: document.getElementById('siteSelect'),
  codePanel: document.getElementById('codePanel'),
  codeBox: document.getElementById('codeBox'),
  copyCode: document.getElementById('copyCode'),
  blockedList: document.getElementById('blockedList'),
  sitesAlert: document.getElementById('sitesAlert'),
  addSiteBtn: document.getElementById('addSiteBtn'),
  logoutBtn: document.getElementById('logoutBtn')
};

let sites = [];

function showError(message) {
  if (!elements.sitesAlert) return;
  elements.sitesAlert.textContent = message;
  elements.sitesAlert.hidden = false;
}

function clearError() {
  if (!elements.sitesAlert) return;
  elements.sitesAlert.textContent = '';
  elements.sitesAlert.hidden = true;
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
}

function normalizeDomain(value) {
  let input = String(value || '').trim();
  if (!input) return null;
  if (!/^https?:\/\//i.test(input)) input = `https://${input}`;
  try {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return null;
    return url.origin;
  } catch (_) {
    return null;
  }
}

function populateSites() {
  if (!elements.siteSelect) return;
  elements.siteSelect.replaceChildren();
  if (!sites.length) {
    elements.siteSelect.append(new Option('Önce site ekle', ''));
    elements.siteSelect.disabled = true;
    return;
  }
  elements.siteSelect.disabled = false;
  sites.forEach((site) => elements.siteSelect.append(new Option(site.name || site.domain || 'Adsız site', site.id)));
  const selectedId = new URLSearchParams(location.search).get('site');
  if (selectedId && sites.some((site) => site.id === selectedId)) elements.siteSelect.value = selectedId;
}

function makeSiteRow(site) {
  const row = document.createElement('div');
  row.className = 'site-row';

  const domain = document.createElement('div');
  domain.className = 'domain';
  const icon = document.createElement('span');
  icon.className = 'domain-icon';
  icon.textContent = '↗';
  const details = document.createElement('div');
  const name = document.createElement('strong');
  name.textContent = site.name || 'Adsız site';
  const meta = document.createElement('small');
  meta.textContent = `${site.domain || 'Domain belirtilmemiş'} · `;
  const status = document.createElement('span');
  status.className = `ok-pill ${site.active ? '' : 'inactive-pill'}`;
  status.textContent = site.active ? '● Aktif' : '● Pasif';
  meta.append(status);
  details.append(name, meta);
  domain.append(icon, details);

  const actions = document.createElement('div');
  actions.className = 'site-actions';
  const open = document.createElement('a');
  open.className = 'ghost';
  open.href = `index.html?site=${encodeURIComponent(site.id)}`;
  open.textContent = 'Paneli aç';
  const code = document.createElement('button');
  code.className = 'ghost';
  code.type = 'button';
  code.textContent = 'Takip kodu';
  code.addEventListener('click', () => showCode(site));
  actions.append(open, code);
  row.append(domain, actions);
  return row;
}

function renderSites() {
  if (!elements.siteList) return;
  elements.siteList.replaceChildren();
  if (!sites.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    const strong = document.createElement('strong');
    strong.textContent = 'Henüz siten eklenmemiş.';
    empty.append(strong, document.createElement('br'), document.createTextNode('İlk siteni eklemek için “Yeni site ekle” butonunu kullan.'));
    elements.siteList.append(empty);
    return;
  }
  sites.forEach((site) => elements.siteList.append(makeSiteRow(site)));
}

async function loadSites() {
  const { data, error } = await client.from('sites').select('id,name,domain,site_key,active,created_at').order('created_at', { ascending: false });
  if (error) throw new Error('Siteler yüklenemedi. Supabase erişim ayarlarını kontrol et.');
  sites = data || [];
  populateSites();
  renderSites();
}

function showCode(site) {
  if (!site) return;
  const code = `<script src="https://01pandaa.github.io/bot-tiklama-engelleme/tracker/tracker.js" data-site-key="${site.site_key}" defer><\/script>`;
  elements.codeBox.textContent = code;
  elements.codePanel.hidden = false;
  elements.codePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  elements.copyCode.onclick = async () => {
    try {
      await navigator.clipboard.writeText(code);
      elements.copyCode.textContent = '✓ Kopyalandı';
      setTimeout(() => { elements.copyCode.textContent = 'Kodu kopyala'; }, 1200);
    } catch (_) {
      showError('Takip kodu panoya kopyalanamadı. Kodu kutudan elle kopyalayabilirsin.');
    }
  };
}

function makeBlockedRow(item) {
  const row = document.createElement('div');
  row.className = 'blocked-row';
  const info = document.createElement('div');
  const ip = document.createElement('strong');
  ip.textContent = String(item.ip_address || 'Bilinmiyor');
  const meta = document.createElement('small');
  const site = sites.find((entry) => entry.id === item.site_id);
  meta.textContent = `${site?.name || 'Site'} · ${item.reason || 'Manuel işaretlendi'} · ${item.created_at ? new Date(item.created_at).toLocaleString('tr-TR') : 'Tarih bilinmiyor'}`;
  info.append(ip, meta);
  const remove = document.createElement('button');
  remove.className = 'block';
  remove.type = 'button';
  remove.textContent = 'Listeden çıkar';
  remove.addEventListener('click', () => removeBlocked(item));
  row.append(info, remove);
  return row;
}

function renderBlocked(items) {
  if (!elements.blockedList) return;
  elements.blockedList.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Koruma listesinde henüz IP yok.';
    elements.blockedList.append(empty);
    return;
  }
  items.forEach((item) => elements.blockedList.append(makeBlockedRow(item)));
}

async function loadBlocked() {
  const { data, error } = await client.from('blocked_ips').select('id,site_id,ip_address,reason,created_at').order('created_at', { ascending: false });
  if (error) throw new Error('Koruma listesi yüklenemedi.');
  renderBlocked(data || []);
}

async function removeBlocked(item) {
  if (!item?.id || !window.confirm(`${item.ip_address} adresini koruma listesinden çıkarmak istiyor musun?`)) return;
  const { error } = await client.from('blocked_ips').delete().eq('id', item.id);
  if (error) {
    showError('IP koruma listesinden çıkarılamadı.');
    return;
  }
  await loadBlocked();
}

async function addSite() {
  const name = window.prompt('Site adı:')?.trim();
  if (!name) return;
  const domain = normalizeDomain(window.prompt('Web sitesi adresi (ör. https://www.ornek.com):'));
  if (!domain) {
    showError('Geçerli bir http veya https site adresi gir.');
    return;
  }
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;
  const { error } = await client.from('sites').insert({ owner_id: user.id, name, domain });
  if (error) {
    showError('Site eklenemedi. Aynı site zaten kayıtlı olabilir veya Supabase izinleri eksik olabilir.');
    return;
  }
  clearError();
  await loadSites();
}

async function init() {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) {
    location.replace('login.html');
    return;
  }
  setUser(data.session.user);
  try {
    await loadSites();
    await loadBlocked();
  } catch (error) {
    showError(error.message || 'Sayfa verileri yüklenemedi.');
  }
}

elements.siteSelect?.addEventListener('change', (event) => {
  if (event.target.value) location.href = `index.html?site=${encodeURIComponent(event.target.value)}`;
});
elements.addSiteBtn?.addEventListener('click', addSite);
elements.logoutBtn?.addEventListener('click', async () => {
  await client.auth.signOut();
  location.replace('login.html');
});

init();
