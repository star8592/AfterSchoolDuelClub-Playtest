/**
 * R45 — independent game application. NO legacy R14..R44 UI/director imports.
 * Only 5 game actions: select card, confirm play, end turn, view rules, reset via URL.
 * Real rules and 3D rendering are separate; visual animation never mutates HP.
 */
import {BY_ID,MAX_HP,createGame,playCard,endTurn,aiTurn,legalMoves} from './engine.mjs';

const $=id=>document.getElementById(id);
const seed=Number(new URLSearchParams(location.search).get('seed')??'1')||1;
const g=createGame(seed);
const scene=$('stadium');
let selected=null,sceneReady=false,sceneError=false,lastToast='',lastFightSerial=0;
const styleName={ember:'活力',grove:'创意',tide:'默契'};
const pictogram={
 E02:'➤',E03:'⚑',E04:'★',
 G02:'⌘',G03:'⚗',G04:'◇',
 T01:'♫',T02:'☷',T03:'↔',T04:'⌂',
 E05:'✦',E06:'✹',G05:'╋',G06:'▤',T05:'☼',T06:'◉'
};
const MAX_CARDS_ON_FIELD=5;
const $make=(tag,className,text)=>{
 const node=document.createElement(tag);
 if(className)node.className=className;
 if(text!==undefined)node.textContent=String(text);
 return node;
};
const own='player',enemy='ai';
function announce(message,kind='neutral'){
 lastToast=message;
 const element=$('battle-toast');
 element.textContent=message;
 element.dataset.kind=kind;
}
function gameReady(){return g.phase==='playing'&&g.active==='player';}
function cardCanPlay(index){
 return gameReady()&&legalMoves(g).some(m=>m.index===index&&m.lane===0);
}
function describeCard(c){
 if(c.kind==='unit')return '攻 '+c.attack+' / 生命 '+c.hp+' · 上场后下次轮到你才攻击';
 const effects={
  buff:'使场上第一个己方角色攻击力 +2',
  blast:'直接对对手人气造成 3 点伤害',
  repair:'中央竞技场全部己方角色回复 2 点生命',
  draw:'再抽 2 张手牌',
  heal:'己方恢复 3 点人气',
  confuse:'对中央竞技场所有敌方角色造成 2 点伤害'
 };
 return effects[c.effect]||c.line;
}
function unitTag(unit,side){
 const c=BY_ID[unit.id],tag=$make('span','unit '+(side==='player'?'mine':'foe'));
 const label=c?.name||unit.id;
 tag.textContent=label+' ';
 const hp=$make('span','hp','♥'+unit.hp);
 tag.append(hp);
 tag.title='攻击 '+(unit.attack+unit.buff)+' / 生命 '+unit.hp+(unit.shield?' / 护盾 '+unit.shield:'');
 return tag;
}
function renderBoard(){
 for(const [side,id,count] of [['player','my-field','my-field-count'],['ai','enemy-field','enemy-field-count']]){
  const list=g.board[side][0];
  $(id).replaceChildren(...list.map(u=>unitTag(u,side)));
  $(count).textContent=String(list.length);
 }
}
function renderHand(){
 const fragment=document.createDocumentFragment();
 g.hand.player.forEach((id,index)=>{
  const c=BY_ID[id],available=cardCanPlay(index);
  const card=$make('button','card '+c.style+(selected===index?' selected':''));
  card.type='button';
  card.dataset.cardId=id;
  card.dataset.handIndex=String(index);
  card.disabled=!available;
  card.setAttribute('aria-pressed',String(selected===index));
  card.setAttribute('aria-label','选择卡牌：'+c.name+'，花费'+c.cost+'能量。'+describeCard(c));
  if(!available){
   card.title=!gameReady()?'现在不是你的出牌阶段':
    c.cost>g.energy.player?'能量不足（需要 '+c.cost+'）':'场上已达到最大 5 名召唤物';
  }
  const head=$make('div','card-type');
  head.append($make('span',null,styleName[c.style]+' · '+(c.kind==='unit'?'人物':'事件')),
    $make('span','cost',c.cost));
  const isPortrait=id==='E01'||id==='G01';
  const art=$make('span','card-illustration'+(isPortrait?' true-3d-portrait':' original-card-symbol'));
  art.setAttribute('aria-hidden','true');
  if(isPortrait){
   const img=$make('img','real-actor-portrait');
   img.src='./assets/cards/'+id+'-vrm-card-bust.png';
   img.alt='';img.decoding='async';img.loading='eager';
   art.append(img);
  }else{
   const symbol=$make('span','symbol',pictogram[id]||'✦');
   art.append(symbol);
  }
  card.dataset.art=isPortrait?'actual-vrm':'symbol-only';
  card.title=(isPortrait?'已实装3D角色：':'仍待独立角色美术：')+c.name;
  card.append(head,$make('strong','card-name',c.name),art,
    $make('div','card-desc',c.line),
    $make('div','card-stats',c.kind==='unit'?'⚔ '+c.attack+'　♥ '+c.hp:'✦ '+(c.cost===1?'轻量事件':'战术事件')));
  card.addEventListener('click',()=>{
   selected=selected===index?null:index;
   render();
   if(selected!==null){
    const chosen=BY_ID[g.hand.player[selected]];
    announce('已选「'+chosen.name+'」。按下方金色「出牌」按钮即可'+
      (chosen.kind==='unit'?'召唤到场中央。':'立即发动事件。'),'selected');
   }else announce('已取消选牌。重新选择一张手牌即可。');
  });
  fragment.append(card);
 });
 $('hand').replaceChildren(fragment);
 $('hand-count').textContent=String(g.hand.player.length);
 if(!g.hand.player.length)$('hand').append($make('div','empty-hand','手牌用完，点击「结束回合」即可继续抽牌'));
}
function renderHUD(){
 $('player-hp').textContent=String(g.hp.player);
 $('enemy-hp').textContent=String(g.hp.ai);
 $('player-hp-bar').style.width=(100*g.hp.player/MAX_HP).toFixed(1)+'%';
 $('enemy-hp-bar').style.width=(100*g.hp.ai/MAX_HP).toFixed(1)+'%';
 $('energy').textContent=String(g.energy.player);
 $('round').textContent='第 '+g.round+' 回合';
 $('whose-turn').textContent=g.phase==='ended'?'决斗结束':
  g.active==='player'?'轮到你出牌':'AI 正在回应';
}
function renderActions(){
 const card=selected===null?null:BY_ID[g.hand.player[selected]];
 const canPlay=selected!==null&&cardCanPlay(selected);
 const btn=$('play');
 btn.disabled=!canPlay;
 btn.textContent=card?'出牌 · '+(card.kind==='unit'?'召唤':'发动'):'先选一张牌';
 $('selected-title').textContent=card?card.name+' · '+card.cost+' 能量':'还没有选牌';
 $('selected-info').textContent=card?describeCard(card):
  '点击手牌选择，无需选择教室、走廊或其他部署位置';
 $('end').disabled=!gameReady();
 $('end').textContent=g.phase==='ended'?'本局结束':
  '结束回合 → AI 出牌';
}
function renderGuide(){
 $('guide-step').textContent=g.phase==='ended'?'本局结束 · '+(g.winner==='player'?'你赢了！':g.winner==='ai'?'AI 获胜':'平局'):
  selected!==null?'② 点击下方金色「出牌」，人物便会进入中央竞技场':
  g.active==='player'?'① 选择手牌　② 点击「出牌」　③ 按「结束回合」让 AI 回应':
  'AI 正在出牌 · 请看中央竞技场与对局提示';
}
function render(){
 renderHUD();
 renderBoard();
 renderHand();
 renderActions();
 renderGuide();
}
function boardSnapshot(){
 return{type:'ASDC_R45_BOARD',player:g.board.player[0].map(x=>x.id),
   ai:g.board.ai[0].map(x=>x.id)};
}
function sendScene(msg){
 if(!sceneReady||!scene.contentWindow)return false;
 scene.contentWindow.postMessage(msg,location.origin);
 return true;
}
function updateCameraAngle(angle){
 const node=$('camera-angle');
 if(node)node.textContent=Math.round(angle)+'°';
}
for(const [id,delta] of [['camera-left',-45],['camera-right',45]]){
 $(id)?.addEventListener('click',()=>sendScene({type:'ASDC_R48_CAMERA_DELTA',degrees:delta}));
}
$('camera-reset')?.addEventListener('click',()=>sendScene({type:'ASDC_R48_CAMERA_SET',degrees:0}));
$('camera-fullscreen')?.addEventListener('click',async()=>{
 try{
  if(document.fullscreenElement)await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
 }catch(error){announce('浏览器未允许全屏，可按 F11 切换全屏');}
});
window.addEventListener('message',ev=>{
 if(ev.source===scene.contentWindow&&ev.origin===location.origin&&ev.data?.type==='ASDC_R48_CAMERA_ANGLE')
  updateCameraAngle(ev.data.degrees);
});
function syncScene(){
 sendScene(boardSnapshot());
}
// A visually projected physical card from the correct side duelist platform.
// This is a secondary presentation event; it never changes core rules.
function projectPlayedCard(id,side='player'){
 const card=BY_ID[id];if(!card)return;
 sendScene({type:'ASDC_R46_CARD_PLAY',side,id,name:card.name,
   kind:card.kind,cost:card.cost});
}
function stateSummary(eventList){
 const newCards=eventList.filter(e=>e.type==='card_play'&&e.side==='ai');
 const combat=eventList.filter(e=>e.type==='exchange'||e.type==='direct_hit');
 const cardsText=newCards.length?
  'AI 打出：'+newCards.map(e=>BY_ID[e.card]?.name||e.card).join('、'):
  'AI 本轮没有新出牌';
 const attacks=combat.length?
  '，'+combat.map(e=>e.type==='exchange'?
    (e.side==='player'?'我方':'对方')+'的「'+BY_ID[e.from].name+'」攻击「'+BY_ID[e.to].name+
    '」，伤害 '+e.damage+' / 反击 '+e.retaliation:
    (e.side==='player'?'我方':'对方')+'直接造成 '+e.damage+' 点伤害').join('；'):
  '。刚上场的召唤物要等下个己方行动回合才能攻击';
 return cardsText+attacks;
}
function findRealExchange(eventList){
 return eventList.find(e=>e.type==='exchange'&&e.side==='player'&&e.from==='E01'&&e.to==='G01'&&e.serial>lastFightSerial);
}
function playFight(e){
 lastFightSerial=e.serial;
 sendScene({
  type:'ASDC_R45_FIGHT',mode:'live',actor:'E01',target:'G01',
  event:{type:'exchange',from:e.from,to:e.to,side:e.side,lane:0,serial:e.serial,
   damage:e.damage,blocked:e.blocked,retaliation:e.retaliation,
   retaliation_blocked:e.retaliation_blocked,
   target_defeated:e.target_defeated,attacker_defeated:e.attacker_defeated},
  noRulesMutation:true
 });
 // Actual damage was already resolved by the engine; scene animation is visual.
}
$('play').addEventListener('click',()=>{
 if(selected===null||!cardCanPlay(selected))return;
 const id=g.hand.player[selected],c=BY_ID[id],result=playCard(g,selected,0);
 if(!result.ok){
  announce('出牌失败：'+result.reason,'warning');render();return;
 }
 selected=null;
 render();syncScene();
 projectPlayedCard(id,'player');
 const suffix=c.kind==='unit'?'已进入中央竞技场。本回合待命，下次轮到你才会攻击。':
  '已立即结算事件效果。';
 announce('已出牌：「'+c.name+'」。'+suffix+'　还可以继续出牌，或点击「结束回合」。','played');
 if(g.phase==='ended')announce('决斗结束！'+(g.winner==='player'?'你赢了！':'AI 获胜。'),'ended');
});
$('end').addEventListener('click',()=>{
 if(!gameReady())return;
 const serial=g.serial;
 endTurn(g);
 if(g.phase==='playing'&&g.active==='ai')aiTurn(g);
 const fresh=g.events.filter(e=>e.serial>serial);
 selected=null;
 render();syncScene();
 const summary=stateSummary(fresh);
 for(const event of fresh.filter(e=>e.type==='card_play'&&e.side==='ai').slice(-3)){
  projectPlayedCard(event.card,'ai');
 }
 const fight=findRealExchange(fresh);
 if(fight)playFight(fight);
 if(g.phase==='ended'){
  const endText=g.winner==='player'?'你赢得了对决！':g.winner==='ai'?'AI 获胜，再试一局！':'平局。';
  announce(endText+' '+summary,'ended');
 }else announce(summary+'。现在轮到你了。','ai');
});
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==scene.contentWindow)return;
 if(event.data?.type==='ASDC_R45_SCENE_READY'){
  sceneReady=true;sceneError=false;
  syncScene();
  return;
 }
 if(event.data?.type==='ASDC_R45_FIGHT_ACCEPTED'){
  return;
 }
});
scene.addEventListener('load',()=>{if(!sceneReady)sceneError=false});
window.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&$('help').open)$('help').open=false;
 if(event.target instanceof HTMLElement&&/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))return;
 if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
  event.preventDefault();sendScene({type:'ASDC_R48_CAMERA_DELTA',degrees:event.key==='ArrowLeft'?-45:45});
 }
 if(event.key==='Home'||event.key.toLowerCase()==='r'){
  sendScene({type:'ASDC_R48_CAMERA_SET',degrees:0});
 }
});
render();
announce('开始决斗：你在左，对手在右；选牌并按「出牌」，召唤物会进入同一个三维体育馆。');
if(new URLSearchParams(location.search).get('qa')==='1'){
 Object.defineProperty(window,'__r45QA',{value:{
  get board(){return structuredClone(g.board)},
  get round(){return g.round},
  get hp(){return {...g.hp}},
  get energy(){return {...g.energy}},
  get hand(){return [...g.hand.player]},
  get phase(){return g.phase},
  get sceneReady(){return sceneReady},
  get sceneError(){return sceneError},
  get cardCount(){return Object.keys(BY_ID).length},
  get events(){return structuredClone(g.events)},
  get selected(){return selected},
  get lastFightSerial(){return lastFightSerial}
 }});
}
