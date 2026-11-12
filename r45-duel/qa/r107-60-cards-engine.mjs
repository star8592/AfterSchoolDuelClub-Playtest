import {CARDS,BY_ID,DECK_PRESETS,MAX_HP,createGame,playCard,endTurn,aiTurn,simulate} from '../engine.mjs';
import {COMIC_ASIDE_LINES} from '../comedy-script.mjs';
import {COMIC_BEATS} from '../audio-engine.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const fail=(cond,msg)=>{checks++;if(!cond){failures.push(msg);throw Error(msg)}};
const checksLog=[];
let checks=0;const failures=[];
const existingIds=['E01','E02','E03','E04','G01','G02','G03','G04','M01','M02','T01','T02','T03','T04','E05','E06','G05','G06','T05','T06'];
fail(CARDS.length===60,'Exactly 60 distinct card objects');
fail(new Set(CARDS.map(c=>c.id)).size===60,'No duplicate ids');
fail(existingIds.every(id=>BY_ID[id]),'Original 20 original cards retained');
fail(CARDS.filter(c=>c.kind==='unit').length===14,'Original 14 visual unit assets retained');
fail(CARDS.filter(c=>c.kind==='spell').length===46,'46 actual event spells');
fail(Object.keys(DECK_PRESETS).length===6,'Six working deck presets');
for(const c of CARDS){
 fail(['ember','grove','tide'].includes(c.style),'Correct style '+c.id);
 fail(Number.isInteger(c.cost)&&c.cost>=1&&c.cost<=5,'Price bounded '+c.id);
 fail(!!c.line&&!!c.name,'Story authored '+c.id);
 fail(COMIC_ASIDE_LINES[c.id]?.length>=4,'4+ text-only comedy lines '+c.id);
 if(c.kind==='spell')fail(!!COMIC_BEATS['spell_'+c.effect], 'Foley present '+c.id+' '+c.effect);
}
for(const [key,preset] of Object.entries(DECK_PRESETS)){
 fail(preset.cards.length===20,key+' 20 distinct kinds');
 fail(new Set(preset.cards).size===20,key+' no duplicates');
 fail(preset.cards.every(id=>BY_ID[id]),key+' catalog references exist');
 const game=createGame(90210,key);
 fail(game.deckPreset===key,key+' deck identity persisted');
 fail(game.deck.player.length+game.hand.player.length===40,key+' 40 true cards per player');
 const mirror=createGame(90210,key);
 fail(JSON.stringify(game.deck.player)===JSON.stringify(mirror.deck.player),key+' deterministic shuffle');
}
fail(!DECK_PRESETS.classic.cards.some(id=>id.startsWith('K')),'Original tutorial deck unchanged');
for(const c of CARDS.filter(c=>c.kind==='spell')){
 const g=createGame(13);
 g.energy.player=9;g.hand.player.unshift(c.id);g.hp.player=13;g.hp.ai=15;
 g.board.player[0]=[{uid:'ALLY',id:'E01',style:'ember',attack:3,hp:4,buff:0,shield:0,summonedAt:0}];
 g.board.ai[0]=[{uid:'ENEMY',id:'G01',style:'grove',attack:3,hp:8,buff:0,shield:0,summonedAt:0}];
 const before={energy:g.energy.player,hand:g.hand.player.length,hp:{...g.hp},ally:{...g.board.player[0][0]},enemy:{...g.board.ai[0][0]}};
 const r=playCard(g,0,0);
 const receipt=g.events.findLast(e=>e.type==='card_play'&&e.card===c.id);
 fail(r.ok&&receipt?.spellOutcome?.effect===c.effect,c.id+' rule-authoritative card_play outcome');
 fail(g.energy.player>=0&&g.energy.player<=9,c.id+' energy bounds');
 fail(g.hp.player>=0&&g.hp.player<=MAX_HP&&g.hp.ai>=0&&g.hp.ai<=MAX_HP,c.id+' HP bounds');
 const actual=receipt.spellOutcome;
 if(['blast','stew'].includes(c.effect))fail(actual.directDamage>0,c.id+' real direct damage');
 if(['confuse','splash','eclipse','boomerang','trick'].includes(c.effect))
  fail(actual.unitDamage>0,c.id+' real unit damage');
 if(['heal','stew','banquet','eclipse'].includes(c.effect))
  fail(actual.healed>0,c.id+' real healing');
 if(['draw','insight','reroute'].includes(c.effect))
  fail(actual.cardDraw>0,c.id+' declared draw count');
 if(c.effect==='shield')fail(g.board.player[0][0].shield===2,c.id+' real shield');
 if(c.effect==='chaos')fail(g.board.ai[0][0].attack===2,c.id+' real attack weakening');
 if(c.effect==='updraft')fail(g.board.player[0][0].attack===4,c.id+' real attack upgrade');
 if(c.effect==='banquet')fail(g.board.player[0][0].hp===5,c.id+' actual unit healing');
 if(c.effect==='repair')fail(g.board.player[0][0].hp===6,c.id+' actual repair');
 if(c.effect==='buff')fail(g.board.player[0][0].buff===2,c.id+' existing buff');
}
const snapshots={};
for(const key of Object.keys(DECK_PRESETS)){
 const wins={player:0,ai:0,draw:0},turns=[];
 for(let seed=1;seed<=120;seed++){
  const g=simulate(seed,'first',key);
  fail(g.phase==='ended'&&['player','ai','draw'].includes(g.winner),key+' reaches terminal '+seed);
  wins[g.winner]++;turns.push(g.round);
 }
 snapshots[key]={wins,meanRounds:+(turns.reduce((a,b)=>a+b,0)/turns.length).toFixed(2)};
}
const result={ok:failures.length===0,checks,failures,catalog:60,presets:Object.keys(DECK_PRESETS),simulation:snapshots};
const out=resolve(import.meta.dirname,'evidence/r107');mkdirSync(out,{recursive:true});
writeFileSync(resolve(out,'r107-60-card-rules.json'),JSON.stringify(result,null,2)+'\n');
console.log('R107_60_CARD_ENGINE',JSON.stringify(result));
if(!result.ok)process.exitCode=7;
