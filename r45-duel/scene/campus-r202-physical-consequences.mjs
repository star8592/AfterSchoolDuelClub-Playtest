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
 P07:Object.freeze({kind:'ice',impact:'冰面滑向对手脚下，对手重心打滑',reaction:'slip'}),
 // R203: five additional actual source-prop consequences. These are
 // separately gated by r203BodyHit; R202's original five do not change.
 K04:Object.freeze({kind:'chili',impact:'辣椒月饼在对手脸前爆开辣椒碎粒',reaction:'hot'}),
 S08:Object.freeze({kind:'soda',impact:'原售货机实物汽水罐击中胸前喷出汽水珠',reaction:'spray'}),
 P03:Object.freeze({kind:'cardboard',impact:'纸箱恐龙踩到脚前纸板碎片散开',reaction:'stumble'}),
 X05:Object.freeze({kind:'paper',impact:'原版作业纸从头顶卷到对手脸前',reaction:'paperstorm'}),
 Q07:Object.freeze({kind:'moon',impact:'第二个纸板月亮落在对手头顶，碎纸板掉落',reaction:'moonfall'})
});
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
export function createR202MaterialConsequences(THREE,root,{reducedMotion=false}={}){
 const entries=[],geo=new THREE.IcosahedronGeometry(1,0);
 const r203Geos=new Map();
 const palettes=Object.freeze({
  chalk:['#f8f0de','#c3d1d1'],
  food:['#75518c','#e7bf55'],
  jelly:['#9fc58f','#e5c9a5'],
  ice:['#badce2','#eff6f2'],
  chili:['#a83225','#f7a24b'],
  soda:['#a7d5d2','#bfdbe4'],
  cardboard:['#af8862','#e8cda2'],
  paper:['#fff5dc','#b1cce2'],
  moon:['#d3c5aa','#a4b7bf']
 });
 const r203Shapes=Object.freeze({
  chili:()=>new THREE.ConeGeometry(1,2.1,5),
  soda:()=>new THREE.SphereGeometry(1,7,5),
  cardboard:()=>new THREE.BoxGeometry(1,.14,.65),
  paper:()=>new THREE.PlaneGeometry(1,1.4),
  moon:()=>new THREE.IcosahedronGeometry(1,1)
 });
 function shape(kind){
  if(!r203Shapes[kind])return geo;
  if(!r203Geos.has(kind))r203Geos.set(kind,r203Shapes[kind]());
  return r203Geos.get(kind);
 }
 const materials=new Map();
 let spawned=0,expired=0,peak=0;
 function mat(kind,index){
  const key=kind+index;
  if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({
   color:palettes[kind][index],metalness:kind==='ice'?.08:0,
   roughness:kind==='chalk'?.96:kind==='food'?.68:
    kind==='jelly'?.35:kind==='soda'?.23:kind==='paper'?.92:
    kind==='cardboard'?.98:kind==='chili'?.57:.34,
   side:kind==='paper'?THREE.DoubleSide:THREE.FrontSide
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
  const a=new THREE.InstancedMesh(shape(spec.kind),mat(spec.kind,0),Math.ceil(n/2));
  const b=new THREE.InstancedMesh(shape(spec.kind),mat(spec.kind,1),Math.floor(n/2));
  a.name='R202_HIT_FRAGMENTS_'+spec.kind+'_A';
  b.name='R202_HIT_FRAGMENTS_'+spec.kind+'_B';
  a.frustumCulled=false;b.frustumCulled=false;
  a.castShadow=false;b.castShadow=false;
  group.add(a,b);
  const state={id,kind:spec.kind,group,meshes:[a,b],born:now,
   duration:['paper','moon','cardboard'].includes(spec.kind)?1.45:
    spec.kind==='ice'?1.38:spec.kind==='jelly'?1.1:.95,
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
    const kind=a.kind;
    const floor=kind==='ice'?-.8:0;
    const spread=kind==='chalk'?.68:kind==='food'?.86:kind==='jelly'?.54:
     kind==='paper'?1.42:kind==='soda'?1.3:kind==='moon'?.77:.92;
    const rise=kind==='paper'?.43:kind==='soda'?.22:kind==='chili'?.18:
     kind==='moon'?.08:.13;
    const gravity=kind==='paper'?.26:kind==='soda'?.88:
     kind==='moon'?.95:kind==='cardboard'?.88:
     kind==='food'?.7:kind==='jelly'?.36:.22;
    dummy.position.set(Math.cos(scatter)*radius*spread,
      (kind==='ice'?floor+.10:Math.sin(scatter*2+i)*.15)+
       Math.sin(Math.PI*u)*(rise+(i%5)*.105)-u*u*gravity,
      Math.sin(scatter)*radius*(kind==='paper'?1.0:kind==='soda'?.9:.55));
    const size=(kind==='chalk'?.060:kind==='food'?.082:kind==='jelly'?.075:
     kind==='chili'?.090:kind==='soda'?.072:kind==='paper'?.19:
     kind==='cardboard'?.17:kind==='moon'?.13:.065)*
     (1+(i%4)*.18)*(1-smooth((u-.72)/.28));
    dummy.scale.setScalar(Math.max(.0005,size));
    const flutter=kind==='paper'?2.6:kind==='cardboard'?1.55:1;
    dummy.rotation.set(u*(i%4)*.7*flutter,u*(i%5)*.9*flutter,
     i*.43+(kind==='paper'?u*6:kind==='moon'?u*2:0));
    dummy.updateMatrix();
    a.meshes[i%2].setMatrixAt(Math.floor(i/2),dummy.matrix);
   }
   for(const mesh of a.meshes)mesh.instanceMatrix.needsUpdate=true;
  }
 }
 function dispose(){
  while(entries.length)root.remove(entries.pop().group);
  geo.dispose();for(const g of r203Geos.values())g.dispose();r203Geos.clear();
  for(const m of materials.values())m.dispose();materials.clear();
 }
 return {spawn,update,dispose,get stats(){return {
  spawned,expired,active:entries.length,peak,
  physicalKinds:[...new Set(entries.map(a=>a.kind))],
  oneMeshDrawPerPhysicalMaterial:true,
  addedPointLights:0,addedGlowRings:0,addedSprites:0
 }}};
}
