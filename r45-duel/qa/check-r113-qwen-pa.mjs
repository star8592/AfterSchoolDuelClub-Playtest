import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../assets/audio');
const pa=JSON.parse(readFileSync(resolve(root,'pa/announcer-manifest.json')));
const old=JSON.parse(readFileSync(resolve(root,'voice-manifest.json')));
assert.equal(pa.provider,'Qwen3-TTS');
assert.equal(Object.keys(pa.clips).length,9,'nine genuine offline recordings');
assert.equal(Object.values(old.clips).flatMap(x=>Object.values(x)).filter(x=>x.file&&x.ready).length,98,
 'original 98 actor recordings must be retained');
const speakers=new Set(),types=new Set(),clips=[];
for(const [key,c] of Object.entries(pa.clips)){
 assert.equal(c.ready,true);
 assert.equal(c.review_status,'pending-human-listening','do not claim human-audition');
 assert.ok(/^r113_[a-z_]+\.ogg$/.test(c.file));
 assert.ok(c.duration_seconds>.8&&c.duration_seconds<13);
 assert.ok(c.text.length>3);
 const file=resolve(root,'pa',c.file),blob=readFileSync(file);
 assert.ok(statSync(file).size>3000);
 assert.equal(createHash('sha256').update(blob).digest('hex'),c.sha256);
 const probe=spawnSync('ffprobe',['-v','error','-select_streams','a:0',
  '-show_entries','stream=codec_name','-of','default=nokey=1:noprint_wrappers=1',file],
  {encoding:'utf8'});
 assert.equal(probe.status,0,'valid decodable Opus');
 assert.equal(probe.stdout.trim(),'opus','real Opus file');
 speakers.add(c.speaker);types.add(c.kind);clips.push([key,c.duration_seconds]);
}
assert.equal(speakers.size,3,'PA host + female + male natural voices');
assert.equal(types.size,2,'announcer + social');
console.log('R113_QWEN_VOICE_VERIFY',JSON.stringify({passed:true,clips,existingActorClips:98}));
