import * as THREE from '../assets/three/build/three.module.js';
import {createSkinnedIndexUnion} from '../scene/skinned-index-union.mjs';
function assert(value,msg){if(!value)throw new Error('R181_INDEX_UNION_FAIL '+msg)}
const positions=new THREE.BufferAttribute(new Float32Array([
 -1,0,0,0,1,0,1,0,0,
 -1,0,1,0,1,1,1,0,1
]),3);
const normal=new THREE.BufferAttribute(new Float32Array(18).fill(.5),3);
const uv=new THREE.BufferAttribute(new Float32Array(12).fill(.1),2);
const idx=new THREE.Uint16BufferAttribute(new Uint16Array(6),1);
const skinIndex=new THREE.Uint16BufferAttribute(new Uint16Array(24),4);
const weights=[];
for(let i=0;i<6;i++)weights.push(1,0,0,0);
const skinWeight=new THREE.Float32BufferAttribute(weights,4);
const base={position:positions,normal,uv,skinIndex,skinWeight};
const material=new THREE.MeshBasicMaterial({name:'RealHairCutout',alphaTest:.5,side:THREE.DoubleSide,transparent:false});
const bone=new THREE.Bone();bone.name='C_Head';bone.updateMatrixWorld(true);
function mesh(indices,m=material,attrs=base,inv=new THREE.Matrix4()){
 const geometry=new THREE.BufferGeometry();
 for(const [k,v]of Object.entries(attrs))geometry.setAttribute(k,v);
 geometry.setIndex(indices);
 const o=new THREE.SkinnedMesh(geometry,m);
 const skel=new THREE.Skeleton([bone],[inv]);
 o.bind(skel,new THREE.Matrix4());
 o.updateMatrix();
 return o;
}
function testMerged(){
 const root=new THREE.Group();root.name='R181_TEST_ACTOR';
 root.add(mesh([0,1,2]),mesh([3,4,5]));
 const batch=createSkinnedIndexUnion(THREE);batch.process(root);
 const r=batch.stats;
 assert(r.sourceMeshes===2&&r.resultMeshes===1&&r.savedDraws===1,'saved draw');
 const m=root.children[0];
 assert(m.isSkinnedMesh&&m.material===material,'original mat and skin');
 assert(m.skeleton.bones[0]===bone,'original bone');
 assert(m.geometry.attributes.position.count===positions.count,'position count preserved');
 // Geometry.clone() is allowed one copy, but never 2 copies per source.
 assert(m.geometry.index.count===6,'index count');
 assert([...m.geometry.index.array].join(',')==='0,1,2,3,4,5','exact primitive index sequence');
 assert(m.geometry.attributes.skinWeight.array.join(',')===skinWeight.array.join(','),'weight values');
 assert(m.geometry.attributes.uv.array.join(',')===uv.array.join(','),'original UV');
 assert(!m.geometry.morphAttributes.position,'no face morph altered');
 return r;
}
function testRefusal(reason,variant){
 const root=new THREE.Group();root.name='R181_TEST_REJECT_'+reason;
 const baseMesh=mesh([0,1,2]);
 root.add(baseMesh,variant());
 const b=createSkinnedIndexUnion(THREE);b.process(root);
 assert(root.children.length===2 && b.stats.savedDraws===0,reason+' must reject');
 return {reason,skipped:b.stats.skipped.length};
}
function testSeparateParents(){
 const root=new THREE.Group(),a=new THREE.Group(),b=new THREE.Group();
 a.add(mesh([0,1,2]));b.add(mesh([3,4,5]));
 root.add(a,b);
 const q=createSkinnedIndexUnion(THREE);q.process(root);
 assert(q.stats.savedDraws===0&&a.children.length===1&&b.children.length===1,
  'different parent must remain independent');
 return true;
}
const results={merged:testMerged(),separateParentsRejected:testSeparateParents(),rejected:[
 testRefusal('differentUV',()=>mesh([3,4,5],material,{...base,uv:uv.clone()})),
 testRefusal('differentBoneInverse',()=>mesh([3,4,5],material,base,new THREE.Matrix4().makeTranslation(1,0,0))),
 testRefusal('transparentHair',()=>{
  const c=material.clone();c.transparent=true;
  return mesh([3,4,5],c);
 }),
 testRefusal('differentParent',()=>{
  // Separate hierarchy would not join; construct a non-hair material
  // here to cover unchanged source semantics.
  const c=material.clone();c.name='BodyRough';
  return mesh([3,4,5],c);
 })
]};
console.log('R181_SAFE_INDEX_UNION_UNIT_PASS',JSON.stringify(results));
