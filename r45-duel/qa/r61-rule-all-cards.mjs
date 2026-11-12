/**
 * R61 deterministic core check. Real game rules, no synthetic renderer counts:
 * every unit enters the authoritative board, every spell emits card_play and
 * settles its actual specific effect without touching Three.js state.
 */
import {CARDS,BY_ID,createGame,playCard,MAX_HP} from '../engine.mjs';
const checks=[];
for(const c of CARDS){
 const g=createGame(41);
 g.hand.player.unshift(c.id);
 g.energy.player=9;
 g.stylesPlayed.player=[];
 g.comboTriggered.player=false;
 g.hp.player=10;g.hp.ai=14;
 g.board.player[0]=[
  {uid:'U901',id:'E01',style:'ember',attack:2,hp:1,buff:0,shield:0,summonedAt:0}
 ];
 g.board.ai[0]=[
  {uid:'U902',id:'G01',style:'grove',attack:1,hp:5,buff:0,shield:0,summonedAt:0}
 ];
 const pre={hand:g.hand.player.length,energy:g.energy.player,playerHp:g.hp.player,aiHp:g.hp.ai,
  ally:g.board.player[0][0].hp,foe:g.board.ai[0][0].hp,allyBuff:g.board.player[0][0].buff};
 const result=playCard(g,0,0);
 const play=g.events.filter(x=>x.type==='card_play').at(-1);
 const actuallySpawned=c.kind==='unit'&&g.board.player[0].some(x=>x.id===c.id);
 const effects={
   buff:g.board.player[0][0].buff>pre.allyBuff,
   blast:g.hp.ai<pre.aiHp,
   repair:g.board.player[0][0].hp>pre.ally,
   draw:g.hand.player.length>pre.hand-1,
   heal:g.hp.player>pre.playerHp,
   confuse:g.board.ai[0][0]?.hp<pre.foe || g.board.ai[0].length===0,
   stew:g.hp.player>pre.playerHp&&g.hp.ai<pre.aiHp,
   shield:(g.board.player[0][0]?.shield||0)>0,
   splash:g.board.ai[0][0]?.hp<pre.foe,
   chaos:g.board.ai[0][0]?.attack<1,
   banquet:g.hp.player>pre.playerHp,
   insight:g.hand.player.length>=pre.hand-1,
   updraft:g.board.player[0][0].attack>2,
   reroute:g.hand.player.length>pre.hand-1,
   boomerang:g.board.ai[0][0]?.hp<pre.foe,
   eclipse:g.hp.player>pre.playerHp,
   trick:g.board.ai[0][0]?.hp<pre.foe
 };
 const pass=result.ok&&play?.card===c.id&&g.energy.player===pre.energy-c.cost+(c.effect==='insight'?1:0)&&
  (c.kind==='unit'?actuallySpawned:effects[c.effect]);
 const row={id:c.id,kind:c.kind,cost:c.cost,pass,actuallySpawned,
  effect:c.kind==='spell'?c.effect:null,ruleEvent:play?.card};
 checks.push(row);
 console.log('R61_RULE_CARD_GATE',JSON.stringify(row));
}
const passed=checks.filter(x=>x.pass).length;
console.log('R107_RULE_60_TOTAL',JSON.stringify({passed,total:checks.length,units:checks.filter(x=>x.kind==='unit').length,spells:checks.filter(x=>x.kind==='spell').length}));
if(passed!==60)process.exitCode=3;
