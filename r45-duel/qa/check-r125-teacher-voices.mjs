import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../assets/audio/crowd');
const m=JSON.parse(readFileSync(resolve(root,'r125-teacher-manifest.json'),'utf8'));
assert.equal(m.provider,'Qwen3-TTS');assert.equal(m.actor,'M01');
assert.equal(m.review_status,'pending-human-listening');
assert.deepEqual(Object.keys(m.clips).sort(),['order','paper']);
for(const key of ['order','paper']){
 const v=m.clips[key],file=resolve(root,v.file);
 assert.equal(v.file,'r125_teacher_'+key+'.ogg');assert.equal(v.speaker,'serena');
 const buf=readFileSync(file);
 assert.ok(buf.length>6000);
 assert.equal(createHash('sha256').update(buf).digest('hex'),v.sha256);
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries',
  'stream=codec_name,sample_rate:format=duration','-of','json',file],{encoding:'utf8'}));
 assert.equal(probe.streams[0].codec_name,'opus');
 assert.equal(+probe.streams[0].sample_rate,48000);
 assert.ok(Math.abs(Number(probe.format.duration)-v.duration_seconds)<.08);
 assert.ok(v.ready&&v.text.length>15);
}
console.log('R125_TEACHER_VOICE_ASSET_PASS',JSON.stringify({
 actors:['M01'],voices:2,originalQwenOpus:true,
 timestampsAndHashValid:true,humanListeningReview:'pending'
}));
