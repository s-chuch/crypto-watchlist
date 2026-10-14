'use strict';
// Shared helpers for admin.html and trades.html (DOM-only rendering, no innerHTML).
const $=s=>document.querySelector(s);
function h(tag,attrs,...kids){const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs||{})){if(v==null||v===false)continue;if(k==='class')e.className=v;else if(k==='style')Object.assign(e.style,v);else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v)}for(const c of kids.flat()){if(c==null||c===false)continue;e.append(c instanceof Node?c:String(c))}return e}
const clear=e=>{e.replaceChildren();return e};
const num=v=>{const n=typeof v==='string'?Number(v):v;return typeof n==='number'&&isFinite(n)?n:null};
const str=(v,n=200)=>typeof v==='string'?v.slice(0,n):'';
const money=n=>{n=num(n);if(n==null)return'—';const a=Math.abs(n);if(a>=1e9)return'$'+(n/1e9).toFixed(2)+'B';if(a>=1e6)return'$'+(n/1e6).toFixed(2)+'M';if(a>=1e3)return'$'+n.toLocaleString(undefined,{maximumFractionDigits:2});if(a>=1)return'$'+n.toFixed(2);if(a===0)return'$0';return'$'+n.toPrecision(3)};
const qty=n=>{n=num(n);return n==null?'—':n.toLocaleString(undefined,{maximumFractionDigits:8})};
const ID_RE=/^[a-z0-9][a-z0-9-]{0,99}$/,UN_RE=/^[a-z0-9_]{3,20}$/,ROLES=['admin','editor','viewer','pending'];
const sb=window.supabase.createClient('https://rgohzlofcfkpsigqjcab.supabase.co','sb_publishable_cZVafIc3SZNzGEdir7JqEA_Nz7LFv3N',{auth:{persistSession:true,detectSessionInUrl:false}});
async function currentProfile(){try{const {data}=await sb.auth.getSession();const u=data.session&&data.session.user;if(!u)return null;
 const r=await sb.from('profiles').select('id,username,role').eq('id',u.id).maybeSingle();const p=r.data;return p&&UN_RE.test(p.username)&&ROLES.includes(p.role)?p:{id:u.id,username:'',role:'pending'}}catch(_){return null}}
const cap=s=>s?s.charAt(0).toUpperCase()+s.slice(1):'';
function navBar(p,active){const links=[['./','Home'],['app.html','Dashboard'],['trades.html','Trades']];if(p&&p.role==='admin')links.push(['admin.html','Admin']);
 return h('nav',{class:'nav'},links.map(([u,l])=>h('a',{href:u,class:l===active?'on':null},l)),p?h('span',{class:'mu'},cap(p.username)+' ('+p.role+')'):h('a',{href:'app.html'},'Sign in'))}
async function livePrices(ids){ids=[...new Set(ids.filter(i=>ID_RE.test(i)))];if(!ids.length)return{};try{const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids='+ids.join(',')+'&vs_currencies=usd',{referrerPolicy:'no-referrer'});if(!r.ok)return{};const p=await r.json();const o={};for(const i of ids)if(p[i]&&num(p[i].usd)!=null)o[i]=p[i].usd;return o}catch(_){return{}}}
