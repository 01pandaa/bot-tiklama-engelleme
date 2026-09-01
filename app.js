const SUPABASE_URL='https://snfjcdknsfwjnxrggypc.supabase.co';
const SUPABASE_ANON_KEY='';
const SITE_KEY='4189c147ff7e90470c66cb02';
const rows=[];
const table=document.getElementById('clickTable');
const demoRows=[
 {ip:'185.72.xxx.xxx',date:'31.08.2026 14:42',clicks:18,source:'Google Ads',risk:'Yüksek',score:94,status:'İncelenmeli'},
 {ip:'88.241.xxx.xxx',date:'31.08.2026 14:36',clicks:9,source:'Google Ads',risk:'Orta',score:71,status:'İncelenmeli'},
 {ip:'78.190.xxx.xxx',date:'31.08.2026 14:21',clicks:7,source:'Google Ads',risk:'Yüksek',score:88,status:'İncelenmeli'},
 {ip:'176.54.xxx.xxx',date:'31.08.2026 13:58',clicks:3,source:'Google Ads',risk:'Düşük',score:24,status:'Normal'},
 {ip:'95.12.xxx.xxx',date:'31.08.2026 13:41',clicks:14,source:'Google Ads',risk:'Yüksek',score:91,status:'İncelenmeli'}
];
function render(data){
 table.innerHTML=data.length?data.map((r,i)=>`<tr><td><strong>${r.ip}</strong></td><td>${r.date}</td><td>${r.clicks}</td><td>${r.source}</td><td><span class="badge ${r.risk==='Yüksek'?'high':r.risk==='Orta'?'medium':'low'}">${r.risk} · ${r.score}</span></td><td class="status">${r.status}</td><td><button class="block" data-i="${i}">Engelle</button></td></tr>`).join(''):`<tr><td colspan="7" style="text-align:center;padding:30px">Henüz ziyaret verisi yok.</td></tr>`;
 table.querySelectorAll('.block').forEach(btn=>btn.addEventListener('click',()=>{btn.disabled=true;btn.textContent='Engellendi';}));
}
function fmtDate(v){return new Date(v).toLocaleString('tr-TR',{dateStyle:'short',timeStyle:'short'});}
async function loadVisits(){
 if(!SUPABASE_ANON_KEY){render(demoRows);return;}
 try{
  const site=await fetch(`${SUPABASE_URL}/rest/v1/sites?site_key=eq.${SITE_KEY}&select=id`).then(r=>r.json());
  if(!site?.[0]) return render([]);
  const data=await fetch(`${SUPABASE_URL}/rest/v1/visits?site_id=eq.${site[0].id}&select=ip_address,occurred_at,referrer,risk_score,risk_level,is_bot&order=occurred_at.desc&limit=50`,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}}).then(r=>r.json());
  const mapped=(Array.isArray(data)?data:[]).map(v=>({ip:v.ip_address||'Bilinmiyor',date:fmtDate(v.occurred_at),clicks:1,source:v.referrer?.includes('google')?'Google':'Organik / Direkt',risk:v.risk_level==='high'?'Yüksek':v.risk_level==='medium'?'Orta':'Düşük',score:v.risk_score,status:v.is_bot?'Bot':'Normal'}));
  render(mapped);
 }catch(e){render(demoRows);}
}
render(demoRows);
document.getElementById('refreshBtn')?.addEventListener('click',async e=>{e.currentTarget.textContent='✓ Güncellendi';await loadVisits();setTimeout(()=>e.currentTarget.textContent='↻ Yenile',1200)});
document.getElementById('filterBtn')?.addEventListener('click',()=>{const onlyHigh=confirm('Sadece yüksek riskli tıklamaları gösterilsin mi?');if(onlyHigh){render(rows.filter(r=>r.risk==='Yüksek'));}else loadVisits();});
loadVisits();