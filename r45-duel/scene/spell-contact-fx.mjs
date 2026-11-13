/**
 * R121 — target-anchored physical spell contact. Never mutates game rules.
 * Different geometries / movement envelopes for the fifteen elements,
 * deliberately not one recolored sphere. No third-party effect assets.
 */
import {ELEMENTS} from './spell-response-contract.mjs';
const clamp=x=>Math.min(1,Math.max(0,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
export function createSpellContactFX(THREE,scene,{reducedMotion=false}={}){
 const root=new THREE.Group();root.name='R121_Elemental_Real_Target_Contacts';
 scene.add(root);
 const active=[];const MAX=8;
 let spawned=0,expired=0,rejected=0,peak=0;
 function add(parent,geometry,color,opacity=.82,glow=false){
  const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity,
   depthWrite:false,side:THREE.DoubleSide,
   blending:glow?THREE.AdditiveBlending:THREE.NormalBlending});
  const mesh=new THREE.Mesh(geometry,material);
  parent.add(mesh);mesh.userData.baseOpacity=opacity;
  return mesh;
 }
 function shard(group,color,i,n,shape='crystal'){
  const geom=shape==='disc'?new THREE.TorusGeometry(.18,.036,6,15):
    shape==='leaf'?new THREE.ConeGeometry(.13,.48,5):
    shape==='rock'?new THREE.DodecahedronGeometry(.17,0):
    new THREE.TetrahedronGeometry(.15,0);
  const obj=add(group,geom,color,.85,i%2===0);
  const a=i*Math.PI*2/n;
  obj.position.set(Math.cos(a)*.34,.65+(.21*(i%4)),Math.sin(a)*.32);
  obj.userData.angle=a;obj.userData.phase=i;obj.userData.role=shape;
  return obj;
 }
 function play(signature,anchor,now=0,{kind='host'}={}){
  const element=ELEMENTS[signature?.element];
  if(!element||!Number.isFinite(now)||!anchor||!Number.isFinite(anchor.x)||
     !Number.isFinite(anchor.y)||!Number.isFinite(anchor.z)){
   rejected++;return false;
  }
  const group=new THREE.Group();group.name='R121_CONTACT_'+signature.element+'_'+signature.id;
  group.position.set(anchor.x,anchor.y,anchor.z);root.add(group);
  const color=element.color;const accent=new THREE.Color(color).lerp(new THREE.Color(0xffffff),.53);
  const parts=[];
  const ringCount=['water','wind','sound','time','space','mind','shadow'].includes(signature.element)?3:1;
  for(let i=0;i<ringCount;i++){
   const ring=add(group,new THREE.TorusGeometry(.38+i*.19,.032,6,36),
    i%2?accent:color,.57,true);
   ring.position.y=kind==='host'?1.25:1.05;
   ring.rotation.x=signature.element==='wind'||signature.element==='space'?.2:Math.PI/2;
   ring.userData.role='ring';ring.userData.phase=i;parts.push(ring);
  }
  let shape='crystal';
  if(['fire','wood','wind'].includes(signature.element))shape='leaf';
  if(['water','ice','sound','time','mind','space'].includes(signature.element))shape='disc';
  if(['earth','absurd','shadow'].includes(signature.element))shape='rock';
  const count=reducedMotion?5:signature.element==='electric'?11:8;
  for(let i=0;i<count;i++)parts.push(shard(group,i%2?color:accent,i,count,shape));
  if(signature.element==='electric'){
   for(let i=0;i<4;i++){
    const pts=[[-.34,1.8,-.05],[-.1+(i%2)*.11,1.36,.04],[.20,1.15,-.1],[.07,.72,.12]];
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      pts.map(p=>new THREE.Vector3(...p))),
     new THREE.LineBasicMaterial({color,transparent:true,opacity:.9,
       depthWrite:false,blending:THREE.AdditiveBlending}));
    line.rotation.y=i*Math.PI*.5;group.add(line);
    line.userData={role:'bolt',baseOpacity:.9,phase:i};parts.push(line);
   }
  }
  const light=new THREE.PointLight(color,0,reducedMotion?1.6:2.3,2);
  light.position.y=1.14;group.add(light);
  const duration=reducedMotion?.46:signature.element==='ice'||signature.element==='time'?1.02:.82;
  active.push({group,parts,light,element:signature.element,started:now,duration,
   id:signature.id,target:kind});
  spawned++;peak=Math.max(peak,active.length);
  while(active.length>MAX)disposeOne(active.shift());
  return true;
 }
 function disposeOne(fx){
  fx.group.removeFromParent();
  fx.group.traverse(o=>{o.geometry?.dispose?.();o.material?.dispose?.()});
  expired++;
 }
 function update(now){
  for(let i=active.length-1;i>=0;i--){
   const a=active[i],elapsed=now-a.started;
   if(elapsed<0)continue;
   if(elapsed>=a.duration){disposeOne(a);active.splice(i,1);continue}
   const t=elapsed/a.duration,appear=smooth(t/.13),fade=1-smooth((t-.60)/.40),strength=appear*fade;
   const frozen=a.element==='ice'||a.element==='time';
   for(const p of a.parts){
    const {role,phase=0,angle=0,baseOpacity=.8}=p.userData;
    if(role==='ring'){
     p.scale.setScalar(.55+1.75*smooth(t));
     p.rotation.z+=(frozen?0:.016)*(phase%2?1:-1);
     p.material.opacity=baseOpacity*strength;
    }else if(role==='bolt'){
     p.visible=t<.69&&(Math.floor(t*21+phase)%3!==0);
     p.material.opacity=baseOpacity*strength;
    }else{
     const radial=frozen?.37:.37+1.17*smooth(t/.72);
     p.position.x=Math.cos(angle)*radial;
     p.position.z=Math.sin(angle)*radial*.75;
     if(a.element==='water')p.position.y=.25+.62*Math.abs(Math.sin(t*9+phase));
     else if(a.element==='wind')p.position.y=.42+t*1.15+.20*Math.sin(t*17+phase);
     else if(a.element==='fire')p.position.y=.45+t*1.37;
     else if(a.element==='electric')p.position.y=.52+.92*Math.abs(Math.sin(t*19+phase));
     else if(a.element==='earth')p.position.y=.84-1.2*smooth(t);
     else if(frozen)p.position.y=.40+(phase%5)*.24;
     else p.position.y=.52+.55*smooth(t)+.12*Math.sin(t*13+phase);
     p.rotation.z=t*(frozen?.2:5)+(phase*.67);
     p.scale.setScalar((.40+.93*smooth(t/.27))*fade);
     p.material.opacity=baseOpacity*strength;
    }
   }
   a.light.intensity=(reducedMotion?.7:2.5)*strength;
  }
 }
 function dispose(){while(active.length)disposeOne(active.pop());root.removeFromParent()}
 return {play,update,dispose,get stats(){return{
  elements:Object.keys(ELEMENTS).length,spawned,expired,rejected,active:active.length,
  peak,activeElements:active.map(x=>x.element),ruleMutations:0
 }}};
}
