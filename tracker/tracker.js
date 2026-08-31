/* Bot Tıklama Engelleme - site takip kodu başlangıcı
   Gerçek IP adresi sunucu tarafında alınmalıdır; tarayıcı kodu tek başına IP tespit etmez.
   Bu sürüm, güvenli şekilde ziyaret sinyallerini gönderecek altyapı için hazırlanmıştır.
*/
(function(){
  const startedAt=Date.now();
  const event={
    page:location.href,
    referrer:document.referrer||null,
    title:document.title,
    userAgent:navigator.userAgent,
    language:navigator.language,
    screen:`${screen.width}x${screen.height}`,
    startedAt:new Date().toISOString()
  };
  window.BotClickProtection={
    getEvent:()=>({...event,durationMs:Date.now()-startedAt}),
    version:'0.1.0'
  };
})();