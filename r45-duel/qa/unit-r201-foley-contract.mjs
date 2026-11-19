import assert from'node:assert/strict';
import{readFileSync,existsSync,statSync}from'node:fs';
import{SCHOOL_MAGIC_IDENTITIES}from'../scene/campus-magic-bible.mjs';
const file=new URL('../audio-engine.mjs',import.meta.url);
const body=readFileSync(file,'utf8');
const registered=new Map([...body.matchAll(/^\s*(r102_[a-z0-9_]+):'([^']+\.ogg)'/gm)]
 .map(([_,key,name])=>[key,name]));
const ids=Object.keys(SCHOOL_MAGIC_IDENTITIES);
assert.equal(ids.length,46);
let total=0;
const referenced=new Set(),pairs=new Set();
for(const id of ids){
 const m=SCHOOL_MAGIC_IDENTITIES[id];
 assert.equal(m.foley.length,2,id);
 assert(m.lines.cast?.length>=6&&m.lines.hit?.length>=6,id);
 const pair=m.foley.join(' / ');pairs.add(pair);
 for(const key of m.foley){
  const name=registered.get(key);assert(name,'Missing library reference '+id+':'+key);
  const asset=new URL('../assets/audio/'+name,import.meta.url);
  assert(existsSync(asset)&&statSync(asset).size>40,'Missing physical Opus sample '+name);
  total++;referenced.add(key);
 }
}
assert(referenced.size>=20);
console.log('R201_46_ORIGINAL_MAGIC_SOUND_CONTRACT_PASS',JSON.stringify({
 spells:ids.length,foleyAssignments:total,localAudioFiles:referenced.size,
 distinctFoleyPairs:pairs.size,uniquePerSpellVoicesRecorded:false}));
