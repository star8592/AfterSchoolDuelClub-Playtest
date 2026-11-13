/**
 * R45 — independent game application. NO legacy R14..R44 UI/director imports.
 * Free duel + R98 optional in-game tutorial; core gameplay always stays in engine.mjs.
 * Real rules and 3D rendering are separate; visual animation never mutates HP.
 */
import {BY_ID,CARDS,DECK_PRESETS,MAX_HP,createGame,playCard,endTurn,aiTurn,legalMoves} from './engine.mjs';
import {cardArtURL,cardArtStatus} from './card-art.mjs';
import {createDuelAudio} from './audio-engine.mjs';
import {CARD_ELEMENTS,ELEMENTS} from './scene/spell-response-contract.mjs';
import {chooseCrowdAccident} from './scene/spectator-chaos-contract.mjs';
import {resolveSpectatorProp} from './scene/bleacher-prop-comedy.mjs';
import {makeComedyScript,COMIC_ASIDE_LINES} from './comedy-script.mjs';
import {normalizeRealCombo} from './scene/combo-contract.mjs';
import {LESSONS,createTutorialGame,tutorialStatus,tutorialCanPlay,playTutorialCard} from './tutorial.mjs';
import {GUIDED_LINES,createGuidedGame,guidedStatus,guidedCanPlay,guidedPlayCard,guidedEndTurn} from './guided-tutorial.mjs';

const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
// R101: ordinary new sessions should not always receive the SAME seed-1
// starting hand. A shared ?seed=N remains exactly reproducible for challenges
// and QA. Show the real random seed in the URL without reloading the scene.
function createVisitorSeed(){
 const key=new Uint32Array(1);
 if(globalThis.crypto?.getRandomValues){
  crypto.getRandomValues(key);
  return 1+(key[0]%2147483646);
 }
 return 1+(Math.floor(Date.now()/17)%2147483646);
}
const suppliedSeed=Number(params.get('seed'));
const seed=params.has('seed')&&Number.isInteger(suppliedSeed)&&
 suppliedSeed>=1&&suppliedSeed<=2147483646?suppliedSeed:createVisitorSeed();
if(!params.has('seed')||seed!==suppliedSeed){
 const fixed=new URL(location.href);fixed.searchParams.set('seed',String(seed));
 history.replaceState(null,'',fixed.href);
}
const tutorialMode=params.get('mode')==='tutorial';
const guidedMode=params.get('mode')==='guided';
const requestedLevel=Number(params.get('level')??'1');
const initialLevel=tutorialMode&&Number.isInteger(requestedLevel)&&requestedLevel>=1&&requestedLevel<=LESSONS.length?requestedLevel:1;
const requestedDeck=params.get('deck');
const activeDeck=(!tutorialMode&&Object.hasOwn(DECK_PRESETS,requestedDeck))?requestedDeck:'classic';
let g=guidedMode?createGuidedGame(seed):tutorialMode?createTutorialGame(initialLevel,seed):createGame(seed,activeDeck);
const scene=$('stadium');
const comedyScript=makeComedyScript(seed);
let lastQwenSubtitle=null,spokenSubtitleCount=0,asideSeq=0,speechSeq=0;
const asideHistory=[];
function showSpokenLine(entry){
 if(guidedMode&&GUIDED_LINES[entry?.kind])return; // R120 uses the persistent duel commentator bubble.
 if(!entry||typeof entry.text!=='string'||!entry.text.trim())return;
 const node=$('spoken-dialogue'),speaker=$('spoken-speaker'),words=$('spoken-words');
 if(!node||!speaker||!words)return;
 const name=BY_ID[entry.id]?.name||({
  HOST_PLAYER:'我方决斗者',HOST_AI:'对方决斗者',
  STADIUM_PA:'体育馆广播员',
  SPECTATOR_0:'左后排观众',SPECTATOR_1:'左前排观众',
  SPECTATOR_2:'右前排观众',SPECTATOR_3:'右后排观众'})[entry.id]||entry.id;
 speaker.textContent=name+' · Qwen3 角色配音';
 words.textContent=entry.text;
 node.dataset.side=entry.id==='STADIUM_PA'||String(entry.id).startsWith('SPECTATOR_')?'center':
  entry.id==='HOST_AI'?'ai':'player';
 node.hidden=false;spokenSubtitleCount++;
 lastQwenSubtitle={...entry,name};
 const serial=++speechSeq;
 const ms=Math.max(950,Math.min(9500,Math.round((Number(entry.duration_seconds)||2.4)*1000)+450));
 setTimeout(()=>{if(serial===speechSeq)node.hidden=true},ms);
}
function showComedyAside(line){
 if(!line?.text)return;
 const node=$('comedy-aside');
 if(!node)return;
 $('comedy-quip-text').textContent=line.text;
 $('comedy-quip-speaker').textContent=line.speaker||'校园场边吐槽 · 文字';
 node.dataset.side=line.side||'center';
 node.hidden=false;
 const serial=++asideSeq;
 asideHistory.push(line);if(asideHistory.length>90)asideHistory.shift();
 setTimeout(()=>{if(serial===asideSeq)node.hidden=true},3000);
}
// R122: speak only when a REAL Qwen audio element has started playing.
 // The iframe contains the ORIGINAL source VRM visemes and does not
 // receive a fictitious mouth-motion cue on a text-only fallback.
function realVoiceStarted(entry){
 if(sceneReady&&['HOST_PLAYER','HOST_AI'].includes(entry?.id)&&
    Number.isInteger(entry.serial)&&entry.serial>0){
  sendScene({type:'ASDC_R122_VOICE_START',actor:entry.id,
   serial:entry.serial,kind:entry.kind,text:entry.text,
   duration_seconds:entry.duration_seconds});
 }
 showSpokenLine(entry);
}
function realVoiceStopped(entry){
 if(sceneReady&&['HOST_PLAYER','HOST_AI'].includes(entry?.id)&&
    Number.isInteger(entry.serial)&&entry.serial>0)
  sendScene({type:'ASDC_R122_VOICE_STOP',actor:entry.id,
   serial:entry.serial});
}
const audio=createDuelAudio({onVoiceLine:realVoiceStarted,onVoiceStop:realVoiceStopped});
audio.setOpeningMusic(seed);
const hostSpeechTurn={player:-1,ai:-1};
function sayHostOnce(side){
 if(!['player','ai'].includes(side)||hostSpeechTurn[side]===g.round)return false;
 const round=g.round,battle=g;
 hostSpeechTurn[side]=round;
 // R117: sync the actual recorded Qwen host-cast VO with the R85 wrist
 // draw/show timeline, rather than speaking while the hands are still idle.
 setTimeout(()=>{
  if(g!==battle||g.round!==round||g.phase==='ended'||!sceneReady)return;
  audio.playCharacter(side==='player'?'HOST_PLAYER':'HOST_AI','cast');
 },570);
 return true;
}
function summonSpeaksAfterGesture(id,serial){
 const battle=g;
 setTimeout(()=>{
  if(g!==battle||g.phase==='ended'||!g.events.some(e=>
    e.type==='card_play'&&e.card===id&&e.serial===serial))return;
  audio.playCharacter(id,'enter');
 },1120);
}

let selected=null,sceneReady=false,sceneError=false,lastToast='',lastFightSerial=0;
let guidedStarted=false,guidedBusy=false,guidedVoiceKey=null,guidedSpeechSerial=0;
const comboAudioReceipts=new Set();
const combatAudioReceipts=new Set();
const styleName={ember:'活力',grove:'创意',tide:'默契'};
const pictogram={
 E02:'➤',E03:'⚑',E04:'★',
 G02:'⌘',G03:'⚗',G04:'◇',M01:'♫',M02:'♨',
 T01:'♫',T02:'☷',T03:'↔',T04:'⌂',
 E05:'✦',E06:'✹',G05:'╋',G06:'▤',T05:'☼',T06:'◉'
};
const MAX_CARDS_ON_FIELD=5;
const NEW_EVENT_ICONS={K:'🍲',Q:'📚',S:'⚗',P:'🏃',X:'⏳'};
const R107_CARD_SIGILS=Object.freeze({
 K01:'🍆',K02:'🍉',K03:'🍇',K04:'🌶️',K05:'🥣',K06:'🧋',K07:'🐸',K08:'🍌',
 Q01:'✏️',Q02:'🎒',Q03:'✦',Q04:'🔊',Q05:'🎤',Q06:'💡',Q07:'🌙',Q08:'⭕',
 S01:'⏰',S02:'🖊️',S03:'🪄',S04:'⚡',S05:'🤖',S06:'🪀',S07:'🕳️',S08:'🥤',
 P01:'🌬️',P02:'🧱',P03:'🦖',P04:'📣',P05:'🏀',P06:'🏃',P07:'🦢',P08:'☄️',
 X01:'⏳',X02:'👕',X03:'🚓',X04:'🛏️',X05:'📓',X06:'🔁',X07:'📆',X08:'🕰️'
});
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
 if(audio.status().requested){
  audio.stop();paintSoundToggle();
  ++speechSeq;$('spoken-dialogue').hidden=true;
  return;
 }
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
 return ({buff:'cast',blast:'spell_charge',confuse:'spell_charge',repair:'heal',heal:'heal',draw:'select',
  stew:'heal',shield:'shield_block',splash:'sonic_wave',chaos:'spell_charge',banquet:'heal',
  insight:'select',updraft:'spell_charge',reroute:'card_flip',boomerang:'spell_charge',
  eclipse:'sonic_wave',trick:'spell_charge'})[c.effect]||'turn';
}
function gameReady(){return sceneReady&&!sceneError&&g.phase==='playing'&&g.active==='player'&&
  (!guidedMode||(guidedStarted&&!guidedBusy));}
function cardCanPlay(index){
 return gameReady()&&tutorialCanPlay(g,index)&&(!guidedMode||guidedCanPlay(g,index))&&
  legalMoves(g).some(m=>m.index===index&&m.lane===0);
}
function describeCard(c){
 if(c.kind==='unit')return '攻 '+c.attack+' / 生命 '+c.hp+' · 上场后下次轮到你才攻击';
 if(c.rule)return c.rule;
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
  if((tutorialMode&&!tutorialCanPlay(g,index))||(guidedMode&&!guidedCanPlay(g,index)))return;
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
  const artURL=cardArtURL(id);
  const art=$make('span','card-illustration'+
    (artURL?' painted-card-art':' original-card-symbol'));
  art.setAttribute('aria-hidden','true');
  if(artURL){
   const img=$make('img','painted-card-image');
   img.src=artURL;img.alt='';img.width=620;img.height=780;
   img.decoding='async';img.loading='lazy';
   art.append(img);
  }else{
   const symbol=$make('span','symbol',pictogram[id]||R107_CARD_SIGILS[id]||
     NEW_EVENT_ICONS[id[0]]||'✦');
   art.append(symbol);
  }
  card.dataset.art=cardArtStatus(id);
  card.title=(artURL?'点击选择；可在图鉴放大查看插画：':'原创插画尚未完成：')+
    c.name+' · '+describeCard(c);
  card.append(head,$make('strong','card-name',c.name),art,
    $make('div','card-desc',c.line),
    $make('div','card-stats',c.kind==='unit'?'⚔ '+c.attack+'　♥ '+c.hp:'✦ '+describeCard(c)));
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
 if(guidedMode){
  const step=guidedStatus(g);
  $('hand-count').textContent=step.completed?'0':'1';
  if(step.completed){
   const finish=$make('div','lesson-finished-hand');
   finish.append($make('strong',null,'✓ 恭喜！你亲手赢得了第一场练习赛'),
    $make('span',null,'对手人气从 6 变成 0。正式比赛双方从 20 点开始。'),
    $make('span','lesson-finished-hint','点击下方金色「进入自由对战」，开始真正的决斗。'));
   $('hand').append(finish);
  }
  return;
 }
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
 if(guidedMode){
  const state=guidedStatus(g);
  const completed=!!state?.completed;
  const canSummon=!!state?.target&&selected!==null&&cardCanPlay(selected);
  const canFinish=guidedStarted&&!guidedBusy&&sceneReady&&!sceneError;
  btn.disabled=!canFinish||(!completed&&!canSummon);
  btn.textContent=completed?'✓ 进入自由对战':canSummon?'出牌 · '+BY_ID[g.hand.player[selected]]?.name:
   state?.target?'选择高亮的牌':'这回合请按「结束回合」';
  $('selected-title').textContent=completed?'✓ 真实获胜！':
   !guidedStarted?'先点击「开始声画教学」':
   guidedBusy?'两位玩家正在讲解…':
   state?.target?'第 '+state.round+' 回合 · 请选牌':'第 '+state.round+' 回合 · 等对方回应';
  $('selected-info').textContent=state.hint;
  endBtn.hidden=!!state.target||completed||!guidedStarted;
  endBtn.disabled=!canFinish||state.target!==null||completed;
  endBtn.textContent='结束回合 → 看对手回应';
  return;
 }
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
 launch.hidden=tutorialMode||guidedMode;
 $('guided-launch').hidden=guidedMode||tutorialMode;
 $('guided-panel').hidden=!guidedMode;
 $('guided-narration').hidden=!guidedMode;
 panel.hidden=!tutorialMode;
 if(guidedMode){
  const state=guidedStatus(g);
  $('guided-round').textContent='入门实战 · 第 '+Math.min(3,state.round)+'/3 回合 · '+
   (state.completed?'练习胜利！':'对手练习人气 6/20');
  $('guided-instruction').textContent=state.hint;
  $('guided-step-label').textContent=state.completed?'获胜！':'第 '+state.round+'/3 回合';
  $('guided-begin').disabled=!sceneReady||sceneError||guidedStarted;
  $('guided-begin').hidden=guidedStarted;
  $('guided-repeat').hidden=!guidedStarted;
  $('guided-repeat').disabled=guidedBusy;
  if(!guidedStarted){
   $('guided-words').textContent='男女决斗者会边出牌、边回应、边讲解。跟着高亮手牌打三回合，最后由你亲手赢得练习赛。';
   $('guided-voice-status').textContent=sceneReady?'点「开始声画教学」，播放双人原声。':'三维竞技场准备中…';
  }
  return;
 }
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
$('guided-launch').addEventListener('click',()=>{
 const u=new URL(location.href);
 u.searchParams.set('mode','guided');u.searchParams.delete('level');
 location.assign(u.href);
});
$('guided-exit').addEventListener('click',()=>location.assign(freeDuelUrl().href));
// R120: one speaker at a time; subtitles persist even when the player mutes.
// The real Qwen recording is only claimed when an actual file begins to play.
async function guidedSay(key){
 const line=GUIDED_LINES[key];
 if(!line)return;
 guidedVoiceKey=key;
 const panel=$('guided-narration');
 panel.dataset.side=line.side;
 $('guided-speaker').textContent=line.side==='player'?'女决斗者 · 我方出牌讲解':'男决斗者 · 对手回应讲解';
 $('guided-words').textContent=line.text;
 const seconds=audio.playTutorialLine(key);
 $('guided-voice-status').textContent=seconds>0?'原创 Qwen3 人物原声 · 文字同步讲解':
  audio.status().requested?'语音暂不可用 · 请阅读同步文字':'已静音 · 同步文字继续教学';
 // Time the scripted duel by each real recording, not arbitrary card timers.
 const duration=params.get('qa')==='1'&&params.get('guidedQuick')==='1'?180:
  seconds>0?Math.round(seconds*1000)+190:
  Math.max(1300,Math.min(3400,line.text.length*62));
 await new Promise(resolve=>setTimeout(resolve,duration));
}
async function guidedSequence(keys){
 if(!guidedMode)return;
 guidedBusy=true;render();
 try{for(const key of keys)await guidedSay(key);}
 finally{guidedBusy=false;render();}
}
$('guided-begin').addEventListener('click',()=>{
 if(!guidedMode||guidedStarted||!sceneReady||sceneError)return;
 guidedStarted=true;guidedBusy=true;render();
 void (async()=>{
  try{await audio.unlock()}catch(e){console.warn('Tutorial audio will use text-only:',String(e))}
  await guidedSequence(['intro_f','intro_m','prompt_one']);
 })();
});
$('guided-repeat').addEventListener('click',()=>{
 if(!guidedMode||!guidedStarted||guidedBusy||!guidedVoiceKey)return;
 void guidedSequence([guidedVoiceKey]);
});
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
 combatAudioReceipts.clear();
 r121SpokenContacts.clear();r122PlayedCrowdAccidents.clear();
 ++asideSeq;++speechSeq;
 $('comedy-aside').hidden=true;$('spoken-dialogue').hidden=true;
 g=createTutorialGame(level+1,seed+level);
 audio.resetMatch();
 selected=null;lastFightSerial=0;
 hostSpeechTurn.player=-1;hostSpeechTurn.ai=-1;
 render();syncScene();
 announce('开始'+LESSONS[level].title+'：请按底部提示依次出两张卡牌。','selected');
}
$('lesson-next').addEventListener('click',advanceLesson);

function renderGuide(){
 if(guidedMode){
  const state=guidedStatus(g);
  $('guide-step').textContent=state.completed?'恭喜获胜！点击「进入自由对战」继续':
   !guidedStarted?'先点击「开始声画教学」听女玩家和男玩家说明':state.hint;
  return;
 }
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
 if(g.phase==='ended'&&!guidedMode)scheduleResult();
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
  showComedyAside(comedyScript.forCombo(event));
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
let pressurePASpoken=false,openingPASpoken=false;
let resultScheduled=false;
const STADIUM_ANNOUNCER=Object.freeze({
 player:['体育馆广播：本局冠军诞生！获胜方全体注意，立刻跳一段！',
  '体育馆广播：恭喜我方获胜！音乐组注意，操场舞王申请加冕！',
  '体育馆广播：胜利属于这一边！谁还没跳起来？记大过……开玩笑的！'],
 ai:['体育馆广播：对手获胜！请给他们掌声，也请给输家一包纸巾！',
  '体育馆广播：敌方社团获胜！本场最佳表演奖：整个舞蹈队！'],
 draw:['体育馆广播：双方握手言和！奖杯先交给广播站保管！']
});
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
 const ending=comedyScript.outcome(g.winner,g.serial);
 $('result-comic').textContent=ending?.text||'';
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
 // The audience sees an authentic court-wide victory performance first.
 sendScene({type:'ASDC_R112_VICTORY',winner:g.winner||'draw'});
 // Once the old character VO finishes, give the real Qwen gym announcer
 // the microphone. Fallback uses explicitly labeled TEXT, never a fake voice.
 setTimeout(()=>{
  const key=g.winner==='draw'?'draw':'win_'+g.winner;
  if(audio.playPA(key))return;
  const words=STADIUM_ANNOUNCER[g.winner]||STADIUM_ANNOUNCER.draw;
  const line=words[Math.abs(seed+g.serial)%words.length];
  showComedyAside({text:line,side:'center',
   speaker:'体育馆广播 · 赛后文字播报'});
 },320);
 window.setTimeout(showResult,6800);
}
function startRematch(){
 if(g.phase!=='ended')return;
 const target=new URL(location.href);
 // The next seed changes both starting hands and the AI's random sequence.
 target.searchParams.set('seed',String((Math.abs(seed)%2147483646)+1));
 location.assign(target.href);
}
$('result-rematch').addEventListener('click',startRematch);
// Exactly the same seed AND deck preset, same deterministic core.
function sameDuelChallengeUrl(){
 const url=new URL('./',location.href);
 url.search='';url.hash='';
 url.searchParams.set('seed',String(seed));
 if(g.deckPreset!=='classic')url.searchParams.set('deck',g.deckPreset);
 url.searchParams.set('ref','challenge');
 return url.href;
}
async function shareChallenge(){
 const shareUrl=sameDuelChallengeUrl();
 const message='放学后决斗社同局挑战：我打到了第 '+g.round+
  ' 回合，剩余人气 '+g.hp.player+':'+g.hp.ai+
  '。同一副起始牌，敢不敢来比一局？';
 if(navigator.share){
  try{
   await navigator.share({title:'放学后决斗社 · 同局挑战',text:message,url:shareUrl});
   $('result-share-status').textContent='已打开分享面板';return;
  }catch(error){if(error?.name==='AbortError'){
   $('result-share-status').textContent='已取消分享';return;
  }}
 }
 try{
  await navigator.clipboard.writeText(message+' '+shareUrl);
  $('result-share-status').textContent='挑战链接已复制，发给朋友即可';
 }catch{
  const copy=document.createElement('textarea');copy.value=message+' '+shareUrl;
  copy.style.cssText='position:fixed;left:-9999px';
  document.body.append(copy);copy.select();
  const success=document.execCommand('copy');copy.remove();
  $('result-share-status').textContent=success?'挑战链接已复制':'请手动复制地址栏链接';
 }
}
$('result-challenge').addEventListener('click',shareChallenge);
$('result-feedback').addEventListener('click',()=>{
 const issue=new URL('https://github.com/star8592/AfterSchoolDuelClub-Playtest/issues/new');
 issue.searchParams.set('title','[试玩反馈] 第 '+g.round+' 回合 · '+(g.winner||'未结束'));
 issue.searchParams.set('body',['我在《放学后决斗社》玩了一局。',
  '随机牌局种子：'+seed,'最终人气：'+g.hp.player+':'+g.hp.ai,
  '问题/好笑的时刻：','',
  '（GitHub 提交可能需要登录；不要填写私人信息）'].join(String.fromCharCode(10)));
 window.open(issue.href,'_blank','noopener,noreferrer');
});
$('result-review').addEventListener('click',()=>{
 $('result-overlay').hidden=true;
 $('end').focus({preventScroll:true});
});
// R110 short visual-only card entrance. It does not affect engine timings,
 // legal moves, buffs, health, voice, or any input handlers.
let playedArtTimer=null,playedArtSerial=0;
function revealPlayedArt(card,side){
 const node=$('played-card-reveal'),img=$('played-card-image');
 if(!node||!img||!card)return;
 const url=cardArtURL(card.id);
 if(!url)return;
 const serial=++playedArtSerial;
 clearTimeout(playedArtTimer);
 node.dataset.side=side;
 node.classList.remove('played-card-enter');
 node.hidden=false;
 img.src=url;
 $('played-card-kind').textContent=card.kind==='unit'?'人物召唤 · SUMMON':'荒诞事件 · EVENT';
 $('played-card-name').textContent=card.name;
 $('played-card-cost').textContent=card.cost+' 能量 · '+card.id;
 void node.offsetWidth;
 node.classList.add('played-card-enter');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 playedArtTimer=setTimeout(()=>{
  if(serial===playedArtSerial){node.hidden=true;node.classList.remove('played-card-enter')}
 },reduced?1400:2500);
}
// A visually projected physical card from the correct side duelist platform.
// This is a secondary presentation event; it never changes core rules.
function projectPlayedCard(id,side='player',serial=null){
 const card=BY_ID[id];if(!card)return;
 revealPlayedArt(card,side);
 sendScene({type:'ASDC_R46_CARD_PLAY',side,id,name:card.name,
   kind:card.kind,cost:card.cost,serial});
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
 if(guidedMode){
  if(g.guided.completed){if(!guidedBusy)location.assign(freeDuelUrl().href);return;}
  if(selected===null||!cardCanPlay(selected))return;
  const id=g.hand.player[selected],c=BY_ID[id],before=g.serial;
  const result=guidedPlayCard(g,selected,0);
  if(!result.ok){announce('请按教学提示出牌：'+result.reason,'warning');return;}
  selected=null;render();syncScene();
  const played=g.events.findLast(e=>e.type==='card_play'&&e.side==='player'&&e.serial>before);
  audio.playCue(cardSound(c),'player');
  if(played){projectPlayedCard(id,'player',played.serial);
   audio.playComicBeat(c.kind==='unit'?'summon_'+c.style:'spell_'+c.effect,'player',played.serial);
   if(c.kind==='spell')sendSpellImpact(played);
  }
  const step=guidedStatus(g).key;
  const lines=step==='end1'?['played_one','prompt_end_one']:
   step==='end2'?['played_two','prompt_end_two']:
   step==='won'?['victory_f','victory_m']:[];
  if(step==='won'){audio.playCue('win','player');audio.playComicBeat('game_finish','player',g.serial);}
  announce(step==='won'?'恭喜！对手人气归零，真实规则判定你获胜。':
   '已按真实规则打出「'+c.name+'」，听完双方讲解后继续。','played');
  void guidedSequence(lines);
  return;
 }
 if(tutorialMode&&tutorialStatus(g).completed){advanceLesson();return;}
 if(g.phase==='ended'){showResult();return;}
 if(selected===null||!cardCanPlay(selected))return;
 const previousSerial=g.serial;
 const id=g.hand.player[selected],c=BY_ID[id],preHp={...g.hp},
   result=tutorialMode?playTutorialCard(g,selected,0):playCard(g,selected,0);
 if(!result.ok){
  announce('出牌失败：'+result.reason,'warning');render();return;
 }
 const played=g.events.findLast(e=>e.type==='card_play'&&
  e.side==='player'&&e.card===id&&e.serial>previousSerial);
 if(!played)throw Error('Successful play must produce canonical card_play');
 // R121 spells must reach the 3D scene BEFORE removing defeated models
 // from the board; keep the true source rig for its final hit reaction.
 if(c.kind==='spell')sendSpellImpact(played);
 selected=null;
 render();syncScene();
 showComedyAside(c.kind==='unit'?
  comedyScript.forCard(id,played.serial,'player'):
  comedyScript.forSpell(id,played.serial,'player'));
 presentRealCombos(previousSerial);
 audio.playCue(cardSound(c),'player');
 projectPlayedCard(id,'player',played.serial);
 audio.playComicBeat(c.kind==='unit'?'summon_'+c.style:
  'spell_'+c.effect,'player',played.serial);
 audio.playCue('card_flip','player');
 // The host announces once per turn, then the freshly summoned unit gets a
 // distinct entrance sentence. Previously host cast cut off every unit voice.
 sayHostOnce('player');
 if(c.kind==='unit')summonSpeaksAfterGesture(id,played.serial);
 if(c.kind==='spell'){
  const sound={blast:'meteor_impact',confuse:'sonic_wave',buff:'spell_charge',
    repair:'ice_shatter',draw:'card_flip',heal:'shield_block',
    stew:'heal',shield:'shield_block',splash:'sonic_wave',chaos:'sonic_wave',
    banquet:'heal',insight:'card_flip',updraft:'shield_block',reroute:'card_flip',
    boomerang:'spell_charge',eclipse:'sonic_wave',trick:'spell_charge'}[c.effect];
  if(sound){
   if(c.effect==='blast'||c.effect==='confuse')
     setTimeout(()=>audio.playCue(sound,'player'),460);
   else audio.playCue(sound,'player');
  }
  // Host hurt VO is driven by the verified R121 contact receipt.
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
  audio.playComicBeat('game_finish',g.winner==='ai'?'ai':'player',g.serial);
  announce('决斗结束！'+(g.winner==='player'?'你赢了！':'AI 获胜。'),'ended');
 }
});
$('end').addEventListener('click',()=>{
 if(g.phase==='ended'){startRematch();return;}
 if(tutorialMode||!gameReady())return;
 if(guidedMode&&guidedStatus(g).target!==null)return;
 const guidedRound=guidedMode?guidedStatus(g).round:null;
 if(guidedMode)guidedBusy=true;
 audio.playCue('turn');
 const pre=boardSnapshot().units;
 const preHp={...g.hp};
 const serial=g.serial;
 if(guidedMode)guidedEndTurn(g);
 else{endTurn(g);if(g.phase==='playing'&&g.active==='ai')aiTurn(g);}
 const fresh=g.events.filter(e=>e.serial>serial);
 for(const event of fresh){
  if(event.type==='card_play'&&BY_ID[event.card]?.kind==='spell')
   sendSpellImpact(event);
 }
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
    if(!guidedMode)audio.playCharacter(side==='player'?'HOST_PLAYER':'HOST_AI','hurt');
    audio.playCue('score_chime',side);
   },430);
  }
 }
 const summary=stateSummary(fresh);
 for(const event of fresh.filter(e=>e.type==='card_play'&&e.side==='ai').slice(-3)){
  const enemyCard=BY_ID[event.card];
  audio.playCue(enemyCard?.kind==='unit'?'enemy_cast':cardSound(enemyCard),'ai');
  projectPlayedCard(event.card,'ai',event.serial);
  if(enemyCard)audio.playComicBeat(enemyCard.kind==='unit'?
   'summon_'+enemyCard.style:'spell_'+enemyCard.effect,'ai',event.serial);
  showComedyAside(enemyCard?.kind==='unit'?
    comedyScript.forCard(event.card,event.serial,'ai'):
    comedyScript.forSpell(event.card,event.serial,'ai'));
  if(!guidedMode){
   sayHostOnce('ai');
   if(enemyCard?.kind==='unit')summonSpeaksAfterGesture(event.card,event.serial);
  }
  if(enemyCard?.kind==='spell') {
   const fx={blast:'meteor_impact',confuse:'sonic_wave',buff:'spell_charge',
     repair:'ice_shatter',draw:'card_flip',heal:'shield_block',
     stew:'heal',shield:'shield_block',splash:'sonic_wave',chaos:'sonic_wave',
     banquet:'heal',insight:'card_flip',updraft:'shield_block',reroute:'card_flip',
     boomerang:'spell_charge',eclipse:'sonic_wave',trick:'spell_charge'}[enemyCard.effect];
   if(fx){
    if(enemyCard.effect==='blast'||enemyCard.effect==='confuse')
      setTimeout(()=>audio.playCue(fx,'ai'),460);
    else audio.playCue(fx,'ai');
   }
   // Verified contact from the scene owns hurt dialogue, not this timeout.
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
  showComedyAside(comedyScript.reply(clashes[0].side,clashes[0].serial));
  // Qwen3-TTS attack voice only for the actual attacker and when available.
  // The turn can contain many simultaneous exchanges. One intelligible
  // characteristic battle shout is better than three voices interrupting.
  const lead=clashes.find(e=>e.from&&BY_ID[e.from]?.kind==='unit');
  // Character speech now starts at the verified physical impact callback;
  // do not play it prematurely while the 3D body is still preparing to strike.
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
  audio.playComicBeat('game_finish',g.winner==='ai'?'ai':'player',g.serial);
  announce(endText+' '+summary,'ended');
 }else{
  audio.musicForBattle({round:g.round,playerHp:g.hp.player,aiHp:g.hp.ai,
    comboPlayer:g.comboCounts.player,comboAi:g.comboCounts.ai});
  if(!pressurePASpoken&&g.round>=4)
   pressurePASpoken=audio.playPA('pressure');
  announce(summary+'。现在轮到你了。','ai');
 }
 if(guidedMode){
  const sequence=guidedRound===1?['ai_one','round_two']:
   ['exchange_m','ai_two','round_three'];
  void guidedSequence(sequence);
 }
});
const r121SpokenContacts=new Set();
const r122PlayedCrowdAccidents=new Set();
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==scene.contentWindow)return;
 if(event.data?.type==='ASDC_R122_CROWD_ACCIDENT'){
  const d=event.data;
  const match=g.events.find(e=>e.type==='card_play'&&e.serial===d.serial&&
   e.card===d.card&&e.side===d.side&&e.spellOutcome);
  if(!match||r122PlayedCrowdAccidents.has(d.serial))return;
  const canonical=chooseCrowdAccident({
   type:'ASDC_R81_SPELL_RESULT',serial:match.serial,card:match.card,
   side:match.side,effect:match.spellOutcome.effect,
   directDamage:match.spellOutcome.directDamage,
   damage:match.spellOutcome.directDamage+match.spellOutcome.unitDamage
  },{force:new URLSearchParams(location.search).get('qa')==='1'&&
    new URLSearchParams(location.search).get('r122Crowd')==='force'});
  if(!canonical||canonical.scenario!==d.scenario||canonical.line!==d.line||
   canonical.spectatorIndex!==d.spectatorIndex||
   d.gameplayHit!==false||d.ruleDamage!==0)return;
  const prop=resolveSpectatorProp(canonical);
  if(!prop||d.prop!==prop.kind||d.propLine!==prop.line)return;
  r122PlayedCrowdAccidents.add(d.serial);
  if(r122PlayedCrowdAccidents.size>400)r122PlayedCrowdAccidents.clear();
  const pitch=.86+(canonical.spectatorIndex%4)*.13;
  audio.playCrowdYelp(d.scenario,d.spectatorIndex,d.serial);
  audio.playCue('r102_crowd_gasp',d.spectatorIndex<2?'player':'ai',
   {rate:pitch,gainScale:.85});
  audio.playCue(d.scenario==='shockwave'?'r102_paper_flap':
   d.scenario==='ricochet'?'r102_rubber_squeak':
   d.scenario==='overshoot'?'r102_spring_boing':'r102_chalk_snap',
   d.spectatorIndex<2?'player':'ai',{rate:1.02,gainScale:.6,delay:.12});
  showComedyAside({text:'看台意外！'+prop.caption+'。'+prop.line,
   side:'center',speaker:'看台现场 · 搞笑吐槽字幕'});
  const matchGame=g,incidentSerial=d.serial;
  // A dead-simple event-bound postscript: does not run after rematch or
  // victory, and never cuts off the fighter's own recorded voice.
  // A real M01 music teacher (not a generic PA persona) steps forward
  // after the first student scream. The speaker line is Qwen-recorded,
  // and the soundtrack is queued behind the fighter's own speech.
  setTimeout(()=>{
   if(g!==matchGame||g.phase==='ended'||!sceneReady||
    !r122PlayedCrowdAccidents.has(incidentSerial))return;
   audio.playTeacherOrder(prop.kind==='homework'?'paper':'order');
  },2450);
  setTimeout(()=>{
   if(g!==matchGame||g.phase==='ended'||!sceneReady||
    !r122PlayedCrowdAccidents.has(incidentSerial))return;
   if(!audio.playPropPA(prop.kind)){
    showComedyAside({text:'体育馆广播：'+prop.caption,
     side:'center',speaker:'看台广播 · 文字'});
   }
  },7600);

  return;
 }
 if(event.data?.type==='ASDC_R121_SPELL_CONTACT'){
  const d=event.data;
  const match=g.events.find(e=>e.type==='card_play'&&e.serial===d.serial&&
   e.card===d.card&&e.side===d.caster);
  const outcome=match?.spellOutcome;
  if(!outcome||CARD_ELEMENTS[d.card]!==d.element||
    d.victim!==(d.caster==='player'?'ai':'player')||
    d.directDamage!==outcome.directDamage||d.unitDamage!==outcome.unitDamage||
    r121SpokenContacts.has(d.serial))return;
  r121SpokenContacts.add(d.serial);
  if(r121SpokenContacts.size>500)r121SpokenContacts.clear();
  const hasHit=d.directDamage>0||d.unitDamage>0;
  if(hasHit){
   audio.playCue(ELEMENTS[d.element]?.sound||'hit',d.victim,{gainScale:.80});
   if(!guidedMode){
    if(d.directDamage>0){
     audio.playCharacter(d.victim==='player'?'HOST_PLAYER':'HOST_AI','hurt');
    }else if(Array.isArray(d.targetIds)&&d.targetIds.length){
     // A summoned source GLB is not a human voice; use its authored
     // Qwen file when present, otherwise the actual side's host line.
     if(!audio.playCharacter(d.targetIds[0],'hurt'))
      audio.playCharacter(d.victim==='player'?'HOST_PLAYER':'HOST_AI','hurt');
    }
   }
  }
  return;
 }
 if(event.data?.type==='ASDC_R45_SCENE_READY'){
  sceneReady=true;sceneError=false;
  syncScene();
  sendScene({type:'ASDC_R53_HP_MODE',mode:hpViewModes[hpViewIndex]});
  render(); // enable legal cards only after authentic GLB/VRM readiness
  // One locally recorded PA opening if the browser permitted auto-audio.
  // If restricted, no browser TTS substitute or extra setup prompt.
  if(!guidedMode)setTimeout(()=>{
   if(!openingPASpoken)openingPASpoken=audio.playPA('start');
  },750);
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
   // Additional authored, layered sounds only on the verified R100
   // actual 3D impact frame; skip-before-impact stays completely silent.
   audio.playComicBeat('combo_'+effect,side,serial);
  }
  return;
 }
 if(event.data?.type==='ASDC_R112_DIALOGUE'){
  // Ignore the ordinary ambient 3D social barks during the voiced tutorial.
  if(guidedMode)return;
  const line=event.data;
  if(['player','ai'].includes(line.side)&&
    typeof line.text==='string'&&line.text.length<=120)
  {
   if(!audio.playSocialLine(line.side,line.text))
    showComedyAside({text:line.text,side:line.side,
     speaker:(line.side==='player'?'我方':'对方')+'决斗者 · 场边小声对话'});
  }
  return;
 }
 if(event.data?.type==='ASDC_R102_COMBAT_IMPACT'){
  const {serial,side,effect}=event.data;
  const real=g.events.find(e=>e.serial===serial&&e.side===side&&
   (e.type==='exchange'||e.type==='direct_hit'));
  if(real&&effect===(real.type==='direct_hit'?'direct_hit':'actual_exchange')&&
   !combatAudioReceipts.has(serial)){
   combatAudioReceipts.add(serial);
   audio.playComicBeat(effect,side,serial);
   // R117: the on-stage kinetic event, not the turn button, starts
   // the character's ACTUAL recorded attack line. One line per real hit;
   // the two 3D participants remain the authoritative visible actors.
   if(!guidedMode&&typeof real.from==='string'&&BY_ID[real.from]?.kind==='unit')
    audio.playCharacter(real.from,'attack');
   audio.playCue(effect==='direct_hit'?'hit':'attack',side);
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
// R107: keep the heavy 3D stage mounted while switching a themed 40-card
// deck. This resets the actual deterministic engine and clears stale effects.
const deckSelector=$('deck-select');
deckSelector.value=activeDeck;
deckSelector.disabled=tutorialMode||guidedMode;
deckSelector.title=guidedMode?'先完成三回合入门实战，再选择自由对战卡组':
 tutorialMode?'连携试炼使用基础卡组':'切换会重新开局，三维模型无需再次下载';
deckSelector.addEventListener('change',()=>{
 if(tutorialMode||guidedMode)return;
 const next=deckSelector.value;
 if(!Object.hasOwn(DECK_PRESETS,next))return;
 g=createGame(seed,next);
 audio.resetMatch();
 resultScheduled=false;
 $('result-overlay').hidden=true;
 ++asideSeq;++speechSeq;
 $('comedy-aside').hidden=true;$('spoken-dialogue').hidden=true;
 selected=null;lastFightSerial=0;
 comboAudioReceipts.clear();combatAudioReceipts.clear();
 r121SpokenContacts.clear();r122PlayedCrowdAccidents.clear();
 hostSpeechTurn.player=-1;hostSpeechTurn.ai=-1;
 sendScene({type:'ASDC_R100_COMBO_RESET'});
 const url=new URL(location.href);
 if(next==='classic')url.searchParams.delete('deck');
 else url.searchParams.set('deck',next);
 history.replaceState(null,'',url.href);
 render();syncScene();
 announce('已切换「'+DECK_PRESETS[next].name+'」：真正的 40 张主题卡组已重新洗牌。','selected');
});
// R107 card encyclopedia is on demand; 60 record thumbnails are NOT
// additional GLB asset downloads, with source/licensing left distinct.
const library=$('card-library'),libraryCards=$('library-cards');
const libraryFilters=$('library-filters');
const categories=['全部','近期热梗','经典社团','黑暗食堂','教室怪谈','社团实验','体育荒诞','时空校园'];
let libraryFilter='全部';
for(const name of categories){
 const btn=$make('button',null,name);
 btn.type='button';btn.dataset.category=name;
 btn.addEventListener('click',()=>{
  libraryFilter=name;
  libraryFilters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
  paintLibrary();
 });
 libraryFilters.append(btn);
}
function paintLibrary(){
 const cards=CARDS.filter(c=>libraryFilter==='近期热梗'?!!c.trend:libraryFilter==='全部'||
  (libraryFilter==='经典社团'?!c.theme:c.theme===libraryFilter));
 libraryFilters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',
  String(b.dataset.category===libraryFilter)));
 $('library-count').textContent='显示 '+cards.length+' / '+CARDS.length+' 张 · '+
  cards.filter(c=>c.kind==='unit').length+' 张人物 · '+
  cards.filter(c=>c.kind==='spell').length+' 张事件';
 const result=document.createDocumentFragment();
 for(const c of cards){
  const box=$make('article','library-tile '+c.style+(c.trend?' fresh-meme':''));
  const head=$make('div','library-tile-head');
  head.append($make('span',null,(c.trend?'近期热梗 · ':'')+(c.theme||'经典社团')+' · '+(c.kind==='unit'?'人物':'事件')),
    $make('b',null,String(c.cost)));
  const art=$make('div','library-tile-art');
  const artwork=cardArtURL(c.id);
  if(artwork){
   const img=$make('img','library-tile-image');
   img.src=artwork;img.alt='';img.width=620;img.height=780;
   img.loading='lazy';img.decoding='async';art.append(img);
   box.dataset.art='illustrated';
  }else{
   const span=$make('span','library-art-pending','独立插画制作中');
   art.append(span);box.dataset.art='pending';
  }
  box.tabIndex=0;box.setAttribute('role','button');
  box.setAttribute('aria-label','放大查看 '+c.name);
  box.addEventListener('click',()=>showCardArtDetail(c));
  box.addEventListener('keydown',e=>{
   if(e.key==='Enter'||e.key===' '){e.preventDefault();showCardArtDetail(c)}
  });
  box.append(head,art,$make('h3',null,c.name),$make('p',null,c.line),
    $make('strong','library-effect',describeCard(c)));
  result.append(box);
 }
 libraryCards.replaceChildren(result);
}
// The zoom dialog is independent of the active battle and never mutates rules.
const artDetail=$make('div','card-zoom');
artDetail.hidden=true;
artDetail.setAttribute('role','dialog');
artDetail.setAttribute('aria-modal','true');
artDetail.setAttribute('aria-label','卡牌高清图');
document.body.append(artDetail);
let artDetailReturnFocus=null;
function closeCardArtDetail(){
 if(artDetail.hidden)return;
 artDetail.hidden=true;artDetail.replaceChildren();
 artDetailReturnFocus?.focus?.({preventScroll:true});
}
function showCardArtDetail(c){
 if(!c)return;
 artDetailReturnFocus=document.activeElement;
 artDetail.replaceChildren();
 const panel=$make('section','card-zoom-panel '+c.style);
 const close=$make('button','card-zoom-close','✕ 关闭');
 close.type='button';close.addEventListener('click',closeCardArtDetail);
 const picture=$make('figure','card-zoom-picture');
 const src=cardArtURL(c.id);
 if(src){
  const img=$make('img','card-zoom-image');
  img.src=src;img.alt=c.name+'的独立插画';img.width=620;img.height=780;
  img.decoding='async';picture.append(img);
 }else picture.append($make('span','card-zoom-unfinished','本卡独立插画仍在制作中'));
 const body=$make('div','card-zoom-copy');
 body.append($make('span',null,c.id+' · '+(c.theme||'经典社团')+' · '+c.cost+' 能量'),
  $make('h2',null,c.name),$make('p',null,c.line),
  $make('strong',null,describeCard(c)));
 panel.append(close,picture,body);artDetail.append(panel);
 artDetail.hidden=false;close.focus({preventScroll:true});
}
artDetail.addEventListener('click',e=>{if(e.target===artDetail)closeCardArtDetail()});
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!artDetail.hidden){e.preventDefault();closeCardArtDetail()}
});
$('card-selected-art').addEventListener('click',()=>{
 const id=selected!==null?g.hand.player[selected]:g.hand.player[0];
 if(id)showCardArtDetail(BY_ID[id]);
});
$('card-library-open').addEventListener('click',()=>{
 library.hidden=false;libraryFilter='全部';paintLibrary();
 $('card-library-close').focus({preventScroll:true});
});
$('card-library-close').addEventListener('click',()=>library.hidden=true);
library.addEventListener('click',e=>{if(e.target===library)library.hidden=true});
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!library.hidden){library.hidden=true;e.preventDefault();}
});
render();
announce(guidedMode?'三回合真实练习赛：点击上方「开始声画教学」，女玩家教你出牌，男玩家演示回应。':
 '开始决斗：你在左，对手在右；选牌并按「出牌」，召唤物会进入同一个三维体育馆。');
if(new URLSearchParams(location.search).get('qa')==='1'){
 Object.defineProperty(window,'__r45QA',{value:{
  get tutorial(){return tutorialStatus(g)},
  get guided(){return guidedMode?{...guidedStatus(g),started:guidedStarted,busy:guidedBusy,voiceKey:guidedVoiceKey}:null},
  get board(){return structuredClone(g.board)},
  get round(){return g.round},
  get hp(){return {...g.hp}},
  get energy(){return {...g.energy}},
  get hand(){return [...g.hand.player]},
  get phase(){return g.phase},
  get sceneReady(){return sceneReady},
  get sceneError(){return sceneError},
  get cardCount(){return Object.keys(BY_ID).length},
  get deckPreset(){return g.deckPreset},
  get deckTotal(){return g.deck.player.length+g.hand.player.length+g.discard.player.length+g.board.player[0].length},
  get events(){return structuredClone(g.events)},
  get selected(){return selected},
  get lastFightSerial(){return lastFightSerial},
  get audio(){return audio.status()},
  get comedy(){return{lastQwenSubtitle,spokenSubtitleCount,
    asideHistory:[...asideHistory],allTextLines:
      Object.values(COMIC_ASIDE_LINES).reduce((n,lines)=>n+lines.length,0)}},

  audioVoiceSample(id,kind='enter'){return audio.playCharacter(id,kind)},
  audioPASample(key){return audio.playPA(key)},
  audioSocialSample(side,text){return audio.playSocialLine(side,text)}
 }});
}
