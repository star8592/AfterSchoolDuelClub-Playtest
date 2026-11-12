/** Real deterministic engine exercises: never rewrite official damage or
 * expose an artificial special gameplay rule. Exact source cards and action
 * functions are imported from the current game.
 */
import {BY_ID,createGame,playCard,endTurn,legalMoves} from '../engine.mjs';
export const TRIALS=Object.freeze([
 {id:'cost',name:'认识能量',short:'第一课 · 选牌与费用',number:'01',
  story:'放学铃一响，迟到的社员就冲向体育馆。先看左上角的费用，再派他上场。',
  task:'找出「铃声追不上」，花费 1 点能量让他真正进入中央竞技场。',
  tip:'每张卡左上角是费用。你的能量够，才可以打出；人物上场后需要等到下一个自己的回合才会攻击。',
  cards:['E01','G02'],energy:2,setup:[],target:'E01',action:'play',
  success:'人物真实上场了！你花掉了 1 点能量。刚召唤的社员先待命，下一次轮到你时才攻击。'},
 {id:'spell',name:'事件加成',short:'第二课 · 事件牌',number:'02',
  story:'队友已经站稳。突然有人喊加油，整间体育馆都开始震动。',
  task:'使用「超速呐喊」这张事件牌，亲手让已有角色获得真实攻击加成。',
  tip:'事件牌不需要召唤到场上，出牌后立即按说明结算。注意：加成只会给己方第一名角色。',
  cards:['E05','T03'],energy:2,setup:['E01'],target:'E05',action:'play',
  success:'事件牌生效！场上的「铃声追不上」攻击力真实增加了 2 点。'},
 {id:'attack',name:'结束回合',short:'第三课 · 真实攻击',number:'03',
  story:'你的社员已经准备完毕，对手还没来得及安排守卫。轮到你决定何时交棒。',
  task:'点击「结束回合」，看人物依照原规则自动攻击对手人气。',
  tip:'人物不是放上来就立刻打人；上一轮就已在场的角色会在你的回合结束时攻击。此关开局预置了上一轮已经上场的真正人物牌。',
  cards:['G05','T05'],energy:2,setup:['E01'],target:null,action:'end',
  success:'这一击是真实引擎计算的人气伤害，双方血量不是动画编出来的。'},
 {id:'combo',name:'双风格连携',short:'第四课 · 校园奇招',number:'04',
  story:'运动员和橡皮筋建筑师决定联手。没想到连携竟然变成了一枚飞出去的粉笔！',
  task:'依次使用「铃声追不上」（活力）与「橡皮筋建筑师」（创意），打出真实粉笔连携。',
  tip:'一方首次使用两种不同风格，便触发一次组合技：活力+创意=粉笔，活力+默契=广播，创意+默契=招新海报。同一方每局只触发一次。',
  cards:['E01','G01'],energy:2,setup:[],target:'E01',action:'double',
  success:'真正的粉笔连携已触发！敌方场上无人，按真实规则直接扣除对手 1 点人气。'}
]);
function takeFromDeck(g,side,id){
 for(const stack of [g.hand[side],g.deck[side]]){
  const i=stack.indexOf(id);
  if(i>=0)return stack.splice(i,1)[0];
 }
 throw Error('Trial card missing from official true deck: '+id);
}
export function createTrial(level=0){
 const t=TRIALS[level];if(!t)throw Error('Unknown training trial '+level);
 const game=createGame(31702+level);
 const selected=t.cards.map(id=>takeFromDeck(game,'player',id));
 game.hand.player.splice(0,game.hand.player.length,...selected);
 for(const id of t.setup){
  takeFromDeck(game,'player',id);
  const card=BY_ID[id];
  game.board.player[0].push({uid:'R103_TRAINING_'+id,id,style:card.style,
   attack:card.attack,hp:card.hp,buff:0,shield:0,summonedAt:0});
 }
 game.energy.player=t.energy;
 return {game,step:0,completed:false,result:null,level};
}
export function trialStatus(session){
 const {game,level,step,completed}=session,t=TRIALS[level];
 const target=t.action==='double'?t.cards[Math.min(step,1)]:t.target;
 return {level,step,completed,title:t.name,target,legal:legalMoves(game).map(m=>m.id),
  energy:game.energy.player,hp:{...game.hp},board:game.board.player[0].map(x=>({...x})),
  events:[...game.events],turn:game.active};
}
export function actTrial(session,{cardId=null,end=false}={}){
 const {game,level}=session,t=TRIALS[level];
 if(session.completed)return {ok:false,reason:'已经通关'};
 if(t.action==='end'){
  if(!end)return {ok:false,reason:'这关请点击结束回合'};
  const before=game.hp.ai,r=endTurn(game);
  const actual=game.events.find(e=>e.type==='direct_hit'&&e.side==='player');
  if(!r.ok||!actual||game.hp.ai>=before)throw Error('Real end turn attack did not occur');
  session.completed=true;
  session.result={type:'direct_hit',damage:before-game.hp.ai,serial:actual.serial};
  return {ok:true,completed:true,...session.result};
 }
 if(end)return {ok:false,reason:'请先打出本关指定的卡牌'};
 const required=t.action==='double'?t.cards[session.step]:t.target;
 if(cardId!==required)return {ok:false,reason:'本关请先打出「'+BY_ID[required].name+'」'};
 const index=game.hand.player.indexOf(required);
 if(index<0||!legalMoves(game).some(m=>m.index===index))
  return {ok:false,reason:'规则不允许打出这张卡'};
 const old=game.serial,prevAtk=game.board.player[0][0]?.buff||0;
 const result=playCard(game,index,0);
 if(!result.ok)return result;
 const cardEvent=game.events.find(e=>e.type==='card_play'&&e.serial>old&&e.card===required);
 if(!cardEvent)throw Error('Trial play not backed by canonical card_play');
 session.step++;
 if(t.id==='cost'){
  session.completed=game.board.player[0].some(u=>u.id==='E01');
 }else if(t.id==='spell'){
  session.completed=game.board.player[0][0]?.buff===prevAtk+2&&
   cardEvent.spellOutcome?.effect==='buff';
 }else if(t.id==='combo'&&session.step===2){
  const combo=game.events.find(e=>e.type==='combo_effect'&&e.serial>old);
  if(!combo||combo.effect!=='chalk_direct'||combo.damage!==1)
   throw Error('Trial requires actual engine chalk_direct for empty enemy field');
  session.completed=true;
 }
 if(session.completed){
  session.result={type:t.id,serial:cardEvent.serial,card:required,
   energyLeft:game.energy.player,hp:{...game.hp}};
 }
 return{ok:true,completed:session.completed,event:cardEvent,...session.result};
}
