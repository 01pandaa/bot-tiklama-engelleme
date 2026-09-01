const SUPABASE_URL='https://snfjcdknsfwjnxrggypc.supabase.co';
const SUPABASE_KEY='sb_publishable_q9b5q9JV-5Zd6FLY13rWxQ_o2dMvN-_';
const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const message=document.getElementById('message');
function show(text,error=false){message.textContent=text;message.className='auth-message '+(error?'error':'success');}
const loginForm=document.getElementById('loginForm');
if(loginForm) loginForm.addEventListener('submit',async e=>{e.preventDefault();show('Giriş yapılıyor…');const {error}=await client.auth.signInWithPassword({email:email.value.trim(),password:password.value});if(error){show(error.message,true);return}location.href='index.html';});
const signupForm=document.getElementById('signupForm');
if(signupForm) signupForm.addEventListener('submit',async e=>{e.preventDefault();show('Hesap oluşturuluyor…');const {data,error}=await client.auth.signUp({email:email.value.trim(),password:password.value,options:{data:{full_name:fullName.value.trim()}}});if(error){show(error.message,true);return}if(data.session) location.href='index.html'; else show('Hesabın oluşturuldu. E-posta adresine gelen doğrulama bağlantısını aç, sonra giriş yap.');});
