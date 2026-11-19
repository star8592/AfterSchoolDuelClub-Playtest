/** R182 campus-gag hero props are each a distinct PHYSICAL action.
 * No magic rings, no generic glow, no new light/shader, no per-frame geometry.
 * These are mesh transforms of independently authored Blender objects.
 */
const six=Object.freeze(['K06','Q05','P04','S04','P05','X05']);
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const fade=t=>smooth(t/.16)*(1-smooth((t-.86)/.14));
function animate(id,o,t,serial){
 if(!six.includes(id)||!o.name.startsWith(id+'_')||
  !o.name.endsWith('_ACTOR')||o.isMesh)return false;
 let base=o.userData.r182Base;
 if(!base){
  base={position:o.position.clone(),rotation:o.rotation.clone(),scale:o.scale.clone()};
  o.userData.r182Base=base;
 }
 o.position.copy(base.position);o.rotation.copy(base.rotation);
 o.scale.copy(base.scale);
 const k=fade(t),f=t*12,fast=t*25,phase=serial*.17;
 if(id==='K06'){
  if(o.name.includes('CUP'))o.rotation.z+=k*.13*Math.sin(fast);
  if(o.name.includes('STRAW')){
   o.position.y+=k*.11*Math.sin(f);
   o.rotation.z+=k*.18*Math.sin(f+.6);
  }
  if(o.name.includes('CHILI')){
   o.position.y+=k*.63*smooth(t/.35)*(1-smooth((t-.76)/.23));
   o.rotation.y+=k*.40*Math.sin(f+phase);
  }
 }else if(id==='Q05'){
  if(o.name.includes('CHALK')){
   o.rotation.z+=k*.24*Math.sin(f+.7);
   o.position.y+=k*.09*Math.sin(f*2);
  }
  if(o.name.includes('MICROPHONE')){
   o.rotation.z+=k*.17*Math.sin(f*1.3);
  }
  if(o.name.includes('DUST')){
   o.position.y+=k*.26*Math.abs(Math.sin(f+.4));
   o.scale.multiplyScalar(1+.27*k*smooth(t/.32));
  }
 }else if(id==='P04'){
  if(o.name.includes('WHISTLE')){
   o.rotation.z+=k*.34*Math.sin(f+.5);
   o.position.y+=k*.08*Math.sin(f);
  }
  if(o.name.includes('PENNANT')){
   o.rotation.y+=k*.32*Math.sin(f*1.8);
   o.rotation.z+=k*.15*Math.sin(f+.7);
  }
 }else if(id==='S04'){
  if(o.name.includes('CRANK')){
   o.rotation.z+=k*4.0*t; // physical brass gear turns, no abstract spiral
  }
  if(o.name.includes('TEST_PAPER')){
   o.position.y+=k*.24*smooth((t-.12)/.56);
   o.rotation.z+=k*.13*Math.sin(f*1.5);
  }
 }else if(id==='P05'){
  if(o.name.includes('VOLLEYBALL')){
   const flight=smooth((t-.10)/.67);
   o.position.x+=k*1.20*flight;
   o.position.y+=k*.85*Math.sin(Math.PI*flight);
   o.rotation.x+=k*(t*8+phase);
   o.rotation.z+=k*t*4;
  }
  if(o.name.includes('HOOP')){
   o.rotation.z+=k*.14*Math.sin(f*1.6)*smooth((t-.56)/.18);
  }
 }else if(id==='X05'){
  if(o.name.includes('BOOK')){
   o.rotation.y+=k*.10*Math.sin(f*.8);
  }
  if(o.name.includes('PAPER_GALAXY')){
   o.rotation.y+=k*(t*3.3);
   o.position.y+=k*.16*Math.sin(f+.8);
  }
  if(o.name.includes('PENCIL')){
   o.rotation.z+=k*t*3.5;
   o.position.y+=k*.20*Math.sin(f*1.4);
  }
 }
 return true;
}
export const R182_HERO_IDS=six;
export function r182AnimateActor(id,actor,t,serial){return animate(id,actor,t,serial)}
