import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../assets/audio/crowd');
const manifest=JSON.parse(readFileSync(resolve(root,'crowd-manifest.json'),'utf8'));
assert.equal(manifest.provider,'Qwen3-TTS');
assert.equal(manifest.review_status,'pending-human-listening');
const scenarios=['ricochet','overshoot','shockwave','misfire'];
assert.equal(Object.keys(manifest.clips).length,8);
for(const scenario of scenarios){
 for(const variant of ['a','b']){
  const key=scenario+'_'+variant,clip=manifest.clips[key];
  assert.ok(clip);
  assert.equal(clip.scenario,scenario);
  assert.ok(clip.ready);
  assert.equal(clip.file,'r122_'+key+'.ogg');
  const file=resolve(root,clip.file),bytes=readFileSync(file);
  assert.ok(statSync(file).size>2000);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256);
  assert.ok(clip.text.length>=3&&clip.text.length<70);
  const actual=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',file],{encoding:'utf8'}));
  assert.equal(actual.streams[0].codec_name,'opus');
  assert.ok(actual.streams[0].sample_rate>=24000);
  assert.ok(Math.abs(Number(actual.format.duration)-clip.duration_seconds)<.07);
 }
}
console.log('R122_CROWD_VOICE_ASSET_PASS',JSON.stringify({
 voices:8,scenarios:4,allRealOpus:true,
 humanListeningReview:'pending',provider:'Qwen3-TTS'
}));
