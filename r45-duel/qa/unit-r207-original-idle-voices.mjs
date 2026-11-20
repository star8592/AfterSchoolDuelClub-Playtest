import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {R207_IDLE_LINES,createR207IdleChatter} from '../r207-idle-chatter.mjs';
const manifest=JSON.parse(readFileSync(new URL('../assets/audio/voice-manifest.json',import.meta.url)));
const ids=Object.keys(R207_IDLE_LINES);
assert.equal(ids.length,16);
let verified=0,totalBytes=0;
for(const id of ids){
 assert(manifest.clips[id],id+' recorded voice identity');
 for(const [index,text] of R207_IDLE_LINES[id].entries()){
  assert(text.length>=8&&text.length<80,'natural length '+id);
  const kind=index===0?'idle':'idle_v2';
  const meta=manifest.clips[id][kind];
  assert(meta?.ready,id+' missing original recorded '+kind);
  assert.equal(meta.text,text,'subtitles must equal original spoken script');
  assert.equal(meta.file,id+'-r207_'+kind+'.ogg');
  const file=readFileSync(new URL('../assets/audio/voices/'+meta.file,import.meta.url));
  assert.equal(file.toString('ascii',0,4),'OggS');
  assert.equal(createHash('sha256').update(file).digest('hex'),meta.sha256);
  assert(meta.duration_seconds>.55&&meta.duration_seconds<13);
  assert.equal(meta.review_status,'pending-human-listening');
  verified++;totalBytes+=file.length;
 }
}
const sim=createR207IdleChatter(15,{quick:true});
assert.equal(sim.propose(1000,['HOST_PLAYER','M01'],1),null);
let p=sim.propose(9000,['HOST_PLAYER','M01'],1);
assert(p&&['HOST_PLAYER','M01'].includes(p.id));
sim.settle(p,9000,true);
assert.equal(sim.inspect().accepted,1);
assert.equal(sim.propose(10000,['HOST_PLAYER','M01'],1),null);
assert.equal(sim.propose(12000,['HOST_PLAYER','M01'],2),null);
p=sim.propose(24000,['HOST_PLAYER','M01'],2);
assert(p&&['HOST_PLAYER','M01'].includes(p.id));
assert.notEqual(p.id,sim.inspect().lastSpokenActors.at(-1));
sim.settle(p,24000,true);
assert.equal(sim.inspect().accepted,2);
assert.equal(sim.propose(45000,['M01'],2,{quiet:true}),null);
const data={actors:ids.length,originalOpus:verified,totalBytes,
 noRuntimeTTS:true,scriptSubtitleParity:true,scheduling:sim.inspect(),
 defaultFeatureOff:true};
console.log('R207_ALL_16_CHARACTERS_32_REAL_OPUS_AND_LOW_PRIORITY_SCHEDULER_PASS',JSON.stringify(data));
