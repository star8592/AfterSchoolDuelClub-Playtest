/**
 * R122 - actual 3D projectile travels from the battle floor to an actual
 * mounted spectator. Three-act slapstick: approach -> harmless impact ->
 * clean recovery. Spectator is never assigned HP/damage.
 */
import {ELEMENTS} from './spell-response-contract.mjs';
const clamp=x=>Math.min(1,Math.max(0,x));
const ease=x=>{const a=clamp(x);return a*a*(3-2*a)};
export function createSpectatorChaosFX(THREE,scene,{reducedMotion=false}={}){
 const root=new THREE.Group();root.name='R122_Campus_Spectator_Collateral';scene.add(root);
 const sphere=new THREE.IcosahedronGeometry(.22,1);
 const spark=new THREE.TetrahedronGeometry(.10,0);
 const active=[];let launched=0,impacts=0,expired=0,peak=0;
 const white=new THREE.Color(0xffffff);
 function material(color,opacity=.8){
  return new THREE.MeshBasicMaterial({color,transparent:true,opacity,
   depthWrite:false,side:THREE.DoubleSide,
   blending:THREE.AdditiveBlending});
 }
 function play(incident,anchor,now=0){
  if(!incident||!anchor||!Number.isFinite(now)||!ELEMENTS[incident.element]||
    ![anchor.x,anchor.y,anchor.z].every(Number.isFinite))return false;
  const c=ELEMENTS[incident.element].color;
  const group=new THREE.Group();root.add(group);
  group.name='R122_HARMLESS_'+incident.scenario+'_'+incident.serial;
  // Start near the caster's real world battle half, end on the true spectator
  // body, never in screen space. A wide-angle arena keeps both visible.
  const start=new THREE.Vector3(incident.side==='player'?-1.78:1.78,1.65,-.4);
  const end=new THREE.Vector3(anchor.x,anchor.y+1.35,anchor.z+.28);
  const ball=new THREE.Mesh(sphere,material(c,.92));
  group.add(ball);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.38,.035,7,34),material(c,.7));
  group.add(halo);
  const shards=[];
  for(let j=0;j<(reducedMotion?8:18);j++){
   const obj=new THREE.Mesh(spark,material(j%3===0?white:c,.9));
   group.add(obj);shards.push(obj);
  }
  const path=new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([start,end]),
    new THREE.LineBasicMaterial({color:c,transparent:true,opacity:0,
      blending:THREE.AdditiveBlending,depthWrite:false}));
  group.add(path);
  const light=new THREE.PointLight(c,0,2.8,2);group.add(light);
  active.push({group,ball,halo,shards,path,light,start,end,
   scenario:incident.scenario,element:incident.element,
   now,impacted:false,duration:reducedMotion?.80:1.65});
  launched++;peak=Math.max(peak,active.length);
  while(active.length>4)remove(active.shift());
  return true;
 }
 function remove(a){
  a.group.removeFromParent();
  for(const obj of [...a.shards,a.ball,a.halo,a.path]){
   if(obj!==a.ball&&obj!==a.halo&&obj!==a.path)obj.material.dispose();
  }
  a.ball.material.dispose();a.halo.material.dispose();a.halo.geometry.dispose();a.path.material.dispose();
  a.path.geometry.dispose();expired++;
 }
 function update(now=0){
  for(let i=active.length-1;i>=0;i--){
   const a=active[i],t=Math.max(0,now-a.now);
   if(t>=a.duration){remove(a);active.splice(i,1);continue}
   const projectileTime=reducedMotion?.24:.49;
   const flight=ease(t/projectileTime);
   // Ricochets arc over the back seats, shockwaves approach as a broad pulse.
   const p=a.start.clone().lerp(a.end,flight);
   p.y+=(a.scenario==='ricochet'?1.1:a.scenario==='overshoot'?.65:.34)*
    Math.sin(Math.PI*flight);
   a.ball.position.copy(p);
   a.halo.position.copy(p);a.halo.lookAt(a.end);
   a.ball.visible=a.halo.visible=t<projectileTime;
   a.ball.scale.setScalar((a.scenario==='shockwave'?1.7:1)*(.8+.3*Math.sin(t*17)**2));
   a.halo.scale.setScalar(.8+1.9*flight);
   a.path.material.opacity=reducedMotion?0:t<projectileTime?.10:0;
   const burst=ease((t-projectileTime)/.1)*
    (1-ease((t-projectileTime-.45)/.52));
   if(!a.impacted&&t>=projectileTime){a.impacted=true;impacts++;}
   a.shards.forEach((s,j)=>{
    const angle=j*2.39996;
    const r=(.14+.82*ease((t-projectileTime)/.55))*(1+(j%4)*.09);
    s.visible=t>=projectileTime&&burst>.01;
    s.position.set(a.end.x+Math.cos(angle)*r,
     a.end.y+.24*Math.sin(angle*1.7)+.08*Math.sin(t*9+j),
     a.end.z+.55*Math.sin(angle)*r);
    s.rotation.set(t*5+j,t*7+j*.4,t*6);
    s.scale.setScalar((.35+(j%3)*.13)*burst);
    s.material.opacity=.8*burst;
   });
   a.light.position.copy(t<projectileTime?p:a.end);
   a.light.intensity=(reducedMotion?.7:2.3)*(t<projectileTime?1:burst);
  }
 }
 function dispose(){while(active.length)remove(active.pop());root.removeFromParent();sphere.dispose();spark.dispose()}
 return{play,update,dispose,get stats(){return{
  launched,impacts,expired,active:active.length,peak,
  activeScenarios:active.map(x=>x.scenario),ruleMutations:0
 }}};
}
