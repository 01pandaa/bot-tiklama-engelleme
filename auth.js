const SUPABASE_URL = 'https://snfjcdknsfwjnxrggypc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_q9b5q9JV-5Zd6FLY13rWxQ_o2dMvN-_';

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
window.clickShieldClient = client;

function showMessage(text, isError = false) {
  const message = document.getElementById('message');
  if (!message) return;
  message.textContent = text;
  message.className = `auth-message ${isError ? 'error' : 'success'}`;
  message.setAttribute('aria-live', 'polite');
}

function setFormBusy(form, busy, label) {
  const button = form?.querySelector('button[type="submit"]');
  if (!button) return;
  button.disabled = busy;
  if (busy) button.dataset.originalLabel = button.textContent;
  button.textContent = busy ? label : (button.dataset.originalLabel || button.textContent);
}

function authErrorMessage(error, action) {
  const raw = String(error?.message || '').trim();
  const normalized = raw.toLowerCase();
  const waitMatch = raw.match(/after\s+(\d+)\s+seconds?/i);

  if (error?.status === 429 || normalized.includes('security purposes') || normalized.includes('rate limit') || normalized.includes('too many requests')) {
    const waitText = waitMatch ? `${waitMatch[1]} saniye` : 'yaklaşık 1 dakika';
    return `Güvenlik nedeniyle çok sık deneme yapıldı. Lütfen ${waitText} bekleyip butona yalnızca bir kez tıklayın.`;
  }

  if (normalized.includes('user already registered') || normalized.includes('already registered')) {
    return 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı deneyin.';
  }

  if (normalized.includes('invalid login credentials')) {
    return 'E-posta veya şifre hatalı.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Önce e-posta adresinize gönderilen doğrulama bağlantısını açın.';
  }

  if (normalized.includes('password')) {
    return 'Şifre en az 8 karakter olmalı ve geçerli bir şifre seçmelisiniz.';
  }

  return action === 'signup' ? 'Hesap oluşturulamadı. Bilgileri kontrol edip tekrar deneyin.' : 'Giriş yapılamadı. Bilgileri kontrol edip tekrar deneyin.';
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  let requestInFlight = false;
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (requestInFlight) return;
    requestInFlight = true;
    const email = document.getElementById('email')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    setFormBusy(loginForm, true, 'Giriş yapılıyor…');
    showMessage('Giriş yapılıyor…');

    try {
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        showMessage(authErrorMessage(error, 'login'), true);
        return;
      }

      location.replace('index.html');
    } catch (error) {
      showMessage(authErrorMessage(error, 'login'), true);
    } finally {
      requestInFlight = false;
      setFormBusy(loginForm, false);
    }
  });
}

const signupForm = document.getElementById('signupForm');
if (signupForm) {
  let requestInFlight = false;
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (requestInFlight) return;
    requestInFlight = true;
    const fullName = document.getElementById('fullName')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const password = document.getElementById('password')?.value || '';
    setFormBusy(signupForm, true, 'Hesap oluşturuluyor…');
    showMessage('Hesap oluşturuluyor…');

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      });

      if (error) {
        showMessage(authErrorMessage(error, 'signup'), true);
        return;
      }

      if (data.session) {
        location.replace('index.html');
        return;
      }

      showMessage('Hesabın oluşturuldu. E-posta adresine gelen doğrulama bağlantısını aç, sonra giriş yap.');
    } catch (error) {
      showMessage(authErrorMessage(error, 'signup'), true);
    } finally {
      requestInFlight = false;
      setFormBusy(signupForm, false);
    }
  });
}
