'use strict';
let f_fp=null,f_upd=null,me=null,trades=[],live={},fUser='',fCoin='',pick=null,st;
const canEdit=()=>!!me&&(me.role==='editor'||me.role==='admin');
const COIN_RE=/^[A-Za-z0-9][A-Za-z0-9._-]{0,59}$/;
async function init(){me=await currentProfile();clear($('#navwrap')).append(navBar(me,'Trades'));await load();render()}
async function load(){const {data}=await sb.from('trades').select('*').order('traded_at',{ascending:false}).limit(500);trades=data||[];live=await livePrices(trades.map(t=>t.coin))}
function nowLocal(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)}
function form(){if(!canEdit())return h('div',{class:'vo'},!me?'👁 View-only mode — sign in on the dashboard to log trades':'👁 View-only mode — your account can view but not log trades');
 let price=null;const pinfo=h('div',{class:'pinfo'},'Price: pick a coin'),getq=h('div',{class:'tot'},'You get ≈ —');
 const dec=q=>q>=1000?2:q>=1?4:q>=0.01?6:8,fq=q=>q.toLocaleString(undefined,{maximumFractionDigits:dec(q)});
 const amt=()=>Number(f.elements.a.value);
 const upd=()=>{const a=amt(),ok=!!pick&&a>0&&price>0;getq.textContent='You get ≈ '+(pick&&a>0&&price>0?fq(a/price)+' '+(pick.sym||''):'—');bBuy.disabled=!ok;bSell.disabled=!ok};
 const bBuy=h('button',{type:'button',class:'big buy',disabled:true,onclick:()=>save('buy')},'Buy'),bSell=h('button',{type:'button',class:'big sell',disabled:true,onclick:()=>save('sell')},'Sell');
 const rf=()=>h('button',{type:'button',class:'rf',title:'Refresh price','aria-label':'Refresh price',onclick:fp},'↻');
 const fp=async()=>{price=null;upd();if(!pick){clear(pinfo).append('Price: pick a coin');return null}clear(pinfo).append('Price: fetching…');
  const p=(await livePrices([pick.id]))[pick.id];if(p!=null&&p>0){price=p;clear(pinfo).append('Price: ',h('b',{},money(p)),' · live '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+' ',rf())}
  else clear(pinfo).append(h('span',{class:'dn'},"Price: couldn't fetch price "),rf());upd();return price};
 f_fp=fp;f_upd=upd;
 const res=h('div',{id:'ar'}),msg=h('div',{class:'mu'});const chosen=h('div',{class:'mu'},'Search for a coin and pick it.');
 const save=async sd=>{const el=f.elements,a=amt();if(!pick||!(a>0)||!(price>0))return;
  const when=el.d.value?new Date(el.d.value):new Date();if(isNaN(when))return msg.textContent='Invalid date.';const note=el.n.value.trim().slice(0,280);
  msg.textContent='Checking latest price…';const p=await fp();if(!(p>0)){msg.textContent="Couldn't refresh the price, so nothing was saved. Try again.";return}
  const q=a/p,nm=pick.name,sym=pick.sym||'';msg.textContent='';
  if(!confirm((sd==='buy'?'Buy ':'Sell ')+money(a)+' of '+nm+' at '+money(p)+' (≈ '+fq(q)+' '+sym+')?'))return;
  msg.textContent='Saving…';const {error}=await sb.from('trades').insert({coin:pick.id,coin_name:nm.slice(0,100),side:sd,quantity:q,price_usd:p,amount_usd:a,traded_at:when.toISOString(),note:note||null});
  if(error)return msg.textContent='Could not save: '+error.message;pick=null;await load();render();toast((sd==='buy'?'Bought ':'Sold ')+money(a)+' of '+nm+' ✓')};
 const f=h('form',{class:'tf',onsubmit:e=>e.preventDefault()},
  h('input',{name:'cs',type:'search',placeholder:'Search coin (name or ticker)…',autocomplete:'off',oninput:e=>search(e.target.value,res,chosen,f)}),
  res,chosen,pinfo,
  h('div',{class:'tg'},
   h('label',{},'Amount (USD)',h('input',{name:'a',oninput:()=>upd(),type:'number',step:'any',min:'0',inputmode:'decimal',placeholder:'e.g. 100'})),
   h('label',{},'Date & time',h('input',{name:'d',type:'datetime-local',value:nowLocal()}))),
  getq,h('textarea',{name:'n',maxlength:'280',placeholder:'Note (optional, max 280 characters)',rows:'2'}),h('div',{class:'bs'},bBuy,bSell),msg);
 upd();return h('section',{class:'legend'},h('h3',{},'Log a trade'),f)}
function search(q,res,chosen,f){clearTimeout(st);q=q.trim();if(q.length<2){clear(res);return}
 st=setTimeout(async()=>{try{const r=await(await fetch('https://api.coingecko.com/api/v3/search?query='+encodeURIComponent(q.slice(0,50)),{referrerPolicy:'no-referrer'})).json();
  const list=(Array.isArray(r&&r.coins)?r.coins:[]).filter(c=>c&&typeof c.id==='string'&&ID_RE.test(c.id)).slice(0,6);
  clear(res).append(...list.map(c=>h('div',{class:'ar',onclick:()=>{pick={id:c.id,name:str(c.name,100),sym:str(c.symbol,20).toUpperCase()};clear(res);chosen.textContent='Coin: '+pick.name+' ('+pick.sym+')';f_fp&&f_fp()}},
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
    h('div',{class:'g'},h('div',{},h('span',{},'Quantity'),qty(q)),h('div',{},h('span',{},'Price'),money(p)),h('div',{},h('span',{},'Amount'),money(num(t.amount_usd)!=null?t.amount_usd:t.total)),
     h('div',{},h('span',{},'Value now'),cur==null?'—':money(cur)),h('div',{},h('span',{},'P/L vs live'),d==null?h('span',{class:'mu'},'n/a'):h('b',{class:d>=0?'up':'dn'},(d>=0?'+':'')+money(d)+' ('+((t.side==='buy'?1:-1)*(lp/p-1)*100).toFixed(1)+'%)'))),
    t.note&&h('div',{class:'mu note'},'“'+str(t.note,280)+'”'),me&&t.user_id===me.id&&h('button',{class:'rm sm',onclick:()=>del(t)},'Delete my trade'))}):h('div',{class:'mu'},'No trades yet.')))}
init();

function toast(t){const e=h('div',{class:'toast',role:'status'},t);document.body.append(e);setTimeout(()=>e.remove(),2600)}
