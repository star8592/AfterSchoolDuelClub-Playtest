/**
 * R98 — Three playable original campus comedy lessons for the ONE arena.
 * Historic V0.5 three-lane source is research only. These lessons stage real
 * cards from the real R97 deck and require actual engine combo_effect events.
 * No custom attack arithmetic, phantom damage, or ghost cards.
 */
import {BY_ID,createGame,playCard} from './engine.mjs';

export const LESSONS=Object.freeze([
 Object.freeze({
  id:'chalk',title:'第 1 关 · 粉笔弹射',
  story:'风纪委员守住了体育馆入口。把活力与创意组合起来，打出出乎意料的一击！',
  cards:Object.freeze(['E01','G01']),foe:'T01',effect:'chalk_hit',
  steps:Object.freeze([
   '① 点击「铃声追不上」并出牌：先让活力社员入场。',
   '② 点击「橡皮筋建筑师」并出牌：触发真实的粉笔弹射连携。'
  ]),
  success:'粉笔弹射命中！伤害直接由规则结算，敌方格挡或被击倒都会如实显示。'
 }),
 Object.freeze({
  id:'broadcast',title:'第 2 关 · 广播室串台',
  story:'放学广播突然串了频道。用活力加默契获得额外一张牌，补足下一步策略。',
  cards:Object.freeze(['E01','T01']),foe:'G01',effect:'broadcast_draw',
  steps:Object.freeze([
   '① 点击「铃声追不上」并出牌：先打出活力风格。',
   '② 点击「迟到的播音员」并出牌：广播连携会真实补抽一张牌。'
  ]),
  success:'广播连携成功！一个竞技场里不会虚构跨走廊转移，实际规则是补抽 1 张牌。'
 }),
 Object.freeze({
  id:'poster',title:'第 3 关 · 招新海报',
  story:'社团招新海报飘进体育馆。用创意加默契给己方前排套上真实护盾。',
  cards:Object.freeze(['G01','T01']),foe:'E01',effect:'poster_shield',
  steps:Object.freeze([
   '① 点击「橡皮筋建筑师」并出牌：建立己方前排。',
   '② 点击「迟到的播音员」并出牌：让前排实际获得 2 点护盾。'
  ]),
  success:'招新海报护盾成功！角色获得的护盾是真实规则数据，不是画面里假装变强。'
 })
]);

function takeExisting(game,side,id){
 for(const cards of [game.hand[side],game.deck[side]]){
  const index=cards.indexOf(id);
  if(index>=0)return cards.splice(index,1)[0];
 }
 throw Error('Missing actual deck card: '+id);
}
export function createTutorialGame(level=1,seed=20261112){
 if(!Number.isInteger(level)||level<1||level>LESSONS.length)throw Error('Unknown lesson '+level);
 const lesson=LESSONS[level-1],game=createGame(seed);
 const selected=lesson.cards.map(id=>takeExisting(game,'player',id));
 game.hand.player.unshift(...selected); // both are from the 40-card classic preset deck
 // Scripted starting opponent is removed from its actual deck/hand first.
 const foe=takeExisting(game,'ai',lesson.foe),card=BY_ID[foe];
 game.board.ai[0].push({uid:'U'+(level*1000-1),id:foe,style:card.style,
  attack:card.attack,hp:card.hp,buff:0,shield:0,summonedAt:0});
 game.tutorial={level,id:lesson.id,step:0,completed:false,result:null};
 return game;
}
export function tutorialStatus(game){
 const t=game.tutorial;
 if(!t)return null;
 const lesson=LESSONS[t.level-1];
 if(!lesson)throw Error('Unexpected lesson state');
 return{...lesson,level:t.level,step:t.step,completed:t.completed,
  target:t.completed?null:lesson.cards[t.step],result:t.result};
}
export function tutorialCanPlay(game,index){
 const t=tutorialStatus(game);
 return !t||(!t.completed&&game.active==='player'&&
  game.hand.player[index]===t.target&&index===game.hand.player.indexOf(t.target));
}
export function playTutorialCard(game,index,lane=0){
 const t=tutorialStatus(game);
 if(!t)return playCard(game,index,lane);
 if(t.completed)return {ok:false,reason:'本关已完成，请进入下一关'};
 const id=game.hand.player[index];
 if(!tutorialCanPlay(game,index)||lane!==0)return {ok:false,reason:'请按教学顺序出牌'};
 const result=playCard(game,index,0);
 if(!result.ok)return result;
 game.tutorial.step++;
 if(game.tutorial.step===2){
  const combo=game.events.findLast(e=>e.type==='combo_effect'&&e.side==='player');
  if(!combo||combo.effect!==t.effect)
   throw Error('Tutorial must be backed by a real '+t.effect+' event');
  game.tutorial.completed=true;
  game.tutorial.result={effect:combo.effect,serial:combo.serial,
   damage:combo.damage||0,blocked:combo.blocked||0,shield:combo.shield||0,
   draw:combo.draw||0,defeated:!!combo.defeated};
 }
 return result;
}
