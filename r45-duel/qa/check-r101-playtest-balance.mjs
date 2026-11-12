import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {CARDS,simulate} from '../engine.mjs';
const seedCount=2500;
const report={schema:'R101_PLAYTEST_BALANCE_1',seedCount,cardKinds:{
 total:CARDS.length,unit:CARDS.filter(c=>c.kind==='unit').length,
 spell:CARDS.filter(c=>c.kind==='spell').length},strategies:{}};
for(const strategy of ['first','last']){
 const wins={player:0,ai:0,draw:0},rounds=[],combos={};
 const targetPlayed=new Map(CARDS.map(c=>[c.id,0]));
 for(let seed=1;seed<=seedCount;seed++){
  const g=simulate(seed,strategy);
  if(!['player','ai','draw'].includes(g.winner))throw Error('Missing winner seed '+seed);
  wins[g.winner]++;
  rounds.push(g.round);
  for(const e of g.events){
   if(e.type==='combo_effect')combos[e.effect]=(combos[e.effect]||0)+1;
   if(e.type==='card_play')targetPlayed.set(e.card,(targetPlayed.get(e.card)||0)+1);
  }
 }
 const sorted=[...targetPlayed].sort((a,b)=>b[1]-a[1]);
 report.strategies[strategy]={
  wins,meanRound:Math.round(100*rounds.reduce((a,b)=>a+b,0)/rounds.length)/100,
  medianRound:rounds.sort((a,b)=>a-b)[Math.floor(rounds.length/2)],
  comboEffects:combos,
  highestCards:sorted.slice(0,6).map(([id,count])=>({id,count})),
  leastCards:sorted.slice(-6).map(([id,count])=>({id,count}))};
}
const out=resolve(import.meta.dirname,'evidence/r101');
mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,'r101-repeat-play-baseline.json'),JSON.stringify(report,null,2));
console.log('R101_5000_DETERMINISTIC_MATCHES',JSON.stringify(report));
if(report.cardKinds.total!==20||report.cardKinds.unit!==14||report.cardKinds.spell!==6)
 process.exitCode=6;
