import assert from 'node:assert/strict';
import {BY_ID,CARDS} from '../engine.mjs';
import {CARD_MAGIC_MOTIFS,MAGIC_MOTIF_COUNT} from '../scene/magic-arsenal.mjs';
import {ELEMENTS,CARD_ELEMENTS,SPELL_SIGNATURES,describeSpellContact}
 from '../scene/spell-response-contract.mjs';
const cards=CARDS.filter(c=>c.kind==='spell');
assert.equal(cards.length,46);
assert.equal(Object.keys(CARD_ELEMENTS).length,46);
assert.equal(Object.keys(SPELL_SIGNATURES).length,46);
assert.ok(MAGIC_MOTIF_COUNT>=30);
assert.equal(Object.keys(ELEMENTS).length,15);
assert.equal(new Set(Object.values(CARD_ELEMENTS)).size,15);
assert.equal(new Set(Object.values(SPELL_SIGNATURES).map(x=>x.signature)).size,46);
for(const c of cards){
 assert.ok(CARD_MAGIC_MOTIFS[c.id]);
 const d=describeSpellContact({type:'ASDC_R81_SPELL_RESULT',
  card:c.id,side:'player',effect:c.effect,serial:9,
  damage:3,directDamage:2,targetUids:['U1','U1','BAD','U2']});
 assert.ok(d,'card '+c.id+' must produce an allowed contact');
 assert.equal(d.id,c.id);
 assert.equal(d.directDamage,2);
 assert.equal(d.unitDamage,1);
 assert.deepEqual(d.targetUids,['U1','U2']);
 assert.equal(d.victim,'ai');
 assert.ok(ELEMENTS[d.element]);
 assert.ok(d.damaging);
 assert.equal(describeSpellContact({type:'ASDC_R81_SPELL_RESULT',
  card:c.id,side:'ai',serial:9,effect:'not_real',damage:4,directDamage:4}),null);
}
const c=cards[0];
const support=describeSpellContact({type:'ASDC_R81_SPELL_RESULT',
 card:c.id,effect:c.effect,side:'ai',serial:15,damage:0,
 directDamage:0,targetUids:['U10']});
assert.equal(support.supportive,true);
assert.equal(support.damaging,false);
assert.deepEqual(support.targetUids,[]);
assert.equal(describeSpellContact({type:'ASDC_R81_SPELL_RESULT',
 card:'ZZZ',effect:'blast',side:'player',serial:1}),null);
assert.equal(describeSpellContact({type:'ASDC_R81_SPELL_RESULT',
 card:c.id,effect:c.effect,side:'other',serial:1}),null);
assert.equal(describeSpellContact({type:'ASDC_R81_SPELL_RESULT',
 card:c.id,effect:c.effect,side:'player',serial:0}),null);
console.log('R121_ELEMENTAL_CONTRACT_PASS',JSON.stringify({
 spells:cards.length,visualMotifs:MAGIC_MOTIF_COUNT,
 elements:Object.keys(ELEMENTS).length,signatures:Object.keys(SPELL_SIGNATURES).length
}));
