import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {UNIT_MODEL_SPECS} from '../scene/summon-models.mjs';
const p=new URLSearchParams(location.search),id=p.get('id')||'E03';
const spec=UNIT_MODEL_SPECS[id];
let ready=false,fail=null,meshes=0,bones=0,extent=null,boneNames=[];
const renderer=new THREE.WebGLRenderer({canvas:document.querySelector('#portrait'),alpha:true,antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight,false);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
renderer.setClearColor(0x000000,0);
const scene=new THREE.Scene();
scene.add(new THREE.HemisphereLight('#e8f5ff','#5c6477',2.0));
const key=new THREE.DirectionalLight('#ffe3bf',4.25);key.position.set(-4.2,8,7);scene.add(key);
const fill=new THREE.DirectionalLight('#92c6ff',2.5);fill.position.set(3,4,5);scene.add(fill);
const rim=new THREE.DirectionalLight('#e8acff',2.9);rim.position.set(5,5,-5);scene.add(rim);
const camera=new THREE.PerspectiveCamera(36,innerWidth/innerHeight,.01,30);
camera.position.set(0,1.42,5.6);camera.lookAt(0,1.42,0);
window.__R103Studio={get ready(){return ready},get error(){return fail},get meshes(){return meshes},get bones(){return bones},get extent(){return extent},get boneNames(){return boneNames},id};
async function main(){
 if(!spec)throw Error('no known actual GLB registry entry for '+id);
 // Use exact main-branch GLBs, not abandoned low-poly alternatives or internet models.
 let file=spec.file;
 if(id==='E02')file='E02-R60-PhotoPaper-WingFlex-STUDY.glb';
 const gltf=await new GLTFLoader().loadAsync('../assets/summons/'+file);
 const model=gltf.scene;
 model.traverse(o=>{if(o.isMesh)meshes++;if(o.isBone){bones++;boneNames.push(o.name)};
   if(o.isMesh){o.frustumCulled=false;o.castShadow=false}});
 if(meshes<1)throw Error('empty GLB '+id);
 // Studio-only acting pose on the source rig: replace asset T-pose without
 // changing the original production GLB or cloning a low-poly stand-in.
 if(id==='M01'||id==='M02'){
  model.traverse(o=>{
   if(!o.isBone)return;
   const n=o.name.toLowerCase();
   if(!/(upperarm|upper_arm|shoulder|arm_l|arm_r|leftarm|rightarm)/.test(n))return;
   const left=/(left|\.l|_l|arm_l)/.test(n);
   const right=/(right|\.r|_r|arm_r)/.test(n);
   if(left===right)return;
   o.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0,0,1),(left?.87:-.87)));
  });
 }
 const bbox=new THREE.Box3().setFromObject(model,true);
 const size=bbox.getSize(new THREE.Vector3());
 extent={size:size.toArray(),file,meshes,bones};
 const scale=(spec.kind==='character'?2.72:2.05)/Math.max(.01,size.y);
 const center=bbox.getCenter(new THREE.Vector3());
 model.scale.setScalar(scale);
 model.position.copy(center.multiplyScalar(-scale));
 model.position.y+=1.32;
 const pivot=new THREE.Group();pivot.add(model);
 pivot.rotation.y=Number(p.get('yaw')||'0');
 scene.add(pivot);
 let frames=0;const render=()=>{
  renderer.render(scene,camera);
  frames++;
  if(frames>=19){ready=true;return}
  requestAnimationFrame(render);
 };requestAnimationFrame(render);
}
main().catch(e=>{fail=String(e);console.error('R103_CARD_REAL_GLTF_FAIL',id,e)});
