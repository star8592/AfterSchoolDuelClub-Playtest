/**
 * R45 — independent game application. NO legacy R14..R44 UI/director imports.
 * Free duel + R98 optional in-game tutorial; core gameplay always stays in engine.mjs.
 * Real rules and 3D rendering are separate; visual animation never mutates HP.
 */
import {BY_ID,MAX_HP,createGame,playCard,endTurn,aiTurn,legalMoves} from './engine.mjs';
import {createDuelAudio} from './audio-engine.mjs';
import {normalizeRealCombo} from './scene/combo-contract.mjs';
import {LESSONS,createTutorialGame,tutorialStatus,tutorialCanPlay,playTutorialCard} from './tutorial.mjs';

const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const seed=Number(params.get('seed')??'1')||1;
const tutorialMode=params.get('mode')==='tutorial';
const requestedLevel=Number(params.get('level')??'1');
const initialLevel=tutorialMode&&Number.isInteger(requestedLevel)&&requestedLevel>=1&&requestedLevel<=LESSONS.length?requestedLevel:1;
let g=tutorialMode?createTutorialGame(initialLevel,seed):createGame(seed);
const scene=$('stadium');
const audio=createDuelAudio();
audio.setOpeningMusic(seed);
const hostSpeechTurn={player:-1,ai:-1};
function sayHostOnce(side){
 if(!['player','ai'].includes(side)||hostSpeechTurn[side]===g.round)return false;
 hostSpeechTurn[side]=g.round;
 return audio.playCharacter(side==='player'?'HOST_PLAYER':'HOST_AI','cast');
}

let selected=null,sceneReady=false,sceneError=false,lastToast='',lastFightSerial=0;
const comboAudioReceipts=new Set();
const styleName={ember:'活力',grove:'创意',tide:'默契'};
const pictogram={
 E02:'➤',E03:'⚑',E04:'★',
 G02:'⌘',G03:'⚗',G04:'◇',M01:'♫',M02:'♨',
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
for(const [id,channel] of [['audio-music','music'],['audio-sfx','sfx'],['audio-voice','voice']]){
 const slider=$(id);slider.value=Math.round(audio.status().volume[channel]*100);
 slider.addEventListener('input',()=>audio.setVolume(channel,Number(slider.value)/100));
}
// Sound is ON for new players; Chrome/Safari may wait for the first gesture.
 // Never make "enable audio" an extra step before selecting or playing a card.
const soundToggle=$('audio-toggle');
function paintSoundToggle(){
 const requested=audio.status().requested;
 soundToggle.textContent=requested?'♫ 声音开启':'♪ 声音关闭';
 soundToggle.setAttribute('aria-pressed',String(requested));
 soundToggle.title=requested
  ?'默认播放音乐、战斗音效和人物语音；点此可静音。浏览器可能在第一次游戏操作时开始播放。'
  :'当前已静音，点此恢复音乐、战斗音效和人物语音';
}
paintSoundToggle();
soundToggle.addEventListener('click',()=>{
 if(audio.status().requested){audio.stop();paintSoundToggle();return}
 // This click is already an explicit playback user gesture.
 void audio.turnOn().catch(e=>console.warn('Game audio unavailable:',String(e)));
 paintSoundToggle();
});
function unlockSoundOnFirstGameAction(event){
 const sound=audio.status();
 // A resumed AudioContext does not imply the music HTMLAudioElement was
 // allowed to autoplay. Retry the latter on a genuine card/keyboard gesture.
 if(!sound.requested||(sound.enabled&&sound.counters.musicStart>0))return;
 if(event.target instanceof Element&&event.target.closest('#audio-toggle'))return;
 void audio.unlock().catch(e=>console.warn('Game audio unavailable:',String(e)));
}
// Capture before the card click is handled, so the first tap has an audible
// card cue rather than a silent first move.
for(const type of ['pointerdown','keydown','click']){
 window.addEventListener(type,unlockSoundOnFirstGameAction,{capture:true,passive:true});
}
void audio.prepare().catch(e=>console.warn('Audio preload unavailable:',String(e)));
if(audio.status().requested){
 // Autoplay is attempted where the browser allows it; otherwise no dialog:
 // first ordinary game interaction resumes the sound automatically.
 void audio.unlock().catch(e=>console.warn('Audio autoplay unavailable:',String(e)));
}
function cardSound(c){
 if(c.kind==='unit')return 'cast';
 return ({buff:'cast',blast:'spell_charge',confuse:'spell_charge',repair:'heal',heal:'heal',draw:'select'})[c.effect]||'turn';
}
function gameReady(){return sceneReady&&!sceneError&&g.phase==='playing'&&g.active==='player';}
function cardCanPlay(index){
 return gameReady()&&tutorialCanPlay(g,index)&&
  legalMoves(g).some(m=>m.index===index&&m.lane===0);
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
  if(tutorialMode&&!tutorialCanPlay(g,index))return;
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
   audio.playCue('select');
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
 const lesson=tutorialMode?tutorialStatus(g):null;
 $('hand-count').textContent=String(lesson?(lesson.completed?0:1):g.hand.player.length);
 if(lesson?.completed){
  const finish=$make('div','lesson-finished-hand');
  finish.append($make('strong',null,'✓ '+lesson.title+' · 挑战成功'),
   $make('span',null,lesson.success),
   $make('span','lesson-finished-hint',
    lesson.level===LESSONS.length?'点击下方金色按钮，进入正式自由对战。':'点击下方金色「进入下一关」，继续玩。'));
  $('hand').append(finish);
 }else if(!g.hand.player.length){
  $('hand').append($make('div','empty-hand','手牌用完，点击「结束回合」即可继续抽牌'));
 }
}
function scoreboardSnapshot(){
 return{type:'ASDC_R81_SCORE',player:g.hp.player,ai:g.hp.ai,round:g.round,
   turn:g.phase==='ended'?'ended':g.active,comboPlayer:g.comboCounts.player,
   comboAi:g.comboCounts.ai,energy:g.energy.player};
}
function sendSpellImpact(cardEvent) {
 if(!cardEvent||cardEvent.type!=='card_play'||!BY_ID[cardEvent.card]||
   BY_ID[cardEvent.card].kind!=='spell'||!cardEvent.spellOutcome)return false;
 const {directDamage,unitDamage,targetUids,effect}=cardEvent.spellOutcome;
 return sendScene({type:'ASDC_R81_SPELL_RESULT',card:cardEvent.card,
   side:cardEvent.side,serial:cardEvent.serial,damage:directDamage+unitDamage,
   directDamage,targetUids,effect});
}
function renderHUD(){
 for(const [side,node] of [['player','player-hp'],['ai','enemy-hp']]){
   const label=$(node),next=String(g.hp[side]);
   if(label.textContent!==next){label.textContent=next;
     label.classList.remove('score-changed');void label.offsetWidth;
     label.classList.add('score-changed');}
 }

 $('player-hp-bar').style.width=(100*g.hp.player/MAX_HP).toFixed(1)+'%';
 $('enemy-hp-bar').style.width=(100*g.hp.ai/MAX_HP).toFixed(1)+'%';
 $('energy').textContent=String(g.energy.player);
 $('round').textContent='第 '+g.round+' 回合';
 const combo=$('combo-count');if(combo)combo.textContent='连携 '+g.comboCounts.player+' : '+g.comboCounts.ai;
 $('whose-turn').textContent=g.phase==='ended'?'决斗结束':
  g.active==='player'?'轮到你出牌':'AI 正在回应';
}
function renderActions(){
 const ended=g.phase==='ended',lesson=tutorialMode?tutorialStatus(g):null;
 const completed=!!lesson?.completed;
 const card=selected===null?null:BY_ID[g.hand.player[selected]];
 const canPlay=selected!==null&&cardCanPlay(selected);
 const btn=$('play'),endBtn=$('end');
 if(lesson){
  btn.disabled=!sceneReady||sceneError||(!completed&&!canPlay);
  btn.textContent=completed?
   (lesson.level===LESSONS.length?'✓ 开始自由对战':'✓ 进入下一关 · '+(lesson.level+1)+'/3'):
   card?'出牌 · '+(card.kind==='unit'?'召唤':'发动'):'选择高亮的卡牌';
  $('selected-title').textContent=completed?'✓ 本关成功！':
   card?card.name+' · '+card.cost+' 能量':'教学第 '+lesson.level+' 关 · 步骤 '+(lesson.step+1)+'/2';
  $('selected-info').textContent=completed?
   (lesson.level===LESSONS.length?'点击金色按钮，正式开始自由对战。':'点击金色按钮进入下一关，不用再找手牌。'):
   lesson.steps[lesson.step].replace(/^[①②]\s*/,'');
  endBtn.hidden=true;endBtn.disabled=true;
  return;
 }
 endBtn.hidden=false;
 btn.disabled=ended?false:!canPlay;
 btn.textContent=ended?'查看本局战绩':card?'出牌 · '+(card.kind==='unit'?'召唤':'发动'):'先选一张牌';
 $('selected-title').textContent=ended?'本局已结束':card?card.name+' · '+card.cost+' 能量':'还没有选牌';
 $('selected-info').textContent=ended?'点击「再来一局」重新抽牌，开启新决斗':
  sceneError?'三维资源加载失败。请在场景中点击「重新加载三维场景」，完成后再出牌。':
  !sceneReady?'三维体育馆和角色模型正在加载，载入后即可出牌。':
  card?describeCard(card):'点击手牌选择，无需选择教室、走廊或其他部署位置';
 endBtn.disabled=!ended&&!gameReady();
 endBtn.textContent=ended?'↻ 再来一局':'结束回合 → AI 出牌';
}
function renderLesson(){
 const launch=$('tutorial-start'),panel=$('lesson-panel');
 launch.hidden=tutorialMode;
 panel.hidden=!tutorialMode;
 if(!tutorialMode)return;
 const status=tutorialStatus(g);
 $('lesson-progress').textContent='剧情教学 '+status.level+' / '+LESSONS.length;
 $('lesson-title').textContent=status.title+(status.completed?' · 完成！':'');
 $('lesson-story').textContent=status.completed?status.success:status.story;
 const result=status.result;
 $('lesson-instruction').textContent=status.completed?
  '实际连携：'+result.effect+(result.damage?' · 伤害 '+result.damage:'')+
   (result.blocked?' · 格挡 '+result.blocked:'')+
   (result.shield?' · 护盾 +'+result.shield:'')+
   (result.draw?' · 额外抽牌 '+result.draw:'')+
   (result.defeated?' · 对方单位退场':''):
  status.steps[status.step];
 const next=$('lesson-next');
 // The bottom gold CTA is the sole progression action. Keep this old node
 // hidden to avoid two conflicting next-step locations.
 next.hidden=true;
 next.textContent=status.level===LESSONS.length?'完成教学 · 开始自由对战':'下一关 · '+LESSONS[status.level].title;
}
function freeDuelUrl(){
 const u=new URL(location.href);
 u.searchParams.delete('mode');u.searchParams.delete('level');
 return u;
}
$('tutorial-start').addEventListener('click',()=>{
 const u=new URL(location.href);
 u.searchParams.set('mode','tutorial');u.searchParams.set('level','1');
 location.assign(u.href);
});
$('tutorial-exit').addEventListener('click',()=>location.assign(freeDuelUrl().href));
function advanceLesson(){
 if(!tutorialMode||!tutorialStatus(g).completed||!sceneReady||sceneError)return;
 const level=g.tutorial.level;
 if(level===LESSONS.length){location.assign(freeDuelUrl().href);return;}
 // A fresh lesson is a fresh actual duel instance. The stadium itself stays
 // mounted, avoiding repeat 70MB VRM/GLB downloads between chapters.
 // Stop the previous chapter's props immediately; no effect leaks into the next one.
 sendScene({type:'ASDC_R100_COMBO_RESET'});
 comboAudioReceipts.clear();
 g=createTutorialGame(level+1,seed+level);
 selected=null;lastFightSerial=0;
 hostSpeechTurn.player=-1;hostSpeechTurn.ai=-1;
 render();syncScene();
 announce('开始'+LESSONS[level].title+'：请按底部提示依次出两张卡牌。','selected');
}
$('lesson-next').addEventListener('click',advanceLesson);

function renderGuide(){
 if(tutorialMode){
  const t=tutorialStatus(g);
  $('guide-step').textContent=t.completed?'本关连携已经真实触发，点击「下一关」继续':t.steps[t.step];
  return;
 }
 $('guide-step').textContent=g.phase==='ended'?'本局结束 · '+(g.winner==='player'?'你赢了！':g.winner==='ai'?'AI 获胜':'平局'):
  selected!==null?'② 点击下方金色「出牌」，人物便会进入中央竞技场':
  g.active==='player'?'① 选择手牌　② 点击「出牌」　③ 按「结束回合」让 AI 回应':
  'AI 正在出牌 · 请看中央竞技场与对局提示';
}
function render(){
 if(g.phase==='ended')scheduleResult();
 renderHUD();
 renderBoard();
 renderHand();
 renderActions();
 renderLesson();
 renderGuide();
 sendScene(scoreboardSnapshot());
}
function boardSnapshot(){
 const units=side=>g.board[side][0].map(x=>({uid:x.uid,id:x.id,hp:x.hp,attack:x.attack+x.buff,shield:x.shield||0}));
 return{type:'ASDC_R45_BOARD',
  player:g.board.player[0].map(x=>x.id),ai:g.board.ai[0].map(x=>x.id),
  units:{player:units('player'),ai:units('ai')}};
}
function sendScene(msg){
 if(!sceneReady||!scene.contentWindow)return false;
 scene.contentWindow.postMessage(msg,location.origin);
 return true;
}
// R100: only genuine events written by engine.mjs can launch a 3D school
// comedy cinematic. The director receives read-only outcome metadata and
// never gets a reference to the mutable game state.
function presentRealCombos(sinceSerial){
 for(const raw of g.events.filter(e=>e.type==='combo_effect'&&e.serial>sinceSerial)){
  const event=normalizeRealCombo(raw);
  if(!event)throw Error('R100 real combo contract invalid: '+raw.effect);
  sendScene({type:'ASDC_R100_REAL_COMBO',event:raw,
   chapter:tutorialMode?g.tutorial.level:0});
  // Character/card gesture audio happens immediately; the impact cue
  // arrives from the real 3D payoff frame, not a timer or guessed duration.
 }
}

function updateCameraAngle(angle){
 const node=$('camera-angle');
 if(node)node.textContent=Math.round(angle)+'°';
}
for(const [id,delta] of [['camera-left',-45],['camera-right',45]]){
 $(id)?.addEventListener('click',()=>sendScene({type:'ASDC_R48_CAMERA_DELTA',degrees:delta}));
}
$('camera-reset')?.addEventListener('click',()=>sendScene({type:'ASDC_R48_CAMERA_SET',degrees:0}));
const hpViewModes=['auto','full','compact','hidden'];
const hpViewNames={auto:'♥ 自动',full:'♥ 完整',compact:'♥ 精简',hidden:'♥ 隐藏'};
let hpViewIndex=0;
function nextHpViewMode(){
 hpViewIndex=(hpViewIndex+1)%hpViewModes.length;
 const mode=hpViewModes[hpViewIndex];
 const control=$('hp-label-mode');
 if(control){control.textContent=hpViewNames[mode];control.setAttribute('aria-label','血量名牌：'+hpViewNames[mode]);}
 sendScene({type:'ASDC_R53_HP_MODE',mode});
}
$('hp-label-mode')?.addEventListener('click',nextHpViewMode);

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
 sendScene(scoreboardSnapshot());
}
// Every terminal engine path (HP depletion or turn limit, on either side)
// must lead to a visible result and a one-click fresh match. Re-navigation
// recreates BOTH the rule engine and 3D iframe, preventing stale summoned units.
let resultScheduled=false;
function showResult(){
 if(g.phase!=='ended')return;
 const overlay=$('result-overlay');
 const outcome={
  player:{title:'胜利！',summary:'你赢得了这场卡牌决斗！',symbol:'★'},
  ai:{title:'本局挑战结束',summary:'AI 赢得本局，换一手牌再战！',symbol:'↻'},
  draw:{title:'势均力敌！',summary:'双方战平，再来一局分胜负。',symbol:'✦'}
 }[g.winner]||{title:'决斗结束',summary:'本局已经结算。',symbol:'✦'};
 overlay.dataset.outcome=g.winner||'draw';
 $('result-title').textContent=outcome.title;
 $('result-summary').textContent=outcome.summary;
 $('result-symbol').textContent=outcome.symbol;
 $('result-player-hp').textContent=String(g.hp.player);
 $('result-ai-hp').textContent=String(g.hp.ai);
 $('result-round').textContent='第 '+g.round+' 回合 · 决斗结束';
 overlay.hidden=false;
 $('result-rematch').focus({preventScroll:true});
}
function scheduleResult(){
 if(resultScheduled)return;
 resultScheduled=true;
 // Allow the final score hit and character reaction to land before the panel.
 window.setTimeout(showResult,1100);
}
function startRematch(){
 if(g.phase!=='ended')return;
 const target=new URL(location.href);
 // The next seed changes both starting hands and the AI's random sequence.
 target.searchParams.set('seed',String((Math.abs(seed)%2147483646)+1));
 location.assign(target.href);
}
$('result-rematch').addEventListener('click',startRematch);
$('result-review').addEventListener('click',()=>{
 $('result-overlay').hidden=true;
 $('end').focus({preventScroll:true});
});
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
 if(tutorialMode&&tutorialStatus(g).completed){advanceLesson();return;}
 if(g.phase==='ended'){showResult();return;}
 if(selected===null||!cardCanPlay(selected))return;
 const previousSerial=g.serial;
 const id=g.hand.player[selected],c=BY_ID[id],preHp={...g.hp},
   result=tutorialMode?playTutorialCard(g,selected,0):playCard(g,selected,0);
 if(!result.ok){
  announce('出牌失败：'+result.reason,'warning');render();return;
 }
 selected=null;
 render();syncScene();
 presentRealCombos(previousSerial);
 audio.playCue(cardSound(c),'player');
 projectPlayedCard(id,'player');
 audio.playCue('card_flip','player');
 // The host announces once per turn, then the freshly summoned unit gets a
 // distinct entrance sentence. Previously host cast cut off every unit voice.
 sayHostOnce('player');
 if(c.kind==='unit')audio.playCharacter(id,'enter');
 if(c.kind==='spell'){
  sendSpellImpact(g.events.findLast(e=>e.type==='card_play'&&e.side==='player'&&e.card===id));
  const sound={blast:'meteor_impact',confuse:'sonic_wave',buff:'spell_charge',
    repair:'ice_shatter',draw:'card_flip',heal:'shield_block'}[c.effect];
  if(sound){
   if(c.effect==='blast'||c.effect==='confuse')
     setTimeout(()=>audio.playCue(sound,'player'),460);
   else audio.playCue(sound,'player');
  }
  if(g.hp.ai<preHp.ai)setTimeout(()=>audio.playCharacter('HOST_AI','hurt'),460);
 }
 const suffix=c.kind==='unit'?'已进入中央竞技场。本回合待命，下次轮到你才会攻击。':
  '已立即结算事件效果。';
 const lesson=tutorialMode?tutorialStatus(g):null;
 announce(lesson?.completed?
  '本关成功！'+lesson.success+' 请点击底部金色「'+
   (lesson.level===LESSONS.length?'开始自由对战':'进入下一关')+'」继续。':
  tutorialMode?'已打出「'+c.name+'」。'+lesson.steps[lesson.step]:
  '已出牌：「'+c.name+'」。'+suffix+'　还可以继续出牌，或点击「结束回合」。','played');
 if(g.phase==='ended'){
  audio.gameFinished(g.winner);
  announce('决斗结束！'+(g.winner==='player'?'你赢了！':'AI 获胜。'),'ended');
 }
});
$('end').addEventListener('click',()=>{
 if(g.phase==='ended'){startRematch();return;}
 if(tutorialMode||!gameReady())return;
 audio.playCue('turn');
 const pre=boardSnapshot().units;
 const preHp={...g.hp};
 const serial=g.serial;
 endTurn(g);
 if(g.phase==='playing'&&g.active==='ai')aiTurn(g);
 const fresh=g.events.filter(e=>e.serial>serial);
 selected=null;
 render();syncScene();
 presentRealCombos(serial);
 for(const side of ['player','ai']){
  const delta=Math.max(0,preHp[side]-g.hp[side]);
  // An AI spell already has its own precise impact event; don't count it a
  // second time as a generic host hit or make the rival flinch twice.
  const spellDamage=fresh.filter(e=>e.type==='card_play'&&
    e.side!==(side)&&e.spellOutcome).reduce((n,e)=>n+e.spellOutcome.directDamage,0);
  const otherDamage=Math.max(0,delta-spellDamage);
  if(otherDamage>0){
   setTimeout(()=>{
    sendScene({type:'ASDC_R81_HIT_HOST',side,damage:otherDamage});
    audio.playCharacter(side==='player'?'HOST_PLAYER':'HOST_AI','hurt');
    audio.playCue('score_chime',side);
   },430);
  }
 }
 const summary=stateSummary(fresh);
 for(const event of fresh.filter(e=>e.type==='card_play'&&e.side==='ai').slice(-3)){
  const enemyCard=BY_ID[event.card];
  audio.playCue(enemyCard?.kind==='unit'?'enemy_cast':cardSound(enemyCard),'ai');
  projectPlayedCard(event.card,'ai');
  sayHostOnce('ai');
  if(enemyCard?.kind==='unit')audio.playCharacter(event.card,'enter');
  if(enemyCard?.kind==='spell') {
   sendSpellImpact(event);
   const fx={blast:'meteor_impact',confuse:'sonic_wave',buff:'spell_charge',
     repair:'ice_shatter',draw:'card_flip',heal:'shield_block'}[enemyCard.effect];
   if(fx){
    if(enemyCard.effect==='blast'||enemyCard.effect==='confuse')
      setTimeout(()=>audio.playCue(fx,'ai'),460);
    else audio.playCue(fx,'ai');
   }
   if(event.spellOutcome?.directDamage>0){
    setTimeout(()=>audio.playCharacter('HOST_PLAYER','hurt'),460);
   }
  }
 }
 const fight=findRealExchange(fresh);
 const clashes=fresh.filter(e=>e.type==='exchange'||e.type==='direct_hit');
 // R46 preserves its exclusive full-rig E01→G01 cinematic.
 // Every other real exchange uses the shorter UID-specific 3D sequence.
 if(fight)playFight(fight);
 const generic=fight?clashes.filter(e=>e.serial!==fight.serial):clashes;
 if(clashes.length){
  audio.playCue('attack',clashes[0].side);
  audio.playCue('hit',clashes[0].side==='player'?'ai':'player');
  // Qwen3-TTS attack voice only for the actual attacker and when available.
  // The turn can contain many simultaneous exchanges. One intelligible
  // characteristic battle shout is better than three voices interrupting.
  const lead=clashes.find(e=>e.from&&BY_ID[e.from]?.kind==='unit');
  if(lead)audio.playCharacter(lead.from,'attack');
 }
 if(generic.length)sendScene({type:'ASDC_R51_COMBAT_EVENTS',
  pre,post:boardSnapshot().units,events:generic.map(e=>({
   type:e.type,serial:e.serial,side:e.side,from:e.from,to:e.to||null,
   attacker_uid:e.attacker_uid||null,target_uid:e.target_uid||null,
   damage:e.damage,blocked:e.blocked||0,retaliation:e.retaliation||0,
   target_hp_after:e.target_hp_after,attacker_hp_after:e.attacker_hp_after,
   target_defeated:!!e.target_defeated,attacker_defeated:!!e.attacker_defeated
  }))});
 if(g.phase==='ended'){
  const endText=g.winner==='player'?'你赢得了对决！':g.winner==='ai'?'AI 获胜，再试一局！':'平局。';
  audio.gameFinished(g.winner);
  announce(endText+' '+summary,'ended');
 }else{
  audio.musicForBattle({round:g.round,playerHp:g.hp.player,aiHp:g.hp.ai,
    comboPlayer:g.comboCounts.player,comboAi:g.comboCounts.ai});
  announce(summary+'。现在轮到你了。','ai');
 }
});
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==scene.contentWindow)return;
 if(event.data?.type==='ASDC_R45_SCENE_READY'){
  sceneReady=true;sceneError=false;
  syncScene();
  sendScene({type:'ASDC_R53_HP_MODE',mode:hpViewModes[hpViewIndex]});
  render(); // enable legal cards only after authentic GLB/VRM readiness
  return;
 }
 if(event.data?.type==='ASDC_R45_SCENE_FAILED'){
  sceneReady=false;sceneError=true;
  render();
  announce('三维人物没有加载成功，出牌已暂停。请在竞技场中点击重新加载。','error');
  return;
 }
 if(event.data?.type==='ASDC_R100_COMBO_IMPACT'){
  const {serial,effect,side,chapter}=event.data;
  const key=chapter+':'+side+':'+serial+':'+effect;
  const raw=g.events.find(e=>e.type==='combo_effect'&&e.serial===serial&&
   e.side===side&&e.effect===effect);
  if(raw&&chapter===(tutorialMode?g.tutorial.level:0)&&
     normalizeRealCombo(raw)&&!comboAudioReceipts.has(key)){
   comboAudioReceipts.add(key);
   const cue=effect.startsWith('chalk')?'meteor_impact':
    effect==='broadcast_draw'?'sonic_wave':'shield_block';
   audio.playCue(cue,side);
  }
  return;
 }
 if(event.data?.type==='ASDC_R45_FIGHT_ACCEPTED'){
  return;
 }
});
scene.addEventListener('load',()=>{sceneReady=false;sceneError=false;render()});
window.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&$('help').open)$('help').open=false;
 if(event.target instanceof HTMLElement&&/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName))return;
 if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
  event.preventDefault();sendScene({type:'ASDC_R48_CAMERA_DELTA',degrees:event.key==='ArrowLeft'?-45:45});
 }
 if(event.key.toLowerCase()==='h'&&!event.repeat){
  nextHpViewMode();
 }
 if(event.key==='Home'||event.key.toLowerCase()==='r'){
  sendScene({type:'ASDC_R48_CAMERA_SET',degrees:0});
 }
});
render();
announce('开始决斗：你在左，对手在右；选牌并按「出牌」，召唤物会进入同一个三维体育馆。');
if(new URLSearchParams(location.search).get('qa')==='1'){
 Object.defineProperty(window,'__r45QA',{value:{
  get tutorial(){return tutorialStatus(g)},
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
  get lastFightSerial(){return lastFightSerial},
  get audio(){return audio.status()},
  audioVoiceSample(id,kind='enter'){return audio.playCharacter(id,kind)}
 }});
}
