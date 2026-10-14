'use strict';
// Old magic-link/OAuth callbacks or deep links land on the dashboard.
if(/[#&](access_token|error)=|[?&]code=/.test(location.hash+location.search))location.replace('app.html'+location.search+location.hash);
const SB='https://rgohzlofcfkpsigqjcab.supabase.co',K='sb_publishable_cZVafIc3SZNzGEdir7JqEA_Nz7LFv3N';
const $=i=>document.getElementById(i),set=(i,t,c)=>{const e=$(i);e.textContent=t;if(c)e.className=c};
const f=n=>n>=1e12?'$'+(n/1e12).toFixed(2)+'T':n>=1e9?'$'+(n/1e9).toFixed(1)+'B':n>=1e6?'$'+(n/1e6).toFixed(1)+'M':'$'+Math.round(n);
const num=v=>typeof v==='number'&&isFinite(v)?v:null;
(async()=>{let rows=null;
 try{const r=await fetch(SB+'/rest/v1/coins?select=coingecko_id,orig_price,price,mcap&removed=eq.false',{headers:{apikey:K},referrerPolicy:'no-referrer'});if(!r.ok)throw 0;rows=(await r.json()).map(x=>({id:String(x.coingecko_id),op:num(x.orig_price),price:num(x.price),mcap:num(x.mcap)}))}
 catch(_){try{rows=(await(await fetch('data.json')).json()).coins.map(c=>({id:c.id||'static:'+c.name,op:num(c.op),price:num(c.price),mcap:num(c.mcap)}))}catch(_){return}}
 const ids=rows.filter(r=>/^[a-z0-9-]+$/.test(r.id)).map(r=>r.id);let live=false;
 try{const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids='+ids.join(',')+'&vs_currencies=usd&include_market_cap=true',{referrerPolicy:'no-referrer'});if(!r.ok)throw 0;const p=await r.json();
  rows.forEach(x=>{const q=p[x.id];if(q&&num(q.usd)!=null){x.price=q.usd;if(num(q.usd_market_cap))x.mcap=q.usd_market_cap;live=true}})}catch(_){}
 const cmp=rows.filter(x=>x.op&&x.price&&!/^(g-token)$/.test(x.id)),up=cmp.filter(x=>x.price>=x.op).length;
 set('s-n',String(rows.length));set('s-mc',f(rows.reduce((s,x)=>s+(x.mcap||0),0)));set('s-up',up+' / '+cmp.length,'up');
 set('s-live',live?'● Live prices · '+new Date().toLocaleTimeString():'Showing the saved snapshot (live prices unavailable).')})();
