import assert from 'node:assert/strict';
import {DECK_PRESETS,createGame,playCard} from '../engine.mjs';
import {LESSONS,createTutorialGame,tutorialStatus,tutorialCanPlay,playTutorialCard} from '../tutorial.mjs';

let checks=0,scenarios=0;
function assertCheck(value,message){assert.ok(value,message);checks++;}
for(let seed=1;seed<=100;seed++)for(let level=1;level<=LESSONS.length;level++){
 const orig=createGame(seed);
 const game=createTutorialGame(level,seed);
 const lesson=LESSONS[level-1];
 assertCheck(game.board.ai[0].length===1&&game.board.ai[0][0].id===lesson.foe,'genuine staged foe');
 // Exactly 2 copies of each card, each side, before any action:
 for(const side of ['player','ai']){
  const counts=new Map;
  for(const id of [...game.deck[side],...game.hand[side],...game.board[side][0].map(x=>x.id)])
   counts.set(id,(counts.get(id)||0)+1);
  assertCheck(DECK_PRESETS.classic.cards.every(id=>counts.get(id)===2)&&
   [...counts.values()].reduce((a,b)=>a+b,0)===40,'no ghost or missing classic cards '+side);
 }
 assertCheck(game.hand.player[0]===lesson.cards[0]&&game.hand.player[1]===lesson.cards[1],'actual required cards in hand');
 assertCheck(tutorialStatus(game).step===0,'lesson starts step zero');
 assertCheck(tutorialCanPlay(game,0)&&!tutorialCanPlay(game,1),'cannot skip current skill card');
 const premature=playTutorialCard(game,1,0);
 assertCheck(!premature.ok&&!game.events.some(e=>e.type==='combo_effect'),'wrong order is refused');
 assertCheck(playTutorialCard(game,0,0).ok,'first actual legal card');
 assertCheck(tutorialStatus(game).step===1&&!tutorialStatus(game).completed,'first step state');
 assertCheck(playTutorialCard(game,0,0).ok,'second actual legal card');
 const status=tutorialStatus(game),combo=game.events.findLast(x=>x.type==='combo_effect');
 assertCheck(status.completed&&status.result.serial===combo.serial&&combo.effect===lesson.effect,'real engine combo event');
 assertCheck(game.energy.player>=1&&game.comboCounts.player===1,'real refund and combo tally');
 assertCheck(!tutorialCanPlay(game,0),'no extra card after lesson done');
 assertCheck(game.hp.player===orig.hp.player,'no scripted damage to player');
 if(level===1){
  assertCheck(combo.damage===2&&combo.defeated&&game.board.ai[0].length===0,'real chalk hit defeated T01');
 }else if(level===2){
  assertCheck(combo.draw===1&&game.board.ai[0].length===1,'real broadcast draw without fake lane movement');
 }else{
  assertCheck(combo.shield===2&&game.board.player[0][0].shield===2,'real poster shield is present on engine unit');
 }
 scenarios++;
}
assertCheck(LESSONS.length===3,'exactly 3 original tutorial chapters');
console.log(JSON.stringify({passed:true,scenarios,assertions:checks,description:'3 actual single-arena combos, deck conservation, order guard, shield/damage/draw'}));
