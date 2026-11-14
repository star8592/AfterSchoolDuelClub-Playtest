/**
 * R61 playability-only resource registry, not a final art approval.
 * All 10 GLB files are standalone inside r45-duel/assets/summons.
 * E01/G01 remain the existing unique source VRM rigs.
 */
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {r125VersionedAssetURL} from '../r125-asset-urls.mjs';
import {createR126MusicTeacherClips,R126_TEACHER_ACTION_NAMES} from './r126-music-teacher-native-acting.mjs';
import {createR127OwlSourceFeathers} from './r127-owl-source-feather-motion.mjs';
import {createR128PhilSourceFullBody,repairR128PhilSourceHierarchy} from './r128-source-lower-body.mjs';
import {createR130SpecialFullBody,prepareR130SourceLegs} from './r130-special-source-legs.mjs';
import {repairR131TrueSourceArms} from './r131-real-source-upper-arms.mjs';
import {createR134JayClips,createR134JaySequencer} from './r134-jay-source-stage.mjs';
import {createR135PairClips,createR135PairSequencer} from './r135-source-pair-acting.mjs';
import {createR136SourceClips,createR136EnsembleSequencer} from './r136-source-ensemble.mjs';
import {createR140OriginalFaceActing} from './r140-source-face-acting.mjs';
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

// R119: The source-bound skinned models are strictly study-only. Production
// keeps the R97 author-approved films until each separate actor passes
// camera, source-credit, foot-plant and bone/vertex verification.
export const R119_SKIN_STUDY_FILES=Object.freeze({
 E03:'E03-Ellie-Skinned-R119.glb',
 E04:'E04-Phil-Skinned-R119.glb',
 G02:'G02-Snow-Skinned-R119.glb',
 G03:'G03-Jay-Skinned-R119.glb',
 G04:'G04-Victoria-Skinned-R119.glb',
 T03:'T03-Rain-Skinned-R119.glb',
 T04:'T04-Rex-Skinned-R119.glb'
});
// R132: per-source Blender Pose-as-Rest-baked original CC-BY GLBs.
 // G02 and T03 are texture-compacted after Blender; original mesh/joint
 // binary buffers remain verified. This is research-only until art approval.
export const R132_BAKED_SOURCE_FILES=Object.freeze({
 E03:'E03-Ellie-Skinned-R132-BakedRest-PILOT.glb',
 G02:'G02-Snow-Skinned-R132-BakedRest-PILOT.glb',
 G03:'G03-Jay-Skinned-R132-BakedRest-PILOT.glb',
 G04:'G04-Victoria-Skinned-R132-BakedRest-PILOT.glb',
 T03:'T03-Rain-Skinned-R132-BakedRest-PILOT.glb',
 T04:'T04-Rex-Skinned-R132-BakedRest-PILOT.glb'
});
const R132_BAKED_STUDY=(()=>{
 const q=new URLSearchParams(location.search);
 const parent=(()=>{try{return window.parent!==window?
  new URLSearchParams(window.parent.location.search):null;}catch{return null;}})();
 const qa=q.get('qa')==='1'||parent?.get('qa')==='1';
 return qa&&(q.get('r132BakedRest')==='on'||parent?.get('r132BakedRest')==='on');
})();
// R134 visible-performance pilot. Explicit source opt-in initially, so the
// author-approved R97 default and all existing R131-R133 study routes remain
// unchanged until official wide-camera acceptance has been obtained.
export const R134_JAY_STAGE=(()=>{
 const local=new URLSearchParams(location.search);
 if(local.has('r134Jay'))return local.get('r134Jay')==='on';
 try{return window.parent!==window&&
  new URLSearchParams(window.parent.location.search).get('r134Jay')==='on';}
 catch{return false;}
})();
// One canonical game build, individually selectable production-pilot identities.
export const R135_PAIR_STAGES=(()=>{
 const read=()=>{
  const local=new URLSearchParams(location.search);
  if(local.has('r135Pair'))return local.get('r135Pair')||'';
  try{return window.parent!==window?
   new URLSearchParams(window.parent.location.search).get('r135Pair')||'':'';}
  catch{return '';}
 };
 const raw=read();
 if(raw==='on'||raw==='all')return new Set(['E03','T04']);
 if(raw==='off'||!raw)return new Set();
 return new Set(raw.split(',').filter(x=>['E03','T04'].includes(x)));
})();
export const R136_CAST_STAGES=(()=>{
 const q=new URLSearchParams(location.search);
 const raw=(()=>{
  if(q.has('r136Cast'))return q.get('r136Cast')||'';
  try{return window.parent!==window?
   new URLSearchParams(window.parent.location.search).get('r136Cast')||'':'';}
  catch{return '';}
 })();
 if(raw==='on'||raw==='all')return new Set(['E04','G02','G04','T03']);
 if(raw==='off'||!raw)return new Set();
 return new Set(raw.split(',').filter(id=>['E04','G02','G04','T03'].includes(id)));
})();
const R119_STUDY_IDS=(()=>{
 let raw=new URLSearchParams(location.search).get('r119Rig')||'';
 try{if(!raw&&window.parent!==window)
  raw=new URLSearchParams(window.parent.location.search).get('r119Rig')||'';}catch{}
 if(raw==='all')raw=Object.keys(R119_SKIN_STUDY_FILES).join(',');
 const allowed=new Set(Object.keys(R119_SKIN_STUDY_FILES));
 return new Set(raw.split(',').filter(x=>allowed.has(x)));
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
// R124 keeps every original GLB untouched and distributable. The 12 normal
// startup files have lossless .glb.gz wire copies; experimental fallback
// models and browsers without native DecompressionStream use .glb directly.
export const R124_PACKED_DEFAULTS=Object.freeze([
 'E02-R60-PhotoPaper-WingFlex-STUDY.glb',
 'E03-Ellie-Landing-R97.glb',
 'E04-Phil-Landing-R97.glb',
 'G02-Snow-Landing-R97.glb',
 'G03-Jay-Landing-R97.glb',
 'G04-Victoria-Landing-R97.glb',
 'M01-MusicTeacher-PolyforkSchoolTeacher.glb',
 'M02-CafeteriaAunt-ChefHat-Ladle-R114.glb',
 'T01-Owl-Innerscene-R84.glb',
 'T02-LivingMenu-R59.glb',
 'T03-Rain-Landing-R97.glb',
 'T04-Rex-Landing-R97.glb'
]);
const R124_PACKED_SET=new Set(R124_PACKED_DEFAULTS);
function r124PackedDisabled(){
 let forced=new URLSearchParams(location.search).get('r124Packed')==='off';
 try{forced ||=window.parent!==window&&
  new URLSearchParams(window.parent.location.search).get('r124Packed')==='off'}
 catch{ /* direct file and cross-origin embedding use local policy */ }
 return forced;
}
export const UNIT_MODEL_IDS=Object.freeze(Object.keys(UNIT_MODEL_SPECS));
export async function preloadSummonModels(THREE,loader,{onLoaded,onTransfer,concurrency=4}={}){
 // Bound GLB requests and parser work instead of firing 12 large models at once.
 // Keep the original full 12/12 readiness and per-model validation contract.
 const limit=Math.max(1,Math.min(12,Math.floor(Number(concurrency))||4));
 let active=0;
 const pending=[];
 async function loadPacked(url){
  // Put .gz before the version query, never after ?v=<digest>.
  const candidate=new URL(url);
  candidate.pathname += '.gz';
  const packedUrl=r125VersionedAssetURL(candidate).href;
  const response=await fetch(packedUrl);
  if(!response.ok)throw Error('R124 missing verified lossless GLB pack '+packedUrl+' HTTP '+response.status);
  const reader=response.body?.getReader();
  if(!reader)throw Error('R124 packed GLB requires a readable stream');
  const first=await reader.read();
  if(first.done||!first.value||first.value.byteLength<2)
   throw Error('R124 missing compressed glTF bytes '+packedUrl);
  let received=0;
  const total=Number(response.headers.get('content-length'))||0;
  const track=chunk=>{
   received+=chunk.byteLength;
   // Only actual received bytes appear in the existing verified download UI.
   onTransfer?.(url,{loaded:received,total:total||received,lengthComputable:total>0});
  };
  const body=new ReadableStream({
   start(controller){track(first.value);controller.enqueue(first.value)},
   async pull(controller){
    const part=await reader.read();
    if(part.done)controller.close();
    else{track(part.value);controller.enqueue(part.value)}
   },
   cancel(reason){return reader.cancel(reason)}
  });
  // A CDN could transparently decode gzip using Content-Encoding: gzip.
  // Inspect the ACTUAL response bytes to prevent accidental double decode.
  const hasGzipMagic=first.value[0]===0x1f&&first.value[1]===0x8b;
  const buffer=await new Response(hasGzipMagic?
   body.pipeThrough(new DecompressionStream('gzip')):body).arrayBuffer();
  if(new DataView(buffer).getUint32(0,false)!==0x676c5446)
   throw Error('R124 packed file did not decode to a genuine glTF binary '+packedUrl);
  return loader.parseAsync(buffer,new URL('.',url).href);
 }
 async function loadBounded(url,selectedFile){
  if(active>=limit)await new Promise(resolve=>pending.push(resolve));
  active++;
  try{
   if(R124_PACKED_SET.has(selectedFile)&&typeof DecompressionStream==='function'&&
      !r124PackedDisabled())return await loadPacked(url);
   return await loader.loadAsync(url,event=>onTransfer?.(url,event));
  }finally{active--;pending.shift()?.();}
 }
 const loaded=await Promise.all(UNIT_MODEL_IDS.map(async id=>{
  const baseSpec=UNIT_MODEL_SPECS[id];
  const spec=id==='T02'&&isT02DuoStudy?
   {...baseSpec,targetHeight:1.58,maxWidth:2.32,maxDepth:1.75,hover:0,kind:'duo'}:
   id==='M02'&&r99ChefOld?{...baseSpec,targetHeight:2.07}:baseSpec;
  const selectedFile=id==='M02'&&r99ChefOld?'M02-CafeteriaAunt-CartoonR76.glb':
   id==='T02'&&isT02DuoStudy?
   'T02-CanteenAunt-LivingMenu-Duo-STUDY.glb':
   R119_STUDY_IDS.has(id)?(
    R132_BAKED_STUDY&&Object.hasOwn(R132_BAKED_SOURCE_FILES,id)?
     R132_BAKED_SOURCE_FILES[id]:
    id==='E04'&&(()=>{
     const q=new URLSearchParams(location.search);
     const parent=(()=>{try{return window.parent!==window?
      new URLSearchParams(window.parent.location.search):null;}catch{return null;}})();
     const qa=q.get('qa')==='1'||parent?.get('qa')==='1';
     return qa&&(q.get('r131BakedRest')==='on'||parent?.get('r131BakedRest')==='on');
    })()?'E04-Phil-Skinned-R131-BakedRest-PILOT.glb':R119_SKIN_STUDY_FILES[id]):
   id==='G03'&&R134_JAY_STAGE?
    R132_BAKED_SOURCE_FILES.G03:
   R135_PAIR_STAGES.has(id)?
    R132_BAKED_SOURCE_FILES[id]:
   R136_CAST_STAGES.has(id)?
    (id==='E04'?'E04-Phil-Skinned-R131-BakedRest-PILOT.glb':
     R132_BAKED_SOURCE_FILES[id]):
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
  const gltf=await loadBounded(url.href,selectedFile);
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
 // GLTFLoader normalizes '.', '-', and spaces in original Blender node
 // names. Match the exact logical Blender bone, never a stale hard-coded
 // name that silently disables real shoulder animation.
 const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const find=name=>{
  let matched=null;instance.traverse(o=>{
   if(!matched&&o.isBone&&norm(o.name)===norm(name))matched=o;
  });return matched;
 };
 const left=find('DEF-Shoulder.L');
 const right=find('DEF-Shoulder.R');
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
   return new THREE.QuaternionKeyframeTrack(`${bone.uuid}.quaternion`,times,values);
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

// R119: real render-bound source meshes; original names are normalized by
// GLTFLoader. Clip names and physically tracked UUIDs stay on each separate
// instance, so two identical summon cards never share a skeleton or action.
export function createR119TrueSkinClips(THREE,instance,id,{sourceBakedRest=false}={}){
 const norm=x=>String(x||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const find=(...names)=>{
  const normalized=new Set(names.map(norm));let found=null;
  instance.traverse(o=>{
   if(!found&&o.isBone&&normalized.has(norm(o.name)))found=o;
  });return found;
 };
 const joints={
  left:find('DEF-UpperArm1.L','DEF-Shoulder.L'),
  right:find('DEF-UpperArm1.R','DEF-Shoulder.R'),
  elbowL:find('DEF-Forearm1.L'),
  elbowR:find('DEF-Forearm1.R'),
  head:find('DEF-Head','FK-Head'),
  neck:find('DEF-Neck','FK-Neck'),
  chest:find('DEF-Chest','DEF-Spine3','FK-Chest')
 };
 if(!joints.left||!joints.right||!joints.head||!joints.chest)return [];
 const character={
  E03:{strength:1.15,tempo:1.12},
  E04:{strength:1.02,tempo:.96},
  G02:{strength:.76,tempo:.88},
  G03:{strength:1.07,tempo:1.09},
  G04:{strength:.82,tempo:.88},
  T03:{strength:1.04,tempo:1.12},
  T04:{strength:1.10,tempo:1.03}
 }[id]||{strength:1,tempo:1};
 const make=(name,duration,times,movements)=>{
  const tracks=[];
  for(const[key,bone]of Object.entries(joints)){
   if(!bone)continue;
   const first=bone.quaternion.clone(),axes=movements[key]||[];
   const values=[];
   const axis=key==='head'||key==='neck'||key==='chest'?
    new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,1);
   for(let i=0;i<times.length;i++){
    // Source Blender character rigs need a relaxed natural arm rest; source
    // deform bones otherwise start nearly horizontal (classic zombie bind).
    // Original R97 authored shoulder down pose uses opposite polarity for
    // Snow and Rain; apply it on the true skinned deformation channels.
    const restPolarity=(id==='G02'||id==='T03')?-1:1;
    const naturalShoulderRest=sourceBakedRest?0:(key==='left'?1.32:key==='right'?-1.32:0)*restPolarity;
    const gesture=Math.max(-.55,Math.min(.55,axes[i]||0))*character.strength;
    const angle=naturalShoulderRest+gesture;
    const q=first.clone().multiply(new THREE.Quaternion().setFromAxisAngle(axis,angle));
    values.push(q.x,q.y,q.z,q.w);
   }
   tracks.push(new THREE.QuaternionKeyframeTrack(
    bone.uuid+'.quaternion',times,values));
  }
  return new THREE.AnimationClip(name,duration,tracks);
 };
 const idleTimes=[0,.6,1.3,2.2,3.0];
 const pulse=[0,.024,-.012,.035,0],opp=[0,-.024,.012,-.035,0];
 const wave=[0,.048,-.014,.020,0],slow=[0,.016,-.011,.018,0];
 const times=[0,.15,.40,.70,1.06],hitTimes=[0,.10,.24,.40,.64];
 const pattern=(peak)=>[0,peak*.55,peak,peak*.48,0];
 return [
  make('R119_Skeletal_Idle',3.0,idleTimes,{
   left:pulse,right:opp,elbowL:slow,elbowR:slow,
   head:wave,neck:slow,chest:slow}),
  make('R119_Skeletal_Attack',1.06,times,{
   left:pattern(-.14),right:pattern(.38),
   elbowL:pattern(.07),elbowR:pattern(-.19),
   head:pattern(-.08),neck:pattern(-.05),chest:pattern(-.10)}),
  make('R119_Skeletal_Hit',.64,hitTimes,{
   left:pattern(.21),right:pattern(-.18),
   elbowL:pattern(-.08),elbowR:pattern(.10),
   head:pattern(.14),neck:pattern(.07),chest:pattern(.13)}),
  make('R119_Skeletal_Walk',3.0,idleTimes,{
   left:wave,right:wave.map(v=>-v),elbowL:slow,elbowR:slow,
   head:slow,neck:slow,chest:pulse}),
  make('R119_Skeletal_Challenge',1.06,times,{
   left:pattern(-.08),right:pattern(.31),
   elbowL:pattern(.07),elbowR:pattern(-.24),
   head:pattern(-.06),neck:pattern(-.05),chest:pattern(-.04)}),
  make('R119_Skeletal_Worry',1.06,times,{
   left:pattern(.12),right:pattern(-.12),
   elbowL:pattern(.10),elbowR:pattern(.08),
   head:pattern(.13),neck:pattern(.04),chest:pattern(.08)}),
  make('R119_Skeletal_Celebrate',1.06,times,{
   left:pattern(-.21),right:pattern(.43),
   elbowL:pattern(.11),elbowR:pattern(-.14),
   head:pattern(-.09),neck:pattern(-.05),chest:pattern(-.05)})
 ];
}
export function instantiateSummon(THREE,template){
 const instance=cloneSkeleton(template.source);
 instance.traverse(o=>{if(o.isSkinnedMesh)o.frustumCulled=false});
 // R131 source rest-pose probe: some Blender 5 exports include valid
 // weighted geometry but incorrect bone inverse matrices. Only a QA URL
 // may recompute inverses from the exact original unanimated source pose.
 // Never alter the released source or production default without proof.
 const q131=new URLSearchParams(location.search);
 const q131Parent=(()=>{try{return window.parent!==window?
  new URLSearchParams(window.parent.location.search):null;}catch{return null;}})();
 const q131Qa=q131.get('qa')==='1'||q131Parent?.get('qa')==='1';
 const q131Rebind=q131Qa&&(q131.get('r131RestRebind')==='on'||
  q131Parent?.get('r131RestRebind')==='on');
 let q131Rebound=0;
 if(q131Rebind&&template.selectedFile===R119_SKIN_STUDY_FILES[template.id]){
  instance.updateMatrixWorld(true);
  instance.traverse(mesh=>{
   if(!mesh.isSkinnedMesh)return;
   mesh.skeleton.calculateInverses();
   q131Rebound++;
  });
 }
 // Center and seat source mesh at arena floor, while keeping source skeleton
 // transform and animation binding intact under the original model root.
 instance.position.set(-template.center.x,-template.center.y,-template.center.z);
 const scaled=new THREE.Group();scaled.scale.setScalar(template.scale);scaled.add(instance);
 const root=new THREE.Group();root.add(scaled);
 root.name='R61_ACTUAL_GLTF_SUMMON_'+template.id;
 const r86Clips=template.id==='G03'&&template.selectedFile==='G03-Jay-Skinned-R86.glb'?createR86JaySkeletonClips(THREE,instance):[];
 const r131SourceBaked=template.id==='E04'&&
  template.selectedFile==='E04-Phil-Skinned-R131-BakedRest-PILOT.glb';
 const r132SourceBaked=Object.hasOwn(R132_BAKED_SOURCE_FILES,template.id)&&
  template.selectedFile===R132_BAKED_SOURCE_FILES[template.id];
 const r134Jay=template.id==='G03'&&r132SourceBaked&&R134_JAY_STAGE;
 const r135Pair=r132SourceBaked&&R135_PAIR_STAGES.has(template.id);
 const r136Cast=(r131SourceBaked||r132SourceBaked)&&R136_CAST_STAGES.has(template.id);
 const r119Skin=r131SourceBaked||r132SourceBaked||
  template.selectedFile===R119_SKIN_STUDY_FILES[template.id];
 const r128PilotOn=(()=>{
  const local=new URLSearchParams(location.search);
  if(local.has('r128Body'))return local.get('r128Body')==='on';
  try{return window.parent!==window&&
   new URLSearchParams(window.parent.location.search).get('r128Body')==='on';}
  catch{return false;}
 })();
 const r129PilotOn=(()=>{
  const local=new URLSearchParams(location.search);
  if(local.has('r129Body'))return local.get('r129Body')==='on';
  try{return window.parent!==window&&
   new URLSearchParams(window.parent.location.search).get('r129Body')==='on';}
  catch{return false;}
 })();
 const r129FlatActors=new Set(['E03','G03','G04','T04']);
 const sourceBodyPilot=r119Skin&&(
  (template.id==='E04'&&(r128PilotOn||r136Cast))||
  (r129FlatActors.has(template.id)&&(r129PilotOn||r134Jay||r135Pair||r136Cast)));
 const r130PilotOn=(()=>{
  const local=new URLSearchParams(location.search);
  if(local.has('r130Body'))return local.get('r130Body')==='on';
  try{return window.parent!==window&&
   new URLSearchParams(window.parent.location.search).get('r130Body')==='on';}
  catch{return false;}
 })();
 const r130SpecialOn=r119Skin&&(r130PilotOn||r136Cast)&&
  ['G02','T03'].includes(template.id);
 const r128Hierarchy=sourceBodyPilot?
  repairR128PhilSourceHierarchy(THREE,instance,template.id):null;
 const r130Hierarchy=r130SpecialOn?
  prepareR130SourceLegs(THREE,instance,template.id):null;
 const r131ArmsOn=(()=>{
  const local=new URLSearchParams(location.search);
  if(local.has('r131Arms'))return local.get('r131Arms')==='on';
  try{return window.parent!==window&&
   new URLSearchParams(window.parent.location.search).get('r131Arms')==='on';}
  catch{return false;}
 })();
 const r131Arms=r119Skin&&(r131ArmsOn||r134Jay||r135Pair||r136Cast)?
  repairR131TrueSourceArms(THREE,instance,template.id):null;
 // Diagnostic ONLY: reveal the authentic source skin's unanimated bind
 // pose to distinguish a faulty GLB export from faulty action curves.
 // Disabled in all normal gameplay; not a public rollout option.
 const r131RawPose=(()=>{
  const local=new URLSearchParams(location.search);
  const parent=(()=>{try{return window.parent!==window?
   new URLSearchParams(window.parent.location.search):null;}catch{return null;}})();
  const qa=local.get('qa')==='1'||parent?.get('qa')==='1';
  return qa&&(local.get('r131RawPose')==='on'||parent?.get('r131RawPose')==='on');
 })();
 const source119Base=r119Skin&&!r131RawPose?
  createR119TrueSkinClips(THREE,instance,template.id,
   {sourceBakedRest:r131SourceBaked||r132SourceBaked}):[];
 const source119Clips=r134Jay?
  createR134JayClips(THREE,instance,source119Base):
  r135Pair?createR135PairClips(THREE,instance,source119Base,template.id):
  r136Cast?createR136SourceClips(THREE,instance,source119Base,template.id):
  source119Base;
 const r128Phil=sourceBodyPilot?
  createR128PhilSourceFullBody(THREE,instance,source119Clips,template.id,{
   directorAmplify:r135Pair?(template.id==='E03'?1.50:1.30):
    r136Cast?(template.id==='E04'?1.55:1.30):1,
   directorVariant:r136Cast&&template.id==='G04'?'r139Victoria':
    r135Pair&&template.id==='T04'?'r142Rex':
    r134Jay&&template.id==='G03'?'r142Jay':null
  }):null;
 const r130Special=r130SpecialOn?
  createR130SpecialFullBody(THREE,instance,source119Clips,template.id):null;
 const r119Clips=r130Special?r130Special.clips:r128Phil?r128Phil.clips:source119Clips;
 const r126Teacher=template.id==='M01'?createR126MusicTeacherClips(THREE,instance):null;
 const r127OwlDisabled=(()=>{
  const q=new URLSearchParams(location.search);
  if(q.get('r127Owl')==='off')return true;
  try{return window.parent!==window&&new URLSearchParams(window.parent.location.search).get('r127Owl')==='off';}
  catch{return false}
 })();
 const r127Owl=template.id==='T01'&&!r127OwlDisabled?
  createR127OwlSourceFeathers(THREE,instance,{reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}):null;
 // If a source-export model is missing one of the actual bound arm bones,
 // don't silently pretend the artist's character has its desired animation.
 if(r119Skin&&!r131RawPose&&r119Clips.length!==7)
  throw Error('R119 real skin has no valid mapped 7 body clips: '+template.id);
 const availableClips=r119Clips.length?r119Clips:r86Clips.length?r86Clips:
  r126Teacher?[...template.clips,...r126Teacher.clips]:template.clips;
 const mixer=availableClips.length?new THREE.AnimationMixer(instance):null;
 const r134Controller=r134Jay?createR134JaySequencer(THREE,mixer,availableClips,instance):null;
 const r135Controller=r135Pair?createR135PairSequencer(
  THREE,instance,mixer,availableClips,template.id):null;
 const r136Controller=r136Cast?createR136EnsembleSequencer(
  THREE,instance,mixer,availableClips,template.id):null;
 // Only the explicit high-poly cast study receives source-authored facial
 // deformation. The R97 production default and its materials stay untouched.
 // R141 extends the SAME original facial engine to the separately enabled
 // R134 Jay and R135 Ellie/Rex high-poly production pilots. Never apply
 // original face morphs to the released default R97 asset path.
 const r140Face=(r136Controller||r135Controller||r134Controller)?
  createR140OriginalFaceActing(THREE,instance,template.id):null;
 // R90: subtle transient whole-instance lean and lift layered over R89 glTF
 // morph clips; reset each frame. This is not live torso, leg, or foot rigging.
 let groundedY=0;
 let combatPose=null;
 const setCombatPose=(pose)=>{
  combatPose=pose?{...pose}:null;
  scaled.rotation.x=pose?.lean||0;
  scaled.rotation.y=pose?.upperTwist||0;
  scaled.rotation.z=pose?.sideLean||0;
  scaled.position.y=groundedY+(pose?.lift||0)+
   (r135Controller?.getLift()||0);
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
  const preference=kind==='attack'?['R119_Skeletal_Attack','R86_Skeletal_Attack','Attack_Dart','Attack_Flip_Menu','Attack','attack','Special','Cheer']:
   kind==='hit'?['R119_Skeletal_Hit','R86_Skeletal_Hit','Hit_Recoil','Hit_Retreat','Hit','hit']:
   kind==='death'?['Death','dead']:
   kind==='walk'?['R119_Skeletal_Walk','R86_Skeletal_Walk','Bank_Left','Bank_Right','Walk_Small_Steps','Walk','walk','Run']:
     ['R119_Skeletal_Idle','R86_Skeletal_Idle','Idle_Glide','Idle_Menu_Breath','Idle','idle','Stand'];
  return preference.map(n=>clips.find(c=>c.name===n)).find(Boolean)||clips[0];
 };
 let current=null;
 const teacherPerformance={sourceSkinnedMeshes:r126Teacher?.sourceSkinnedMeshes||0,
  sourceBones:r126Teacher?.sourceBones||0,trackedJoints:0,boneFrames:0,maxRealJointAngle:0,
  current:null};
 const teacherRest=r126Teacher?new Map([...r126Teacher.tracked].map(([name,b])=>[name,b.quaternion.clone()])):null;
 const teacherUpdate=dt=>{
  mixer.update(dt);
  teacherPerformance.boneFrames++;
  let active=0;
  for(const [name,bone] of r126Teacher.tracked){
   const rest=teacherRest.get(name);
   if(!rest||!bone.isBone)continue;
   const angle=rest.angleTo(bone.quaternion);
   teacherPerformance.maxRealJointAngle=Math.max(teacherPerformance.maxRealJointAngle,angle);
   if(angle>.025)active++;
  }
  teacherPerformance.trackedJoints=Math.max(teacherPerformance.trackedJoints,active);
 };
 const teacherPlay=(kind)=>{
  if(current===kind&&kind==='idle')return true;
  mixer.stopAllAction();
  const baseName=kind==='walk'?'Walk':'Idle';
  const base=template.clips.find(x=>x.name===baseName)||template.clips[0];
  if(!base)throw Error('R126_M01 original source clip missing');
  const idle=mixer.clipAction(base);
  idle.reset().setLoop(THREE.LoopRepeat,Infinity).setEffectiveWeight(1).play();
  const gesture=kind==='attack'?'R126_M01_Order':
   kind==='hit'?'R126_M01_Shocked':
   kind==='celebrate'?'R126_M01_Cheer':
   kind==='walk'?null:kind.startsWith('R126_M01_')?kind:'R126_M01_Conduct';
  if(gesture){
   const clip=availableClips.find(c=>c.name===gesture);
   if(!clip)throw Error('R126_M01 missing original-joint gesture '+gesture);
   const additive=mixer.clipAction(clip,undefined,THREE.AdditiveAnimationBlendMode);
   const looping=kind==='idle';
   additive.reset().setEffectiveWeight(1).setLoop(looping?THREE.LoopRepeat:THREE.LoopOnce,looping?Infinity:1);
   additive.clampWhenFinished=false;additive.play();
  }
  teacherPerformance.current=kind;
  current=kind;return true;
 };
 const duo=template.id==='T02' &&
  template.selectedFile==='T02-CanteenAunt-LivingMenu-Duo-STUDY.glb';
 const play=(kind)=>{
  if(r136Controller)return r136Controller.play(kind);
  if(r135Controller)return r135Controller.play(kind);
  if(r134Controller)return r134Controller.play(kind);
  if(r127Owl)return r127Owl.play(kind);
  if(r126Teacher)return teacherPlay(kind);
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
 // R116: short, true authored kitchen-theatre motions on the REAL
 // right-hand-skinned chef, triggered by personality/match context.
 // No clip is synthesized or borrowed from a different character identity.
 const lifeClips=r119Skin?
  new Set(['R119_Skeletal_Challenge','R119_Skeletal_Worry','R119_Skeletal_Celebrate']):
  template.id==='M01'?new Set(R126_TEACHER_ACTION_NAMES):
  template.id==='M02'?new Set([
  'Angry_Stomp','Big_Wave_Hello','Confused_Scratch','Jazz_Hands',
  'Shrug','Victory_Cheer']):new Set();
 const playLifeClip=(name)=>{
  if(!lifeClips.has(name)||!mixer)return 0;
  if(r136Controller)return r136Controller.playNamed(name)?
   availableClips.find(c=>c.name===name)?.duration||0:0;
  if(r135Controller)return r135Controller.playNamed(name)?
   availableClips.find(c=>c.name===name)?.duration||0:0;
  if(r134Controller)return r134Controller.playNamed(name)?
   availableClips.find(c=>c.name===name)?.duration||0:0;
  if(r126Teacher){teacherPlay(name);return availableClips.find(c=>c.name===name)?.duration||0;}
  const clip=availableClips.find(x=>x.name===name);
  if(!clip)return 0;
  if(current===name)return clip.duration||0;
  mixer.stopAllAction();
  const action=mixer.clipAction(clip);
  action.reset();action.enabled=true;action.setEffectiveWeight(1);
  action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;
  action.play();current=clip.name;
  return clip.duration||0;
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
 return {root,mixer,play,update:r131Arms?(dt=>{
  mixer.update(dt);
  r134Controller?.update(dt);r135Controller?.update(dt);
  r136Controller?.update(dt);
  // A physical E03 celebration includes original moving knees/feet plus
  // a bounded true body lift, not merely a whole mesh root-only wobble.
  if(r135Controller)scaled.position.y=groundedY+(combatPose?.lift||0)+
   r135Controller.getLift();
  r128Phil?.update();r130Special?.update();r131Arms.update();
  r140Face?.update(dt,r136Controller?.getCurrentClip()||
   r135Controller?.getCurrentClip()||r134Controller?.getCurrentClip());
 }):r130Special?(dt=>{mixer.update(dt);r130Special.update();}):r128Phil?(dt=>{mixer.update(dt);r128Phil.update();}):r127Owl?r127Owl.update:r126Teacher?teacherUpdate:filmStatic?updateStatic:null,instance,meshCount:template.meshes,animationCount:template.clips.length,runtimeBoneClips:r86Clips.length+r119Clips.length+(r126Teacher?.clips.length||0),r119Skin,
  getPlayingClips:()=>mixer?mixer._actions.filter(a=>a.isRunning()).map(a=>a.getClip().name):[],
  getR126TeacherMotion:()=>({...teacherPerformance}),
  getR127OwlMotion:()=>r127Owl?.inspect()||null,
  getR128FullBody:()=>template.id==='E04'&&r128Phil?
   {...r128Phil.inspect(),hierarchy:r128Hierarchy}:null,
  getR129FullBody:()=>template.id!=='E04'&&r128Phil?
   {...r128Phil.inspect(),hierarchy:r128Hierarchy}:null,
  getR130FullBody:()=>r130Special?
   {...r130Special.inspect(),hierarchyProof:r130Hierarchy}:null,
  getR131Arms:()=>r131Arms?.inspect()||null,
  r131RestReboundMeshes:q131Rebound,
  r131BakedRestOriginalSource:r131SourceBaked,
  r132BakedRestOriginalSource:r132SourceBaked,
  r134JayRealStage:r134Controller?.inspect()||null,
  getR134JayStage:()=>r134Controller?.inspect()||null,
  getR135PairStage:()=>r135Controller?.inspect()||null,
  getR136CastStage:()=>r136Controller?.inspect()||null,
  getR140OriginalFace:()=>r140Face?.inspect()||null,
  startSourceSpeech:details=>r140Face?.startSpeech(details)||false,
  stopSourceSpeech:serial=>r140Face?.stopSpeech(serial)||false,
  setCombatPose,setClipRate,playLifeClip,
  getCombatPose:()=>combatPose,getClipRate:()=>mixer?.timeScale??1,
  artApproved:false,kind:'real-gltf-prototype'};
}