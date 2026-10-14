'use strict';
let me=null,profiles=[],coins=[],trades=[],log=[];
const main=()=>$('#main');
const sec=(title,...kids)=>h('section',{class:'legend'},h('h3',{},title),...kids);
async function init(){me=await currentProfile();clear($('#navwrap')).append(navBar(me,'Admin'));
 if(!me||me.role!=='admin'){clear(main()).append(h('div',{class:'den'},h('h2',{},'Admins only'),h('p',{class:'mu'},'Taking you to the dashboard…')));setTimeout(()=>location.replace('app.html'),1800);return}
 await load();render()}
async function load(){const [p,c,t,l]=await Promise.all([sb.from('profiles').select('id,username,role,created_at,approved_at').limit(1000),sb.from('coins').select('coingecko_id,name,ticker,removed,added_at').order('name').limit(1000),
 sb.from('trades').select('*').order('traded_at',{ascending:false}).limit(200),sb.from('change_log').select('*').order('created_at',{ascending:false}).limit(200)]);
 profiles=(p.data||[]).filter(u=>UN_RE.test(u.username)&&ROLES.includes(u.role));coins=c.data||[];trades=t.data||[];log=l.data||[]}
const reload=async()=>{await load();render()};
async function setRole(u,r){if(!confirm('Change '+u.username+' to '+r+'?'))return;const {data,error}=await sb.from('profiles').update({role:r}).eq('id',u.id).select('id');if(error||!data||!data.length)alert('Could not change role'+(error?': '+error.message:''));await reload()}
async function delCoin(c){if(!confirm('Permanently delete '+c.name+'? This cannot be undone (its change log is kept).'))return;const {data,error}=await sb.from('coins').delete().eq('coingecko_id',c.coingecko_id).select('coingecko_id');if(error||!data||!data.length)alert('Could not delete'+(error?': '+error.message:''));await reload()}
async function delTrade(t){if(!confirm('Delete '+(t.username||'?')+"'s "+t.side+' of '+qty(t.quantity)+' '+t.coin+'?'))return;const {data,error}=await sb.from('trades').delete().eq('id',t.id).select('id');if(error||!data||!data.length)alert('Could not delete'+(error?': '+error.message:''));await reload()}
const ACT={add:'added',remove:'removed',restore:'restored',delete:'permanently deleted',role_change:'changed role:',trade_delete:'deleted a trade:'};
let coinQ='';
function render(){const m=clear(main());const cnt=r=>profiles.filter(u=>u.role===r).length;const day=Date.now()-864e5,week=Date.now()-7*864e5;
 const stat=(l,v)=>h('div',{class:'c'},h('div',{class:'l'},l),h('div',{class:'v'},v));
 m.append(sec('Overview',h('div',{class:'stat-grid'},stat('Users',profiles.length),stat('Pending',cnt('pending')),stat('Editors',cnt('editor')),stat('Viewers',cnt('viewer')),stat('Admins',cnt('admin')),
  stat('Changes (24h)',log.filter(r=>Date.parse(r.created_at)>day).length),stat('Changes (7d)',log.filter(r=>Date.parse(r.created_at)>week).length),stat('Trades',trades.length))));
 const order={pending:0,editor:1,viewer:2,admin:3};
 m.append(sec('Users',...[...profiles].sort((x,y)=>order[x.role]-order[y.role]||String(y.created_at).localeCompare(x.created_at)).map(u=>{const self=u.id===me.id;const b=(r,l)=>u.role!==r&&h('button',{class:'rm ok sm',onclick:()=>setRole(u,r)},l);
  return h('div',{class:'urow'+(u.role==='pending'?' pend':'')},h('span',{},h('b',{},u.username),' ',h('span',{class:'st'},u.role),h('span',{class:'lt'},' joined '+new Date(u.created_at).toLocaleDateString())),
   self||u.role==='admin'?h('span',{class:'mu'},self?'you':''):h('span',{class:'ubtn'},b('editor','Approve as editor'),b('viewer','Set viewer'),u.role!=='pending'&&h('button',{class:'rm sm',onclick:()=>setRole(u,'pending')},'Revoke')))})));
 const list=h('div',{});const drawCoins=()=>{clear(list).append(...coins.filter(c=>(c.name+' '+(c.ticker||'')+' '+c.coingecko_id).toLowerCase().includes(coinQ)).slice(0,60).map(c=>h('div',{class:'urow'},h('span',{},h('b',{},str(c.name,100)),h('span',{class:'tk'},str(c.ticker,20)),c.removed?h('span',{class:'st'},' removed'):''),h('button',{class:'rm sm',onclick:()=>delCoin(c)},'Delete permanently'))))};
 m.append(sec('Coins (permanent delete)',h('input',{type:'search',placeholder:'Filter coins…',value:coinQ,oninput:e=>{coinQ=e.target.value.toLowerCase();drawCoins()}}),list));drawCoins();
 m.append(sec('Trade moderation',trades.length?trades.slice(0,100).map(t=>h('div',{class:'urow'},h('span',{},h('b',{},str(t.username,20)||'?'),' ',h('span',{class:t.side==='buy'?'up':'dn'},t.side),' '+qty(t.quantity)+' '+str(t.coin_name||t.coin,60)+' @ '+money(t.price_usd),h('span',{class:'lt'},' '+new Date(t.traded_at).toLocaleString())),h('button',{class:'rm sm',onclick:()=>delTrade(t)},'Delete'))):h('div',{class:'mu'},'No trades yet.')));
 m.append(sec('Full change log',log.length?log.filter(r=>ACT[r.action]).map(r=>h('div',{class:'lg'},h('span',{class:'lt'},new Date(r.created_at).toLocaleString()),h('span',{},h('b',{},str(r.username,20)||'someone'),' ',h('span',{class:'la la-'+r.action},ACT[r.action]),' ',r.action==='role_change'||r.action==='trade_delete'?str(r.detail,160):(str(r.coin_name,100)||r.coingecko_id)))):h('div',{class:'mu'},'No changes yet.')))}
init();
