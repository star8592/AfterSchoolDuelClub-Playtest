import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const canvas=document.getElementById('stage');
const state=document.getElementById('state');
const clipsBox=document.getElementById('clips');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.2;
renderer.shadowMap.enabled=true;
const scene=new THREE.Scene();scene.background=new THREE.Color('#12273e');
const camera=new THREE.PerspectiveCamera(38,1,.05,100);
const orbit=new OrbitControls(camera,canvas);orbit.enableDamping=true;orbit.minDistance=2;orbit.maxDistance=18;
const hemi=new THREE.HemisphereLight('#d3efff','#35485f',2.5);scene.add(hemi);
const key=new THREE.DirectionalLight('#ffe3be',3);key.position.set(4,8,6);scene.add(key);
const fill=new THREE.DirectionalLight('#8dc6ff',1.3);fill.position.set(-4,4,-3);scene.add(fill);
const stage=new THREE.Mesh(new THREE.CylinderGeometry(3.3,3.3,.045,96),new THREE.MeshStandardMaterial({color:'#234057',metalness:.23,roughness:.52}));
stage.position.y=-.04;scene.add(stage);
const group=new THREE.Group();scene.add(group);
let mixer=null,model=null,rootMotion=null,animations=[],activeClip='none',last=performance.now(),errors=[];
const clock=new THREE.Clock();
function resize() {const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(h,1);camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);
function activate(name){
 if(!mixer) return;
 const clip=animations.find(c=>c.name===name);
 if(!clip) return;
 mixer.stopAllAction();
 const action=mixer.clipAction(clip);
 action.reset();
 action.setLoop(name==='Idle_Glide'?THREE.LoopRepeat:THREE.LoopOnce, name==='Idle_Glide'?Infinity:1);
 action.clampWhenFinished=name!=='Idle_Glide';
 action.play();
 activeClip=name;
 for(const b of clipsBox.querySelectorAll('button')) b.classList.toggle('active',b.dataset.clip===name);
 state.textContent='实际 GLB · '+name+' · glTF2 AnimationMixer（非 CSS 动画）';
}
mixer=null;
function readWings() {
 let left=null,right=null;
 model?.traverse(obj=>{
   if(obj.userData?.patch_r60_role==='wing_left')left=obj;
   if(obj.userData?.patch_r60_role==='wing_right')right=obj;
 });
 return {
  left:left?.morphTargetInfluences?.slice()??null,
  right:right?.morphTargetInfluences?.slice()??null,
  texture:!!left?.material?.map,
  normal:!!left?.material?.normalMap,
  roughness:!!left?.material?.roughnessMap,
  rolesFound:!!left&&!!right
 };
}
window.__PATCH_E02_QA={
 get version(){return oldVersion?'R59':'R60';},
 get wings(){return readWings();},
 get loaded(){return !!model;},
 get meshes(){let n=0;model?.traverse(o=>{if(o.isMesh)n++});return n},
 get animations(){return animations.map(x=>x.name)},
 get active(){return activeClip},
 get errors(){return errors.slice()},
 get motion(){return rootMotion?{rotation:[...rootMotion.quaternion.toArray()],position:[...rootMotion.position.toArray()]}:null},
 setClip:activate
};
const oldVersion=new URLSearchParams(location.search).get('old')==='1';
const modelFile=oldVersion?'./E02-R59-NativeMotion-STUDY.glb':'./E02-R60-PhotoPaper-WingFlex-STUDY.glb';
document.getElementById('variant-label').textContent=oldVersion?'R59 旧版：纯色纸翼 / 无独立形变':'R60 新版：CC0 实物扫描纸面 / 独立折翼';
document.getElementById('variant').textContent=oldVersion?'切到 R60 材质+折翼':'切回 R59 旧版对照';
document.getElementById('variant').onclick=()=>{const u=new URL(location.href);if(oldVersion)u.searchParams.delete('old');else u.searchParams.set('old','1');location.href=u.toString()};
new GLTFLoader().load(modelFile,(gltf)=>{
 model=gltf.scene;group.add(model);
 animations=gltf.animations;
 rootMotion=model.children[0]; // glTF scene has exactly one audited source root (node 17); loader may sanitize node names.
 rootMotion.position.set(0,0,0);
 const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 // Fit horizontally across desktop and vertically on phones; preserve true mesh proportions.
 resize();
 const aspect=Math.max(.48,canvas.clientWidth/Math.max(1,canvas.clientHeight));
 const fov=THREE.MathUtils.degToRad(camera.fov);
 const fittedHeight=Math.max(size.y*1.45,size.x/aspect*1.22,size.z*1.35);
 const distance=Math.max(2.0,fittedHeight/(2*Math.tan(fov/2))*(aspect>1.45?.67:.92));
 orbit.target.copy(center);
 camera.position.copy(center).add(new THREE.Vector3(distance*.25,distance*.55,distance));
 camera.lookAt(center);orbit.update();
 stage.scale.set(.75,.75,.75);stage.position.y=box.min.y-.04;
 mixer=new THREE.AnimationMixer(model);
 const labels={Idle_Glide:'待机·漂浮',Bank_Left:'左转',Bank_Right:'右转',Attack_Dart:'俯冲攻击',Hit_Recoil:'受击回弹'};
 for(const clip of animations){const b=document.createElement('button');b.dataset.clip=clip.name;b.textContent=labels[clip.name]||clip.name;b.onclick=()=>activate(clip.name);clipsBox.append(b)}
 mixer.addEventListener('finished',()=>{if(activeClip!=='Idle_Glide')activate('Idle_Glide')});
 resize();activate('Idle_Glide');
},undefined,e=>{errors.push(String(e));state.textContent='加载失败：'+String(e);});
function frame(){
 requestAnimationFrame(frame);
 if(canvas.clientWidth&&canvas.clientHeight){if(renderer.domElement.width !== Math.round(canvas.clientWidth*renderer.getPixelRatio()) ||
 renderer.domElement.height!==Math.round(canvas.clientHeight*renderer.getPixelRatio()))resize();}
 const dt=Math.min(clock.getDelta(),.05);mixer?.update(dt);orbit.update();renderer.render(scene,camera);
}
frame();
