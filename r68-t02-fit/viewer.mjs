import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
const models={
 round:{file:'./Rocketbox-FemaleChef-R68-Rounded-FrontAligned-STUDY.glb',name:'Rocketbox 圆润修改版',bones:80},
 chef:{file:'./chef-female-01-uncompressed.glb',name:'Rocketbox 现成原版',bones:80},
 mpfb:{file:'./T02-R68-BodyFit-Uniform-STUDY.glb',name:'MakeHuman 官方自动适配版',bones:53}
};
const params=new URLSearchParams(location.search);
const modelName=models[params.get('model')]?params.get('model'):'round';
const stage=document.getElementById('stage'),status=document.getElementById('status'),stats=document.getElementById('stats');
document.querySelectorAll('[data-model]').forEach(b=>{b.classList.toggle('active',b.dataset.model===modelName);b.addEventListener('click',()=>{const u=new URL(location.href);u.searchParams.set('model',b.dataset.model);location.href=u.toString()})});
const renderer=new THREE.WebGLRenderer({canvas:stage,antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new THREE.Scene();scene.background=new THREE.Color('#1d344a');
scene.add(new THREE.HemisphereLight('#e0eefa','#49515d',2.5));
const sun=new THREE.DirectionalLight('#ffe8c9',3.5);sun.position.set(-4,7,5);scene.add(sun);
const fill=new THREE.DirectionalLight('#a8d8fc',1.2);fill.position.set(4,3,-5);scene.add(fill);
const floor=new THREE.Mesh(new THREE.CircleGeometry(2.4,84),new THREE.MeshStandardMaterial({color:'#294d58',roughness:.8}));floor.rotation.x=-Math.PI/2;scene.add(floor);
const camera=new THREE.PerspectiveCamera(39,1,.05,50);
const orbit=new OrbitControls(camera,stage);orbit.enableDamping=true;orbit.minDistance=2.0;orbit.maxDistance=14;orbit.target.set(0,1.05,0);
let human=null,menu=null,mixer=null,clips=[],ready=false,errors=[];
function frameModel(gltf,height,x,kind){
 const group=new THREE.Group();scene.add(group);group.position.x=x;
 const obj=gltf.scene;obj.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(obj,true),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 if(box.isEmpty()||size.y<=0)throw Error('空模型：'+kind);
 obj.scale.setScalar(height/size.y);
 obj.position.set(-center.x*height/size.y,-box.min.y*height/size.y,-center.z*height/size.y);
 group.add(obj);
 return obj;
}
function tally(obj){let bones=0,meshes=0,skinned=0,triangles=0;obj?.traverse(o=>{if(o.isBone)bones++;if(o.isMesh){meshes++;if(o.isSkinnedMesh)skinned++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position?.count||0)/3}});return{bones,meshes,skinned,triangles:Math.round(triangles)}}
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix()}
function angle(deg){const rad=THREE.MathUtils.degToRad(deg),dist=4.65;camera.position.set(dist*Math.sin(rad),1.65,dist*Math.cos(rad));camera.lookAt(0,1.04,0);orbit.target.set(0,1.04,0);orbit.update()}
for(const b of document.querySelectorAll('[data-angle]'))b.onclick=()=>angle(Number(b.dataset.angle));
document.getElementById('reset').onclick=()=>angle(0);
document.getElementById('menuAction').onclick=()=>{
 if(!mixer)return;const c=clips.find(x=>x.name==='Attack_Flip_Menu')||clips.find(x=>/Attack/.test(x.name));
 if(!c)return;mixer.stopAllAction();const a=mixer.clipAction(c);a.reset();a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;a.play();
};
new GLTFLoader().loadAsync(models[modelName].file).then(async g=>{
 human=frameModel(g,1.92,-.9,'human');
 const m=await new GLTFLoader().loadAsync('../r45-duel/assets/summons/T02-LivingMenu-R59.glb');
 menu=frameModel(m,1.24,.96,'menu');clips=m.animations;mixer=new THREE.AnimationMixer(menu);
 const idle=clips.find(c=>c.name==='Idle_Menu_Breath');if(idle)mixer.clipAction(idle).play();
 const a=tally(human),b=tally(menu);
 if(a.bones!==models[modelName].bones)throw Error('人体骨架数量不符合资产锁定值');
 ready=true;
 stats.textContent=models[modelName].name+' · 人体 '+a.meshes+' 网格 / '+a.bones+' 骨骼 / '+a.triangles+' 三角面 · 活菜单 '+b.meshes+' 网格 / '+clips.length+' 动作';
 status.textContent='真实 WebGL2 已载入 '+models[modelName].name;
}).catch(e=>{errors.push(String(e));status.textContent='加载错误：'+e});
const clock=new THREE.Clock();
function render(){requestAnimationFrame(render);if(stage.width!==Math.round(stage.clientWidth*renderer.getPixelRatio())||stage.height!==Math.round(stage.clientHeight*renderer.getPixelRatio()))resize();mixer?.update(Math.min(.05,clock.getDelta()));orbit.update();renderer.render(scene,camera)}
resize();angle(0);render();
window.__R68_QA={get loaded(){return ready},get selected(){return modelName},get human(){return tally(human)},get menu(){return tally(menu)},get clips(){return clips.map(x=>x.name)},get errors(){return errors.slice()},get renderer(){const gl=renderer.getContext();const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}};
