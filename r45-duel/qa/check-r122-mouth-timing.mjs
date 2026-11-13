import {speechMouthAt,MOUTH_SHAPES} from '../scene/voice-mouth-timing.mjs';
import assert from 'node:assert/strict';
const text='哎呀！这张牌也太厉害了，轮到你出牌啦！';
const sample={text,started:4,duration:3.7,serial:88};
let frames=0,closed=0;const seen=new Set(),energy=[];
for(let n=0;n<260;n++){
 const frame=speechMouthAt(sample,3.9+n*.016);
 if(frame){
  assert.equal(frame.source,'confirmed-qwen-playback');
  assert(MOUTH_SHAPES.includes(frame.shape));
  assert(frame.openness>=0&&frame.openness<=1);
  energy.push(frame.openness);
  seen.add(frame.shape);frames++;
 }else closed++;
}
assert(frames>150&&closed>10);
assert(seen.size>=3,'multiple authored real VRM face visemes are used');
assert(energy.some(x=>x>.5)&&energy.some(x=>x<.05));
for(const invalid of [null,undefined,{started:0,duration:2,text:''},
 {started:0,duration:20,text:'你好'}, {started:0,duration:0,text:'a'}])
 assert.equal(speechMouthAt(invalid,1),null);
assert.equal(speechMouthAt(sample,7.72),null);
console.log('R122_MOUTH_TIMELINE_PASS',{frames,closed,shapes:[...seen]});
