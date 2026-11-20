/** R208 audit of 60 cards, 46 true spell cast voices per two hosts, 46 distinct sound signatures. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,existsSync} from 'node:fs';
import {CARDS} from '../engine.mjs';
import {SCHOOL_MAGIC_IDENTITIES} from '../scene/campus-magic-bible.mjs';
import {R208_SPELL_FOLEY_ACCENTS,r208SpellAccent} from '../r208-audio-coverage.mjs';
const assets=new URL('../assets/audio/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('voice-manifest.json',assets)));
const spells=CARDS.filter(x=>x.kind==='spell'),units=CARDS.filter(x=>x.kind==='unit');
assert.equal(CARDS.length,60);
assert.equal(spells.length,46);
assert.equal(units.length,14);
let voices=0,bytes=0;
const soundSignatures=new Map(),duplicatePairs=[];
const pairs=new Map();
for(const id of spells.map(c=>c.id)){
 const card=SCHOOL_MAGIC_IDENTITIES[id];
 assert(card&&card.lines.cast&&card.foley.length===2,id);
 const oldSignature=card.foley.join('::');
 pairs.set(oldSignature,[...(pairs.get(oldSignature)||[]),id]);
 const accent=R208_SPELL_FOLEY_ACCENTS[id];
 const newSignature=oldSignature+(accent?'::'+accent.phase+':'+accent.cue:'');
 assert(!soundSignatures.has(newSignature),id+' has indistinguishable foley fingerprint');
 soundSignatures.set(newSignature,id);
 if(accent){
  assert(['cast','contact'].includes(accent.phase));
  assert(r208SpellAccent(id,accent.phase)===accent);
  assert(!r208SpellAccent(id,accent.phase==='cast'?'contact':'cast'));
  assert(existsSync(new URL(accent.cue+'.ogg',assets)),accent.cue);
 }
 for(const source of card.foley)assert(existsSync(new URL(source+'.ogg',assets)),id+' missing '+source);
 for(const [host,speaker] of [['HOST_PLAYER','serena'],['HOST_AI','dylan']]){
  const kind='r208_'+id;
  const c=manifest.clips[host]?.[kind];
  assert(c?.ready,id+' '+host+' has no real recorded Opus');
  assert.equal(c.text,card.lines.cast,id+' literal script and caption');
  assert.equal(c.speaker,speaker,host+' original voice');
  assert.equal(c.file,host+'-'+kind+'.ogg',id+' file identity');
  assert.equal(c.review_status,'pending-human-listening');
  assert(c.duration_seconds>.55&&c.duration_seconds<13);
  const bytesOf=readFileSync(new URL('voices/'+c.file,assets));
  assert.equal(bytesOf.toString('ascii',0,4),'OggS',id);
  assert.equal(createHash('sha256').update(bytesOf).digest('hex'),c.sha256);
  voices++;bytes+=bytesOf.length;
 }
}
for(const [p,ids]of pairs)if(ids.length>1)duplicatePairs.push(ids);
assert.equal(soundSignatures.size,46);
assert.equal(duplicatePairs.length,7);
assert.equal(Object.keys(R208_SPELL_FOLEY_ACCENTS).length,7);
assert.equal(voices,92);
console.log('R208_60_CARDS_46_SPELLS_92_ORIGINAL_HOST_VOICES_46_UNIQUE_SFX_FINGERPRINTS_PASS',JSON.stringify({
 cards:CARDS.length,units:units.length,spells:spells.length,voiceFiles:voices,voiceBytes:bytes,
 oldSoundPairCount:pairs.size,uniqueSoundSignatures:soundSignatures.size,
 augmentedCollisions:duplicatePairs.length,unrecordedSpells:0,
 noRuntimeTTS:true,unchangedRules:true,review:'pending-human-listening'
}));
