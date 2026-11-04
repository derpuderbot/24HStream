// Aktualisiert data/*.json über die Twitch Helix API. Secrets kommen NUR aus Umgebungsvariablen (GitHub Secrets).
import fs from 'node:fs';
const {TWITCH_CLIENT_ID:id,TWITCH_CLIENT_SECRET:sec}=process.env;
if(!id||!sec){console.log('Keine Twitch-Secrets gesetzt – überspringe (Seite nutzt Live-Fallback).');process.exit(0)}
const rd=f=>JSON.parse(fs.readFileSync(f,'utf8')),cfg=rd('data/config.json'),logins=cfg.streamers.map(s=>s.login);
const tok=(await(await fetch('https://id.twitch.tv/oauth2/token',{method:'POST',body:new URLSearchParams({client_id:id,client_secret:sec,grant_type:'client_credentials'})})).json()).access_token;
if(!tok){console.error('Token-Abruf fehlgeschlagen');process.exit(1)}
const H={'Client-Id':id,Authorization:'Bearer '+tok},api=async p=>{const r=await fetch('https://api.twitch.tv/helix/'+p,{headers:H});if(!r.ok)throw new Error(p+' '+r.status);return r.json()};
const q=logins.map(l=>'login='+l).join('&'),users=(await api('users?'+q)).data,streams=(await api('streams?'+logins.map(l=>'user_login='+l).join('&'))).data;
const out={updated:new Date().toISOString(),source:'twitch-helix',streamers:{}},snap={t:out.updated,d:{}},clips=[];
for(const u of users){
  const l=u.login,s=streams.find(x=>x.user_login==l);let f=null;
  try{f=(await api('channels/followers?broadcaster_id='+u.id)).total}catch{try{const t=await(await fetch('https://decapi.me/twitch/followcount/'+l)).text();if(/^\d+$/.test(t.trim()))f=+t}catch{}}
  let tt=null;try{const r=await fetch('https://twitchtracker.com/api/channels/summary/'+l,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json'}});if(r.ok){const j=await r.json();tt={avg:j.avg_viewers??null,max:j.max_viewers??null,hours:j.hours_watched??null,rank:j.rank??null,followers:j.followers_total??j.followers??null};if(f==null)f=tt.followers}else console.log('TwitchTracker',l,'HTTP',r.status)}catch(e){console.log('TwitchTracker nicht erreichbar:',l)}
  const g=s?s.game_name:null;
  out.streamers[l]={name:u.display_name,avatar:u.profile_image_url,live:!!s,title:s?s.title:null,game:g,viewers:s?s.viewer_count:null,followers:f,startedAt:s?s.started_at:null,tt};
  snap.d[l]={v:s?s.viewer_count:null,f,l:!!s};
  try{for(const c of(await api('clips?first=3&broadcaster_id='+u.id)).data)clips.push({id:c.id,title:c.title,broadcaster:c.broadcaster_name,thumb:c.thumbnail_url,views:c.view_count})}catch{}
}
const h=rd('data/history.json');h.push(snap);fs.writeFileSync('data/history.json',JSON.stringify(h.slice(-3000)));
fs.writeFileSync('data/stats.json',JSON.stringify(out,null,1));fs.writeFileSync('data/clips.json',JSON.stringify({updated:out.updated,clips},null,1));
console.log('OK',out.updated);
