(()=>{
const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const Q=new URLSearchParams(location.search),HOST=location.hostname||'localhost';
const fmt=v=>v==null?'N/A':Number(v).toLocaleString('de-DE');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const getJ=async u=>{const r=await fetch(u+'?t='+Date.now());if(!r.ok)throw new Error(u+' '+r.status);return r.json()};
const getT=async u=>{const r=await fetch(u);if(!r.ok)throw new Error(r.status);return(await r.text()).trim()};
let cfg,stats={updated:null,streamers:{}},hist=[],clips={clips:[]},live={},av={},view=Q.get('view')||'dual',chat=false,metric='v',lastLive={};
const lines=[];
function jlog(m,c=''){lines.push(`<div class="${c}"><b>${new Date().toLocaleTimeString('de-DE')}</b> ${esc(m)}</div>`);if(lines.length>8)lines.shift();$('#jlog').innerHTML=lines.join('')}
const S=()=>cfg.streamers;
const fresh=()=>stats.updated&&Date.now()-Date.parse(stats.updated)<30*6e4;
const D=l=>(fresh()?stats.streamers[l]:live[l])||stats.streamers[l]||{};
async function liveFetch(l){
  const b='https://decapi.me/twitch/',off=t=>/offline|not found|error|invalid/i.test(t);
  try{
    const up=await getT(b+'uptime/'+l),isLive=!off(up);
    const r=await Promise.allSettled([getT(b+'followcount/'+l),isLive?getT(b+'title/'+l):'',isLive?getT(b+'game/'+l):'',isLive?getT(b+'viewercount/'+l):'']);
    const v=i=>r[i].status==='fulfilled'?r[i].value:null,n=i=>/^\d+$/.test(v(i)||'')?+v(i):null;
    live[l]={live:isLive,followers:n(0),title:v(1)||null,game:v(2)||null,viewers:isLive?n(3):null,src:'decapi.me'};
    if(!av[l])getT(b+'avatar/'+l).then(u=>{if(/^https:/.test(u)){av[l]=u;render()}}).catch(()=>{});
  }catch(e){jlog('Live-Abfrage für '+l+' fehlgeschlagen – Daten als nicht verfügbar markiert.','w')}
}
function applyCfg(){
  const r=document.documentElement.style,t=cfg.theme;
  r.setProperty('--c',t.accent);r.setProperty('--t',t.accent2);r.setProperty('--bg',t.bg);r.setProperty('--ch',cfg.player.chatHeight+'px');
  document.body.classList.toggle('noscan',!t.scanlines);document.body.classList.toggle('noanim',!t.animations);
  document.title=cfg.site.title+' · '+cfg.site.subtitle;$('h1').firstChild.nodeValue=cfg.site.title;$('h1 small').textContent=cfg.site.subtitle;$('#foot').textContent=cfg.site.footer;
  for(const k in cfg.sections)if(!cfg.sections[k]){const s=$('#'+k);if(s)s.style.display='none';const n=$('nav a[href="#'+k+'"]');if(n)n.style.display='none'}
}
function start(){const s=Q.get('start')||cfg.eventStart;const t=s?Date.parse(s):NaN;return isNaN(t)?null:t}
function tick(){
  const now=Date.now(),st=start(),dur=(cfg.durationHours||24)*36e5;
  $('#clock').textContent=new Date().toLocaleString('de-DE');
  let txt,ph,pr=0;
  if(st==null){txt='TERMIN NOCH OFFEN';ph='STANDBY'}
  else if(now<st){const d=st-now;txt=`T-${Math.floor(d/864e5)}d ${pad(Math.floor(d/36e5)%24)}:${pad(Math.floor(d/6e4)%60)}:${pad(Math.floor(d/1e3)%60)}`;ph='COUNTDOWN'}
  else if(now<st+dur){const e=now-st;txt=`LÄUFT ${pad(Math.floor(e/36e5))}:${pad(Math.floor(e/6e4)%60)}:${pad(Math.floor(e/1e3)%60)}`;ph='ONLINE';pr=e/dur*100}
  else{txt='STREAM ABGESCHLOSSEN';ph='ENDE';pr=100}
  $('#cd').textContent=txt;$('#phase').textContent=ph;$('#prog').style.width=pr+'%';
  if(tick.p!==ph){tick.p=ph;jlog('Event-Phase: '+ph,'ok')}
}
const initial=l=>esc(l[0].toUpperCase());
function render(){
  $('#streamers').innerHTML=S().map(s=>{const d=D(s.login),img=s.avatar||d.avatar||av[s.login];
    return`<article class="hud"><div class="sc">${img?`<img class="av" src="${esc(img)}" alt="${esc(s.name)}" referrerpolicy="no-referrer" onerror="this.outerHTML='<div class=av>${initial(s.name)}</div>'">`:`<div class="av">${initial(s.name)}</div>`}<div><h3>${esc(s.name)}</h3><span class="badge ${d.live?'live':''}">${d.live==null?'STATUS N/A':d.live?'● LIVE':'OFFLINE'}</span></div></div>
    <div class="kv"><span>Zuschauer<b class="${d.viewers==null?'na':''}">${fmt(d.viewers)}</b></span><span>Follower<b class="${d.followers==null?'na':''}">${fmt(d.followers)}</b></span></div>
    <div class="mut">Titel: ${d.title?esc(d.title):'N/A'}<br>Spiel: ${d.game?esc(d.game):'N/A'}</div><p><a class="btn" target="_blank" rel="noopener" href="https://www.twitch.tv/${s.login}">Twitch ↗</a>${(s.extra||[]).map(x=>`<a class="btn" target="_blank" rel="noopener" href="${esc(x.url)}">${esc(x.label)} ↗</a>`).join('')}</p></article>`}).join('');
  const [a,b]=S(),T=s=>stats.streamers[s.login]?.tt||{},h=l=>hist.map(x=>x.d?.[l]).filter(Boolean),pk=l=>{const v=h(l).map(x=>x.v).filter(x=>x!=null);return v.length?Math.max(...v):null},avg=l=>{const v=h(l).filter(x=>x.l&&x.v!=null).map(x=>x.v);return v.length?Math.round(v.reduce((p,c)=>p+c,0)/v.length):null};
  const rows=[['Zuschauer jetzt',D(a.login).viewers,D(b.login).viewers],['Follower',D(a.login).followers,D(b.login).followers],['Peak-Zuschauer*',pk(a.login),pk(b.login)],['Ø Zuschauer (live)*',avg(a.login),avg(b.login)]].concat(cfg.data.showTwitchTracker?[['Ø Zuschauer 30 T. (TwitchTracker)',T(a).avg,T(b).avg],['Peak 30 T. (TwitchTracker)',T(a).max,T(b).max],['TwitchTracker-Rang',T(a).rank,T(b).rank]]:[]);
  $('#compare').innerHTML=`<div class="cmp"><b class="l">${esc(a.name)}</b><span class="m">VS</span><b>${esc(b.name)}</b>${rows.map(r=>`<span class="l ${r[1]==null?'na':''}">${fmt(r[1])}</span><span class="m">${r[0]}</span><span class="${r[2]==null?'na':''}">${fmt(r[2])}</span>`).join('')}</div><p class="mut">* aus gesammelten Verlaufsdaten (${hist.length} Messpunkte) · TwitchTracker-Werte nur verfügbar, wenn die Abfrage in der GitHub Action gelingt</p>`;
  const ms=[...cfg.data.followerMilestones].sort((p,q)=>p-q),em=[...cfg.data.eventMilestones].sort((p,q)=>p-q);
  const st=start(),el=st&&Date.now()>st?(Date.now()-st)/36e5:null;
  $('#miles').innerHTML=S().map(s=>{const f=D(s.login).followers,nx=f==null?null:ms.find(m=>m>f);return`<div class="hud"><h3>Follower-Meilenstein · ${esc(s.name)}</h3>${f==null?'<span class="na">N/A</span>':nx?`<div class="ms">${fmt(f)} / ${fmt(nx)}</div><div class="bar"><i style="width:${f/nx*100}%"></i></div>`:'Alle Stufen erreicht'}</div>`}).join('')+`<div class="hud"><h3>Event-Meilensteine</h3>${em.map((x,i)=>{const nx=em[i+1];return`<div class="item ${el==null?'':el>=x?(nx==null||el<nx?'run':'done'):''}">Stunde ${x}${i==0?' – Start':i==em.length-1?' – Finale':''}</div>`}).join('')}</div>`;
  const it=(arr,f)=>arr&&arr.length?arr.map(f).join(''):'<p class="mut">Noch nicht veröffentlicht (data/config.json)</p>';
  $('#sched').innerHTML=it(cfg.schedule,x=>`<div class="item">${x.hour!=null?'Stunde '+x.hour:esc(x.time||'')} · ${esc(x.title)}<small>${esc(x.note||'')}</small></div>`);
  $('#games').innerHTML=it(cfg.games,x=>`<div class="item">${esc(x.name)}<small>${esc(x.note||'')}</small></div>`);
  $('#chal').innerHTML=it(cfg.challenges,x=>`<div class="item">${esc(x.title)}<small>${esc(x.note||'')}</small></div>`);
  const CL=[...(cfg.clips||[]).map(c=>({id:String(c.id||'').split('?')[0].split('/').filter(Boolean).pop(),title:c.title||'Clip',broadcaster:'',views:null})),...clips.clips];
  $('#clipgrid').innerHTML=CL.length?CL.map(c=>`<div class="hud"><div class="pl"><div class="thumb" data-c="${esc(c.id)}" style="background-image:url('${esc(c.thumb||'')}')" title="Abspielen">▶</div></div><div class="item">${esc(c.title)}<small>${c.broadcaster?esc(c.broadcaster)+' · ':''}${c.views!=null?fmt(c.views)+' Views':'manuell hinzugefügt'}</small></div></div>`).join(''):'<p class="mut">Noch keine Clips geladen – werden bei aktivierter Daten-Aktualisierung (GitHub Action) abgerufen.</p>';
  const L=[...(cfg.links||[]),...(cfg.socials||[])];
  $('#linklist').innerHTML=L.length?L.map(x=>`<a class="btn" target="_blank" rel="noopener" href="${esc(x.url)}">${esc(x.label)} ↗</a>`).join(''):'<span class="mut">Keine öffentlichen Links hinterlegt.</span>';
  $('#upd').textContent=fresh()?`Daten: Twitch API · Stand ${new Date(stats.updated).toLocaleString('de-DE')}`:`Daten: Live-Abfrage via decapi.me · Stand ${new Date().toLocaleTimeString('de-DE')}${stats.updated?' (API-Stand veraltet: '+new Date(stats.updated).toLocaleString('de-DE')+')':''}`;
  for(const s of S()){const d=D(s.login);if(lastLive[s.login]!==undefined&&lastLive[s.login]!==d.live)jlog(`${s.name} ist jetzt ${d.live?'LIVE':'offline'}.`,'ok');lastLive[s.login]=d.live}
  chart();
}
function chart(){
  const c=$('#chart'),r=devicePixelRatio||1,W=c.width=c.clientWidth*r,H=c.height=220*r,x=c.getContext('2d');x.clearRect(0,0,W,H);
  const pts=hist.filter(h=>S().some(s=>h.d?.[s.login]?.[metric]!=null));
  if(pts.length<2){$('#chartnote').textContent='Noch keine Verlaufsdaten – sie entstehen durch die geplanten Aktualisierungen (GitHub Action).';return}
  $('#chartnote').textContent='Verlauf aus '+pts.length+' Messpunkten';
  const all=pts.flatMap(h=>S().map(s=>h.d?.[s.login]?.[metric]).filter(v=>v!=null)),mx=Math.max(...all),mn=metric=='f'?Math.min(...all):0,t0=Date.parse(pts[0].t),t1=Date.parse(pts.at(-1).t)||t0+1;
  S().forEach((s,i)=>{x.strokeStyle=i?'#ffb84d':'#00e5ff';x.shadowColor=x.strokeStyle;x.shadowBlur=8;x.lineWidth=2*r;x.beginPath();let on=0;
    pts.forEach(h=>{const v=h.d?.[s.login]?.[metric];if(v==null)return;const X=(Date.parse(h.t)-t0)/(t1-t0||1)*(W-20*r)+10*r,Y=H-10*r-(v-mn)/((mx-mn)||1)*(H-30*r);on?x.lineTo(X,Y):x.moveTo(X,Y);on=1});x.stroke();
    x.fillStyle=x.strokeStyle;x.font=12*r+'px monospace';x.fillText(s.name,10*r+i*110*r,14*r)})
}
function player(){
  const [a,b]=S(),ls=view=='a'?[a]:view=='b'?[b]:[a,b],p=$('#player');
  p.className='players';p.style.setProperty('--n',ls.length);
  p.innerHTML=ls.map(s=>`<div class="pl"><iframe src="https://player.twitch.tv/?channel=${s.login}&parent=${HOST}&muted=${!!cfg.player.muted}" allowfullscreen title="${esc(s.name)}" loading="lazy"></iframe></div>`).join('')+(chat?ls.map(s=>`<div class="pl chat"><iframe src="https://www.twitch.tv/embed/${s.login}/chat?parent=${HOST}&darkpopout" title="Chat ${esc(s.name)}" loading="lazy"></iframe></div>`).join(''):'');
  $$('[data-v]').forEach(b=>b.classList.toggle('on',b.dataset.v==view));$('#chatBtn').classList.toggle('on',chat)
}
async function refresh(){if(cfg.data.liveFallback)await Promise.all(S().map(s=>liveFetch(s.login)));render()}
async function loadData(){
  for(const [k,u] of [['stats','data/stats.json'],['hist','data/history.json'],['clips','data/clips.json']]){
    try{const j=await getJ(u);if(k=='stats')stats=j;else if(k=='hist')hist=j;else clips=j}catch(e){jlog('Datei '+u+' nicht verfügbar.','w')}}
  jlog(stats.updated?'Twitch-API-Daten geladen: '+new Date(stats.updated).toLocaleString('de-DE'):'Keine API-Daten – nutze Live-Abfrage.',stats.updated?'ok':'w');
}
async function init(){
  if(Q.get('obs')=='1')document.body.classList.add('obs');
  jlog('System startet … Initialisiere Module');
  try{cfg=await getJ('data/config.json')}catch(e){jlog('Konfiguration fehlt – Abbruch.','w');return}
  try{const o=JSON.parse(localStorage.getItem('cfgOverride')||'null');if(o&&o.streamers&&o.streamers.length>1&&!Q.get('nocfg')){cfg=o;jlog('Lokale Konfiguration aktiv (config.html).','ok')}}catch(e){}
  cfg=mergeCfg(DEFAULTS,cfg);applyCfg();view=Q.get('view')||cfg.player.defaultView;chat=!!cfg.player.chat;
  const w=Q.get('widget');if(w){$$('main>section').forEach(s=>{if(s.id!=w)s.style.display='none'})}
  $$('[data-v="a"]')[0].textContent=S()[0].name;$$('[data-v="b"]')[0].textContent=S()[1].name;
  $$('[data-v]').forEach(b=>b.onclick=()=>{view=b.dataset.v;player()});$$('[data-m]').forEach(b=>b.onclick=()=>{metric=b.dataset.m;$$('[data-m]').forEach(x=>x.classList.toggle('on',x==b));chart()});
  $('#chatBtn').onclick=()=>{chat=!chat;player()};$$('[data-m]')[0].classList.add('on');
  $('#clipgrid').onclick=e=>{const t=e.target.closest('.thumb');if(t)t.outerHTML=`<iframe src="https://clips.twitch.tv/embed?clip=${encodeURIComponent(t.dataset.c)}&parent=${HOST}&autoplay=true" allowfullscreen></iframe>`};
  await loadData();player();render();tick();setInterval(tick,1e3);
  await refresh();setInterval(refresh,Math.max(30,cfg.data.refreshSeconds||90)*1e3);addEventListener('resize',chart);
  jlog('Alle Systeme betriebsbereit.','ok')
}
init();
})();
