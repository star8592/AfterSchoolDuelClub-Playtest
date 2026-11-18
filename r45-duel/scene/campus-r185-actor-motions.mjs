/**
 * R185 independent original "school object comes alive" actor performance.
 * Works on physical Blender parent Empties, never an effect-only glow ring.
 * Reset original rest pose every frame to avoid perpetual drift.
 */
export const R185_HERO_IDS=Object.freeze(
 ['G06','T05','K05','Q03','Q04','Q07','Q08','S02','S05','S07']);
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const env=t=>smooth(t/.14)*(1-smooth((t-.87)/.13));
export function r185AnimateActor(id,o,t,serial){
 if(!R185_HERO_IDS.includes(id)||o.isMesh||
   !o.name.startsWith(id+'_')||!o.name.endsWith('_ACTOR'))return false;
 let b=o.userData.r185Rest;
 if(!b){
  b={p:o.position.clone(),r:o.rotation.clone(),s:o.scale.clone()};
  o.userData.r185Rest=b;
 }
 o.position.copy(b.p);o.rotation.copy(b.r);o.scale.copy(b.s);
 const k=env(t),f=15*t;
 if(id==='G06'){
  if(o.name.includes('PAGE_TURN')){
   o.rotation.x+=k*.42*Math.sin(f*.8);
   o.position.y+=k*.12*smooth(t/.55);
  }
  if(o.name.includes('POPUP')){
   o.position.y+=k*.36*smooth(t/.5);
   o.rotation.z+=k*.13*Math.sin(f*1.2);
  }
  if(o.name.includes('BOOK'))
   o.rotation.y+=k*.11*Math.sin(f*.7);
 }else if(id==='T05'){
  if(o.name.includes('SOUP_BOWL')){
   o.rotation.z+=k*.11*Math.sin(f*.9);
   o.position.y+=k*.07*Math.sin(f*.85);
  }
  if(o.name.includes('SPOON')){
   o.rotation.y+=k*.25*Math.sin(f);
   o.rotation.z+=k*.18*Math.sin(f*1.3);
   o.position.y+=k*.16*smooth(t/.54);
  }
  if(o.name.includes('STEAM')){
   o.position.y+=k*.48*smooth(t/.71);
   o.rotation.z+=k*.12*Math.sin(f*.56);
  }
 }else if(id==='K05'){
  if(o.name.includes('EMPTY_BOWL')){
   o.rotation.z+=k*.12*Math.sin(f*.9);
   o.position.y+=k*.06*Math.abs(Math.sin(f));
  }
  if(o.name.includes('SPOON')){
   o.rotation.z+=k*.20*Math.sin(f*.8);
   o.position.y+=k*.23*smooth(t/.55);
  }
  if(o.name.includes('AIR_CURRENT')){
   o.position.y+=k*.56*smooth(t/.70);
   o.scale.y*=1+k*.19*Math.sin(f*.85);
  }
  if(o.name.includes('EMPTY_MENU'))
   o.rotation.y+=k*.32*Math.sin(f);
 }else if(id==='Q03'){
  if(o.name.includes('EYES')){
   o.position.y+=k*.028*Math.sin(f);
   o.rotation.z+=k*.085*Math.sin(f*.7);
  }
  if(o.name.includes('CHALK_HAND')){
   o.position.x+=k*.26*Math.sin(f*1.2);
   o.position.y+=k*.15*Math.sin(f*.91);
   o.rotation.x+=k*.15*Math.sin(f);
  }
  if(o.name.includes('WRITING')){
   o.position.y+=k*.12*Math.abs(Math.sin(f));
   o.scale.x*=1+k*.09*Math.sin(f);
  }
 }else if(id==='Q04'){
  if(o.name.includes('PHONE')){
   o.rotation.z+=k*.17*Math.sin(f*1.6);
   o.position.y+=k*.09*Math.abs(Math.sin(f*1.7));
  }
  if(o.name.includes('SPEAKER')){
   o.scale.z*=1+k*.10*Math.sin(f*2.2);
   o.rotation.y+=k*.09*Math.sin(f);
  }
  if(o.name.includes('GLASS')){
   o.position.y+=k*.17*Math.abs(Math.sin(f*2));
   o.rotation.z+=k*.13*Math.sin(f*1.9);
  }
 }else if(id==='Q07'){
  if(o.name.includes('REAL_MOON')){
   o.rotation.y+=k*t*4.4;
   o.position.y+=k*.16*Math.sin(f*.52);
  }
  if(o.name.includes('CARDBOARD_MOON')){
   o.rotation.y-=k*t*6;
   o.rotation.z+=k*.20*Math.sin(f);
   o.position.y+=k*.26*Math.sin(f*.71);
  }
 }else if(id==='Q08'){
  if(o.name.includes('CHALK_PRISON')){
   o.scale.x*=1+k*.19*Math.sin(f*.70);
   o.scale.y*=1+k*.16*Math.sin(f*.85);
   o.position.y+=k*.035*Math.sin(f*.66);
  }
  if(o.name.includes('CHALK_STICK')){
   o.position.x+=k*.25*Math.sin(f);
   o.rotation.y+=k*.21*Math.sin(f*1.15);
  }
  if(o.name.includes('LOCK')){
   o.position.y+=k*.17*Math.abs(Math.sin(f));
   o.rotation.z+=k*.14*Math.sin(f);
  }
 }else if(id==='S02'){
  if(o.name.includes('LID')){
   o.rotation.x+=k*.45*smooth(t/.52);
   o.position.y+=k*.13*Math.sin(f*.75);
  }
  if(o.name.includes('ONLY_PENCIL')){
   o.position.y+=k*.29*smooth(t/.62);
   o.rotation.y+=k*.30*Math.sin(f);
   o.rotation.z+=k*.21*Math.sin(f*.75);
  }
  if(o.name.includes('CASE_BODY'))
   o.rotation.z+=k*.055*Math.sin(f*.6);
 }else if(id==='S05'){
  if(o.name.includes('ROBOT_HEAD')){
   o.rotation.y+=k*.45*Math.sin(f*.7);
   o.rotation.z+=k*.13*Math.sin(f*1.2);
  }
  if(o.name.includes('ROBOT_ARMS')){
   o.rotation.z+=k*.38*Math.sin(f*.8);
   o.position.y+=k*.12*Math.sin(f*.86);
  }
  if(o.name.includes('ATTENDANCE_LIST')){
   o.rotation.y-=k*.35*Math.sin(f);
   o.position.y+=k*.13*Math.abs(Math.sin(f));
  }
  if(o.name.includes('ROBOT_BODY'))
   o.position.y+=k*.09*Math.abs(Math.sin(f*1.5));
 }else if(id==='S07'){
  if(o.name.includes('CORRIDOR_DOORS')){
   o.scale.x*=1+k*.13*Math.sin(f*.5);
   o.rotation.y+=k*.13*Math.sin(f*.5);
  }
  if(o.name.includes('BELL')){
   o.rotation.z+=k*.29*Math.sin(f*1.8);
   o.position.y+=k*.10*Math.sin(f*1.7);
  }
  if(o.name.includes('CLAPPER')){
   o.rotation.z+=k*.43*Math.sin(f*2.6);
  }
  if(o.name.includes('TIMETABLE')){
   o.position.y+=k*.54*smooth(t/.62);
   o.rotation.z+=k*t*2.3;
  }
 }
 return true;
}
