import {CARDS,simulate,MAX_TURNS} from '../src/core.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const uniq=[...new Set(CARDS.map(x=>x.id))];
if(CARDS.length!==18||uniq.length!==18)throw Error('R39_CARD_ID_INTEGRITY_FAIL');
let count=0,winners={player:0,ai:0,draw:0},maxRound=0;
for(let seed=1;seed<=120;seed++){
 for(const strategy of ['first','last']){
  const g=simulate(seed,strategy);
  if(g.phase!=='ended')throw Error('CORE_STUCK_'+seed);
  if(!['ai','player','draw'].includes(g.winner))throw Error('BAD_WINNER_'+seed);
  if(g.round>MAX_TURNS)throw Error('OVER_TURN_LIMIT_'+seed);
  winners[g.winner]++;count++;maxRound=Math.max(g.round,maxRound);
 }
}
const proof={ruleEngine:'R25 unchanged core.mjs',count,uniqueCardIDs:uniq.length,cardTotal:CARDS.length,maxRound,maxTurns:MAX_TURNS,winners,
  methodology:'Deterministic first/last legal-move strategies; NOT evidence of balanced human matches.',passed:count===240};
mkdirSync(resolve(import.meta.dirname,'evidence'),{recursive:true});
writeFileSync(resolve(import.meta.dirname,'evidence/core-proof.json'),JSON.stringify(proof,null,2)+'\n');
console.log('R39_CORE_240_PASSED',JSON.stringify(proof));
