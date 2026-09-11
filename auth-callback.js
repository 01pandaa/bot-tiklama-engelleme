const SUPABASE_URL = 'https://snfjcdknsfwjnxrggypc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_q9b5q9JV-5Zd6FLY13rWxQ_o2dMvN-_';
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const message = document.getElementById('callbackMessage');
const link = document.getElementById('callbackLink');

function showCallbackMessage(text, isError = false) {
  if (!message) return;
  message.textContent = text;
  message.className = `auth-sub ${isError ? 'error' : ''}`;
}

function clearAuthUrl() {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

function showFailure(text) {
  showCallbackMessage(text, true);
  if (link) link.hidden = false;
}

async function completeEmailConfirmation() {
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const errorCode = queryParams.get('error_code') || hashParams.get('error_code');
  const description = `${queryParams.get('error_description') || ''} ${hashParams.get('error_description') || ''}`.toLowerCase();

  if (errorCode || description.includes('invalid') || description.includes('expired')) {
    clearAuthUrl();
    showFailure('Bu doğrulama bağlantısı geçersiz veya süresi dolmuş. Kayıt sayfasından yeni bir doğrulama e-postası isteyin.');
    return;
  }

  try {
    if (queryParams.has('code')) {
      const { error } = await client.auth.exchangeCodeForSession(queryParams.get('code'));
      if (error) throw error;
    }

    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      showFailure('Doğrulama bağlantısı oturuma dönüştürülemedi. Yeni bir doğrulama e-postası isteyin.');
      return;
    }

    clearAuthUrl();
    showCallbackMessage('E-posta adresin doğrulandı. Panel açılıyor…');
    window.setTimeout(() => location.replace('index.html'), 500);
  } catch (_) {
    showFailure('E-posta doğrulaması tamamlanamadı. Yeni bir doğrulama e-postası isteyin.');
  }
}

completeEmailConfirmation();
