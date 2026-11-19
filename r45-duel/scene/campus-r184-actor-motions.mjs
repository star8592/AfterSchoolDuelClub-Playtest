/**
 * R184: 10 independently sculpted physical comedy action algorithms.
 * Manipulates actual GLB Empty groups (not procedural scene proxies).
 * Side-effect-free, reset-to-rest each frame, avoids cumulative spin/drift.
 */
export const R184_HERO_IDS=Object.freeze(
 ['E05','G05','T06','K03','K04','Q02','S01','S06','P07','X02']);
const clamp=v=>Math.min(1,Math.max(0,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const envelope=t=>smooth(t/.14)*(1-smooth((t-.86)/.14));
export function r184AnimateActor(id,o,t,serial){
 if(!R184_HERO_IDS.includes(id)||o.isMesh||
    !o.name.startsWith(id+'_')||!o.name.endsWith('_ACTOR'))return false;
 let base=o.userData.r184Rest;
 if(!base){
  base={p:o.position.clone(),r:o.rotation.clone(),s:o.scale.clone()};
  o.userData.r184Rest=base;
 }
 o.position.copy(base.p);o.rotation.copy(base.r);o.scale.copy(base.s);
 const k=envelope(t),f=t*14,p=serial*.04;
 if(id==='E05'){
  if(o.name.includes('HORN')){
   o.rotation.z+=k*.21*Math.sin(f*1.7+p);
   o.position.y+=k*.055*Math.sin(f*1.7+p);
  }
  if(o.name.includes('BANNER')){
   o.rotation.y+=k*.34*Math.sin(f*1.23);
   o.rotation.x+=k*.16*Math.sin(f*1.83);
  }
 }else if(id==='G05'){
  if(o.name.includes('LEGS')){
   o.rotation.z+=k*.09*Math.sin(f);
   o.position.y+=k*.075*smooth(t/.35);
  }
  if(o.name.includes('REPAIR_TOOL')){
   o.rotation.y+=k*t*6.5;
   o.position.y+=k*.14*Math.abs(Math.sin(f*1.34));
  }
  if(o.name.includes('TABLETOP')){
   o.rotation.z+=k*.045*Math.sin(f*.65);
  }
 }else if(id==='T06'){
  if(o.name.includes('LOUDSPEAKER')){
   o.rotation.z+=k*.12*Math.sin(f*2.3);
   o.position.y+=k*.036*Math.sin(f*1.4);
  }
  if(o.name.includes('MICROPHONE')){
   o.rotation.x+=k*.18*Math.sin(f*1.4);
   o.rotation.z+=k*.14*Math.sin(f*.9);
  }
  if(o.name.includes('CONTROL_CONSOLE'))
   o.rotation.z+=k*.025*Math.sin(f*2);
 }else if(id==='K03'){
  if(o.name.includes('PAN')){
   o.rotation.z+=k*.18*Math.sin(f);
   o.position.y+=k*.13*Math.abs(Math.sin(f));
  }
  if(o.name.includes('CORN')||o.name.includes('GRAPES')){
   const off=o.name.includes('GRAPES')?.9:0;
   o.position.y+=k*.35*Math.abs(Math.sin(f+off));
   o.rotation.y+=k*t*(o.name.includes('GRAPES')?7:4.7);
   o.rotation.z+=k*.22*Math.sin(f*1.4+off);
  }
  if(o.name.includes('SPATULA')){
   o.rotation.z+=k*.27*Math.sin(f*1.4);
   o.position.x+=k*.19*Math.sin(f);
  }
 }else if(id==='K04'){
  if(o.name.includes('MOONCAKE')){
   o.position.y+=k*.15*Math.abs(Math.sin(f));
   o.rotation.z+=k*.18*Math.sin(f);
  }
  if(o.name.includes('CHILI')){
   o.position.y+=k*.54*smooth(t/.45);
   o.rotation.y+=k*t*4.5;
   o.rotation.z+=k*.24*Math.sin(f*1.1);
  }
  if(o.name.includes('TRAY'))o.rotation.z+=k*.09*Math.sin(f*.8);
 }else if(id==='Q02'){
  if(o.name.includes('BEAST_HEAD')){
   o.position.y+=k*.24*smooth(t/.42);
   o.rotation.z+=k*.23*Math.sin(f+.3);
  }
  if(o.name.includes('PAPER_LEGS'))
   o.rotation.z+=k*.16*Math.sin(f*1.7);
  if(o.name.includes('NOTICE'))
   o.rotation.y+=k*.09*Math.sin(f*.78);
 }else if(id==='S01'){
  if(o.name.includes('HANDS')){
   // Actual clock hands on same physical dial turning backward.
   o.rotation.y-=k*t*8.2;
  }
  if(o.name.includes('BELLS')){
   o.rotation.z+=k*.25*Math.sin(f*2.8);
   o.position.y+=k*.06*Math.sin(f*2.8);
  }
  if(o.name.includes('CLOCK_CASE'))
   o.rotation.z+=k*.045*Math.sin(f*2.1);
 }else if(id==='S06'){
  if(o.name.includes('BAND')){
   o.scale.x*=1+k*.35*Math.sin(t*17);
   o.position.y+=k*.05*Math.sin(f*1.8);
  }
  if(o.name.includes('TEACHER_HAT')){
   const flight=smooth((t-.25)/.54);
   o.position.y+=k*.73*flight;
   o.position.x+=k*.56*flight;
   o.rotation.y+=k*t*5.8;
   o.rotation.z+=k*.26*Math.sin(f);
  }
  if(o.name.includes('RIG'))
   o.rotation.z+=k*.07*Math.sin(f*.7);
 }else if(id==='P07'){
  if(o.name.includes('SWAN_BODY')){
   o.position.x+=k*.75*smooth(t/.7);
   o.rotation.y+=k*.15*Math.sin(f*.7);
  }
  if(o.name.includes('SWAN_NECK')){
   o.rotation.z+=k*.17*Math.sin(f);
   o.position.y+=k*.07*Math.sin(f);
  }
  if(o.name.includes('SWAN_WINGS')){
   o.rotation.x+=k*.19*Math.sin(f*1.9);
  }
  if(o.name.includes('SKATES')){
   o.position.x+=k*.75*smooth(t/.7);
   o.rotation.z+=k*.06*Math.sin(f*1.8);
  }
 }else if(id==='X02'){
  if(o.name.includes('UNIFORM')){
   o.position.y+=k*.95*smooth((t-.12)/.64);
   o.rotation.z+=k*.11*Math.sin(f+.4);
  }
 }
 return true;
}
