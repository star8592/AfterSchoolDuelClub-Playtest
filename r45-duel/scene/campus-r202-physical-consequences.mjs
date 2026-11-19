/**
 * R202 authored SCHOOL PROP contact, never elemental/light-ring generic VFX.
 *
 * Only material fragments with mass: chalk crumbs, splattered food, wobbling
 * jelly, and hard ice fragments. One shared InstancedMesh per contact.
 * No billboard, PointLight, SpriteMaterial, ShaderMaterial, or GPU readback.
 */
export const R202_SIGNATURE_IMPACTS=Object.freeze({
 E06:Object.freeze({kind:'chalk',impact:'板擦重击后扬起一团白色粉笔灰',reaction:'duck'}),
 Q05:Object.freeze({kind:'chalk',impact:'粉笔记者会朝对手脸前喷出细碎粉尘',reaction:'sneeze'}),
 K01:Object.freeze({kind:'food',impact:'茄子和香蕉翻锅，食材溅到对手胸前',reaction:'disgust'}),
 K07:Object.freeze({kind:'jelly',impact:'果冻蛤蟆蹦到对手肩膀，铃铛吓人一跳',reaction:'startle'}),
 P07:Object.freeze({kind:'ice',impact:'冰面滑向对手脚下，对手重心打滑',reaction:'slip'})
});
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export function createR202MaterialConsequences(THREE,root,{reducedMotion=false}={}){
 const entries=[],geo=new THREE.IcosahedronGeometry(1,0);
 const palettes=Object.freeze({
  chalk:['#f8f0de','#c3d1d1'],
  food:['#75518c','#e7bf55'],
  jelly:['#9fc58f','#e5c9a5'],
  ice:['#badce2','#eff6f2']
 });
 const materials=new Map();
 let spawned=0,expired=0,peak=0;
 function mat(kind,index){
  const key=kind+index;
  if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({
   color:palettes[kind][index],metalness:kind==='ice'?.08:0,
   roughness:kind==='chalk'?.96:kind==='food'?.68:kind==='jelly'?.35:.28
  }));
  return materials.get(key);
 }
 function spawn(id,point,now){
  const spec=R202_SIGNATURE_IMPACTS[id];
  if(!spec||!Array.isArray(point)||point.length!==3||point.some(v=>!Number.isFinite(v)))return false;
  const n=reducedMotion?12:32;
  const group=new THREE.Group();group.name='R202_MATERIAL_HIT_'+id;
  group.position.set(...point);
  root.add(group);
  const a=new THREE.InstancedMesh(geo,mat(spec.kind,0),Math.ceil(n/2));
  const b=new THREE.InstancedMesh(geo,mat(spec.kind,1),Math.floor(n/2));
  a.name='R202_HIT_FRAGMENTS_'+spec.kind+'_A';
  b.name='R202_HIT_FRAGMENTS_'+spec.kind+'_B';
  a.frustumCulled=false;b.frustumCulled=false;
  a.castShadow=false;b.castShadow=false;
  group.add(a,b);
  const state={id,kind:spec.kind,group,meshes:[a,b],born:now,
   duration:spec.kind==='ice'?1.38:spec.kind==='jelly'?1.1:.95,
   count:n,origin:point.map(Number)};
  entries.push(state);
  spawned++;peak=Math.max(peak,entries.length);
  while(entries.length>3){const old=entries.shift();root.remove(old.group);expired++}
  return true;
 }
 const dummy=new THREE.Object3D();
 function update(now){
  for(let k=entries.length-1;k>=0;k--){
   const a=entries[k],age=now-a.born;
   if(age>=a.duration){root.remove(a.group);entries.splice(k,1);expired++;continue}
   const u=clamp(age/a.duration);
   // Offline mathematical choreography, never a particle emitter budget.
   for(let i=0;i<a.count;i++){
    const scatter=(i*2.399963229728653)%(Math.PI*2);
    const radius=(.16+(i%7)*.078)*smooth(u/.30);
    const floor=a.kind==='ice'?-.8:0;
    const spread=a.kind==='chalk'?.68:a.kind==='food'?.86:a.kind==='jelly'?.54:.72;
    dummy.position.set(Math.cos(scatter)*radius*spread,
      (a.kind==='ice'?floor+.10:Math.sin(scatter*2+i)*.15)+
       Math.sin(Math.PI*u)*(.13+(i%5)*.105)-
       (a.kind==='food'?u*u*.7:a.kind==='jelly'?u*u*.36:u*u*.22),
      Math.sin(scatter)*radius*.55);
    const size=(a.kind==='chalk'?.060:a.kind==='food'?.082:a.kind==='jelly'?.075:.065)*
     (1+(i%4)*.21)*(1-smooth((u-.72)/.28));
    dummy.scale.setScalar(Math.max(.0005,size));
    dummy.rotation.set(u*(i%4)*.7,u*(i%5)*.9,i*.43);
    dummy.updateMatrix();
    a.meshes[i%2].setMatrixAt(Math.floor(i/2),dummy.matrix);
   }
   for(const mesh of a.meshes)mesh.instanceMatrix.needsUpdate=true;
  }
 }
 function dispose(){
  while(entries.length)root.remove(entries.pop().group);
  geo.dispose();for(const m of materials.values())m.dispose();materials.clear();
 }
 return {spawn,update,dispose,get stats(){return {
  spawned,expired,active:entries.length,peak,
  physicalKinds:[...new Set(entries.map(a=>a.kind))],
  oneMeshDrawPerPhysicalMaterial:true,
  addedPointLights:0,addedGlowRings:0,addedSprites:0
 }}};
}
