'use strict';
const $=s=>document.querySelector(s);
function h(tag,attrs,...kids){const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs||{})){if(v==null||v===false)continue;if(k==='class')e.className=v;else if(k==='style')Object.assign(e.style,v);else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v)}for(const c of kids.flat()){if(c==null||c===false)continue;e.append(c instanceof Node?c:String(c))}return e}
const clear=e=>{e.replaceChildren();return e};
let B=[],A=[],H=[],C=[],sortK='mcap',sortD=-1;const open=new Set();
const f=n=>{if(n==null||typeof n!=='number'||!isFinite(n))return'—';const a=Math.abs(n);if(a>=1e12)return'$'+(n/1e12).toFixed(2)+'T';if(a>=1e9)return'$'+(n/1e9).toFixed(2)+'B';if(a>=1e6)return'$'+(n/1e6).toFixed(2)+'M';if(a>=1e3)return'$'+(n/1e3).toFixed(1)+'K';if(a>=1)return'$'+n.toFixed(2);if(a===0)return'$0';return'$'+n.toPrecision(3)};
const pct=n=>n==null||!isFinite(n)?'—':(n>0?'+':'')+n.toFixed(1)+'%';
const neutral=c=>/gravity|vault tech/i.test(c.name);
const chg=c=>(!neutral(c)&&c.op&&c.price)?(c.price/c.op-1)*100:null;
const key=c=>c.id||c.name;
function scol(c){const s=c.status||'';if(/ambiguous|assumed/i.test(s))return's-amb';if(/dead|illiquid|near zero|shutdown|offline/i.test(s))return's-dead';if(/rebrand|migrat|merged|swap|formerly/i.test(s))return's-reb';return''}
function slab(c){const k=scol(c);return k=='s-amb'?'Unsure match':k=='s-dead'?'Dead / illiquid':k=='s-reb'?'Rebranded':''}
function grad(p){if(p==null||!isFinite(p))return'#333';const t=Math.max(0,Math.min(1,1+p/100));return`hsl(${t*120},75%,48%)`}
const cols=[['name','Coin'],['price','Price'],['chg','vs 2023'],['mcap','Market cap'],['below','% Below ATH'],['ath','ATH'],['vol','24h Vol'],['m50','Mcap @50x'],['st','Status']];
function val(c,k){return k=='chg'?chg(c):k=='st'?slab(c)+(c.id?'':'static'):k=='m50'?(c.mcap?c.mcap*50:null):c[k]}
// ---- storage validation ----
const ID_RE=/^[a-z0-9][a-z0-9-]{0,99}$/;
const num=v=>typeof v==='number'&&isFinite(v)?v:null;
const str=(v,n=200)=>typeof v==='string'?v.slice(0,n):'';
function cleanAdded(x){if(!x||typeof x!=='object'||typeof x.id!=='string'||!ID_RE.test(x.id))return null;
 return{name:str(x.name,100)||x.id,ticker:str(x.ticker,20).toUpperCase(),id:x.id,added:true,price:num(x.price),mcap:num(x.mcap),vol:num(x.vol),ath:num(x.ath),athdate:/^\d{4}-\d{2}-\d{2}$/.test(x.athdate)?x.athdate:'',below:num(x.below),supply:num(x.supply),utility:'Added by you',status:''}}
function load(k){try{const v=JSON.parse(localStorage.getItem(k)||'[]');return Array.isArray(v)?v.slice(0,500):[]}catch(_){return[]}}
function save(){try{localStorage.setItem('cw_added',JSON.stringify(A));localStorage.setItem('cw_hidden',JSON.stringify(H))}catch(_){}}
// ---- render ----
const pill=c=>h('span',{class:'pill',style:{background:grad(c.below)}},pct(c.below));
const chips=c=>[c.added&&h('span',{class:'st s-add'},'Added by you'),' ',scol(c)&&h('span',{class:'st '+scol(c)},slab(c)),' ',!c.id&&h('span',{class:'st'},'static')];
const rmb=c=>h('button',{class:'rm',onclick:e=>{e.stopPropagation();removeCoin(key(c))}},(c.added?'Remove ':'Hide ')+(c.ticker||c.name));
const nm=(c,cl)=>h('div',{class:cl},h('b',{},c.name),h('span',{class:'tk'},c.ticker||''));
function details(c,ch,cl,full){const L=(k,...v)=>[h('b',{},k+': '),...v,h('br')];
 return[...(full?[...L('vs 2023',h('span',{class:cl},pct(ch)),' (2023: '+f(c.op)+')'),...L('ATH',f(c.ath)+' ('+(c.athdate||'—')+')'),...L('24h volume',f(c.vol))]:[...L('2023 price',f(c.op)+' · ATH date: '+(c.athdate||'—'))]),
 ...L('Supply',c.supply?Number(c.supply).toLocaleString(undefined,{maximumFractionDigits:0}):'—'),...L('Mcap @15x/20x/30x/40x/50x',[15,20,30,40,50].map(m=>f(c.mcap?c.mcap*m:null)).join(' / ')),...L('Utility',c.utility||'—'),h('b',{},'Status notes: '),c.status||'—',h('br'),rmb(c)]}
const toggle=i=>{open.has(i)?open.delete(i):open.add(i);render()};
function render(){const q=$('#q').value.toLowerCase();const r=C.filter(c=>(c.name+' '+(c.ticker||'')+' '+(c.utility||'')+' '+(c.status||'')).toLowerCase().includes(q));
 r.sort((a,b)=>{const x=val(a,sortK),y=val(b,sortK);if(x==null||x==='')return 1;if(y==null||y==='')return-1;return(typeof x=='string'?x.localeCompare(y):x-y)*sortD});
 clear($('#hd')).append(...cols.map(([k,l])=>h('th',{class:'c-'+k,onclick:()=>{sortD=k==sortK?-sortD:(k=='name'||k=='st'?1:-1);sortK=k;render()}},l+(k==sortK?(sortD>0?' ▲':' ▼'):''))));
 const tb=clear($('#tb')),cl=clear($('#cl'));
 r.forEach(c=>{const i=key(c),ch=chg(c),cc=ch==null?'':ch>=0?'up':'dn';
  tb.append(h('tr',{class:'row',onclick:()=>toggle(i)},h('td',{class:cc},h('b',{},c.name),h('span',{class:'tk'},c.ticker||'')),h('td',{class:cc},f(c.price)),h('td',{class:'c-chg '+cc},pct(ch)),h('td',{},f(c.mcap)),h('td',{},pill(c)),h('td',{class:'c-ath'},f(c.ath)),h('td',{class:'c-vol'},f(c.vol)),h('td',{class:'c-m50'},f(c.mcap?c.mcap*50:null)),h('td',{},chips(c))));
  if(open.has(i))tb.append(h('tr',{class:'det'},h('td',{colspan:'9'},details(c,ch,cc,false))));
  cl.append(h('div',{class:'k',onclick:()=>toggle(i)},h('div',{class:'h'},nm(c,cc),h('div',{},chips(c))),
   h('div',{class:'g'},h('div',{},h('span',{},'Price'),h('b',{class:cc},f(c.price))),h('div',{},h('span',{},'% below ATH'),pill(c)),h('div',{},h('span',{},'Market cap'),f(c.mcap))),
   open.has(i)?h('div',{class:'x'},details(c,ch,cc,true)):h('div',{class:'hint'},'Tap for details ▾')))});
 $('#so').value=sortK;$('#sd').textContent=sortD>0?'▲':'▼';const rh=$('#rh');rh.hidden=!H.length;rh.textContent='Restore hidden ('+H.length+')'}
function cards(){const cmp=C.map(c=>[c,chg(c)]).filter(x=>x[1]!=null);const up=cmp.filter(x=>x[1]>=0).length;
 const tot=C.reduce((s,c)=>s+(c.mcap||0),0);const b=C.map(c=>c.below).filter(x=>x!=null&&isFinite(x)).sort((a,b)=>a-b);const med=!b.length?null:b.length%2?b[(b.length-1)/2]:(b[b.length/2-1]+b[b.length/2])/2;
 cmp.sort((a,b)=>b[1]-a[1]);const li=a=>a.flatMap(([c,p])=>[(c.ticker||c.name)+' ',h('span',{class:p>=0?'up':'dn'},pct(p)),h('br')]);
 const card=(l,v,s)=>h('div',{class:'c'},h('div',{class:'l'},l),v,s&&h('small',{},s));
 clear($('#cards')).append(card('Coins tracked',h('div',{class:'v'},C.length),C.filter(c=>c.id).length+' live-priced'),
  card('Since 2023',h('div',{class:'v'},h('span',{class:'up'},up+'↑'),' / ',h('span',{class:'dn'},(cmp.length-up)+'↓')),'of '+cmp.length+' comparable'),
  card('Total market cap',h('div',{class:'v'},f(tot))),card('Median % below ATH',h('div',{class:'v dn'},pct(med))),
  card('Top gainers',h('div',{},li(cmp.slice(0,3)))),card('Top decliners',h('div',{},li(cmp.slice(-3).reverse()))))}
const rebuild=()=>{C=[...B,...A].filter(c=>!H.includes(key(c)));open.clear()};
const refresh=()=>{rebuild();cards();render()};
function removeCoin(k){const c=[...B,...A].find(x=>key(x)===k);if(!c)return;
 if(c.added){if(!confirm('Remove '+c.name+' from your watchlist?'))return;A=A.filter(x=>key(x)!==k)}
 else{if(!confirm('Hide '+c.name+'? You can bring it back with "Restore hidden".'))return;H.push(k)}save();refresh()}
const msg=(t,cls)=>clear($('#ar')).append(h('div',{class:cls||'mu'},t));
let st;
function onSearch(e){clearTimeout(st);const q=e.target.value.trim();if(q.length<2){clear($('#ar'));return}
 st=setTimeout(async()=>{try{msg('Searching…');const r=await(await fetch('https://api.coingecko.com/api/v3/search?query='+encodeURIComponent(q.slice(0,50)),{referrerPolicy:'no-referrer'})).json();
  const have=new Set([...B,...A].map(key));const list=(Array.isArray(r&&r.coins)?r.coins:[]).filter(c=>c&&typeof c.id==='string'&&ID_RE.test(c.id)).slice(0,8);
  if(!list.length)return msg('No matches.');
  clear($('#ar')).append(...list.map(c=>{let img=null;try{const u=new URL(c.thumb);if(u.protocol==='https:'&&/(^|\.)coingecko\.com$/.test(u.hostname))img=h('img',{src:u.href,alt:'',referrerpolicy:'no-referrer'})}catch(_){}
   return h('div',{class:'ar',onclick:()=>addCoin(c.id)},h('span',{},img,h('b',{},str(c.name,100)),h('span',{class:'tk'},str(c.symbol,20))),h('span',{class:'mu'},have.has(c.id)?(H.includes(c.id)?'hidden':'on list'):'+ Add'))}))}
  catch(_){msg('Search failed (CoinGecko rate limit?). Try again shortly.','dn')}},400)}
async function addCoin(id){if(!ID_RE.test(id))return;const done=()=>{clear($('#ar'));$('#aq').value=''};
 if(H.includes(id)){H=H.filter(x=>x!==id);save();refresh();return done()}
 if([...B,...A].some(c=>c.id===id))return msg('Already on your list.');
 try{const m=(await(await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids='+encodeURIComponent(id),{referrerPolicy:'no-referrer'})).json())[0];if(!m)throw 0;
  const c=cleanAdded({name:m.name,ticker:m.symbol,id:m.id,price:m.current_price,mcap:m.market_cap,vol:m.total_volume,ath:m.ath,athdate:str(m.ath_date).slice(0,10),below:m.ath_change_percentage,supply:m.circulating_supply});if(!c)throw 0;
  A.push(c);save();refresh();done()}catch(_){msg("Couldn't load that coin from CoinGecko. Try again shortly.",'dn')}}
async function init(){
 const so=$('#so');so.append(...cols.map(([k,l])=>h('option',{value:k},'Sort: '+l)));so.addEventListener('change',e=>{sortK=e.target.value;sortD=(sortK=='name'||sortK=='st')?1:-1;render()});
 $('#sd').addEventListener('click',()=>{sortD=-sortD;render()});$('#q').addEventListener('input',render);$('#aq').addEventListener('input',onSearch);
 $('#rh').addEventListener('click',()=>{if(confirm('Restore '+H.length+' hidden coin(s)?')){H=[];save();refresh()}});
 const d=await(await fetch('data.json')).json();B=d.coins;
 A=load('cw_added').map(cleanAdded).filter(Boolean).filter((c,i,a)=>a.findIndex(x=>x.id===c.id)===i&&!B.some(b=>b.id===c.id));
 const valid=new Set(B.map(key).concat(A.map(key)));H=[...new Set(load('cw_hidden').filter(k=>typeof k==='string'&&valid.has(k)))];save();rebuild();
 const ids=[...new Set([...B,...A].filter(c=>c.id).map(c=>c.id))];const badge=$('#badge');
 try{const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids='+ids.join(',')+'&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true',{referrerPolicy:'no-referrer'});if(!r.ok)throw 0;const p=await r.json();let n=0;
  [...B,...A].forEach(c=>{const x=c.id&&p[c.id];if(x&&num(x.usd)!=null){n++;c.price=x.usd;if(num(x.usd_market_cap))c.mcap=x.usd_market_cap;if(num(x.usd_24h_vol)!=null)c.vol=x.usd_24h_vol;if(c.ath)c.below=(c.price/c.ath-1)*100}});if(!n)throw 0;save();
  badge.className='badge live';badge.textContent='● Live · '+new Date().toLocaleTimeString()}catch(_){badge.textContent='Snapshot as of '+d.asof}
 refresh()}
init();
