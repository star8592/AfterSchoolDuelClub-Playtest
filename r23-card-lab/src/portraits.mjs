import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const models=[
 {id:'E02',src:'./models/E02-paper-plane.glb',height:1.6,
  camera:[2.9,3.45,5.5],targetY:.85,max:2.75},
 {id:'T02',src:'./models/T02-living-menu.glb',height:2.37,
  camera:[2.8,2.65,5.4],targetY:1.21,max:2.95}
];
const qa={ready:false,assets:[],errors:[]};
Object.defineProperty(window,'__r23PortraitQA',{value:qa});
const loader=new GLTFLoader();
async function renderPortrait(cfg){
 const canvas=document.getElementById('portrait-'+cfg.id);
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true,alpha:true,
   powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.25;renderer.setSize(512,512,false);renderer.setPixelRatio(1);
 renderer.setClearColor(0,0);
 const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight('#e4ecff','#596072',1.14));
 const key=new THREE.DirectionalLight('#ffe5c8',3.6);key.position.set(-3,6,5);
 scene.add(key);const rim=new THREE.DirectionalLight('#a2cbfb',1.7);
 rim.position.set(3,3,-4);scene.add(rim);
 const gltf=await loader.loadAsync(cfg.src);
 const box=new THREE.Box3().setFromObject(gltf.scene,true);
 const dims=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 const maxdim=cfg.id==='E02'?Math.max(dims.x,dims.y,dims.z):dims.y;
 const scale=cfg.height/maxdim;
 gltf.scene.scale.setScalar(scale);
 gltf.scene.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);
 gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 scene.add(gltf.scene);
 const camera=new THREE.OrthographicCamera(-cfg.max/2,cfg.max/2,cfg.max/2,-cfg.max/2,.1,50);
 camera.position.set(...cfg.camera);
 camera.lookAt(0,cfg.targetY,0);
 camera.updateProjectionMatrix();
 renderer.render(scene,camera);
 const url=canvas.toDataURL('image/png');
 const asset={id:cfg.id,png:url,pixels:[512,512],source:'REAL_WEBGL_GLTF_RENDER',
   originalSculptApproved:false};
 return asset;
}
try{
 qa.assets=await Promise.all(models.map(renderPortrait));qa.ready=true;
 document.body.dataset.qa='ready';
}catch(err){qa.errors.push(String(err));console.error('R23 card portrait output failed',err);}
