/* ClickShield website tracker v0.2.0
   Site key is read from the script data-site-key attribute.
   The server receives the visitor IP; the browser never reads or exposes the IP itself.
*/
(function(){
  const script=document.currentScript || document.querySelector('script[data-site-key]');
  const siteKey=script?.getAttribute('data-site-key');
  if(!siteKey) return;

  const api='https://snfjcdknsfwjnxrggypc.supabase.co/functions/v1/collect-visit';
  const sessionKey='clickshield_session';
  let sessionId=localStorage.getItem(sessionKey);
  if(!sessionId){sessionId=crypto.randomUUID();localStorage.setItem(sessionKey,sessionId);}

  const params=new URLSearchParams(location.search);
  const deviceType=innerWidth<768?'mobile':innerWidth<1024?'tablet':'desktop';
  const payload={
    page:location.href,
    referrer:document.referrer||null,
    userAgent:navigator.userAgent,
    language:navigator.language,
    screen:`${screen.width}x${screen.height}`,
    deviceType,
    sessionId,
    gclid:params.get('gclid')
  };

  fetch(api,{method:'POST',headers:{'Content-Type':'application/json','X-Site-Key':siteKey},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});

  window.BotClickProtection={version:'0.2.0',siteKey,getEvent:()=>({...payload})};
})();