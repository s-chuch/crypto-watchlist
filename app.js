'use strict';
const $=s=>document.querySelector(s);
function h(tag,attrs,...kids){const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs||{})){if(v==null||v===false)continue;if(k==='class')e.className=v;else if(k==='style')Object.assign(e.style,v);else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v)}for(const c of kids.flat()){if(c==null||c===false)continue;e.append(c instanceof Node?c:String(c))}return e}
const clear=e=>{e.replaceChildren();return e};
let B=[],A=[],H=[],C=[],sortK='mcap',sortD=-1;const open=new Set();
const f=n=>{if(n==null||typeof n!=='number'||!isFinite(n))return'—';const a=Math.abs(n);if(a>=1e12)return'$'+(n/1e12).toFixed(2)+'T';if(a>=1e9)return'$'+(n/1e9).toFixed(2)+'B';if(a>=1e6)return'$'+(n/1e6).toFixed(2)+'M';if(a>=1e3)return'$'+(n/1e3).toFixed(1)+'K';if(a>=1)return'$'+n.toFixed(2);if(a===0)return'$0';return'$'+n.toPrecision(3)};
const pct=n=>n==null||!isFinite(n)?'—':(n>0?'+':'')+n.toFixed(1)+'%';
const neutral=c=>/gravity|vault tech/i.test(c.name);
const chg=c=>(!neutral(c)&&c.op&&c.price)?(c.price/c.op-1)*100:null;
const key=c=>c.key||c.id||c.name;
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
// ---- render ----
const pill=c=>h('span',{class:'pill',style:{background:grad(c.below)}},pct(c.below));
const chips=c=>[c.added&&h('span',{class:'st s-add'},c.addedBy&&me&&c.addedBy===me.id?'Added by you':'Added by '+(c.addedEmail||'a member')),' ',scol(c)&&h('span',{class:'st '+scol(c)},slab(c)),' ',!c.id&&h('span',{class:'st'},'static')];
const rmb=c=>canEdit()?h('span',{},h('button',{class:'rm',onclick:e=>{e.stopPropagation();removeCoin(key(c))}},'Remove '+(c.ticker||c.name)),' ',isAdmin()&&h('button',{class:'rm',onclick:e=>{e.stopPropagation();hardDelete(key(c))}},'Delete permanently')):null;
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
 $('#so').value=sortK;$('#sd').textContent=sortD>0?'▲':'▼';const rh=$('#rh');rh.hidden=!H.length||!canEdit();rh.textContent='Removed coins ('+H.length+')';renderRemoved();renderAuth()}
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
async function removeCoin(k){const c=[...B,...A].find(x=>key(x)===k);if(!c||!canEdit())return;
 if(!confirm('Remove '+c.name+' from the shared list? Editors can restore it later.'))return;
 const {error}=await sb.from('coins').update({removed:true}).eq('coingecko_id',k);if(error)return alert('Could not remove: '+error.message);await reload()}
async function hardDelete(k){if(!isAdmin())return;const c=allRows.find(x=>x.key===k);if(!c||!confirm('Permanently delete '+c.name+'? This cannot be undone (the change log is kept).'))return;
 const {error}=await sb.from('coins').delete().eq('coingecko_id',k);if(error)return alert('Could not delete: '+error.message);await reload()}
async function restoreCoin(k){if(!canEdit())return;const c=allRows.find(x=>x.key===k);if(!confirm('Restore '+(c?c.name:k)+'?'))return;
 const {error}=await sb.from('coins').update({removed:false}).eq('coingecko_id',k);if(error)return alert('Could not restore: '+error.message);await reload()}
function renderRemoved(){const box=$('#removed');box.hidden=!showRemoved||!canEdit()||!H.length;if(box.hidden)return;
 clear(box).append(h('h3',{},'Removed coins'),...allRows.filter(c=>H.includes(c.key)).map(c=>h('div',{class:'ar'},h('span',{},h('b',{},c.name),h('span',{class:'tk'},c.ticker||'')),h('button',{class:'rm ok',onclick:()=>restoreCoin(c.key)},'Restore'))))}
const UN_RE=/^[a-z0-9_]{3,20}$/,DOM='@users.crypto-watchlist.invalid';let authMode='in';
const ROLE_TXT={admin:'admin',editor:'editor',viewer:'viewer',pending:'pending approval'};
function renderAuth(){const a=clear($('#auth'));
 if(me){const nmv=prof?prof.username.charAt(0).toUpperCase()+prof.username.slice(1):'…',role=prof?prof.role:'';
  a.append(h('span',{class:'who'},'Signed in as ',h('b',{},nmv),role?' ('+ROLE_TXT[role]+')':''),' ',h('button',{class:'btn ghost',onclick:async()=>{await sb.auth.signOut()}},'Sign out'));
  if(role==='pending')a.append(h('div',{class:'notice'},'Waiting for admin approval. You can view everything, but you can\'t add or remove coins yet.'))}
 else{const up=authMode==='up';
  a.append(h('form',{class:'si',onsubmit:onAuth},
   h('div',{class:'tabs'},h('button',{type:'button',class:'tab'+(up?'':' on'),onclick:()=>{authMode='in';renderAuth()}},'Sign in'),h('button',{type:'button',class:'tab'+(up?' on':''),onclick:()=>{authMode='up';renderAuth()}},'Sign up')),
   h('input',{name:'un',placeholder:'Username',autocomplete:'username',autocapitalize:'none',spellcheck:'false',required:true,maxlength:'20'}),
   h('input',{name:'pw',type:'password',placeholder:'Password',autocomplete:up?'new-password':'current-password',required:true,minlength:up?'8':null}),
   up&&h('input',{name:'pw2',type:'password',placeholder:'Confirm password',autocomplete:'new-password',required:true}),
   h('button',{class:'btn',type:'submit'},up?'Create account':'Sign in')),h('div',{id:'am'}))}
 const ce=canEdit();$('#addbox').hidden=!ce;$('#addhint').hidden=ce;
 $('#addhint').textContent=!me?'Sign in to add or remove coins. Viewing is open to everyone.':(prof&&prof.role==='viewer')?'Your account is view-only.':prof&&prof.role==='pending'?'Your account is waiting for admin approval.':'';
 renderUsers()}
async function onAuth(e){e.preventDefault();const f=e.target.elements,un=f.un.value.trim().toLowerCase(),pw=f.pw.value;
 if(!UN_RE.test(un))return authMsg('Username must be 3–20 characters: letters, numbers or _.','dn');
 if(authMode==='up'){if(pw.length<8)return authMsg('Password must be at least 8 characters.','dn');if(pw!==f.pw2.value)return authMsg('Passwords don\'t match.','dn');
  authMsg('Creating account…');const {data,error}=await sb.auth.signUp({email:un+DOM,password:pw});
  if(error)return authMsg(/registered|exists|reserved|database error/i.test(error.message)?'That username is taken or reserved.':'Sign-up failed: '+error.message,'dn');
  if(!data.session)return authMsg('Account created, but sign-in is waiting on email confirmation, which is still on in Supabase. Ask the admin to turn it off.','dn')}
 else{authMsg('Signing in…');const {error}=await sb.auth.signInWithPassword({email:un+DOM,password:pw});if(error)return authMsg('Wrong username or password.','dn')}}
async function loadProfile(){prof=null;if(!me)return;const {data}=await sb.from('profiles').select('id,username,role').eq('id',me.id).maybeSingle();
 if(data&&UN_RE.test(data.username)&&ROLE_TXT[data.role])prof=data}
const canEdit=()=>!!prof&&(prof.role==='editor'||prof.role==='admin'),isAdmin=()=>!!prof&&prof.role==='admin';
let usersOpen=false,users=[];
async function renderUsers(){const box=$('#users');if(!isAdmin()){box.hidden=true;return}box.hidden=false;
 clear(box).append(h('h3',{},'Users ',h('button',{class:'btn ghost sm',onclick:async()=>{usersOpen=!usersOpen;if(usersOpen)await loadUsers();renderUsers()}},usersOpen?'Hide':'Show')));
 if(!usersOpen)return;const order={pending:0,editor:1,viewer:2,admin:3};
 const list=[...users].sort((x,y)=>order[x.role]-order[y.role]||String(y.created_at).localeCompare(x.created_at));
 box.append(...list.map(u=>{const self=u.id===me.id;const b=(r,l)=>u.role!==r&&h('button',{class:'rm ok sm',onclick:()=>setRole(u,r)},l);
  return h('div',{class:'urow'+(u.role==='pending'?' pend':'')},h('span',{},h('b',{},u.username),' ',h('span',{class:'st'},u.role),h('span',{class:'lt'},' joined '+new Date(u.created_at).toLocaleDateString())),
   self||u.role==='admin'?h('span',{class:'mu'},self?'you':''):h('span',{class:'ubtn'},b('editor','Approve as editor'),b('viewer','Set viewer'),u.role!=='pending'&&h('button',{class:'rm sm',onclick:()=>setRole(u,'pending')},'Revoke')))}))}
async function loadUsers(){const {data,error}=await sb.from('profiles').select('id,username,role,created_at').limit(500);users=error?[]:data.filter(u=>UN_RE.test(u.username)&&ROLE_TXT[u.role])}
async function setRole(u,r){if(!confirm('Change '+u.username+' to '+r+'?'))return;const {data,error}=await sb.from('profiles').update({role:r}).eq('id',u.id).select('id');
 if(error||!data||!data.length)return alert('Could not change role'+(error?': '+error.message:''));await loadUsers();await reload()}
function authMsg(t,c){const m=$('#am');if(m)clear(m).append(h('div',{class:c||'mu'},t))}
function renderLog(){const l=clear($('#log'));if(!logRows.length)return l.append(h('div',{class:'mu'},'No changes yet.'));
 const A={add:'added',remove:'removed',restore:'restored',delete:'permanently deleted',role_change:'changed role:'};
 l.append(...logRows.filter(r=>A[r.action]).map(r=>h('div',{class:'lg'},h('span',{class:'lt'},new Date(r.created_at).toLocaleString()),h('span',{},h('b',{},str(r.username,20)||'someone'),' ',h('span',{class:'la la-'+r.action},A[r.action]),' ',r.action==='role_change'?str(r.detail,100):(str(r.coin_name,100)||r.coingecko_id)))))}
const msg=(t,cls)=>clear($('#ar')).append(h('div',{class:cls||'mu'},t));
let st;
function onSearch(e){clearTimeout(st);const q=e.target.value.trim();if(q.length<2){clear($('#ar'));return}
 st=setTimeout(async()=>{try{msg('Searching…');const r=await(await fetch('https://api.coingecko.com/api/v3/search?query='+encodeURIComponent(q.slice(0,50)),{referrerPolicy:'no-referrer'})).json();
  const have=new Set([...B,...A].map(key));const list=(Array.isArray(r&&r.coins)?r.coins:[]).filter(c=>c&&typeof c.id==='string'&&ID_RE.test(c.id)).slice(0,8);
  if(!list.length)return msg('No matches.');
  clear($('#ar')).append(...list.map(c=>{let img=null;try{const u=new URL(c.thumb);if(u.protocol==='https:'&&/(^|\.)coingecko\.com$/.test(u.hostname))img=h('img',{src:u.href,alt:'',referrerpolicy:'no-referrer'})}catch(_){}
   return h('div',{class:'ar',onclick:()=>addCoin(c.id)},h('span',{},img,h('b',{},str(c.name,100)),h('span',{class:'tk'},str(c.symbol,20))),h('span',{class:'mu'},have.has(c.id)?(H.includes(c.id)?'hidden':'on list'):'+ Add'))}))}
  catch(_){msg('Search failed (CoinGecko rate limit?). Try again shortly.','dn')}},400)}
async function addCoin(id){if(!ID_RE.test(id)||!canEdit())return;const done=()=>{clear($('#ar'));$('#aq').value=''};
 if(H.includes(id)){done();return restoreCoin(id)}
 if([...B,...A].some(c=>c.id===id))return msg('Already on the list.');
 try{msg('Adding…');const m=(await(await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids='+encodeURIComponent(id),{referrerPolicy:'no-referrer'})).json())[0];if(!m)throw 0;
  const c=cleanAdded({name:m.name,ticker:m.symbol,id:m.id,price:m.current_price,mcap:m.market_cap,vol:m.total_volume,ath:m.ath,athdate:str(m.ath_date).slice(0,10),below:m.ath_change_percentage,supply:m.circulating_supply});if(!c)throw 0;
  const {error}=await sb.from('coins').insert({coingecko_id:c.id,name:c.name,ticker:c.ticker,price:c.price,supply:c.supply,mcap:c.mcap,ath:c.ath,ath_date:c.athdate||null,below_ath:c.below,volume:c.vol,added_by:me.id});
  if(error)return msg('Could not add: '+error.message,'dn');done();await reload()}catch(_){msg("Couldn't load that coin from CoinGecko. Try again shortly.",'dn')}}
const SB_URL='https://rgohzlofcfkpsigqjcab.supabase.co',SB_KEY='sb_publishable_cZVafIc3SZNzGEdir7JqEA_Nz7LFv3N',SITE='https://s-chuch.github.io/crypto-watchlist/';
const sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,detectSessionInUrl:true,flowType:'pkce'}});
let me=null,prof=null,allRows=[],logRows=[],showRemoved=false,live=null;
function fromRow(r){const id=typeof r.coingecko_id==='string'?r.coingecko_id:'';const st=id.startsWith('static:');
 return{key:id,id:st?null:(ID_RE.test(id)?id:null),name:str(r.name,100)||id,ticker:str(r.ticker,20),utility:str(r.utility,2000),status:str(r.notes,2000),op:num(r.orig_price),osup:num(r.orig_supply),oath:num(r.orig_ath),
  price:num(r.price),supply:num(r.supply),mcap:num(r.mcap),ath:num(r.ath),athdate:/^\d{4}-\d{2}-\d{2}$/.test(r.ath_date)?r.ath_date:'',below:num(r.below_ath),vol:num(r.volume),added:!!r.added_by,addedBy:r.added_by||null,removed:r.removed===true}}
async function reload(){const [c,l]=await Promise.all([sb.from('coins').select('*').limit(1000),sb.from('change_log').select('*').order('created_at',{ascending:false}).limit(50)]);
 if(c.error)throw c.error;logRows=l.error?[]:l.data;allRows=c.data.map(fromRow);
 const emails={};[...logRows].reverse().forEach(r=>{if(r.action==='add')emails[r.coingecko_id]=str(r.username,20)});
 allRows.forEach(c=>{c.addedEmail=emails[c.key]||'';if(live&&c.id&&live[c.id])applyLive(c,live[c.id])});
 B=allRows.filter(c=>!c.added);A=allRows.filter(c=>c.added);H=allRows.filter(c=>c.removed).map(c=>c.key);renderLog();refresh()}
function applyLive(c,x){if(num(x.usd)==null)return false;c.price=x.usd;if(num(x.usd_market_cap))c.mcap=x.usd_market_cap;if(num(x.usd_24h_vol)!=null)c.vol=x.usd_24h_vol;if(c.ath)c.below=(c.price/c.ath-1)*100;return true}
async function init(){
 const so=$('#so');so.append(...cols.map(([k,l])=>h('option',{value:k},'Sort: '+l)));so.addEventListener('change',e=>{sortK=e.target.value;sortD=(sortK=='name'||sortK=='st')?1:-1;render()});
 $('#sd').addEventListener('click',()=>{sortD=-sortD;render()});$('#q').addEventListener('input',render);$('#aq').addEventListener('input',onSearch);
 $('#rh').addEventListener('click',()=>{showRemoved=!showRemoved;renderRemoved()});
 try{const {data}=await sb.auth.getSession();me=data.session?data.session.user:null;await loadProfile()}catch(_){}
 sb.auth.onAuthStateChange((_e,session)=>{const n=session?session.user:null;if((n&&n.id)!==(me&&me.id)){me=n;usersOpen=false;setTimeout(async()=>{await loadProfile();render()},0)}});
 const badge=$('#badge');let src='shared';
 try{await reload()}catch(_){src='file';const d=await(await fetch('data.json')).json();allRows=d.coins.map(c=>Object.assign({},c,{key:c.id||c.name}));B=allRows;A=[];H=[];refresh();
  clear($('#log')).append(h('div',{class:'dn'},'Shared list unavailable; showing the saved snapshot.'))}
 const ids=[...new Set(allRows.filter(c=>c.id).map(c=>c.id))];
 try{const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids='+ids.join(',')+'&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true',{referrerPolicy:'no-referrer'});if(!r.ok)throw 0;live=await r.json();let n=0;
  allRows.forEach(c=>{if(c.id&&live[c.id]&&applyLive(c,live[c.id]))n++});if(!n)throw 0;
  badge.className='badge live';badge.textContent='● Live · '+new Date().toLocaleTimeString()}catch(_){live=null;badge.textContent='Snapshot as of 2026-10-12 20:30 ET'}
 refresh()}
init();
