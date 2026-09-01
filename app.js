const SITE_KEY='4189c147ff7e90470c66cb02';
const table=document.getElementById('clickTable');
const metrics=document.querySelectorAll('.metric > strong');
function fmt(v){return new Date(v).toLocaleString('tr-TR',{dateStyle:'short',timeStyle:'short'});}
function label(v){return v==='high'?'Yüksek':v==='medium'?'Orta':'Düşük';}
function render(rows){table.innerHTML=rows.length?rows.map(r=>`<tr><td><strong>${r.ip_address||'Bilinmiyor'}</strong></td><td>${fmt(r.occurred_at)}</td><td>1</td><td>${r.referrer||'Direkt'}</td><td><span class="badge ${r.risk_level==='high'?'high':r.risk_level==='medium'?'medium':'low'}">${label(r.risk_level)} · ${r.risk_score}</span></td><td class="status">${r.is_bot?'Bot':'Normal'}</td><td><button class="block">Engelle</button></td></tr>`).join(''):'<tr><td colspan="7" style="text-align:center;padding:30px">Henüz ziyaret verisi yok.</td></tr>';}
async function load(){
 const {data:{session}}=await client.auth.getSession();
 if(!session)return;
 const {data:site,error}=await client.from('sites').select('id,domain').eq('site_key',SITE_KEY).maybeSingle();
 if(error||!site){render([]);return;}
 const {data:visits}=await client.from('visits').select('ip_address,occurred_at,referrer,risk_score,risk_level,is_bot').eq('site_id',site.id).order('occurred_at',{ascending:false}).limit(200);
 const rows=visits||[]; const suspicious=rows.filter(x=>x.risk_level!=='low').length; const bots=rows.filter(x=>x.is_bot).length;
 const {count:blocked}=await client.from('blocked_ips').select('id',{count:'exact',head:true}).eq('site_id',site.id);
 metrics[0].textContent=rows.length.toLocaleString('tr-TR'); metrics[1].textContent=suspicious.toLocaleString('tr-TR'); metrics[2].textContent=bots.toLocaleString('tr-TR'); metrics[3].textContent=(blocked||0).toLocaleString('tr-TR');
 const d=document.querySelector('.domain strong');if(d)d.textContent=site.domain; const last=document.querySelector('.domain small');if(last)last.textContent=rows[0]?`Son veri: ${fmt(rows[0].occurred_at)}`:'Henüz veri yok';
 render(rows.slice(0,5));
 const score=document.querySelector('.score-ring strong');if(score)score.textContent=Math.max(0,100-suspicious*8-bots*12);
 const note=document.querySelector('.score-note');if(note)note.textContent=`Toplam ${rows.length} ziyaret kaydedildi. ${suspicious} ziyaret inceleme gerektiriyor.`;
}
document.getElementById('refreshBtn')?.addEventListener('click',async e=>{e.currentTarget.textContent='✓ Güncellendi';await load();setTimeout(()=>e.currentTarget.textContent='↻ Yenile',1200)});
load();