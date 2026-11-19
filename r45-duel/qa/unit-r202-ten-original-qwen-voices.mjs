import assert from'node:assert/strict';
import{readFileSync,statSync}from'node:fs';
import{createHash}from'node:crypto';
const root=new URL('../assets/audio/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('voice-manifest.json',root),'utf8'));
const ids=['E06','Q05','K01','K07','P07'];
const result=[];
for(const [host,speaker] of [['HOST_AI','dylan'],['HOST_PLAYER','serena']]){
 for(const id of ids){
  const meta=manifest.clips[host]?.['r202_'+id];
  assert(meta?.ready&&meta.speaker===speaker);
  assert(meta.model==='Qwen3-TTS-12Hz-1.7B-CustomVoice');
  assert(meta.text?.length>=10&&meta.review_status==='pending-human-listening');
  assert(meta.file===host+'-r202_'+id+'.ogg');
  const url=new URL('voices/'+meta.file,root);
  const bytes=readFileSync(url);
  assert(bytes.length>2000&&bytes.subarray(0,4).toString()==='OggS');
  assert(createHash('sha256').update(bytes).digest('hex')===meta.sha256);
  assert(meta.duration_seconds>.55&&meta.duration_seconds<12);
  result.push({host,id,bytes:statSync(url).size,seconds:meta.duration_seconds});
 }
}
assert.equal(result.length,10);
console.log('R202_TEN_ORIGINAL_QWEN_VOICES_SHA256_PASS',
 JSON.stringify({realOpusFiles:result.length,model:manifest.model,
 maleCount:5,femaleCount:5,allPendingHumanListening:true,totalBytes:result.reduce((s,x)=>s+x.bytes,0)}));
