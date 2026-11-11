import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const c=document.getElementById('c'),status=document.getElementById('status'),stats=document.getElementById('stats');
const renderer=new THREE.WebGLRenderer({canvas:c,antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
const scene=new THREE.Scene();scene.background=new THREE.Color('#1b3448');
const camera=new THREE.PerspectiveCamera(39,1,.05,90),orbit=new OrbitControls(camera,c);
orbit.enableDamping=true;orbit.minDistance=2;orbit.maxDistance=14;orbit.target.set(0,1.03,0);
scene.add(new THREE.HemisphereLight('#d0eaff','#4b5268',2.3));
const light=new THREE.DirectionalLight('#ffead4',3.0);light.position.set(-4,8,6);scene.add(light);
const blue=new THREE.DirectionalLight('#a1d6ff',1.5);blue.position.set(4,3,-4);scene.add(blue);
const floor=new THREE.Mesh(new THREE.CircleGeometry(2.7,92),new THREE.MeshStandardMaterial({color:'#294958',roughness:.86}));
floor.rotation.x=-Math.PI/2;scene.add(floor);
let gltf=null,actor=null,mixer=null,clipMap=new Map(),loaded=false,errors=[],angle=0;
const humans=new Set(['Idle_Aunt_Breath','Serve_Menu','Wave_Welcome','Hit_Recoil']);
const menus=new Set(['Idle_Menu_Breath','Walk_Small_Steps','Attack_Flip_Menu','Defend_Opening_Menu','Hit_Retreat']);
function resized(){const w=c.clientWidth,h=c.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();}
function rotate(v){angle=v;let a=THREE.MathUtils.degToRad(v);let d=4.5;camera.position.set(d*Math.sin(a),1.65,d*Math.cos(a));camera.lookAt(0,1.03,0);orbit.target.set(0,1.03,0);orbit.update();}
function count(){
 let meshes=0,skins=0,bones=0,triangles=0;
 actor?.traverse(o=>{if(o.isMesh){meshes++;if(o.isSkinnedMesh)skins++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position?.count||0)/3;}if(o.isBone)bones++;});
 return{meshes,skinnedMeshes:skins,bones,triangles:Math.round(triangles)};
}
function play(name,loop=false){
 const clip=clipMap.get(name);if(!clip||!mixer)return false;
 const inSet=humans.has(name)?humans:menus;
 for(const other of inSet){if(other!==name){const c=clipMap.get(other);if(c)mixer.existingAction(c)?.stop();}}
 const a=mixer.clipAction(clip);a.reset();a.enabled=true;a.setEffectiveWeight(1);
 a.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);a.clampWhenFinished=!loop;a.play();
 return true;
}
function handQuat(name){return actor?.getObjectByName(name)?.quaternion?.toArray()||null;}
try{
 gltf=await new GLTFLoader().loadAsync('../r45-duel/assets/summons/T02-CanteenAunt-LivingMenu-Duo-STUDY.glb');
 actor=gltf.scene;scene.add(actor);actor.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(actor,true),span=bounds.getSize(new THREE.Vector3());
 // This is a single coordinated scene with actual authored per-component scale.
 if(span.y<1.5||span.y>2.4)throw Error('Merged model height out of planned range: '+span.y);
 for(const a of gltf.animations)clipMap.set(a.name,a);
 mixer=new THREE.AnimationMixer(actor);
 play('Idle_Aunt_Breath',true);play('Idle_Menu_Breath',true);
 const sizes=count();
 stats.textContent='单一真实 GLB：'+sizes.meshes+' 网格 / '+sizes.skinnedMeshes+' 蒙皮网格 / '+sizes.bones+' 骨骼 / '+sizes.triangles+' 三角面 / '+clipMap.size+' 套原生动作。';
 status.textContent='T02 双角色真实三维加载完成（美术研究中，非正式成品）';
 loaded=true;
}catch(e){errors.push(String(e));status.textContent='加载失败：'+e}
document.querySelectorAll('button[data-angle]').forEach(b=>b.addEventListener('click',()=>rotate(Number(b.dataset.angle))));
document.querySelectorAll('button[data-human]').forEach(b=>b.addEventListener('click',()=>play(b.dataset.human,b.dataset.human==='Idle_Aunt_Breath')));
document.querySelectorAll('button[data-menu]').forEach(b=>b.addEventListener('click',()=>play(b.dataset.menu)));
window.addEventListener('resize',resized);
const clock=new THREE.Clock();
function frame(){requestAnimationFrame(frame);if(c.width!==Math.round(c.clientWidth*renderer.getPixelRatio())||c.height!==Math.round(c.clientHeight*renderer.getPixelRatio()))resized();mixer?.update(Math.min(.05,clock.getDelta()));orbit.update();renderer.render(scene,camera);}
resized();rotate(0);frame();
window.__T02_DUO_QA={get loaded(){return loaded},get stats(){return count()},get clipNames(){return[...clipMap.keys()]},get head(){return handQuat('head')},get rightArm(){return handQuat('upperarm_r')},get menuBody(){return actor?.getObjectByName('T02 thick lacquered book body')?.rotation?.toArray()||null},get errors(){return errors.slice()},get angle(){return angle},play};
