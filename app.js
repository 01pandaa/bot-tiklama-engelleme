const rows=[
 {ip:'185.72.xxx.xxx',date:'31.08.2026 14:42',clicks:18,source:'Google Ads',risk:'Yüksek',score:94,status:'İncelenmeli'},
 {ip:'88.241.xxx.xxx',date:'31.08.2026 14:36',clicks:9,source:'Google Ads',risk:'Orta',score:71,status:'İncelenmeli'},
 {ip:'78.190.xxx.xxx',date:'31.08.2026 14:21',clicks:7,source:'Google Ads',risk:'Yüksek',score:88,status:'İncelenmeli'},
 {ip:'176.54.xxx.xxx',date:'31.08.2026 13:58',clicks:3,source:'Google Ads',risk:'Düşük',score:24,status:'Normal'},
 {ip:'95.12.xxx.xxx',date:'31.08.2026 13:41',clicks:14,source:'Google Ads',risk:'Yüksek',score:91,status:'İncelenmeli'}
];
const table=document.getElementById('clickTable');
function render(){table.innerHTML=rows.map((r,i)=>`<tr><td><strong>${r.ip}</strong></td><td>${r.date}</td><td>${r.clicks}</td><td>${r.source}</td><td><span class="badge ${r.risk==='Yüksek'?'high':r.risk==='Orta'?'medium':'low'}">${r.risk} · ${r.score}</span></td><td class="status">${r.status}</td><td><button class="block" data-i="${i}">Engelle</button></td></tr>`).join('');
 table.querySelectorAll('.block').forEach(btn=>btn.addEventListener('click',()=>{const i=Number(btn.dataset.i);rows[i].status='Engellendi';btn.disabled=true;btn.textContent='Engellendi';document.getElementById('blockedIps').textContent=Number(document.getElementById('blockedIps').textContent)+1;render();}));}
render();
document.getElementById('refreshBtn').addEventListener('click',e=>{e.currentTarget.textContent='✓ Güncellendi';setTimeout(()=>e.currentTarget.textContent='↻ Verileri Yenile',1200)});
document.getElementById('addIpBtn').addEventListener('click',()=>{const ip=prompt('Engellenecek IP adresini girin:');if(ip){alert(`${ip} koruma listesine eklenecek. Gerçek sistemde bu işlem backend üzerinden kaydedilecektir.`)}});
document.getElementById('filterBtn').addEventListener('click',()=>{const onlyHigh=confirm('Sadece yüksek riskli tıklamaları gösterilsin mi?');if(onlyHigh){table.innerHTML=rows.filter(r=>r.risk==='Yüksek').map((r,i)=>`<tr><td><strong>${r.ip}</strong></td><td>${r.date}</td><td>${r.clicks}</td><td>${r.source}</td><td><span class="badge high">${r.risk} · ${r.score}</span></td><td class="status">${r.status}</td><td><button class="block">Engelle</button></td></tr>`).join('')}else render();});