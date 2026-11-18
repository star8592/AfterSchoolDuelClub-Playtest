/** R183 8 unique CAMPUS school comedy 3D prop action systems.
 * Fully physical GLB actor transformations only. No shader/light loops.
 * Baselines saved per cloned empty; no cumulative position drift.
 */
export const R183_HERO_IDS=Object.freeze(
 ['P03','S08','X03','Q06','K02','K08','S03','Q01']);
const cl=v=>Math.max(0,Math.min(1,v));
const ease=v=>{v=cl(v);return v*v*(3-2*v)};
const amplitude=t=>ease(t/.14)*(1-ease((t-.82)/.18));
export function r183AnimateActor(id,obj,t,serial){
 if(!R183_HERO_IDS.includes(id)||obj.isMesh||
  !obj.name.startsWith(id+'_')||
  !obj.name.endsWith('_ACTOR'))return false;
 let b=obj.userData.r183Base;
 if(!b){
  b={pos:obj.position.clone(),rot:obj.rotation.clone(),scale:obj.scale.clone()};
  obj.userData.r183Base=b;
 }
 obj.position.copy(b.pos);obj.rotation.copy(b.rot);obj.scale.copy(b.scale);
 const k=amplitude(t),f=15*t;
 if(id==='P03'){
  if(obj.name.includes('LEGS')){
   obj.position.y+=k*.17*Math.abs(Math.sin(f*1.2));
   obj.rotation.z+=k*.07*Math.sin(f*1.4);
  }
  if(obj.name.includes('HEAD')){
   obj.position.y+=k*.14*Math.sin(f);
   obj.rotation.z+=k*.24*Math.sin(f+.7);
  }
  if(obj.name.includes('TAIL'))obj.rotation.y+=k*.45*Math.sin(f*1.3);
  if(obj.name.includes('BODY'))obj.rotation.z+=k*.045*Math.sin(f*1.3);
 }else if(id==='S08'){
  if(obj.name.includes('MACHINE'))obj.rotation.z+=k*.13*Math.sin(f*2);
  if(obj.name.includes('FACE')){
   obj.rotation.z+=k*.13*Math.sin(f*2);
   obj.position.y+=k*.07*Math.sin(f);
  }
  if(obj.name.includes('FLYING_CAN')){
   const shot=ease((t-.18)/.52);
   obj.position.x+=k*1.10*shot;
   obj.position.y+=k*.88*Math.sin(shot*Math.PI);
   obj.rotation.x+=k*t*7;
   obj.rotation.z+=k*t*5;
  }
 }else if(id==='X03'){
  if(obj.name.includes('CAR')){
   obj.position.y+=k*.18*Math.abs(Math.sin(f*1.25));
   obj.rotation.z+=k*.14*Math.sin(f);
  }
  if(obj.name.includes('TICKET')){
   obj.position.y+=k*.26*Math.sin(f+.5);
   obj.rotation.y+=k*t*4.4;
  }
 }else if(id==='Q06'){
  if(obj.name.includes('SHADE')){
   obj.rotation.z+=k*.24*Math.sin(f*.9);
   obj.position.y+=k*.07*Math.sin(f);
  }
  if(obj.name.includes('BUTTONS')){
   // THREE beats: left/right/last button press movement.
   const beat=Math.floor(Math.max(0,t-.06)*8)%3;
   obj.position.y-=k*.045*(beat+1)/3;
   obj.rotation.z+=k*.08*Math.sin(t*27);
  }
  if(obj.name.includes('BASE'))
   obj.rotation.z+=k*.02*Math.sin(f);
 }else if(id==='K02'){
  if(obj.name.includes('MELON')){
   obj.rotation.z+=k*.22*Math.sin(f);
   obj.position.y+=k*.09*Math.abs(Math.sin(f*1.1));
  }
  if(obj.name.includes('ERASER')){
   obj.position.y+=k*.40*Math.sin(ease(t/.50)*Math.PI);
   obj.rotation.y+=k*t*4.8;
   obj.rotation.z+=k*.15*Math.sin(f+.9);
  }
 }else if(id==='K08'){
  if(obj.name.includes('BANANA')){
   obj.position.y+=k*.12*Math.abs(Math.sin(f*1.3));
   obj.rotation.z+=k*.13*Math.sin(f);
  }
  if(obj.name.includes('ARMOR'))obj.rotation.y+=k*.22*Math.sin(f);
  if(obj.name.includes('HELMET'))obj.rotation.z+=k*.16*Math.sin(f+1);
  if(obj.name.includes('SHIELD')){
   obj.position.x+=k*.28*ease(t/.45);
   obj.rotation.y+=k*.30*Math.sin(f*1.2);
  }
 }else if(id==='S03'){
  if(obj.name.includes('BROOM')){
   obj.rotation.z+=k*.32*Math.sin(f*.83);
   obj.position.y+=k*.26*ease(t/.56);
  }
  if(obj.name.includes('DUST')){
   obj.position.y+=k*.70*ease(t/.72);
   obj.rotation.z+=k*.15*Math.sin(f*1.4);
  }
 }else if(id==='Q01'){
  if(obj.name.includes('ERASER')){
   obj.position.y+=k*.13*Math.abs(Math.sin(f));
   obj.rotation.z+=k*.15*Math.sin(f);
  }
  if(obj.name.includes('PENCIL')){
   obj.position.x+=k*.25*Math.sin(f*2.2);
   obj.position.y+=k*.13*Math.sin(f*2.1);
   obj.rotation.z+=k*.17*Math.sin(f*2.2);
  }
  if(obj.name.includes('PAPER')){
   obj.rotation.y+=k*.16*Math.sin(f*.8);
  }
 }
 return true;
}
