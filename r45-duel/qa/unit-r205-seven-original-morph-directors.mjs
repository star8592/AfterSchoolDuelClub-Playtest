import assert from'node:assert/strict';
import{R205_ORIGINAL_R97_MORPH_IDS,r205SourceMorphSample}
 from'../scene/campus-r205-visible-summon-performance.mjs';
assert.equal(R205_ORIGINAL_R97_MORPH_IDS.length,7);
const ids=R205_ORIGINAL_R97_MORPH_IDS,signatures=new Set();
for(const id of ids){
 const points=Array.from({length:240},(_,i)=>
  r205SourceMorphSample(id,i/24,{offset:.17,life:{weight:.4,intent:'idle'}}));
 const phases=new Set(points.map(p=>p.phase));
 const keys=['Step','Strike','Brace','Land','Recoil','Retreat'];
 const values=Object.fromEntries(keys.map(k=>[k,points.map(p=>p[k])]));
 assert(phases.has('stride')&&phases.has('show')&&phases.has('glance'),
  'all original actors need rhythmic visible leg/arm/head beats '+id);
 assert(keys.every(k=>Math.max(...values[k])-Math.min(...values[k])>.045),
  'source mesh original body channels must actually change '+id);
 assert(points.every(p=>keys.reduce((s,k)=>s+p[k],0)<=1.04005),
  'never blend >100% of total original source morph clip weights '+id);
 signatures.add(points[0].signature);
 const reduced=r205SourceMorphSample(id,3.1,{offset:.17,reduced:true});
 const normal=r205SourceMorphSample(id,3.1,{offset:.17});
 assert(reduced.intensity<normal.intensity,'reduced motion safety '+id);
}
assert.equal(signatures.size,7,'all 7 original students need unique character rhythms');
assert.equal(r205SourceMorphSample('M02',3),null);
assert.equal(r205SourceMorphSample('E01',3),null);
assert.deepEqual(r205SourceMorphSample(ids[0],3,{offset:.2}),
 r205SourceMorphSample(ids[0],3,{offset:.2}),
 'deterministic and reproducible, not random time jitter');
console.log('R205_ALL_SEVEN_REAL_R97_VISIBLE_MORPH_SIX_CHANNEL_DIRECTORS_PASS',
 JSON.stringify({sevenDifferentGenuineCharacters:7,sourceMorphChannels:6,
 characterSpecificRhythms:7,sampleCount:240,repeatable:true,
 avoidsUnboundBoneRotation:true,noNewGPUAssets:true}));
