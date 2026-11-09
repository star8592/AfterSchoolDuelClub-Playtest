/**
 * First class, playable R19 main-home integration.
 * The source of truth for combat stays src/core.mjs. This is only a
 * high-fidelity licensed prototype-actor visual track in the SAME homepage.
 * The model experiment is not misrepresented as final E01/G01 art.
 */
const $=id=>document.getElementById(id);
const section=$('home3d-r19'),frame=$('home3d-r19-iframe');
const status=$('home3d-r19-status'),loading=$('home3d-r19-loading');
const start=$('home3d-start'),models=$('home3d-models');
const publicPath=location.pathname.startsWith('/r19-game/');
const source=publicPath?'../r18-premium/index.html?embedR19=1':'./labs/premium-character-r18/index.html?embedR19=1';
const url=new URL(source,location.href);
let loaded=false,failed=false,pending=[];
const qa={
  actualVRMReady:false,sourceURL:url.href,
  playableCardGameRetained:!!document.getElementById('end-turn'),
  origin:location.origin,
  lastRealEvent:null,realEventsForwarded:0,
  independentCombatCore:true,originalGameCharacterArtApproved:false,
  modelRights:'OFFICIAL_OLD_BETA_CC0_VROID',
  loadFailed:false,mode:'hero'
};
if(new URLSearchParams(location.search).get('qaR19')==='1')
  Object.defineProperty(window,'__r19HomeQA',{value:qa});
function update(s){status.textContent=s;}
function send(payload){
 if(!loaded||!frame.contentWindow){
   if(payload.type==='R19_CORE_EVENT'&&pending.length<20)pending.push(payload);
   return;
 }
 frame.contentWindow.postMessage(payload,location.origin);
 if(payload.type==='R19_CORE_EVENT'){
  qa.lastRealEvent=payload.event;
  qa.realEventsForwarded++;
 }
}
window.addEventListener('message',ev=>{
 if(ev.origin!==location.origin||ev.source!==frame.contentWindow)return;
 if(ev.data?.type==='R19_PREMIUM_VRM_READY'&&ev.data.modelCount===2&&
    ev.data.originalCharactersApproved===false){
  loaded=true;failed=false;qa.actualVRMReady=true;
  loading.hidden=true;
  update('真实 3D 已载入 · 两位动漫模型为授权样板');
  for(const event of pending.splice(0))send(event);
 }
});
window.addEventListener('asdc:real-events-r19',ev=>{
 if(!ev.detail?.events?.length)return;
 for(const e of ev.detail.events){
  if(!Number.isSafeInteger(e.serial)||typeof e.type!=='string')continue;
  send({type:'R19_CORE_EVENT',event:{...e},source:'ACTUAL_CAMPUS_CORE_EVENT'});
 }
});
function enterGame(){
 document.body.dataset.home3d='playing';
 qa.mode='playing';
 update(loaded?'对局可操作 · 3D人物仍在同一主页':'对局可操作 · 3D模型继续加载');
 const hand=document.querySelector('.hand-section');
 if(hand)hand.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}
start.addEventListener('click',enterGame);
models.addEventListener('click',()=>{
 document.body.dataset.home3d='hero';
 qa.mode='hero';
 section.scrollIntoView({behavior:'smooth',block:'start'});
 if(loaded)send({type:'R19_FOCUS_MODE',view:'female'});
});
if(location.hash==='#battle')requestAnimationFrame(()=>enterGame());
const timer=setTimeout(()=>{
 if(!loaded){failed=true;qa.loadFailed=true;
  loading.textContent='真实3D加载失败；可以继续进行下方卡牌游戏，或换支持WebGL2的浏览器重试。';
  update('3D未成功加载 · 卡牌游戏仍可使用');
 }
},23000);
frame.addEventListener('load',()=>{
 if(loaded||failed)clearTimeout(timer);
});
frame.src=url.href;
