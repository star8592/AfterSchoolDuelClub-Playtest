import {BY_ID,THEMES,LANES,createGame,legalMoves,playCard,endTurn,aiTurn,presentation} from './core.mjs';
import {EPISODES,createGuidedEpisode,playTutorialCard,tutorialStep,tutorialStatus} from './tutorial.mjs';
import {projectComboCue} from './vfx.mjs';
import {appendApprovedArtwork} from './art-runtime.mjs';
import {compilePerformances,compileTurnPerformances} from './performance.mjs';
import {createPerformanceDirector} from './director.mjs';
import {createPresenceTracker} from './presence.mjs';
import {createCombatFeedbackR40} from './combat-feedback-r40.mjs';
import {ART_LAB_ACTOR} from './art-lab-stub.mjs';
import {createCardModelStage} from './card-model-stage-r23.mjs';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
// R42: selection is never a game action; explicit summon/activate confirms a card.
const CARD_PLAY_FLOW='select_then_confirm';
const artLabPreview = /\/art-lab\/?/.test(location.pathname) || params.get('artlab')==='1';
const availableThemes = Object.keys(THEMES);
let theme = availableThemes.includes(params.get('theme')) ? params.get('theme') : 'campus';
let tutorialEnabled = theme==='campus' && params.get('tutorial')==='1';
let currentTutorialLevel=Number(params.get('level'));
if(!Number.isInteger(currentTutorialLevel)||currentTutorialLevel<1||currentTutorialLevel>EPISODES.length)currentTutorialLevel=1;
let game;
let selected = null;
let focusedLane=0;
let observedSerial = 0;
let comboTimer;
let lastVisualCue=null;
let visualTimer;
let finishedShown = false;
let graduationVisible=false;
let startedAt = performance.now();
let clicks = [];
const stageDirector=createPerformanceDirector({documentRef:document,win:globalThis,onEvent:track});
const presenceTracker=createPresenceTracker();
const stableUnits=new Map();
const stableLanes=[];
const cardModelsR23=createCardModelStage(document.getElementById('arena-scene'));
const combatFeedbackR40=createCombatFeedbackR40({onFocus:lane=>{focusedLane=lane;renderArena();}});
let closeBattleCamera=false;
const cameraToggle=$('arena-r41-camera');
cameraToggle?.addEventListener('click',()=>{
 closeBattleCamera=!closeBattleCamera;
 cardModelsR23.setCameraMode(closeBattleCamera?'close':'wide');
 cameraToggle.setAttribute('aria-pressed',String(closeBattleCamera));
 cameraToggle.textContent='镜头：'+(closeBattleCamera?'近景':'全景');
 $('arena-scene').dataset.camera=closeBattleCamera?'close':'wide';
});
$('arena-r41-replay')?.addEventListener('click',()=>combatFeedbackR40.qa.replay());
window.addEventListener('asdc:real-events-r19',()=>{
 const history=combatFeedbackR40.qa.events;
 if(!history.length)return;
 $('arena-r41-current').textContent='最近：'+history[0].summary;
 $('arena-r41-replay').disabled=false;
});
if(params.get('qaR41')==='1')Object.defineProperty(window,'__r41HUDQA',{
 value:{get camera(){return cardModelsR23.qa.cameraMode},
 get current(){return $('arena-r41-current').textContent},
 get canReplay(){return !$('arena-r41-replay').disabled},
 get motion(){return {attacks:cardModelsR23.qa.visualAttackTriggers,
  hits:cardModelsR23.qa.visualHitTriggers,frames:cardModelsR23.qa.activeAttackFrames,
  hitFrames:cardModelsR23.qa.activeHitFrames,serials:cardModelsR23.qa.attackSerials}}}
});
if(params.get('qaR40')==='1')Object.defineProperty(window,'__r40CombatQA',{value:combatFeedbackR40.qa});
const MOTION_PRIORITY=['hurt','block','shield','relocate','summon','powerup'];
function sameChildren(container,children){
  const actual=container.children;
  if(actual.length===children.length&&children.every((child,i)=>actual[i]===child))return;
  container.replaceChildren(...children);
}
function animateUnit(actor,changes){
  const motion=MOTION_PRIORITY.find(name=>changes.some(change=>change.kind===name));
  if(!motion)return;
  actor.dataset.motion=motion;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||typeof actor.animate!=='function')return;
  const frames={
    summon:[{transform:'translateY(-26px) scale(.7)',opacity:0},{transform:'translateY(4px) scale(1.07)',opacity:1},{transform:'translateY(0) scale(1)',opacity:1}],
    hurt:[{transform:'translateX(0)',filter:'brightness(1)'},{transform:'translateX(9px) rotate(6deg)',filter:'brightness(2)'},{transform:'translateX(-5px) rotate(-3deg)',filter:'brightness(1.3)'},{transform:'translateX(0)',filter:'brightness(1)'}],
    block:[{transform:'scale(1)'},{transform:'scale(.86)',filter:'brightness(1.8)'},{transform:'scale(1)',filter:'brightness(1)'}],
    shield:[{transform:'scale(.94)',filter:'brightness(1)'},{transform:'scale(1.12)',filter:'brightness(1.65)'},{transform:'scale(1)',filter:'brightness(1)'}],
    relocate:[{transform:'translateX(-15px)',opacity:.5},{transform:'translateX(0)',opacity:1}],
    powerup:[{transform:'scale(1)'},{transform:'scale(1.08)',filter:'brightness(1.5)'},{transform:'scale(1)',filter:'brightness(1)'}]
  };
  actor.animate(frames[motion],{duration:motion==='summon'?650:480,easing:'cubic-bezier(.22,.9,.26,1)'});
}

const R23_3D_MODEL_CARD_IDS=new Set(['E02','T02']);
function appendR23ModelPortrait(parent,id,className){
 if(theme!=='campus'||!R23_3D_MODEL_CARD_IDS.has(id))return false;
 const img=node('img',className,'');
 img.src='./assets/card-model-portraits/'+id+'.png';
 img.alt=id==='E02'?'原创3D折纸飞机模型预览':'原创3D菜单怪物模型预览';
 img.loading='lazy';img.decoding='async';img.draggable=false;
 img.setAttribute('data-review-status','R23_GLTF_PROTOTYPE_NOT_FINAL_ART');
 img.setAttribute('data-source-glb',id);
 parent.append(img);
 return true;
}
const STYLE_ICONS = {ember:'✦',grove:'◆',tide:'◈'};
const STORIES = {
  campus:'校长把社团申请表误印成食堂菜单。想拿回活动室？先打赢三条战线。',
  star:'星图被调换，守护团的入队挑战突然提前。穿过三处星域，赢回守护资格。',
  wuxia:'门派的演武帖被错送到集市。三路同开，刀盾侠客必须合力守住招牌。'
};
const COMBO_NAMES = {
  'ember,grove': ['粉笔弹射事故','第二张牌所在战线：击中敌方前排2点；空线则直击人气1点。'],
  'ember,tide': ['广播串台调度','第二张牌所在战线：敌方前排调往下一线；无法移动则补抽1牌。'],
  'grove,tide': ['秘密招新海报','第二张牌所在战线：己方前排获得2点护盾；空线则补抽1牌。']
};
const OTHER_COMBO = {
  star:['星流共鸣','两种不同星力结合，返还一格能量。'],
  wuxia:['刀盾合击','两门招式相合，返还一格真气。']
};
function names(side) {return side==='player'?'你':'AI';}
function track(type,extra={}) {
  clicks.push({type,elapsed_ms:Math.max(0,Math.round(performance.now()-startedAt)),turn:game?.round??0,theme,...extra});
}
function node(tag,cls,text) {
  const el=document.createElement(tag);
  if(cls)el.className=cls;
  if(text!==undefined)el.textContent=String(text);
  return el;
}
function addText(parent,tag,cls,text){const el=node(tag,cls,text);parent.append(el);return el;}
function setMessage(text){$('prompt').textContent=text;}
function signalOpponent(text,kind='idle'){
 const label=$('r42-opponent-feedback');
 if(!label)return;
 label.textContent=text;
 label.dataset.kind=kind;
}
function updateTurnCTA(){
 const button=$('end-turn');
 if(!button)return;
 const ready=game.phase==='playing'&&game.active==='player'&&!tutorialStep(game);
 button.disabled=!ready;
 button.textContent=game.phase==='ended'?'对局已结束':
   ready?'结束回合 → 对手行动':'完成教学部署后可结束回合';
 const label=$('r42-current-phase');
 label.textContent=game.phase==='ended'?'本局结束':
   game.active==='player'?'你的出牌阶段':'对手行动中';
}
function renderCardPlaybar(){
 const panel=$('r42-card-playbar'),button=$('r42-confirm-play');
 if(!panel||!button)return;
 const cardId=selected!==null?game.hand.player[selected]:null;
 const card=cardId?presentation(BY_ID[cardId],theme):null;
 const canConfirm=!!card&&game.phase==='playing'&&game.active==='player';
 panel.dataset.selected=String(!!card);
 $('r42-chosen-card').textContent=card?('已选卡牌：'+card.name+' · 费用 '+card.cost+' ✧'):
   '先从下方手牌中选一张';
 $('r42-chosen-target').textContent='召唤／发动位置：'+LANES[focusedLane];
 $('r42-target-select').value=String(focusedLane);
 button.disabled=!canConfirm;
 button.textContent=card?(card.kind==='unit'?'召唤这张牌 → '+LANES[focusedLane]:
     '发动这张牌 → '+LANES[focusedLane]):'选牌后可出牌';
}


function renderUnit(unit,side,lane,changes) {
  const key=side+':'+unit.uid;
  const c=presentation(BY_ID[unit.id],theme);
  let root=stableUnits.get(key);
  if(!root){
    root=node('div','unit-card '+unit.style);
    root.dataset.unitUid=unit.uid;
    root.dataset.cardId=unit.id;
    root.dataset.side=side;
    root.setAttribute('role','group');
    const art=node('span','unit-art '+c.style);
    if(!appendR23ModelPortrait(art,unit.id,'unit-model-portrait')&&
       !appendApprovedArtwork(art,'portrait:'+theme+':'+unit.id,'','unit-art-image'))
      art.textContent=STYLE_ICONS[c.style];
    art.setAttribute('aria-hidden','true');
    root.append(art);
    const name=addText(root,'strong','unit-name',c.name);
    name.title=c.name;
    root._stats=addText(root,'span','unit-stats','');
    root._waiting=addText(root,'span','unit-wait','待命');
    stableUnits.set(key,root);
  }
  const attack=unit.attack+unit.buff;
  root._stats.textContent='⚔ '+attack+' / ♥ '+unit.hp+(unit.shield>0?' / 🛡 '+unit.shield:'');
  root._waiting.hidden=game.turns[side]>unit.summonedAt;
  root.dataset.lane=String(lane);
  root.dataset.readiness=root._waiting.hidden?'ready':'waiting';
  root.setAttribute('aria-label',c.name+'，攻击 '+attack+'，生命 '+unit.hp+
    (unit.shield>0?'，护盾 '+unit.shield:'')+(root._waiting.hidden?'，可战斗':'，本回合待命'));
  animateUnit(root,changes.get(key)||[]);
  return root;
}
function renderSceneArtwork() {
  const stage=$('battle-art-layer');
  stage.replaceChildren();
  const slot=theme==='campus'?'scene:campus:classroom':'scene:'+theme+':arena';
  stage.hidden=!appendApprovedArtwork(stage,slot,'','scene-art-image');
}
function renderLanes() {
  const root=$('lanes');
  const changes=presenceTracker.reconcile(game.board);
  const grouped=new Map();
  for(const change of changes){
    const list=grouped.get(change.key)||[];
    list.push(change);
    grouped.set(change.key,list);
  }
  const liveKeys=new Set();
  const lines=[];
  for(let lane=0;lane<3;lane++){
    let shell=stableLanes[lane];
    if(!shell){
      const line=node('button','lane');
      line.type='button';
      line.dataset.lane=String(lane);
      line.setAttribute('aria-label','在'+LANES[lane]+'部署所选卡牌');
      const enemy=node('div','formation enemy-formation');
      const center=node('div','lane-center');
      addText(center,'strong','lane-name',LANES[lane]);
      addText(center,'span','lane-arrow','↓');
      const own=node('div','formation player-formation');
      line.addEventListener('click',()=>deploy(lane));
      shell={line,enemy,center,own};
      stableLanes[lane]=shell;
    }
    const {line,enemy,center,own}=shell;
    const enemies=game.board.ai[lane].map(unit=>{
      liveKeys.add('ai:'+unit.uid);
      return renderUnit(unit,'ai',lane,grouped);
    });
    if(!enemies.length)enemies.push(node('span','empty-slot','对手空位'));
    const allies=game.board.player[lane].map(unit=>{
      liveKeys.add('player:'+unit.uid);
      return renderUnit(unit,'player',lane,grouped);
    });
    if(!allies.length)allies.push(node('span','empty-slot','点击这里部署'));
    sameChildren(enemy,enemies);
    sameChildren(own,allies);
    let cue=null;
    if(lastVisualCue?.lane===lane){
      line.dataset.effect=lastVisualCue.kind;
      cue=node('span','battle-cue battle-cue-'+lastVisualCue.kind);
      cue.setAttribute('aria-label',lastVisualCue.title+' '+lastVisualCue.subtitle);
      addText(cue,'strong','battle-cue-title',lastVisualCue.title);
      if(lastVisualCue.subtitle)addText(cue,'span','battle-cue-impact',lastVisualCue.subtitle);
    }else delete line.dataset.effect;
    sameChildren(line,cue?[enemy,center,own,cue]:[enemy,center,own]);
    line.classList.toggle('lane-ready',selected!==null&&game.active==='player');
    const teaching=tutorialStep(game);
    line.classList.toggle('tutorial-target',!!teaching&&teaching.lane===lane);
    line.disabled=game.phase!=='playing'||game.active!=='player';
    lines.push(line);
  }
  sameChildren(root,lines);
  for(const key of stableUnits.keys())if(!liveKeys.has(key))stableUnits.delete(key);
}
function updateArenaActor(side,lane) {
  const unit=game.board[side][lane][0]||null;
  const prefix=side==='player'?'arena-player':'arena-enemy';
  const root=$(prefix+'-actor');
  const visual=$(prefix+'-visual');
  const name=$(prefix+'-name');
  const stats=$(prefix+'-stats');
  const id=unit?.id||null;
  const card=id?presentation(BY_ID[id],theme):null;
  root.dataset.unitId=id||'director';
  root.dataset.style=card?.style||(side==='player'?'ember':'tide');
  root.dataset.unitState=unit?(game.turns[side]<=unit.summonedAt?'waiting':'ready'):'director';
  name.textContent=card?.name||(side==='player'?'决斗社队长':'风纪社队长');
  stats.textContent=unit?
    '⚔ '+(unit.attack+unit.buff)+' · ♥ '+unit.hp+(unit.shield>0?' · 🛡 '+unit.shield:'')+
      (root.dataset.unitState==='waiting'?' · 待命':' · 迎战'):
    '指挥位 · '+(side==='player'?'召唤人物即可出战':'等待对手出牌');
  root.setAttribute('aria-label',(side==='player'?'我方':'敌方')+'，'+name.textContent+'，'+stats.textContent);
  if(visual.dataset.card!==String(id)){
    visual.dataset.card=String(id);
    visual.replaceChildren();
    if(artLabPreview&&ART_LAB_ACTOR?.data_uri&&theme==='campus'&&side==='player'&&(!id||id==='E01')){
      const img=node('img','arena-portrait art-lab-actor');
      img.src=ART_LAB_ACTOR.data_uri;
      img.alt='';
      img.decoding='async';
      img.draggable=false;
      img.setAttribute('data-review-status',ART_LAB_ACTOR.status);
      visual.append(img);
      root.dataset.artLab='experiment';
    } else if(!id||!(appendR23ModelPortrait(visual,id,'arena-portrait r23-model-portrait')||
                       appendApprovedArtwork(visual,'portrait:'+theme+':'+id,'','arena-portrait'))){
      for(const className of ['arena-figure-hair','arena-figure-head','arena-figure-body','arena-figure-arm']){
        visual.append(node('span',className));
      }
      delete root.dataset.artLab;
    }
  }
}
function renderArena() {
  const active=theme==='campus';
  $('cinematic-arena').hidden=!active;
  document.body.dataset.theater=active?'on':'off';
  if(!active)return;
  if(artLabPreview){
    document.body.dataset.artLab='experiment';
    document.querySelector('.arena-quality-note').textContent=
      '美术实验（未获批准）：左侧角色由生成战斗图分离，其他人物与场景仍为占位；非交付版';
  }
  const teaching=tutorialStep(game);
  $('arena-scene').dataset.focus=String(focusedLane);
  $('arena-focus-name').textContent=LANES[focusedLane];
  $('arena-focus-description').textContent=
    selected!==null?'已选卡牌。可点击下方「召唤区域」改位置，再按「召唤／发动这张牌」出牌':
    teaching?'教学目标：'+LANES[teaching.lane]+'。先选手牌，再确认出牌':
      '选牌 → 确认召唤／发动 → 结束回合，对手行动';
  $('arena-scene-status').textContent=game.phase==='ended'?'战斗结束 · 双方仍在舞台':
    game.active==='ai'?'对手行动中':
      '双方面对面 · 当前焦点 '+LANES[focusedLane];
  updateArenaActor('player',focusedLane);
  updateArenaActor('ai',focusedLane);
  // This reads the actual game's front-line units only. It cannot mutate rules.
  cardModelsR23.setBoardState({
    player:game.board.player[focusedLane][0]||null,
    ai:game.board.ai[focusedLane][0]||null,
    theme
  });
  for(let lane=0;lane<3;lane++){
    const button=$('arena-lane-'+lane);
    const nPlayer=game.board.player[lane].length;
    const nAI=game.board.ai[lane].length;
    $('arena-lane-count-'+lane).textContent='我 '+nPlayer+' · 敌 '+nAI;
    button.dataset.focused=String(lane===focusedLane);
    button.classList.toggle('arena-lane-ready',selected!==null&&game.active==='player');
    button.dataset.target=lane===focusedLane?'current':'other';
    button.classList.toggle('arena-lane-target',!!teaching&&lane===teaching.lane);
    button.disabled=game.phase!=='playing'||game.active!=='player';
    button.setAttribute('aria-pressed',String(lane===focusedLane));
    button.title=LANES[lane]+'：我方'+nPlayer+'人，对方'+nAI+'人'+(lane===focusedLane?'，当前观察':'');
  }
}
function focusOrDeploy(lane){
  if(!Number.isInteger(lane)||lane<0||lane>2)return;
  if(theme==='campus'&&stageDirector.busy)stageDirector.skip();
  focusedLane=lane;
  renderArena();renderHand();renderCardPlaybar();
  setMessage('已选召唤位置：'+LANES[lane]+
    (selected!==null?'。现在按「召唤／发动这张牌」确认出牌。':
      '。请从手牌中选择一张，再确认出牌。'));
}
function createCard(id,index,available) {
  const c=presentation(BY_ID[id],theme);
  const card=node('button','card '+c.style);card.type='button';
  card.dataset.cardId=c.id;card.dataset.handIndex=String(index);
  const teaching=tutorialStep(game);
  card.disabled=!available||(!!teaching&&teaching.card!==id);
  if(!available&&!teaching){
    const reason=game.active!=='player'?'现在是 AI 行动':
      c.cost>game.energy.player?'需要 '+c.cost+' 能量，当前仅 '+game.energy.player+'；结束回合后回复能量':
      '当前战线人物已满，请换一条战线';
    card.title=reason;
    card.setAttribute('aria-label',c.name+'，暂不能出牌：'+reason);
    card.dataset.unavailable='true';
  }
  card.classList.toggle('tutorial-card',!!teaching&&teaching.card===id);
  card.setAttribute('aria-pressed',String(selected===index));
  if(selected===index)card.classList.add('selected');
  if(theme==='campus'&&available)
    card.setAttribute('aria-label','选择手牌：'+c.name+'。选中后按确认出牌，当前目标'+LANES[focusedLane]);
  const top=node('div','card-top');
  addText(top,'span','card-cost',String(c.cost)+' ✧');
  addText(top,'span','card-kind',c.kind==='unit'?'人物':'事件');
  card.append(top);
  const art=node('div','card-art '+c.style);
  if(!appendR23ModelPortrait(art,id,'card-model-portrait')&&
     !appendApprovedArtwork(art,'portrait:'+theme+':'+id,c.name,'card-art-image')){
    addText(art,'span','card-glyph',STYLE_ICONS[c.style]);
  }
  card.append(art);
  addText(card,'strong','card-title',c.name);
  addText(card,'span','card-flavor',c.line);
  const bottom=node('div','card-bottom');
  addText(bottom,'span','style-label',THEMES[theme].styles[c.style]);
  addText(bottom,'span','card-stats',c.kind==='unit'?'⚔ '+c.attack+'　♥ '+c.hp:'效果牌');
  card.append(bottom);
  card.addEventListener('click',()=>{
    if(theme==='campus'&&stageDirector.busy)stageDirector.skip();
    selected=selected===index?null:index;
    if(selected!==null&&theme==='campus'&&tutorialStep(game))
      focusedLane=tutorialStep(game).lane;
    track('card_selected',{card_id:id,hand_index:index});
    render();
    const text=selected===null?'已取消选择。请重新选择手牌。':
      '已选择「'+c.name+'」；目标区域：'+LANES[focusedLane]+
      '。请按「'+(c.kind==='unit'?'召唤':'发动')+'这张牌」确认。';
    setMessage(text);
    if(selected!==null&&matchMedia('(max-width: 760px)').matches)
      $('r42-card-playbar')?.scrollIntoView?.({behavior:'instant',block:'nearest'});
  });
  return card;
}
function renderHand() {
  const hand=$('hand');hand.replaceChildren();
  const teaching=tutorialStep(game);
  $('hand-count').textContent=teaching?'· 本步 1 张（总 '+game.hand.player.length+' 张）':String(game.hand.player.length);
  const legal=new Set(legalMoves(game).map(m=>m.index));
  for(let i=0;i<game.hand.player.length;i++){
    if(teaching&&game.hand.player[i]!==teaching.card)continue;
    hand.append(createCard(game.hand.player[i],i,game.active==='player'&&legal.has(i)));
  }
  if(!game.hand.player.length)addText(hand,'p','no-cards','手牌用完了。结束回合可再抽牌。');
}
function formatEvent(e) {
  if(e.type==='start')return '序章：社团挑战开始。';
  if(e.type==='turn_start')return '第 '+e.round+' 回合，轮到 '+names(e.side)+'。';
  if(e.type==='card_play')return names(e.side)+'在'+LANES[e.lane]+'打出「'+presentation(BY_ID[e.card],theme).name+'」。';
  if(e.type==='combo')return names(e.side)+'触发跨风格乌龙连携，能量 +1！';
  if(e.type==='combo_effect'){
    const where=LANES[e.lane];
    const desc={
      chalk_hit:'粉笔弹射，击中敌方人物，伤害 '+e.damage+(e.blocked?'（护盾吸收 '+e.blocked+'）':''),
      chalk_direct:'粉笔飞过空线，敌方人气 -1',
      broadcast_move:'广播串台，将敌方人物从'+where+'转移至'+LANES[e.to_lane],
      broadcast_draw:'广播串台未能调度人物，额外抽1张牌',
      poster_shield:'招新海报保护己方人物，获得2点护盾',
      poster_draw:'招新海报揭晓新计划，额外抽1张牌'
    };
    return names(e.side)+'的'+where+'发生乌龙：'+(desc[e.effect]||e.effect)+'。';
  }
  if(e.type==='exchange')return names(e.side)+'在'+LANES[e.lane]+'交锋，造成 '+e.damage+' 伤害。';
  if(e.type==='direct_hit')return names(e.side)+'突破'+LANES[e.lane]+'，直接造成 '+e.damage+' 伤害。';
  if(e.type==='game_end')return '战斗结算：'+(e.winner==='draw'?'平局':names(e.winner)+'获胜')+'。';
  return e.type;
}
function renderJournal() {
  const lines=$('journal-lines');lines.replaceChildren();
  for(const e of game.events.slice(-7).reverse()){
    const row=node('div','log-entry');
    row.append(node('span','log-num',String(e.serial).padStart(3,'0')));
    row.append(node('span','log-text',formatEvent(e)));
    if(e.type==='combo'||e.type==='combo_effect')row.classList.add('combo-log');
    lines.append(row);
  }
}
function hideCombo(){clearTimeout(comboTimer);$('combo-stage').hidden=true;}
function celebrate(e) {
  const pair=e.styles.slice().sort().join(',');
  const [title,text]=theme==='campus'?(COMBO_NAMES[pair]||['乌龙连携','意外组合，返还1点能量！']):OTHER_COMBO[theme];
  $('combo-title').textContent=title;
  $('combo-subtitle').textContent=text;
  $('combo-stage').hidden=false;
  clearTimeout(comboTimer);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)comboTimer=setTimeout(hideCombo,400);
  else comboTimer=setTimeout(hideCombo,1900);
}
function presentVisualEffect(event){
  const cue=projectComboCue(event);
  if(!cue)return;
  lastVisualCue=cue;
  clearTimeout(visualTimer);
  const milliseconds=matchMedia('(prefers-reduced-motion: reduce)').matches?750:1650;
  visualTimer=setTimeout(()=>{
    lastVisualCue=null;
    if(game?.phase==='playing'||game?.phase==='ended')renderLanes();
  },milliseconds);
}
function checkEvents(){
  const fresh=game.events.filter(e=>e.serial>observedSerial);
  for(const e of fresh){
    if(e.type==='combo'){
      track('combo_triggered',{actor:e.side,styles:e.styles,combo_serial:e.comboSerial});
      if(e.side==='player'&&theme!=='campus')celebrate(e);
    }
    if(e.type==='combo_effect'){
      track('combo_effect',{actor:e.side,effect:e.effect,lane:e.lane});
      presentVisualEffect(e);
    }
    if(e.type==='game_end')track('game_complete',{winner:e.winner,reason:e.reason});
  }
  cardModelsR23.onCoreEvents(fresh);
  observedSerial=game.serial;
  if(theme==='campus')combatFeedbackR40.ingest(fresh);
  // R19: visual showcase receives truthfully settled game events;
  // it never owns or changes damage, turn order or player state.
  if(theme==='campus'&&fresh.length&&typeof window!=='undefined'&&typeof CustomEvent==='function'){
    window.dispatchEvent(new CustomEvent('asdc:real-events-r19',{detail:{
      round:game.round,events:fresh.map(e=>({
       serial:e.serial,type:e.type,side:e.side??null,
       card:e.card??null,target:e.target??null,
       from:e.from??null,to:e.to??null,
       lane:e.lane??null,damage:e.damage??null,
       blocked:e.blocked??null,retaliation:e.retaliation??null
      }))
    }}));
  }
  // R39: DO NOT suppress battle performance just because the 3D hero exists.
  // Only replay damage/exchange events actually emitted by the canonical core;
  // source game state is NEVER mutated by the director.
  if(theme==='campus'&&fresh.some(e=>e.type==='exchange'||e.type==='direct_hit'))
    stageDirector.enqueue(compileTurnPerformances(fresh,{theme}));
  else if(!document.getElementById('home3d-r19'))
    stageDirector.enqueue(compilePerformances(fresh,{theme}));
}
function renderTutorial() {
  const status=tutorialStatus(game);
  document.body.dataset.guide=status?(status.completed?'done':'active'):(graduationVisible?'graduated':'free');
  const panel=$('tutorial-panel');
  panel.hidden=!status&&!graduationVisible;
  $('tutorial-next').hidden=!status?.completed;
  $('tutorial-skip').hidden=!status||!!status.completed;
  if(!status&&graduationVisible){
    $('tutorial-title').textContent='三关教学完成 · 自由对战已开启';
    $('tutorial-description').textContent='粉笔攻击、广播调度和海报护盾都已掌握。现在双方从正式随机牌库开始自由对战。';
    $('tutorial-progress').textContent='3 / 3 ✓';
    panel.classList.toggle('tutorial-completed',true);
    return;
  }
  if(!status)return;
  $('tutorial-title').textContent=status.title;
  $('tutorial-description').textContent=status.instruction;
  $('tutorial-progress').textContent=status.progress;
  $('tutorial-next').textContent=currentTutorialLevel<EPISODES.length?'下一关 →':'进入自由对战 →';
  panel.classList.toggle('tutorial-completed',status.completed);
}
function render() {
  renderTutorial();
  $('game-title').textContent=THEMES[theme].title;
  $('game-subtitle').textContent=THEMES[theme].desc+' · 三路策略 · 连携反转';
  $('theme-select').value=theme;
  $('story-text').textContent=game.tutorial?EPISODES[currentTutorialLevel-1].story:STORIES[theme];
  document.body.dataset.theme=theme;
  $('round-num').textContent=String(game.round).padStart(2,'0');
  $('turn-banner').textContent=game.phase==='ended'?'对局结束':game.active==='player'?'你的回合':'AI 的回合';
  $('player-hp').textContent=String(game.hp.player);
  $('ai-hp').textContent=String(game.hp.ai);
  $('energy').textContent='✧ '+String(game.energy.player);
  $('combo-counter').textContent='已触发连携：你 '+game.comboCounts.player+' / AI '+game.comboCounts.ai;
  const canAct=game.phase==='playing'&&game.active==='player';
  $('end-turn').disabled=!canAct||!!tutorialStep(game);
  updateTurnCTA();
  const played=game.stylesPlayed.player.map(s=>THEMES[theme].styles[s]);
  $('combo-hint').textContent=game.comboTriggered.player?'本回合连携已完成。':
    played.length?'本回合已打出：'+played.join('、')+'。再打一种风格可连携。':'本回合出两种不同风格，可返还 1 能量。';
  renderSceneArtwork();renderLanes();renderArena();renderHand();renderCardPlaybar();renderJournal();
  if(game.phase==='ended'&&!finishedShown){
    finishedShown=true;
    $('result-title').textContent=game.winner==='player'?'社团挑战成功！':game.winner==='ai'?'这回被风纪社压制了':'不分胜负，再试一次！';
    $('result-detail').textContent='你 '+game.hp.player+' : AI '+game.hp.ai+' · 连携：你 '+game.comboCounts.player+' / AI '+game.comboCounts.ai+
      '。真实玩家偏好须另行招募测试，本局仅是本地试玩。';
    $('result-dialog').showModal();
  }
}
function deploy(lane) {
  if(theme==='campus'&&stageDirector.busy)stageDirector.skip();
  focusedLane=lane;
  if(selected===null){setMessage('请先选择手牌，再按「召唤／发动这张牌」确认。');return;}
  const cardId=game.hand.player[selected];
  const r=game.tutorial?playTutorialCard(game,selected,lane):playCard(game,selected,lane);
  if(!r.ok){setMessage('无法出牌：'+r.reason);return;}
  track('card_played',{card_id:cardId,lane});
  selected=null;checkEvents();render();
  const playedName=presentation(BY_ID[cardId],theme).name;
  signalOpponent('出牌成功：「'+playedName+'」已打到 '+LANES[lane]+
    (BY_ID[cardId]?.kind==='unit'?'。角色已登场，下一次己方行动才能攻击。按「结束回合 → 对手行动」等待回应。':
     '。效果已结算。按「结束回合 → 对手行动」让 AI 回应。'),'played');
  setMessage(game.tutorial?.completed?
    EPISODES[game.tutorial.level-1].successText+' 点击「'+(game.tutorial.level<EPISODES.length?'下一关':'进入自由对战')+'」继续。':
    (BY_ID[cardId]?.kind==='unit'?
      '「'+presentation(BY_ID[cardId],theme).name+'」已部署！人物本回合先待命。点击「结束回合」，等到下次轮到你时才会自动攻击同一战线的对手。':
      '事件牌已生效。你可以继续出牌，或点击「结束回合」。'));
  if(tutorialStep(game) && matchMedia('(max-width: 760px)').matches)
    $('hand').scrollIntoView?.({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
}
function nextTurn() {
  if(game.phase!=='playing'||game.active!=='player')return;
  if(tutorialStep(game)){
    setMessage('先完成这两张牌的部署，再结束回合；也可以跳过教学。');
    return;
  }
  track('turn_ended');
  const serialBefore=game.serial;
  selected=null;endTurn(game);
  if(game.phase==='playing'&&game.active==='ai')aiTurn(game);
  const freshTurn=game.events.filter(e=>e.serial>serialBefore);
  const aiCards=freshTurn.filter(e=>e.type==='card_play'&&e.side==='ai');
  const attacks=freshTurn.filter(e=>e.type==='exchange'||e.type==='direct_hit');
  const aiReply=aiCards.length?'AI 已出牌：'+aiCards.map(e=>
   presentation(BY_ID[e.card],theme).name+' → '+LANES[e.lane]).join('，'):
   'AI 本次没有新牌可打（仍会结算已有角色的攻击）';
  const combatReply=attacks.length?'；本轮发生 '+attacks.length+' 次真实攻击，详见最近交锋。':
   '；双方新召唤角色暂时待命，下一次自己行动才会攻击。';
  const turnExplanation=game.phase==='ended'?'本局已结算。'+aiReply+combatReply:
    aiReply+combatReply+' 现在又轮到你了。';
  signalOpponent(turnExplanation,'ai-replied');
  const lastCombat=[...game.events].reverse().find(e=>e.type==='exchange'||e.type==='direct_hit');
  if(lastCombat?.lane!==undefined)focusedLane=lastCombat.lane;
  checkEvents();render();
  setMessage(turnExplanation);
}
function restart(seed=Date.now()) {
  stageDirector.reset();
  signalOpponent('你的出牌阶段：从下方选一张手牌，确认召唤／发动；轮到对手时按「结束回合」。','idle');
  combatFeedbackR40.reset();
  $('arena-r41-current').textContent='本局尚无交锋';
  $('arena-r41-replay').disabled=true;
  presenceTracker.reset();
  stableUnits.clear();
  stableLanes.length=0;
  focusedLane=0;
  hideCombo();
  clearTimeout(visualTimer);
  lastVisualCue=null;
  game=tutorialEnabled?createGuidedEpisode(currentTutorialLevel,seed):createGame(seed);
  focusedLane=tutorialStep(game)?.lane??0;
  selected=null;observedSerial=0;finishedShown=false;startedAt=performance.now();clicks=[];
  $('result-dialog').close();
  track('game_started',{seed:game.seed});
  checkEvents();render();
  setMessage(tutorialEnabled?'第'+currentTutorialLevel+'关：'+tutorialStatus(game).instruction:graduationVisible?'三关教学全部完成！现在开始正式自由对战。':
     '从下方手牌选卡，再按「召唤／发动」确认出牌；默认目标教室，可修改。');
}
function exportJournal() {
  track('log_exported');
  const payload={
    schema:'asdc-local-pilot-1',game_version:game.version,variant:theme,
    seed:game.seed,winner:game.winner,round:game.round,
    hp:structuredClone(game.hp),combos:structuredClone(game.comboCounts),
    timing_events:clicks,game_events:game.events
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;link.download='asdc-'+theme+'-'+game.seed+'.json';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  setMessage('已导出本局本地操作日志（不包含玩家身份信息）。');
}
$('theme-select').addEventListener('change',e=>{
  graduationVisible=false;
  const next=e.target.value;
  if(!availableThemes.includes(next))return;
  theme=next;
  tutorialEnabled=false;
  const seed=game.seed;
  restart(seed);track('theme_changed',{variant:theme});
});
$('reset').addEventListener('click',()=>{graduationVisible=false;tutorialEnabled=false;restart();});
$('tutorial-skip').addEventListener('click',()=>{graduationVisible=false;tutorialEnabled=false;restart(game.seed);track('tutorial_skipped');});
$('tutorial-next').addEventListener('click',()=>{
  if(!game.tutorial?.completed)return;
  const next=currentTutorialLevel+1;
  if(next<=EPISODES.length){
    currentTutorialLevel=next;
    graduationVisible=false;
    tutorialEnabled=true;
    restart(game.seed);
    track('tutorial_next_level',{level:currentTutorialLevel});
  } else {
    tutorialEnabled=false;
    graduationVisible=true;
    restart(game.seed);
    track('tutorial_all_completed');
  }
});
$('stage3d-mode').addEventListener('click',()=>{
 const enabled=stageDirector.setLive3DEnabled(!stageDirector.live3DEnabled);
 $('stage3d-mode').textContent='3D交锋：'+(enabled?'已开启':'关闭');
 $('stage3d-mode').setAttribute('aria-pressed',String(enabled));
 setMessage(enabled?'仅E01对G01真实交锋会使用GLB，其他人物保持原演出；可随时跳过。':
  '已关闭实验3D交锋，卡牌规则与本局进度不变。');
 track('three_d_staging_toggled',{enabled});
});
$('stage3d-demo').addEventListener('click',()=>{
 if(!stageDirector.show3DDemoR14())
  setMessage('当前已有演出，请先跳过本段再打开3D研究示范。');
 else{
  $('stage3d-mode').textContent='3D交锋：已开启';
  $('stage3d-mode').setAttribute('aria-pressed','true');
 }
});
$('end-turn').addEventListener('click',nextTurn);
$('r42-confirm-play')?.addEventListener('click',()=>deploy(focusedLane));
$('r42-target-select')?.addEventListener('change',e=>focusOrDeploy(Number(e.target.value)));
$('r42-open-tutorial')?.addEventListener('click',()=>{
 tutorialEnabled=true;currentTutorialLevel=1;graduationVisible=false;restart(game.seed);
 signalOpponent('已进入新手教学：按上方指定卡牌和战线逐步完成操作。','tutorial');
});
$('export').addEventListener('click',exportJournal);
$('show-rules').addEventListener('click',()=>$('rules-dialog').showModal());
$('close-rules').addEventListener('click',()=>$('rules-dialog').close());
$('play-again').addEventListener('click',()=>{graduationVisible=false;tutorialEnabled=false;restart();});
for(let lane=0;lane<3;lane++)$('arena-lane-'+lane).addEventListener('click',()=>focusOrDeploy(lane));
$('skip-combo').addEventListener('click',hideCombo);

// Browser QA ONLY: a second isolated game drives the same stage director.
// The throwaway fixture is never assigned to the user's active game.
if(params.get('qaLiveR14')==='1')globalThis.__asdcLiveR14QA={
 snapshotGame:()=>({
  serial:game.serial,round:game.round,
  hp:{...game.hp},turns:{...game.turns},
  boardSizes:{player:game.board.player.map(x=>x.length),
    ai:game.board.ai.map(x=>x.length)}
 }),
 triggerIsolatedCoreExchange(){
  stageDirector.reset();
  stageDirector.setLive3DEnabled(true);
  const fixture=createGame(20261108);
  fixture.active='player';fixture.turns.player=2;
  const unit=(uid,id,style,attack,hp,shield=0)=>({
   uid,id,style,attack,hp,shield,buff:0,summonedAt:1
  });
  fixture.board.player[1]=[unit('r14-probe-p','E01','ember',2,5)];
  fixture.board.ai[1]=[unit('r14-probe-a','G01','grove',1,5)];
  const action=endTurn(fixture);
  if(!action.ok)throw Error('R14 independent core exchange rejected');
  const e=fixture.events.find(x=>x.type==='exchange'&&
    x.side==='player'&&x.lane===1&&x.from==='E01'&&x.to==='G01');
  if(!e)throw Error('R14 test generated no genuine engine exchange');
  const scenes=compileTurnPerformances([e],{theme:'campus'});
  if(scenes.length!==1)throw Error('R14 did not compile genuine event');
  stageDirector.enqueue(scenes);
  return {eventSerial:e.serial,event:{...e},sceneKind:scenes[0].kind,
   stageStatus:stageDirector.live3DStatus,
   source:'ISOLATED_ENGINE_FIXTURE_NOT_PLAYER_MATCH'};
 },
 get stageStatus(){return stageDirector.live3DStatus;}
};
// R39: game starts with true 3D combat enabled for eligible E01↔G01 exchanges.
stageDirector.setLive3DEnabled(true);
$('stage3d-mode').textContent='3D交锋：已开启';
$('stage3d-mode').setAttribute('aria-pressed','true');
restart(Number(params.get('seed'))||Date.now());
