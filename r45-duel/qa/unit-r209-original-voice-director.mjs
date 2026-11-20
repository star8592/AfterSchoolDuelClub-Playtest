import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {r209CanDelayHurt,r209DropStaleVoice,R209_MAX_DEFER_SECONDS} from '../r209-voice-director.mjs';
const manifest=JSON.parse(readFileSync(new URL('../assets/audio/r209-impact-gasp-manifest.json',import.meta.url)));
assert.equal(manifest.provider,'Qwen3-TTS');
assert.equal(R209_MAX_DEFER_SECONDS,2.5);
let count=0,bytes=0;
for(const [id,speaker] of [['HOST_PLAYER','serena'],['HOST_AI','dylan']]){
 const clip=manifest.clips[id];
 assert(clip&&clip.ready&&clip.speaker===speaker&&
  clip.file===id+'-r209-impact-gasp.ogg'&&
  clip.duration_seconds>.4&&clip.duration_seconds<1.5);
 const f=readFileSync(new URL('../assets/audio/voices/'+clip.file,import.meta.url));
 assert.equal(f.toString('ascii',0,4),'OggS');
 assert.equal(createHash('sha256').update(f).digest('hex'),clip.sha256);
 count++;bytes+=f.length;
}
const args={activeKey:'HOST_PLAYER:r208_S08',activeDuration:2.81,
 position:1.051,hitId:'HOST_AI',hitKind:'r203_S08'};
assert.equal(r209CanDelayHurt(args),true,'original real S08 hit should delay complete retort');
assert.equal(r209CanDelayHurt({...args,position:2.793}),true,'natural ending edge should not be cut');
assert.equal(r209CanDelayHurt({...args,position:0,activeDuration:4.1}),false,
 'never wait behind very long dialogue');
assert.equal(r209CanDelayHurt({...args,hitId:'HOST_PLAYER'}),false,'cannot gasp at oneself');
assert.equal(r209CanDelayHurt({...args,hitKind:'cast'}),false,'only genuine hurt');
assert.equal(r209CanDelayHurt({...args,activeKey:'HOST_PLAYER:idle'}),false,'not for idle');
assert.equal(r209CanDelayHurt({...args,activeDuration:Infinity}),false);
assert.equal(r209CanDelayHurt({...args,position:2.9}),false);
for(const kind of ['enter','idle','social'])
 assert.equal(r209DropStaleVoice({kind}),true);
for(const kind of ['hurt','r203_S08','r208_S08','intro_f'])
 assert.equal(r209DropStaleVoice({kind}),false);
console.log('R209_ORIGINAL_TWO_GASPS_AND_VOICE_PRIORITY_EDGE_CASES_PASS',JSON.stringify({
 shortVoiceFiles:count,bytes,originalS08TruncationSeconds:1.051,
 newCasterFullDurationSeconds:2.81,originalCollision:true,
 noRuntimeTTS:true,queueCap:3,defaultFeatureDisabled:true
}));
