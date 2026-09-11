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

function getEmailRedirectUrl() {
  try {
    return new URL('auth-callback.html', window.location.href).toString();
  } catch (_) {
    return `${window.location.origin}/auth-callback.html`;
  }
}

function clearAuthHash() {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

function showAuthRedirectError() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const errorCode = params.get('error_code');
  const description = (params.get('error_description') || '').toLowerCase();
  if (!errorCode && !description) return;

  if (errorCode === 'otp_expired' || description.includes('invalid') || description.includes('expired')) {
    showMessage('E-posta doğrulama bağlantısı geçersiz veya süresi dolmuş. Kayıt sayfasından yeni bir doğrulama e-postası isteyin.', true);
  } else {
    showMessage('E-posta doğrulaması tamamlanamadı. Kayıt sayfasından yeni bir doğrulama e-postası isteyin.', true);
  }
  clearAuthHash();
}

function authErrorMessage(error, action) {
  const raw = String(error?.message || '').trim();
  const normalized = raw.toLowerCase();

  if (isRateLimitError(error)) {
    const seconds = retryAfterSeconds(error);
    const waitText = seconds ? `${seconds} saniye` : 'yaklaşık 1 dakika';
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

function isRateLimitError(error) {
  const message = String(error?.message || '').toLowerCase();
  return error?.status === 429 || message.includes('security purposes') || message.includes('rate limit') || message.includes('too many requests');
}

function retryAfterSeconds(error) {
  const match = String(error?.message || '').match(/after\s+(\d+)\s+seconds?/i);
  return match ? Number(match[1]) : 60;
}

function startRateLimitCooldown(form, extraButton, seconds) {
  const submitButton = form?.querySelector('button[type="submit"]');
  const originalSubmitLabel = submitButton?.textContent;
  const originalExtraLabel = extraButton?.textContent;
  let remaining = Math.max(1, Number(seconds) || 60);

  const updateLabels = () => {
    if (submitButton) submitButton.textContent = `Tekrar dene (${remaining} sn)`;
    if (extraButton) extraButton.textContent = `Yeni doğrulama e-postası iste (${remaining} sn)`;
  };

  if (submitButton) submitButton.disabled = true;
  if (extraButton) extraButton.disabled = true;
  updateLabels();

  const timer = window.setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      window.clearInterval(timer);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalSubmitLabel || 'Tekrar dene';
      }
      if (extraButton) {
        extraButton.disabled = false;
        extraButton.textContent = originalExtraLabel || 'Doğrulama e-postasını yeniden gönder';
      }
      return;
    }
    updateLabels();
  }, 1000);
}

const loginForm = document.getElementById('loginForm');

async function finishLoginRedirect() {
  if (!loginForm) return;
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const hasAuthData = queryParams.has('code') || hashParams.has('access_token') || hashParams.get('type') === 'signup';
  if (!hasAuthData) return;

  try {
    if (queryParams.has('code')) {
      const { error } = await client.auth.exchangeCodeForSession(queryParams.get('code'));
      if (error) throw error;
    }

    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      showMessage('Doğrulama bağlantısı geçersiz veya süresi dolmuş. Yeni bir doğrulama e-postası isteyin.', true);
      return;
    }

    clearAuthHash();
    showMessage('E-posta adresin doğrulandı. Panel açılıyor…');
    window.setTimeout(() => location.replace('index.html'), 350);
  } catch (error) {
    showMessage('E-posta doğrulaması tamamlanamadı. Yeni bir doğrulama e-postası isteyin.', true);
  }
}

client.auth.onAuthStateChange((event, session) => {
  if (event !== 'SIGNED_IN' || !session || !loginForm || !window.location.hash) return;
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (!params.has('access_token') && params.get('type') !== 'signup') return;
  clearAuthHash();
  showMessage('E-posta adresin doğrulandı. Panel açılıyor…');
  window.setTimeout(() => location.replace('index.html'), 350);
});

showAuthRedirectError();
finishLoginRedirect();

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
const resendButton = document.getElementById('resendVerification');

if (resendButton) {
  resendButton.addEventListener('click', async () => {
    const email = document.getElementById('email')?.value.trim() || '';
    if (!email) {
      showMessage('Önce e-posta adresinizi yazın.', true);
      return;
    }

    resendButton.disabled = true;
    const originalLabel = resendButton.textContent;
    resendButton.textContent = 'E-posta gönderiliyor…';
    showMessage('Doğrulama e-postası gönderiliyor…');
    let cooldownSeconds = 0;

    try {
      const { error } = await client.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: getEmailRedirectUrl() }
      });
      if (error) {
        if (isRateLimitError(error)) cooldownSeconds = retryAfterSeconds(error);
        showMessage(authErrorMessage(error, 'signup'), true);
        return;
      }
      showMessage('Yeni doğrulama e-postası gönderildi. Gelen kutunuzu ve spam klasörünü kontrol edin.');
    } catch (error) {
      showMessage(authErrorMessage(error, 'signup'), true);
    } finally {
      resendButton.disabled = false;
      resendButton.textContent = originalLabel;
      if (cooldownSeconds) startRateLimitCooldown(null, resendButton, cooldownSeconds);
    }
  });
}

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
    let cooldownSeconds = 0;

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: getEmailRedirectUrl()
        }
      });

      if (error) {
        showMessage(authErrorMessage(error, 'signup'), true);
        const normalizedError = (error.message || '').toLowerCase();
        if (resendButton && (isRateLimitError(error) || normalizedError.includes('already registered'))) {
          resendButton.hidden = false;
        }
        if (isRateLimitError(error)) cooldownSeconds = retryAfterSeconds(error);
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
      if (cooldownSeconds) startRateLimitCooldown(signupForm, resendButton, cooldownSeconds);
    }
  });
}
