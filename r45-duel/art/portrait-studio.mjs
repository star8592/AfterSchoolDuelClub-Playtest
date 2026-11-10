/**
 * Build-time true-3D portrait renderer for VRM actors.
 * Source models stay untouched; the final portrait is real mesh, not AI text2image.
 */
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const params=new URLSearchParams(location.search);
const id=params.get('id')==='G01'?'G01':'E01';
const source=id==='E01'?'Shino-original-CC0.vrm':'Fumiriya-original-CC0.vrm';
const canvas=document.getElementById('portrait');
let ready=false,meshCount=0,boneCount=0;
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.07;
renderer.setPixelRatio(1);
renderer.setSize(innerWidth,innerHeight,false);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.1,25);
camera.position.set(0,1.9,4.05);camera.lookAt(0,1.9,0);
scene.add(new THREE.HemisphereLight('#d4edff','#455c6d',1.9));
const key=new THREE.DirectionalLight('#ffe0c8',3.3);key.position.set(-3,6,5);scene.add(key);
const fill=new THREE.DirectionalLight('#96bce6',1.65);fill.position.set(4,3,2);scene.add(fill);
const rim=new THREE.DirectionalLight('#b5defd',2.6);rim.position.set(3,5,-4);scene.add(rim);
async function main(){
 const gltf=await new GLTFLoader().loadAsync('../assets/model/'+source);
 const model=gltf.scene;
 model.traverse(o=>{if(o.isMesh)meshCount++;if(o.isBone)boneCount++;});
 // True VRM bones, not a generic auto-posed avatar replacement.
 model.traverse(o=>{
  if(!o.isBone)return;
  let z=0;
  if(o.name==='J_Bip_R_UpperArm')z=-1.10;
  if(o.name==='J_Bip_L_UpperArm')z=1.10;
  if(z)o.quaternion.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,0,z)));
 });
 const box=new THREE.Box3().setFromObject(model,true);
 const size=box.getSize(new THREE.Vector3());
 window.__bbox={min:box.min.toArray(),max:box.max.toArray(),size:size.toArray()};
 const h=size.y;
 const scale=2.85/h;
 model.scale.setScalar(scale);
 model.position.set(-(box.min.x+box.max.x)/2*scale,-box.min.y*scale,-(box.min.z+box.max.z)/2*scale);
 const pivot=new THREE.Group();
 pivot.rotation.y=Number(params.get("angle")??Math.PI);
 pivot.add(model);scene.add(pivot);
 // Chrome may need a paint/compositor frame after creating a fresh WebGL
 // context. Keep rendering a handful of frames before exposing screenshot QA.
 let rendered=0;
 function draw(){
  renderer.render(scene,camera);rendered++;
  if(rendered<16)requestAnimationFrame(draw);else ready=true;
 }
 requestAnimationFrame(draw);
}
try{await main()}catch(e){console.error('REAL_VRM_PORTRAIT_FAILED',e)}
Object.defineProperty(window,'__portraitQA',{value:{get ready(){return ready},get bones(){return boneCount},get meshes(){return meshCount},get bbox(){return window.__bbox},get id(){return id}}});
