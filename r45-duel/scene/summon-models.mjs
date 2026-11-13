/**
 * R61 playability-only resource registry, not a final art approval.
 * All 10 GLB files are standalone inside r45-duel/assets/summons.
 * E01/G01 remain the existing unique source VRM rigs.
 */
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
// R85: improved R60 photo-paper model and five native clips are the default.
// Exact older R57 remains available with ?e02Study=r57 for immediate rollback.
const isE02R60Study=(()=>{
 const local=new URLSearchParams(location.search).get('e02Study');
 if(local==='r57'||local==='r60')return local==='r60';
 try{
  if(window.parent!==window)
   return new URLSearchParams(window.parent.location.search).get('e02Study')!=='r57';
 }catch{}
 return true;
})();

// R97: Film-style landing cushioning and recovery baked in authentic glTF morphs.
// `?r97Landing=old` reverts only R97 GLBs to stable R96 (no combat rules changed).
const isR97Previous=(()=>{
 const local=new URLSearchParams(location.search).get('r97Landing');
 if(local==='old'||local==='new')return local==='old';
 try{return window.parent!==window&&new URLSearchParams(window.parent.location.search).get('r97Landing')==='old'}catch{return false}
 return false;
})();
const R97_PREVIOUS=Object.freeze({
 E03:'E03-Ellie-Knee-R96.glb',E04:'E04-Phil-Knee-R96.glb',
 G02:'G02-Snow-Knee-R96.glb',G03:'G03-Jay-Knee-R96.glb',
 G04:'G04-Victoria-Knee-R96.glb',T03:'T03-Rain-Knee-R96.glb',
 T04:'T04-Rex-Knee-R96.glb'
});

// R96: Single planted support foot + FK knee bend + pelvis-to-chest weight transfer.
// ?r96Knee=old restores R93 models; all R94/R95 combat logic stays untouched.
const isR96Previous=(()=>{
 const f=new URLSearchParams(location.search).get('r96Knee');
 if(f==='old'||f==='new')return f==='old';
 try{return window.parent!==window&&new URLSearchParams(window.parent.location.search).get('r96Knee')==='old'}catch{}
 return false;
})();
const R96_PREVIOUS=Object.freeze({
 E03:'E03-Ellie-Footwork-R93.glb',E04:'E04-Phil-Footwork-R93.glb',
 G02:'G02-Snow-Footwork-R93.glb',G03:'G03-Jay-Footwork-R93.glb',
 G04:'G04-Victoria-Footwork-R93.glb',T03:'T03-Rain-Footwork-R93.glb',
 T04:'T04-Rex-Footwork-R93.glb'
});

// R93: Blender-native lower-body morph channels Step/Retreat baked into original character rigs.
// ?r93Footwork=old restores unchanged R89 GLBs while retaining R90 choreography.
const isR93Previous=(()=>{
 const flag=new URLSearchParams(location.search).get('r93Footwork');
 if(flag==='old'||flag==='new')return flag==='old';
 try{return window.parent!==window&&new URLSearchParams(window.parent.location.search).get('r93Footwork')==='old'}catch{}
 return false;
})();
const R93_PREVIOUS=Object.freeze({
 E03:'E03-Ellie-Natural-R89.glb',E04:'E04-Phil-Natural-R89.glb',
 G02:'G02-Snow-Natural-R89.glb',G03:'G03-Jay-Natural-R89.glb',
 G04:'G04-Victoria-Natural-R89.glb',T03:'T03-Rain-Natural-R89.glb',
 T04:'T04-Rex-Natural-R89.glb'
});

// R89: Full shoulder/elbow/wrist FK chain baked into natural standing morph bases.
// ?r89Study=r88 restores previous animated models without changing combat logic.
const isR89Previous=(()=>{
 const local=new URLSearchParams(location.search).get('r89Study');
 if(local==='r88'||local==='r89')return local==='r88';
 try{return window.parent!==window&&new URLSearchParams(window.parent.location.search).get('r89Study')==='r88';}catch{}
 return false;
})();
const R89_PREVIOUS=Object.freeze({
 E03:'E03-Ellie-Animated-R88.glb',E04:'E04-Phil-Animated-R88.glb',
 G02:'G02-Snow-Animated-R86.glb',G03:'G03-Jay-Animated-R87.glb',
 G04:'G04-Victoria-Animated-R88.glb',T03:'T03-Rain-Animated-R88.glb',
 T04:'T04-Rex-Animated-R88.glb'
});

// R88: The remaining five Blender Studio characters have native morph-target clips.
// ?r88Study=old keeps the earlier static models for art comparisons and rollback.
const isR88Old=(()=>{
 const p=new URLSearchParams(location.search).get('r88Study');
 if(p==='old'||p==='new')return p==='old';
 try{return window.parent!==window&&new URLSearchParams(window.parent.location.search).get('r88Study')==='old';}catch{}
 return false;
})();
const R88_OLD=Object.freeze({
 E03:'E03-Ellie-BlenderStudio-R83.glb', E04:'E04-Phil-BlenderStudio-R82.glb',
 G04:'G04-Victoria-BlenderStudio-R82.glb', T03:'T03-Rain-BlenderStudio-R83.glb',
 T04:'T04-Rex-BlenderStudio-R80.glb'
});

// R87: Jay's source CloudRig poses baked to localized shape-key motions.
// ?g03Study=r80 switches back to the existing static R80 Jay.
const isG03R87=(()=>{
 const local=new URLSearchParams(location.search).get('g03Study');
 if(local==='r80'||local==='r87')return local==='r87';
 try{if(window.parent!==window)return new URLSearchParams(window.parent.location.search).get('g03Study')!=='r80';}catch{}
 return true;
})();

// R86: CloudRig-derived localized morph animations, not a whole-body sway.
// Use ?g02Study=r83 to revert Snow to R83; supports parent iframe query string.
const isG02R86=(()=>{
 const local=new URLSearchParams(location.search).get('g02Study');
 if(local==='r83'||local==='r86')return local==='r86';
 try{if(window.parent!==window)return new URLSearchParams(window.parent.location.search).get('g02Study')!=='r83';}catch{}
 return true;
})();

// R67: true two-character T02 is opt-in; production default remains menu-only.
const isT02DuoStudy=(()=>{
 const local=new URLSearchParams(location.search).get('t02Study')==='duo';
 if(local)return true;
 try{return window.parent!==window && new URLSearchParams(window.parent.location.search).get('t02Study')==='duo';}
 catch{return false;}
})();

// R86: isolated genuine-skin test. Regular players keep R85 static Jay.
const isG03R86Study=(()=>{
 if(new URLSearchParams(location.search).get('g03Study')==='rig')return true;
 try{return window.parent!==window&&new URLSearchParams(window.parent.location.search).get('g03Study')==='rig'}catch{return false}
})();

// Temporary R99 recovery switch for the original unaccessorized M02 GLB.
const r99ChefOld=(()=>{
 const search=new URLSearchParams(location.search);
 if(search.get('r99Chef')==='old')return true;
 try{return window.parent!==window&&
   new URLSearchParams(window.parent.location.search).get('r99Chef')==='old';}
 catch{return false}
})();
export const UNIT_MODEL_SPECS=Object.freeze({
 // targetHeight is a game-relative visual scale, NOT a raw STL meter value.
 // maxFootprint prevents flat models (E02) from blanketing adjacent lanes.
 E02:{file:'E02-PaperPlane-R57.glb',label:'拐弯纸飞机',targetHeight:.42,maxWidth:1.75,maxDepth:1.75,hover:.48,kind:'object'},
 E03:{file:'E03-Ellie-Landing-R97.glb',label:'加油队长',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 E04:{file:'E04-Phil-Landing-R97.glb',label:'食堂接力员',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 G02:{file:'G02-Snow-Landing-R97.glb',label:'黑板密码专家',targetHeight:2.48,maxWidth:3.55,kind:'character'},
 G03:{file:'G03-Jay-Landing-R97.glb',label:'实验学长',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 G04:{file:'G04-Victoria-Landing-R97.glb',label:'社团计划总监',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 M01:{file:'M01-MusicTeacher-PolyforkSchoolTeacher.glb',label:'音乐老师',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 M02:{file:'M02-CafeteriaAunt-ChefHat-Ladle-R114.glb',label:'食堂阿姨',targetHeight:2.35,maxWidth:2.35,kind:'character'},
 T01:{file:'T01-Owl-Innerscene-R84.glb',label:'猫头鹰播音员',targetHeight:1.15,maxWidth:1.42,kind:'creature'},
 T02:{file:'T02-LivingMenu-R59.glb',label:'食堂隐藏菜单',targetHeight:1.47,maxWidth:1.12,kind:'object'},
 T03:{file:'T03-Rain-Landing-R97.glb',label:'默契收发员',targetHeight:2.08,maxWidth:3.15,kind:'character'},
 T04:{file:'T04-Rex-Landing-R97.glb',label:'活动室守门人',targetHeight:2.08,maxWidth:3.15,kind:'character'}
});
export const UNIT_MODEL_IDS=Object.freeze(Object.keys(UNIT_MODEL_SPECS));
export async function preloadSummonModels(THREE,loader,{onLoaded,concurrency=4}={}){
 // Bound GLB requests and parser work instead of firing 12 large models at once.
 // Keep the original full 12/12 readiness and per-model validation contract.
 const limit=Math.max(1,Math.min(12,Math.floor(Number(concurrency))||4));
 let active=0;
 const pending=[];
 async function loadBounded(url){
  if(active>=limit)await new Promise(resolve=>pending.push(resolve));
  active++;
  try{return await loader.loadAsync(url);}
  finally{active--;pending.shift()?.();}
 }
 const loaded=await Promise.all(UNIT_MODEL_IDS.map(async id=>{
  const baseSpec=UNIT_MODEL_SPECS[id];
  const spec=id==='T02'&&isT02DuoStudy?
   {...baseSpec,targetHeight:1.58,maxWidth:2.32,maxDepth:1.75,hover:0,kind:'duo'}:
   id==='M02'&&r99ChefOld?{...baseSpec,targetHeight:2.07}:baseSpec;
  const selectedFile=id==='M02'&&r99ChefOld?'M02-CafeteriaAunt-CartoonR76.glb':
   id==='T02'&&isT02DuoStudy?
   'T02-CanteenAunt-LivingMenu-Duo-STUDY.glb':
   isR93Previous&&Object.hasOwn(R93_PREVIOUS,id)?
   R93_PREVIOUS[id]:
   isR96Previous&&Object.hasOwn(R96_PREVIOUS,id)?
   R96_PREVIOUS[id]:
   isR97Previous&&Object.hasOwn(R97_PREVIOUS,id)?
   R97_PREVIOUS[id]:
   isR89Previous&&Object.hasOwn(R89_PREVIOUS,id)?
   R89_PREVIOUS[id]:
   isR88Old&&Object.hasOwn(R88_OLD,id)?
   R88_OLD[id]:
   id==='G03'&&!isG03R87?
   'G03-Jay-BlenderStudio-R80.glb':
   id==='G02'&&!isG02R86?
   'G02-Snow-BlenderStudio-R83.glb':
   id==='E02'&&isE02R60Study?
   'E02-R60-PhotoPaper-WingFlex-STUDY.glb':
   id==='G03'&&isG03R86Study?'G03-Jay-Skinned-R86.glb':spec.file;
  const url=new URL('../assets/summons/'+selectedFile,import.meta.url);
  const gltf=await loadBounded(url.href);
  const source=gltf.scene;
  source.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(source);
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  if(bounds.isEmpty()||!Number.isFinite(size.y)||size.y<.02)throw Error('Invalid actual GLB bounds for '+id);
  let meshes=0;
  source.traverse(o=>{if(o.isMesh){meshes++;o.frustumCulled=false;}});
  if(!meshes)throw Error('Empty GLB meshes for '+id);
  // Report only real, validated completed GLB loads. Never fabricate percent
  // based on elapsed time or relax the 12/12 identity readiness gate.
  if(typeof onLoaded==='function')onLoaded({id,file:selectedFile,meshes});
  const scale=Math.min(spec.targetHeight/size.y,
   spec.maxWidth?spec.maxWidth/size.x:Infinity,
   spec.maxDepth?spec.maxDepth/size.z:Infinity);
  return[id,{id,spec,selectedFile,source,clips:gltf.animations,scale,
   measured:{width:size.x,height:size.y,depth:size.z,
    scaledHeight:size.y*scale,scaledWidth:size.x*scale,scaledDepth:size.z*scale},
   center:new THREE.Vector3(center.x,bounds.min.y,center.z),meshes,url:url.pathname}];
 }));
 const models=new Map(loaded);
 if(models.size!==12)throw Error('R61 expected exactly 12 independently sourced summoned GLBs');
 return models;
}
// R86: locally authored bone tracks on Blender Studio's actual Jay deform rig.
// The source GLB has 295 real joints and 0 embedded clips. All actions below
// bind to shoulder bones and deform existing skinned vertices (not mesh sway).
export function createR86JaySkeletonClips(THREE,instance){
 const left=instance.getObjectByName('DEF-ShoulderL');
 const right=instance.getObjectByName('DEF-ShoulderR');
 if(!left?.isBone||!right?.isBone)return [];
 // A narrow decorative jacket strip has incomplete skin weights after GLB export.
 // Hide only that detached trim, never hide the body, hands or sleeve geometry.
 instance.traverse(o=>{if(o.name==='Data_GEO-jay_jacket_1')o.visible=false;});
 const initialL=left.quaternion.clone(),initialR=right.quaternion.clone();
 const z=new THREE.Vector3(0,0,1);
 const clip=(name,times,L,R)=>{
  const track=(bone,base,angles)=>{
   const values=[];
   for(const angle of angles){
    const q=base.clone().multiply(new THREE.Quaternion().setFromAxisAngle(z,angle));
    values.push(q.x,q.y,q.z,q.w);
   }
   return new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`,times,values);
  };
  return new THREE.AnimationClip(name,times.at(-1),[
   track(left,initialL,L),track(right,initialR,R)
  ]);
 };
 return [
  clip('R86_Skeletal_Idle',[0,.72,1.44],[1.05,.99,1.05],[-1.05,-.99,-1.05]),
  clip('R86_Skeletal_Attack',[0,.14,.35,.75],[1.05,.12,-.1,1.05],[-1.05,-.92,-1.05,-1.05]),
  clip('R86_Skeletal_Hit',[0,.12,.28,.56],[1.05,.65,.6,1.05],[-1.05,-.65,-.6,-1.05]),
  clip('R86_Skeletal_Walk',[0,.24,.5,.8],[1.05,.87,1.12,1.05],[-1.05,-1.12,-.87,-1.05])
 ];
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
 const r86Clips=template.id==='G03'&&template.selectedFile==='G03-Jay-Skinned-R86.glb'?createR86JaySkeletonClips(THREE,instance):[];
 const availableClips=r86Clips.length?r86Clips:template.clips;
 const mixer=availableClips.length?new THREE.AnimationMixer(instance):null;
 // R90: subtle transient whole-instance lean and lift layered over R89 glTF
 // morph clips; reset each frame. This is not live torso, leg, or foot rigging.
 let groundedY=0;
 let combatPose=null;
 const setCombatPose=(pose)=>{
  combatPose=pose?{...pose}:null;
  scaled.rotation.x=pose?.lean||0;
  scaled.rotation.y=pose?.upperTwist||0;
  scaled.rotation.z=pose?.sideLean||0;
  scaled.position.y=groundedY+(pose?.lift||0);
 };
 const setClipRate=(rate)=>{if(mixer)mixer.timeScale=rate};

 // R80: user-approved Blender Studio meshes have no exported bone animations.
 const filmStatic=['G03','T04','E04','G04','E03','G02','T03','T01'].includes(template.id)&&availableClips.length===0;
 let staticState='idle',staticElapsed=0,staticPhase=0;
 const updateStatic=(dt)=>{
  if(!filmStatic)return;
  const sec=Math.max(0,Math.min(.09,dt));staticElapsed+=sec;staticPhase+=sec;
  const dur=staticState==='attack'?.72:staticState==='hit'?.54:.8;
  if(staticState!=='idle'&&staticElapsed>dur){staticState='idle';staticElapsed=0;}
  const impulse=staticState==='idle'?0:Math.sin(Math.PI*staticElapsed/dur);
  scaled.rotation.x=(staticState==='attack'?-.1:staticState==='hit'?.065:0)*impulse;
  scaled.rotation.z=.009*Math.sin(staticPhase*.8)+(staticState==='attack'?.07:staticState==='hit'?-.08:0)*impulse;
  scaled.position.y=.003*Math.sin(staticPhase*1.6);
 };
 const choose=(kind)=>{
  if(!mixer)return null;
  const clips=availableClips;
  const preference=kind==='attack'?['R86_Skeletal_Attack','Attack_Dart','Attack_Flip_Menu','Attack','attack','Special','Cheer']:
   kind==='hit'?['R86_Skeletal_Hit','Hit_Recoil','Hit_Retreat','Hit','hit']:
   kind==='death'?['Death','dead']:
   kind==='walk'?['R86_Skeletal_Walk','Bank_Left','Bank_Right','Walk_Small_Steps','Walk','walk','Run']:
     ['R86_Skeletal_Idle','Idle_Glide','Idle_Menu_Breath','Idle','idle','Stand'];
  return preference.map(n=>clips.find(c=>c.name===n)).find(Boolean)||clips[0];
 };
 let current=null;
 const duo=template.id==='T02' &&
  template.selectedFile==='T02-CanteenAunt-LivingMenu-Duo-STUDY.glb';
 const play=(kind)=>{
  if(filmStatic){staticState=kind;staticElapsed=0;current='R80_static_'+kind;return true;}
  if(!mixer)return false;
  if(duo){
   const pairing=kind==='attack'?['Serve_Menu','Attack_Flip_Menu']:
    kind==='hit'?['Hit_Recoil','Hit_Retreat']:
    kind==='walk'?['Wave_Welcome','Walk_Small_Steps']:
    ['Idle_Aunt_Breath','Idle_Menu_Breath'];
   if(current===kind&&kind==='idle')return true;
   mixer.stopAllAction();
   let played=0;
   for(const name of pairing){
    const clip=template.clips.find(c=>c.name===name);
    if(!clip)continue;
    const action=mixer.clipAction(clip);action.reset();action.enabled=true;
    action.setEffectiveWeight(1);
    const looping=kind==='idle'||kind==='walk';
    action.setLoop(looping?THREE.LoopRepeat:THREE.LoopOnce,looping?Infinity:1);
    action.clampWhenFinished=!looping;action.play();played++;
   }
   current=kind;return played===2;
  }
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
  groundedY=scaled.position.y;
 }
 return {root,mixer,play,update:filmStatic?updateStatic:null,instance,meshCount:template.meshes,animationCount:template.clips.length,runtimeBoneClips:r86Clips.length,
  getPlayingClips:()=>mixer?mixer._actions.filter(a=>a.isRunning()).map(a=>a.getClip().name):[],
  setCombatPose,setClipRate,getCombatPose:()=>combatPose,getClipRate:()=>mixer?.timeScale??1,
  artApproved:false,kind:'real-gltf-prototype'};
}