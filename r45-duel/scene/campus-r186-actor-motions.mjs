/**
 * R186: individually authored actions for remaining nine original campus props.
 * Real Blender Empty groups move physical mesh; no decorative shader ring.
 * Every frame resets original rest transforms: never cumulative skeleton drift.
 */
export const R186_HERO_IDS=Object.freeze(
 ['P01','P02','P06','P08','X01','X04','X06','X07','X08']);
const clamp=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const env=t=>smooth(t/.13)*(1-smooth((t-.86)/.14));
export function r186AnimateActor(id,o,t,serial){
 if(!R186_HERO_IDS.includes(id)||o.isMesh||
   !o.name.startsWith(id+'_')||!o.name.endsWith('_ACTOR'))return false;
 let b=o.userData.r186Rest;
 if(!b){
  b={p:o.position.clone(),r:o.rotation.clone(),s:o.scale.clone()};
  o.userData.r186Rest=b;
 }
 o.position.copy(b.p);o.rotation.copy(b.r);o.scale.copy(b.s);
 const k=env(t),f=15*t;
 if(id==='P01'){
  if(o.name.includes('HAIR')){
   o.scale.x*=1+k*.23*Math.sin(f*1.22);
   o.scale.z*=1+k*.22*Math.sin(f*1.71);
   o.rotation.y+=k*.16*Math.sin(f);
  }
  if(o.name.includes('ARMS')){
   o.rotation.z+=k*.33*Math.sin(f*1.1);
   o.position.y+=k*.08*Math.sin(f*.8);
  }
  if(o.name.includes('LEGS')){
   o.rotation.z-=k*.28*Math.sin(f*1.1);
   o.position.y+=k*.09*Math.abs(Math.sin(f));
  }
  if(o.name.includes('CAPE')){
   o.rotation.x+=k*.35*Math.sin(f*1.5);
   o.rotation.z+=k*.15*Math.sin(f*.8);
  }
  if(o.name.includes('HEAD'))
   o.rotation.y+=k*.17*Math.sin(f*.9);
  if(o.name.includes('BODY'))
   o.rotation.z+=k*.07*Math.sin(f*.85);
 }else if(id==='P02'){
  if(o.name.includes('BALL')){
   const ricochet=smooth(t/.5);
   o.position.x+=k*.82*ricochet;
   o.position.y+=k*.45*Math.abs(Math.sin(f*.84));
   o.rotation.y+=k*t*8.4;
  }
  if(o.name.includes('NET')){
   o.position.y+=k*.07*Math.sin(f*1.6);
   o.scale.x*=1+k*.08*Math.sin(f*1.2);
  }
  if(o.name.includes('SCOREBOARD')){
   o.rotation.z+=k*.18*Math.sin(f*.95);
  }
 }else if(id==='P06'){
  if(o.name.includes('BELT')){
   o.position.x-=k*.33*smooth(t/.45);
   o.position.y+=k*.033*Math.sin(f*1.5);
  }
  if(o.name.includes('ROLLER')){
   o.rotation.y-=k*t*7.4;
  }
  if(o.name.includes('SHOES')){
   o.position.x-=k*.55*smooth(t/.58);
   o.position.y+=k*.23*Math.abs(Math.sin(f));
   o.rotation.z+=k*.12*Math.sin(f*1.3);
  }
  if(o.name.includes('TERMINAL'))
   o.rotation.z+=k*.06*Math.sin(f*.9);
 }else if(id==='P08'){
  if(o.name.includes('METEOR')){
   o.position.y-=k*.61*smooth(t/.71);
   o.rotation.y+=k*t*6.5;
   o.rotation.z+=k*.2*Math.sin(f);
  }
  if(o.name.includes('MEDALS')){
   o.position.y+=k*.32*Math.abs(Math.sin(f*.85));
   o.rotation.y+=k*t*7.5;
  }
  if(o.name.includes('RIBBONS')){
   o.rotation.x+=k*.46*Math.sin(f*.87);
   o.rotation.z+=k*.23*Math.sin(f);
  }
 }else if(id==='X01'){
  if(o.name.includes('REVERSE_HANDS')){
   o.rotation.y-=k*t*9.5;
  }
  if(o.name.includes('GEARS')){
   o.rotation.y+=k*t*5.8;
   o.rotation.z+=k*.08*Math.sin(f*1.12);
  }
  if(o.name.includes('CLOCK_DIAL')){
   o.rotation.z+=k*.035*Math.sin(f*.88);
  }
 }else if(id==='X04'){
  if(o.name.includes('PILLOW')){
   o.scale.z*=1+k*.13*Math.sin(f*.91);
   o.position.y+=k*.08*Math.abs(Math.sin(f*.89));
   o.rotation.z+=k*.075*Math.sin(f*.76);
  }
  if(o.name.includes('PROPHECY_NOTE')){
   o.position.y+=k*.45*smooth(t/.62);
   o.rotation.z+=k*.21*Math.sin(f*.75);
   o.rotation.y+=k*t*2.8;
  }
 }else if(id==='X06'){
  if(o.name.includes('SCANNER_LID')){
   o.rotation.x+=k*.34*smooth(t/.55);
   o.position.y+=k*.07*Math.sin(f*.7);
  }
  if(o.name.includes('BOOK')){
   o.rotation.y+=k*.14*Math.sin(f*.82);
   o.position.y+=k*.11*Math.sin(f*1.1);
  }
  if(o.name.includes('COPIES')){
   o.position.x+=k*.32*smooth(t/.65);
   o.position.y+=k*.25*smooth(t/.52);
   o.rotation.z+=k*.18*Math.sin(f*.91);
  }
  if(o.name.includes('LCD'))
   o.rotation.z+=k*.07*Math.sin(f*1.25);
 }else if(id==='X07'){
  if(o.name.includes('DESK')){
   o.position.y-=k*.26*smooth(t/.67);
   o.rotation.z+=k*.10*Math.sin(f*.89);
  }
  if(o.name.includes('CHAIR')){
   o.position.y-=k*.39*smooth(t/.66);
   o.rotation.y+=k*.27*Math.sin(f*.7);
  }
  if(o.name.includes('DISAPPEARING_TEXT')){
   o.position.y+=k*.37*smooth(t/.61);
   o.scale.x*=1-k*.38*smooth(t/.80);
  }
  if(o.name.includes('PAGES')){
   o.position.y+=k*.63*smooth(t/.66);
   o.rotation.y+=k*t*4.9;
  }
  if(o.name.includes('TEXTBOOK')){
   o.rotation.z+=k*.27*Math.sin(f);
  }
 }else if(id==='X08'){
  if(o.name.includes('GUARD_HEAD')){
   o.rotation.y+=k*.36*Math.sin(f*.65);
   o.rotation.z+=k*.12*Math.sin(f*.9);
  }
  if(o.name.includes('GUARD_ARMS')){
   o.rotation.z+=k*.30*Math.sin(f*.75);
   o.position.y+=k*.10*Math.sin(f*.71);
  }
  if(o.name.includes('GUARD_BODY')){
   o.position.y+=k*.07*Math.abs(Math.sin(f*.75));
  }
  if(o.name.includes('TURNSTILE')){
   o.rotation.y+=k*t*4.5;
  }
  if(o.name.includes('TIME_PASS')){
   o.position.x+=k*.35*smooth(t/.56);
   o.position.y+=k*.25*Math.sin(f*.7);
   o.rotation.z+=k*.14*Math.sin(f*.86);
  }
  if(o.name.includes('CARD_SCANNER'))
   o.rotation.z+=k*.075*Math.sin(f*.88);
 }
 return true;
}
