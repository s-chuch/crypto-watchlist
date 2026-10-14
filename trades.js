'use strict';
let f_fp=null,f_upd=null,me=null,trades=[],live={},fUser='',fCoin='',pick=null,st;
const canEdit=()=>!!me&&(me.role==='editor'||me.role==='admin');
const COIN_RE=/^[A-Za-z0-9][A-Za-z0-9._-]{0,59}$/;
async function init(){me=await currentProfile();clear($('#navwrap')).append(navBar(me,'Trades'));await load();render()}
async function load(){const {data}=await sb.from('trades').select('*').order('traded_at',{ascending:false}).limit(500);trades=data||[];live=await livePrices(trades.map(t=>t.coin))}
function nowLocal(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)}
function form(){if(!canEdit())return h('div',{class:'vo'},!me?'👁 View-only mode — sign in on the dashboard to log trades':'👁 View-only mode — your account can view but not log trades');
 const hint=h('span',{class:'ph'}),tot=h('div',{class:'tot'},'Total: —');
 const upd=()=>{const q=Number(f.elements.q.value),p=Number(f.elements.p.value);tot.textContent='Total: '+(q>0&&p>0?money(q*p):'—');const ok=!!pick&&q>0&&p>0;bBuy.disabled=!ok;bSell.disabled=!ok};
 const bBuy=h('button',{type:'button',class:'big buy',disabled:true,onclick:()=>save('buy')},'Buy'),bSell=h('button',{type:'button',class:'big sell',disabled:true,onclick:()=>save('sell')},'Sell');
 const fp=async()=>{if(!pick||!ID_RE.test(pick.id)){clear(hint);upd();return}clear(hint).append('fetching…');const p=await livePrices([pick.id]);const el=f.elements.p;
  if(p[pick.id]!=null){el.value=p[pick.id];clear(hint).append('live · '+new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+' ',h('button',{type:'button',class:'rf',title:'Refresh price','aria-label':'Refresh price',onclick:fp},'↻'))}
  else{el.value='';clear(hint).append(h('span',{class:'dn'},"couldn't fetch price "),h('button',{type:'button',class:'rf',title:'Try again','aria-label':'Try again',onclick:fp},'↻'))}upd()};
 f_fp=fp;f_upd=upd;
 const res=h('div',{id:'ar'}),msg=h('div',{class:'mu'});const chosen=h('div',{class:'mu'},'No coin picked yet. Search, or type a ticker and press "Use as ticker".');
 const save=async sd=>{const el=f.elements;const q=Number(el.q.value),p=Number(el.p.value);
  if(!pick)return msg.textContent='Pick a coin first.';if(!(q>0))return msg.textContent='Quantity must be more than 0.';if(!(p>0))return msg.textContent='Price must be more than 0.';
  const when=el.d.value?new Date(el.d.value):new Date();if(isNaN(when))return msg.textContent='Invalid date.';const note=el.n.value.trim().slice(0,280);
  if(!confirm('Confirm '+sd+' of '+qty(q)+' '+pick.name+' at '+money(p)+' (total '+money(q*p)+')?'))return;const nm=pick.name;msg.textContent='Saving…';const {error}=await sb.from('trades').insert({coin:pick.id,coin_name:pick.name.slice(0,100),side:sd,quantity:q,price_usd:p,traded_at:when.toISOString(),note:note||null});
  if(error)return msg.textContent='Could not save: '+error.message;pick=null;await load();render();toast((sd==='buy'?'Bought ':'Sold ')+qty(q)+' '+nm+' ✓')};
 const f=h('form',{class:'tf',onsubmit:e=>e.preventDefault()},
  h('input',{name:'cs',type:'search',placeholder:'Search coin (name or ticker)…',autocomplete:'off',oninput:e=>search(e.target.value,res,chosen,f)}),
  h('button',{type:'button',class:'btn ghost sm',onclick:()=>{const v=f.elements.cs.value.trim();if(!COIN_RE.test(v))return msg.textContent='Ticker can use letters, numbers, . _ - (max 60).';pick={id:v.toUpperCase(),name:v.toUpperCase()};chosen.textContent='Ticker: '+pick.id+' (no live price — enter it yourself)';clear(res);f.elements.p.value='';f_fp&&f_fp();f_upd&&f_upd()}},'Use as ticker'),
  res,chosen,
  h('div',{class:'tg'},
   h('label',{},'Quantity',h('input',{name:'q',oninput:()=>upd(),type:'number',step:'any',min:'0',inputmode:'decimal',required:true})),
   h('label',{},h('span',{},'Price (USD) ',hint),h('input',{name:'p',oninput:()=>upd(),type:'number',step:'any',min:'0',inputmode:'decimal',required:true})),
   h('label',{},'Date & time',h('input',{name:'d',type:'datetime-local',value:nowLocal()}))),
  tot,h('textarea',{name:'n',maxlength:'280',placeholder:'Note (optional, max 280 characters)',rows:'2'}),h('div',{class:'bs'},bBuy,bSell),msg);
 upd();return h('section',{class:'legend'},h('h3',{},'Log a trade'),f)}
function search(q,res,chosen,f){clearTimeout(st);q=q.trim();if(q.length<2){clear(res);return}
 st=setTimeout(async()=>{try{const r=await(await fetch('https://api.coingecko.com/api/v3/search?query='+encodeURIComponent(q.slice(0,50)),{referrerPolicy:'no-referrer'})).json();
  const list=(Array.isArray(r&&r.coins)?r.coins:[]).filter(c=>c&&typeof c.id==='string'&&ID_RE.test(c.id)).slice(0,6);
  clear(res).append(...list.map(c=>h('div',{class:'ar',onclick:()=>{pick={id:c.id,name:str(c.name,100)};clear(res);chosen.textContent='Coin: '+pick.name+' ('+str(c.symbol,20)+')';f_fp&&f_fp();f_upd&&f_upd()}},
   h('span',{},h('b',{},str(c.name,100)),h('span',{class:'tk'},str(c.symbol,20))),h('span',{class:'mu'},'Pick'))))}catch(_){clear(res).append(h('div',{class:'dn'},'Search failed (rate limit?). Try again shortly.'))}},400)}
async function del(t){if(!confirm('Delete this trade?'))return;const {data,error}=await sb.from('trades').delete().eq('id',t.id).select('id');if(error||!data||!data.length)return alert('Could not delete');await load();render()}
function render(){const m=clear($('#main'));m.append(form());
 const users=[...new Set(trades.map(t=>t.username).filter(Boolean))].sort(),coinsL=[...new Map(trades.map(t=>[t.coin,t.coin_name||t.coin])).entries()].sort((a,b)=>String(a[1]).localeCompare(b[1]));
 const sel=(v,all,opts,on)=>h('select',{onchange:e=>{on(e.target.value);render()}},h('option',{value:''},all),opts.map(([k,l])=>{const o=h('option',{value:k},l);if(k===v)o.selected=true;return o}));
 const rows=trades.filter(t=>(!fUser||t.username===fUser)&&(!fCoin||t.coin===fCoin));
 let pl=0;rows.forEach(t=>{const lp=live[t.coin];if(lp!=null)pl+=(t.side==='buy'?1:-1)*(lp-num(t.price_usd))*num(t.quantity)});
 m.append(h('section',{class:'legend'},h('h3',{},'Trade feed'),h('div',{class:'ctl'},sel(fUser,'All users',users.map(u=>[u,u]),v=>fUser=v),sel(fCoin,'All coins',coinsL,v=>fCoin=v)),
  h('div',{class:'mu'},rows.length+' trade(s) · combined P/L vs live: ',h('b',{class:pl>=0?'up':'dn'},(pl>=0?'+':'')+money(pl))),
  rows.length?rows.map(t=>{const lp=live[t.coin],q=num(t.quantity),p=num(t.price_usd),cur=lp!=null?lp*q:null,d=lp!=null?(t.side==='buy'?1:-1)*(lp-p)*q:null;
   return h('div',{class:'tr'},h('div',{class:'trh'},h('span',{},h('b',{},str(t.username,20)||'?'),' ',h('span',{class:'side '+(t.side==='buy'?'buy':'sell')},t.side.toUpperCase()),' ',h('b',{},str(t.coin_name||t.coin,100))),h('span',{class:'lt'},new Date(t.traded_at).toLocaleString())),
    h('div',{class:'g'},h('div',{},h('span',{},'Quantity'),qty(q)),h('div',{},h('span',{},'Price'),money(p)),h('div',{},h('span',{},'Total'),money(t.total)),
     h('div',{},h('span',{},'Value now'),cur==null?'—':money(cur)),h('div',{},h('span',{},'P/L vs live'),d==null?h('span',{class:'mu'},'n/a'):h('b',{class:d>=0?'up':'dn'},(d>=0?'+':'')+money(d)+' ('+((t.side==='buy'?1:-1)*(lp/p-1)*100).toFixed(1)+'%)'))),
    t.note&&h('div',{class:'mu note'},'“'+str(t.note,280)+'”'),me&&t.user_id===me.id&&h('button',{class:'rm sm',onclick:()=>del(t)},'Delete my trade'))}):h('div',{class:'mu'},'No trades yet.')))}
init();

function toast(t){const e=h('div',{class:'toast',role:'status'},t);document.body.append(e);setTimeout(()=>e.remove(),2600)}
