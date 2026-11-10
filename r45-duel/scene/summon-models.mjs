/**
 * R61 playability-only resource registry, not a final art approval.
 * All 10 GLB files are standalone inside r45-duel/assets/summons.
 * E01/G01 remain the existing unique source VRM rigs.
 */
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
// R63: opt-in only. Without ?e02Study=r60 the existing R62 game and all models
// remain byte-for-byte unaffected. The game iframe is same-origin.
const isE02R60Study=(()=>{
 const local=new URLSearchParams(location.search).get('e02Study')==='r60';
 if(local)return true;
 try{return window.parent!==window && new URLSearchParams(window.parent.location.search).get('e02Study')==='r60';}
 catch{return false;}
})();

export const UNIT_MODEL_SPECS=Object.freeze({
 // targetHeight is a game-relative visual scale, NOT a raw STL meter value.
 // maxFootprint prevents flat models (E02) from blanketing adjacent lanes.
 E02:{file:'E02-PaperPlane-R57.glb',label:'拐弯纸飞机',targetHeight:.42,maxWidth:1.75,maxDepth:1.75,hover:.48,kind:'object'},
 E03:{file:'E03-CheerCaptain-Schoolkid.glb',label:'加油队长',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 E04:{file:'E04-CanteenRelay-FoodCourier.glb',label:'食堂接力员',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 G02:{file:'G02-BlackboardExpert-ItEngineer.glb',label:'黑板密码专家',targetHeight:2.48,maxWidth:3.55,kind:'character'},
 G03:{file:'G03-ReverseLab-WhiteCoatDoctor.glb',label:'实验学长',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 G04:{file:'G04-ClubDirector-OfficeManager.glb',label:'社团计划总监',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 T01:{file:'T01-BroadcastOwl-BarnOwl.glb',label:'猫头鹰播音员',targetHeight:1.15,maxWidth:1.42,kind:'creature'},
 T02:{file:'T02-LivingMenu-R59.glb',label:'食堂隐藏菜单',targetHeight:1.47,maxWidth:1.12,kind:'object'},
 T03:{file:'T03-MailPair-DeliveryRider.glb',label:'默契收发员',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 T04:{file:'T04-ClubGuardian-SecurityGuard.glb',label:'活动室守门人',targetHeight:2.08,maxWidth:3.15,kind:'character'}
});
export const UNIT_MODEL_IDS=Object.freeze(Object.keys(UNIT_MODEL_SPECS));
export async function preloadSummonModels(THREE,loader){
 const loaded=await Promise.all(UNIT_MODEL_IDS.map(async id=>{
  const spec=UNIT_MODEL_SPECS[id];
  const selectedFile=id==='E02'&&isE02R60Study?
   'E02-R60-PhotoPaper-WingFlex-STUDY.glb':spec.file;
  const url=new URL('../assets/summons/'+selectedFile,import.meta.url);
  const gltf=await loader.loadAsync(url.href);
  const source=gltf.scene;
  source.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(source);
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  if(bounds.isEmpty()||!Number.isFinite(size.y)||size.y<.02)throw Error('Invalid actual GLB bounds for '+id);
  let meshes=0;
  source.traverse(o=>{if(o.isMesh){meshes++;o.frustumCulled=false;}});
  if(!meshes)throw Error('Empty GLB meshes for '+id);
  const scale=Math.min(spec.targetHeight/size.y,
   spec.maxWidth?spec.maxWidth/size.x:Infinity,
   spec.maxDepth?spec.maxDepth/size.z:Infinity);
  return[id,{id,spec,selectedFile,source,clips:gltf.animations,scale,
   measured:{width:size.x,height:size.y,depth:size.z,
    scaledHeight:size.y*scale,scaledWidth:size.x*scale,scaledDepth:size.z*scale},
   center:new THREE.Vector3(center.x,bounds.min.y,center.z),meshes,url:url.pathname}];
 }));
 const models=new Map(loaded);
 if(models.size!==10)throw Error('R61 expected exactly 10 independently sourced summoned GLBs');
 return models;
}
export function instantiateSummon(THREE,template){
 const instance=cloneSkeleton(template.source);
 instance.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false});
 // Center and seat source mesh at arena floor, while keeping source skeleton
 // transform and animation binding intact under the original model root.
 instance.position.set(-template.center.x,-template.center.y,-template.center.z);
 const scaled=new THREE.Group();scaled.scale.setScalar(template.scale);scaled.add(instance);
 const root=new THREE.Group();root.add(scaled);
 root.name='R61_ACTUAL_GLTF_SUMMON_'+template.id;
 const mixer=template.clips.length?new THREE.AnimationMixer(instance):null;
 const choose=(kind)=>{
  if(!mixer)return null;
  const clips=template.clips;
  const preference=kind==='attack'?['Attack_Dart','Attack_Flip_Menu','Attack','attack','Special','Cheer']:
   kind==='hit'?['Hit_Recoil','Hit_Retreat','Hit','hit']:
   kind==='death'?['Death','dead']:
   kind==='walk'?['Bank_Left','Bank_Right','Walk_Small_Steps','Walk','walk','Run']:
     ['Idle_Glide','Idle_Menu_Breath','Idle','idle','Stand'];
  return preference.map(n=>clips.find(c=>c.name===n)).find(Boolean)||clips[0];
 };
 let current=null;
 const play=(kind)=>{
  if(!mixer)return false;
  const clip=choose(kind);if(!clip)return false;
  if(current===clip.name&&kind==='idle')return true;
  mixer.stopAllAction();
  const a=mixer.clipAction(clip);a.reset();a.enabled=true;a.setEffectiveWeight(1);
  a.setLoop(kind==='idle'||kind==='walk'?THREE.LoopRepeat:THREE.LoopOnce,kind==='idle'||kind==='walk'?Infinity:1);
  a.clampWhenFinished=kind!=='idle'&&kind!=='walk';
  a.play();current=clip.name;return true;
 };
 play('idle');
 // Some skinned GLBs embed a root-motion offset that raises their boots.
 // Sample the chosen idle clip once, then seat the *real posed* feet on court.
 if(mixer){
  mixer.update(.26);
  scaled.updateMatrixWorld(true);
  const posed=new THREE.Box3().setFromObject(scaled,true);
  if(Number.isFinite(posed.min.y)&&Math.abs(posed.min.y)<3){
   scaled.position.y-=posed.min.y;
  }
 }
 return {root,mixer,play,instance,meshCount:template.meshes,animationCount:template.clips.length,
  artApproved:false,kind:'real-gltf-prototype'};
}
