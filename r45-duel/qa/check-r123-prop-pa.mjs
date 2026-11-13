import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const dir=resolve(import.meta.dirname,'../assets/audio/crowd');
const manifest=JSON.parse(readFileSync(resolve(dir,'r123-prop-pa-manifest.json'),'utf8'));
assert.equal(manifest.provider,'Qwen3-TTS');
assert.equal(manifest.review_status,'pending-human-listening');
const names=['popcorn','juice','homework','backpack'];
assert.deepEqual(Object.keys(manifest.clips).sort(),[...names].sort());
for(const name of names){
 const meta=manifest.clips[name],file=resolve(dir,meta.file);
 assert.equal(meta.file,'r123_pa_'+name+'.ogg');
 assert.equal(meta.speaker,'ryan');
 assert.ok(meta.ready&&meta.text.length>12);
 const buf=readFileSync(file);assert.ok(statSync(file).size>3000);
 assert.equal(createHash('sha256').update(buf).digest('hex'),meta.sha256);
 const probe=JSON.parse(execFileSync('ffprobe',
  ['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8'}));
 assert.equal(probe.streams[0].codec_name,'opus');
 assert.equal(Number(probe.streams[0].sample_rate),48000);
 assert.ok(Math.abs(Number(probe.format.duration)-meta.duration_seconds)<.08);
}
console.log('R123_PROP_PA_ASSET_PASS',JSON.stringify({
 voices:names.length,allRealOpus:true,
 exactTextAndHash:true,humanListeningReview:'pending'
}));
