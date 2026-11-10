import {describeCombatR40} from '../src/combat-feedback-r40.mjs';
import {createGame,playCard,endTurn,aiTurn,simulate,CARDS} from '../src/core.mjs';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
function simulated(seed,id){
 const game=createGame(seed);
 const index=game.hand.player.indexOf(id);if(index<0)throw Error('missing card '+id);
 if(!playCard(game,index,0).ok)throw Error('invalid deployment');
 endTurn(game);if(game.active==='ai')aiTurn(game);
 const prev=game.serial;endTurn(game);
 const e=game.events.find(e=>e.serial>prev&&['exchange','direct_hit'].includes(e.type)&&e.from===id&&e.side==='player');
 if(!e)throw Error('no matching attack');
 return{game,e};
}
const ex=simulated(5,'E02'),hit=simulated(4,'E02');
const a=describeCombatR40(ex.e),b=describeCombatR40(hit.e);
if(!a||a.actor!=='拐弯纸飞机'||a.target!=='食堂隐藏菜单'||a.damage!==2||a.retaliation!==3||!a.exchange)throw Error('exchange calculation is wrong');
if(!b||b.target!=='对方人气'||b.damage!==2||b.exchange||b.counterLabel)throw Error('direct hit calculation is wrong');
if(describeCombatR40({type:'exchange',serial:8,side:'ai',lane:12,from:'E02',to:'T02',damage:9})!==null)throw Error('invalid lane accepted');
if(describeCombatR40({...ex.e,to:'M01'})!==null)throw Error('unknown card accepted');
const sim={player:0,ai:0,draw:0};
for(let seed=1;seed<=120;seed++)for(const s of ['first','last']){
 const result=simulate(seed,s);
 if(result.phase!=='ended')throw Error('game stuck seed '+seed);
 sim[result.winner]++;
}
const result={passed:true,totalCards:CARDS.length,completedGames:240,winners:sim,exchange:a,directHit:b,invalidCasesRejected:2};
writeFileSync(resolve(import.meta.dirname,'evidence/r42-core-240-proof.json'),JSON.stringify(result,null,2)+'\n');
console.log('R42_CORE_240_AND_EVENT_TEST',JSON.stringify(result));
