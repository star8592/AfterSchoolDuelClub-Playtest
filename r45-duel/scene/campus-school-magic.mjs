/**
 * R169 Campus Comedy Magic — display-only physical-prop stage.
 *
 * 46 different school-event IDs, 46 readable prop combinations, NO generic
 * three-ring VFX, no temporary PointLights, no per-cast ShaderMaterial.
 * All reusable geometry/materials are cached and released on dispose.
 *
 * This is the first 46/46 functional 3D staging prototype, NOT 46 finished
 * animation-film-grade hero assets. Character skeletal gestures and bespoke
 * recorded Qwen3 voices are separate gated production deliverables.
 */
import {BY_ID} from '../engine.mjs';
import {renderCampusHeroProp} from './campus-hero-props.mjs';
import {createCampusStaticBatcher} from './campus-prop-static-batcher.mjs';
import {SPELL_CHOREOGRAPHY} from './spell-impact.mjs';
import {SCHOOL_MAGIC_IDENTITIES,SCHOOL_MAGIC_COUNT} from './campus-magic-bible.mjs';
import {R182_HERO_IDS,r182AnimateActor} from './campus-r182-actor-motions.mjs';
import {R183_HERO_IDS,r183AnimateActor} from './campus-r183-actor-motions.mjs';
import {R184_HERO_IDS,r184AnimateActor} from './campus-r184-actor-motions.mjs';
import {R185_HERO_IDS,r185AnimateActor} from './campus-r185-actor-motions.mjs';
import {R186_HERO_IDS,r186AnimateActor} from './campus-r186-actor-motions.mjs';

const clip=(x)=>Math.max(0,Math.min(1,x));
const smooth=x=>{const y=clip(x);return y*y*(3-2*y)};
const hex=(v)=>String(v).toLowerCase();
export function createCampusSchoolMagic(THREE,scene,{reducedMotion=false,mergeStatic=false,r200Readable=false}={}){
 const root=new THREE.Group();root.name='R169_SCHOOL_COMEDY_PHYSICAL_MAGIC';scene.add(root);
 const gcache=new Map(),mcache=new Map(),labels=new Map(),labelMaterials=new Map();
 const heroAssets=new Map();
 function registerHeroAsset(id,model){
  if(!['E06','K01','K07',...R182_HERO_IDS,...R183_HERO_IDS,...R184_HERO_IDS,...R185_HERO_IDS,...R186_HERO_IDS].includes(id)||!model?.isObject3D)return false;
  heroAssets.set(id,model);return true;
 }

 const active=[],lastBySide={player:null,ai:null};
 let gracefulRetirements=0;
 const collateral=[];
 let collateralLaunched=0,collateralExpired=0;
 const staticBatcher=mergeStatic?createCampusStaticBatcher(THREE):null;
 const staged=new Map();const prepareReceipts=[];
 async function prepareGpuMaterial(id,renderer,camera,targetScene){
  if(!SCHOOL_MAGIC_IDENTITIES[id]||!renderer||!camera||!targetScene)
   throw Error('R174 invalid stage request');
  if(staged.has(id))return staged.get(id).receipt;
  const started=performance.now(),host=new THREE.Group();
  host.name='R174_SHADER_PREP_'+id;
  const props=group(host);
  build(props,id);
  const buildDone=performance.now();
  const batch=staticBatcher?.batch(props,id)||null;
  const batchDone=performance.now();
  const oldErrorCheck=renderer.debug.checkShaderErrors;
  // Keep real strict shader checking. Never suppress errors to gain speed.
  const parallelExt=!!renderer.getContext().getExtension('KHR_parallel_shader_compile');
  const compileStart=performance.now();
  await renderer.compileAsync(host,camera,targetScene);
  const compileDone=performance.now();
  const uploadStart=performance.now();
  for(const texture of labels.values())renderer.initTexture(texture);
  const uploadDone=performance.now();
  const receipt={
   id,parallelExt,buildMs:+(buildDone-started).toFixed(3),
   batchMs:+(batchDone-buildDone).toFixed(3),
   compileAsyncMs:+(compileDone-compileStart).toFixed(3),
   uploadMs:+(uploadDone-uploadStart).toFixed(3),
   totalMs:+(uploadDone-started).toFixed(3),
   programsAfter:renderer.info.programs?.length||0,
   checkShaderErrorsUnchanged:renderer.debug.checkShaderErrors===oldErrorCheck};
  staged.set(id,{host,props,receipt});prepareReceipts.push(receipt);
  return receipt;
 }

 // R179: actually draw the unchanged Blender source mesh under the normal
 // scene loading cover. compileAsync alone previously left 100ms+ stutters.
 // This does NOT simulate a cast, change score, or suppress shader errors.
 async function prewarmRealAuthoredHero(id,renderer,camera,targetScene){
  if(!heroAssets.has(id)||!renderer||!camera||!targetScene)
   throw Error('R179 genuine authored asset required for GPU prime');
  const started=performance.now(),programsBefore=renderer.info.programs?.length||0;
  const host=group(root,0,1.45,-.30);
  host.name='R179_GPU_PRIME_REAL_3D_'+id;
  build(host,id);
  const batch=staticBatcher?.batch(host,id)||null;
  // Three real GPU frame submissions (frustum position is the actual battle
  // plane; use source materials with shader checks unchanged).
  for(let i=0;i<3;i++)await new Promise(resolve=>
   requestAnimationFrame(()=>{renderer.render(targetScene,camera);resolve()}));
  root.remove(host);
  let renderedMeshes=0;
  host.traverse(o=>{if(o.isMesh)renderedMeshes++});
  return {id,renderFrames:3,realMeshes:renderedMeshes,
   batch,ms:+(performance.now()-started).toFixed(2),
   shaderDelta:(renderer.info.programs?.length||0)-programsBefore,
   sourceFidelity:true};
 }
 // R187: stage the genuine currently selected GLB for exactly the FIRST
 // already-required visible scene frames. No separate render-loop or delay.
 // Strictly dispose preview group before announcing game ready; reuse the
 // same imported mesh+material GPU objects when first cast clones source.
 function stageOriginalHeroForExistingFrames(id){
  if(!heroAssets.has(id))
   throw Error('R187 selected genuine Blender source not registered '+id);
  const t0=performance.now(),host=group(root,0,1.45,-.30);
  host.name='R187_EXISTING_FRAME_GPU_PRIME_'+id;
  build(host,id);
  const batch=staticBatcher?.batch(host,id)||null;
  let meshCount=0;host.traverse(o=>{if(o.isMesh)meshCount++});
  let cleared=false;
  return {id,meshCount,batch,buildMs:+(performance.now()-t0).toFixed(2),
   get cleared(){return cleared},
   stop(){if(cleared)return;root.remove(host);cleared=true;}};
 }
 const r174Profile=[];
 const maxActive=4;let played=0,expired=0,rejected=0,peakObjects=0,
  peakDraws=0,distinctProps=new Set(),hitAnimations=0;
 const geometry=(name,...params)=>{
  const key=name+JSON.stringify(params);
  if(!gcache.has(key))gcache.set(key,new THREE[name](...params));
  return gcache.get(key);
 };
 const material=(color,metalness=.08)=>{
  const key=hex(color)+':'+metalness;
  if(!mcache.has(key))mcache.set(key,new THREE.MeshStandardMaterial({
   color,metalness,roughness:.68,flatShading:false,
   transparent:false,side:THREE.FrontSide}));
  return mcache.get(key);
 };
 const group=(parent,x=0,y=0,z=0)=>{
  const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;
 };
 const put=(parent,shape,dims,color,{x=0,y=0,z=0,rz=0,ry=0,rx=0,role=''}={})=>{
  const model=new THREE.Mesh(geometry(shape,...dims),material(color));
  model.position.set(x,y,z);model.rotation.set(rx,ry,rz);
  model.castShadow=false;model.receiveShadow=false;model.name=role||shape;
  if(role)model.userData.motion=role;
  parent.add(model);return model;
 };
 const box=(p,w,h,d,c,x=0,y=0,z=0,role='')=>
  put(p,'BoxGeometry',[w,h,d],c,{x,y,z,role});
 const ball=(p,r,c,x=0,y=0,z=0,role='')=>
  put(p,'SphereGeometry',[r,14,10],c,{x,y,z,role});
 const cone=(p,r,h,c,x=0,y=0,z=0,role='')=>
  put(p,'ConeGeometry',[r,h,9],c,{x,y,z,role});
 const tube=(p,r,h,c,x=0,y=0,z=0,role='')=>
  put(p,'CylinderGeometry',[r,r,h,12],c,{x,y,z,role});
 const torus=(p,r,c,x=0,y=0,z=0,role='')=>
  put(p,'TorusGeometry',[r,.055,8,24],c,{x,y,z,role});
 const page=(p,c,x=0,y=.1,z=0)=>box(p,.8,1.0,.045,c,x,y,z,'flutter');
 const paperStack=(p,n=3,color='#f6eada',x=0,y=0)=>{
  for(let i=0;i<n;i++){
   const s=page(p,color,x+i*.08,y+i*.055,-i*.05);s.rotation.z=(i-1)*.22;
  }
 };
 const book=(p,c='#f3d9ad',x=0,y=.1,z=0)=>{
  box(p,1.13,.15,.80,'#465e73',x,y-.30,z);
  box(p,1.08,.07,.75,c,x,y-.20,z,'flutter');
  return p;
 };
 const bowl=(p,x=0,y=.05,z=0,c='#e7d7b7')=>{
  const g=group(p,x,y,z);
  put(g,'CylinderGeometry',[.74,.49,.5,18],c,{role:'bounce'});
  tube(g,.045,.87,'#bbc5ce',.30,.42,0);
  const liquid=put(g,'CylinderGeometry',[.60,.60,.045,18],'#b98457',{y:.24});
  return {g,liquid};
 };
 const pan=p=>{
  const x=group(p,0,.08,0);
  put(x,'CylinderGeometry',[.80,.70,.15,20],'#5e6770',{y:.12,role:'bounce'});
  tube(x,.075,1.0,'#5e6770',1.15,.16,0).rotation.z=Math.PI/2;
  return x;
 };
 const fruit=(p,color,x,y,z,r=.21)=>ball(p,r,color,x,y,z,'bounce');
 const pencil=(p,color,x=0,y=0,z=0,scale=1)=>{
  const g=group(p,x,y,z);
  put(g,'CylinderGeometry',[.06*scale,.06*scale,.85*scale,8],color,{role:'spin'});
  cone(g,.085*scale,.16*scale,'#e5bd93',0,-.51*scale,0);
  return g;
 };
 const megaphone=p=>{
  const g=group(p);
  put(g,'ConeGeometry',[.48,1.05,17],'#d8af79',{x:0,y:0,z:0,rx:Math.PI/2});
  box(g,.19,.27,.31,'#62566c',0,-.46,0);
  return g;
 };
 const speaker=p=>{
  const g=group(p);box(g,1.25,1.2,.49,'#59687b',0,.05,0);
  for(const [x,y,r] of [[0,-.23,.29],[0,.38,.16]])
   put(g,'CylinderGeometry',[r,r,.07,16],'#d6e2e9',{x,y,z:.27,rx:Math.PI/2});
  return g;
 };
 const desk=p=>{
  const g=group(p);box(g,1.58,.14,.94,'#af825a',0,.20,0);
  for(const x of [-.61,.61])for(const z of [-.30,.30])
   box(g,.10,.84,.10,'#6e767a',x,-.27,z);
  return g;
 };
 const clock=p=>{
  const g=group(p);ball(g,.72,'#f1d9a2');
  const dial=put(g,'CylinderGeometry',[.61,.61,.075,28],'#f0e6d4',{z:.12,rx:Math.PI/2});
  for(const [h,rz] of [[.60,.67],[.36,-.83]]){
   const hand=box(g,.065,h,.065,'#45485c',0,0,.20,'spin');
   hand.rotation.z=rz;
  }
  tube(g,.10,.18,'#5b6071',0,.83,0);
  return g;
 };
 const helmet=p=>{
  const g=group(p);const dome=ball(g,.49,'#e3b65e',0,.17);
  dome.scale.set(1.35,.86,1.1);box(g,.85,.10,.65,'#644f48',0,-.10,.09);
  return g;
 };
 const bottle=p=>{
  const g=group(p);
  put(g,'CylinderGeometry',[.34,.46,1.26,14],'#ca8e72',{y:-.05,role:'bounce'});
  tube(g,.19,.40,'#e8d9be',0,.69,0);
  return g;
 };
 const trophy=p=>{
  const g=group(p);put(g,'CylinderGeometry',[.58,.25,.73,20],'#e6bc62',{y:.20});
  tube(g,.10,.44,'#cfab57',0,-.34);
  box(g,.70,.12,.48,'#786758',0,-.61);
  return g;
 };
 const car=p=>{
  const g=group(p);box(g,1.8,.52,.83,'#b28d79',0,.02,0);
  box(g,.9,.45,.76,'#d7d4bc',-.13,.40,0);
  for(const x of [-.58,.60])for(const z of [-.47,.47]){
   const w=put(g,'CylinderGeometry',[.24,.24,.10,14],'#333d43',{x,y:-.24,z,rx:Math.PI/2});
  }
  return g;
 };
 const door=p=>{
  const g=group(p);box(g,1.05,1.65,.11,'#658d86',0,.20,0);
  tube(g,.06,.12,'#d7b979',.37,.22,.11);
  return g;
 };
 const sock=p=>{
  const g=group(p);box(g,.33,.92,.12,'#e2d0c1',0,.16,0);
  box(g,.53,.24,.13,'#a77a7c',.17,-.23,0);return g;
 };
 const stairs=p=>{
  const g=group(p);for(let i=0;i<4;i++)
   box(g,.62,.13,.70,'#9f877d',-.68+i*.46,-.5+i*.23,0);
  return g;
 };
 const notebook=p=>{const g=group(p);book(g,'#efe5be');
  for(let i=0;i<4;i++)tube(g,.025,.10,'#333f53',-.36+i*.20,-.07,.39);
  return g;
 };
 const sign=(p,label)=>{
  const key=label;
  let tex=labels.get(key);
  if(!tex){
   const canvas=document.createElement('canvas');canvas.width=768;canvas.height=184;
   const c=canvas.getContext('2d');
   c.fillStyle='#273d50';c.fillRect(0,0,768,184);
   c.strokeStyle='#d4bb8b';c.lineWidth=10;c.strokeRect(8,8,752,168);
   c.fillStyle='#fff3cf';c.textAlign='center';c.textBaseline='middle';
   c.font='bold 52px system-ui, "Noto Sans CJK SC",sans-serif';
   const chars=[...label],long=chars.length>12;
   if(long)c.font='bold 41px system-ui, "Noto Sans CJK SC",sans-serif';
   c.fillText(label,384,92,718);
   tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
   labels.set(key,tex);
  }
  if(!labelMaterials.has(label))labelMaterials.set(label,
   new THREE.MeshBasicMaterial({map:tex,transparent:false,side:THREE.DoubleSide}));
  const model=new THREE.Mesh(geometry('PlaneGeometry',2.36,.57),
   labelMaterials.get(label));
  model.position.set(0,-.94,.32);
  p.add(model);
 };
 function build(g,id){
  const authored=heroAssets.get(id);
  if(authored){
   const real=authored.clone(true);
   real.name='R179_Original_3D_Sculpt_'+id;
   // R182 expressive on-stage composition only; never rescale geometry
   // buffers, decrease textures or pull close-up in front of the opponent.
   const r182StageSizing={
    K06:[1.28,-.44],Q05:[1.32,-.42],P04:[1.38,-.45],
    S04:[1.25,-.42],P05:[1.26,-.48],X05:[1.23,-.45],
    P03:[1.12,-.70],S08:[1.18,-.62],X03:[1.29,-.47],
    Q06:[1.10,-.49],K02:[1.27,-.43],K08:[1.14,-.49],
    S03:[1.12,-.56],Q01:[1.21,-.42],
    E05:[1.17,-.49],G05:[1.20,-.45],T06:[1.20,-.46],
    K03:[1.18,-.39],K04:[1.26,-.34],Q02:[1.20,-.45],
    S01:[1.28,-.46],S06:[1.22,-.45],P07:[1.19,-.42],
    X02:[1.18,-.45],
    G06:[1.21,-.43],T05:[1.19,-.35],K05:[1.23,-.37],
    Q03:[1.22,-.47],Q04:[1.26,-.49],Q07:[1.22,-.47],
    Q08:[1.16,-.47],S02:[1.19,-.40],S05:[1.20,-.52],
    S07:[1.25,-.48],
    P01:[1.11,-.56],P02:[1.17,-.40],P06:[1.16,-.48],
    P08:[1.24,-.40],X01:[1.18,-.62],X04:[1.20,-.43],
    X06:[1.20,-.45],X07:[1.24,-.47],X08:[1.13,-.52]};
   if(r182StageSizing[id]){
    real.scale.setScalar(r182StageSizing[id][0]);
    real.position.y=r182StageSizing[id][1];
   }
   g.add(real);
   return;
  }
  // Seven R170 signature gags are authored as independent, denser
  // physically recognizable props, without generic glowing rings.
  if(renderCampusHeroProp(id,{THREE,g,group,box,ball,cone,tube,torus,
    geometry,material,pan,book,paperStack,pencil})){
   sign(g,BY_ID[id].name);
   return;
  }
  // Distinct physical silhouettes; visual identities derive from original
  // school-life props rather than merely swapping glowy material colors.
  switch(id){
   case 'E05':case 'P04': megaphone(g); if(id==='P04')torus(g,.24,'#f0a861',.68,.1,0,'bounce');break;
   case 'E06':case 'Q01':case 'Q05':{
    const r=box(g,1.20,.43,.71,id==='Q05'?'#ede4c9':'#51616d',0,.15,0,'tumble');
    box(g,1.20,.11,.70,'#ddd0ba',0,.42);
    if(id==='Q01'){paperStack(g,2);pencil(g,'#b77b63',.6,.35,.1,.6)}
    if(id==='Q05'){pencil(g,'#ece8db',-.6,.47,0);box(g,.30,.33,.16,'#3a4659',.75,0)}
    break;}
   case 'G05':case 'P02':desk(g);if(id==='P02')ball(g,.38,'#e6cb9d',.8,.42,0,'bounce');break;
   case 'G06':case 'X05':paperStack(g,id==='X05'?6:3);book(g,'#e0a981');break;
   case 'T05':case 'K05':bowl(g,0,.08,0,id==='K05'?'#d9e0e6':'#f4ca87');break;
   case 'T06':case 'Q04':speaker(g);if(id==='Q04')box(g,.52,.85,.13,'#c0bbc2',.88,.06,.06);break;
   case 'K01':case 'K04':case 'K03':{pan(g);
    for(let i=0;i<5;i++)fruit(g,id==='K04'?'#b94a46':i%2?'#e4bb5d':'#7b607c',
      -.65+i*.28,.22+(i%2)*.16,i%3*.20-.2,.18);
    if(id==='K04')cone(g,.28,.72,'#df6d43',.53,.48);break;}
   case 'K02':{ball(g,.75,'#4b9d71',0,.12);ball(g,.51,'#d56667',0,.18,.32);
    box(g,.52,.24,.14,'#e5e1d5',.15,.25,.72);break;}
   case 'K06':case 'S08':{bottle(g);
    if(id==='S08'){box(g,1.65,1.20,.77,'#89a7a0',0,-.16,-.36);
      box(g,.48,.27,.11,'#526881',0,.25,.09)}
    else{tube(g,.08,1.12,'#f8e1c6',.25,.83,0);cone(g,.45,.66,'#c74d37',0,1.02)}
    break;}
   case 'K07':{const frog=group(g);ball(frog,.54,'#8ab982',0,.12);
    for(const x of [-.3,.3])ball(frog,.19,'#f0e7d0',x,.42,.31);
    box(g,1.30,.18,1.12,'#e8bfbd',0,-.55);break;}
   case 'K08':{const b=ball(g,.64,'#e7cb72');b.scale.x=.66;
    for(let i=0;i<3;i++)box(g,.8,.12,.40,'#70483b',0,.16+i*.22,.20);break;}
   case 'Q02':{paperStack(g,2);cone(g,.48,.74,'#b4c1d2',0,.75);
    ball(g,.25,'#b2a58c',0,1.01);break;}
   case 'Q03':case 'Q08':{box(g,1.72,1.18,.13,'#245e52',0,.12,0);
    for(let i=0;i<4;i++)pencil(g,'#e0dfc6',-.53+i*.32,.14,.13,.45);
    break;}
   case 'Q06':{tube(g,.065,.95,'#7e8d9a',0,-.20);
    const shade=cone(g,.71,.70,'#f2cd7c',0,.36);shade.rotation.z=Math.PI;
    for(let i=0;i<3;i++)ball(g,.09,'#c76d5c',-.44+i*.20,-.57,.15);break;}
   case 'Q07':{ball(g,.55,'#efddad',-.47,.20);ball(g,.42,'#cdd5e3',.52,.44);break;}
   case 'S01':case 'X01':clock(g);if(id==='X01')paperStack(g,2,'#e8d9aa',.7,-.4);break;
   case 'S02':{box(g,1.52,.48,.66,'#b9a58d',0,-.36);
    pencil(g,'#f0b573',0,.52);break;}
   case 'S03':{tube(g,.10,1.80,'#9d7d61',0,.20);box(g,.80,.45,.20,'#d8c9a7',0,-.75);break;}
   case 'S04':{box(g,1.48,1.09,.73,'#797b8b',0,0);paperStack(g,2,'#ffefcc',.33,.55);
    for(let i=0;i<3;i++)cone(g,.21,.36,'#e6cf64',-.60+i*.56,.40);break;}
   case 'S05':{box(g,.88,1.16,.48,'#9bb4af',0,.05);
    ball(g,.41,'#e4caa0',0,.83);
    for(const x of [-.27,.27])ball(g,.075,'#536977',x,.93,.34);
    break;}
   case 'S06':{const band=torus(g,.70,'#d1a3b4');band.scale.set(1.70,.72,1);
    for(const x of [-1,1])ball(g,.18,'#aa7c66',x,.05);break;}
   case 'S07':{clock(g);box(g,.68,1.03,.14,'#856d85',0,0,-.47);break;}
   case 'P01':{helmet(g);for(let i=0;i<8;i++)cone(g,.075,.63,'#e9bc73',-.8+i*.24,.68+Math.sin(i)*.18);break;}
   case 'P03':{box(g,1.56,.94,.84,'#b69a76',0,-.18);
    cone(g,.47,.72,'#ac8c69',-.62,.63);
    for(const x of [-.5,.5])box(g,.22,.50,.25,'#967457',x,-.84);break;}
   case 'P05':{ball(g,.60,'#efcb7e',-.58,.0);
    const hoop=torus(g,.55,'#c16b5e',.56,.46);
    hoop.rotation.x=Math.PI/2;box(g,.12,.72,.13,'#e1c5a9',.56,-.15,-.16);break;}
   case 'P06':{box(g,1.86,.19,.87,'#5e6b72',0,-.42);
    for(let i=0;i<3;i++)tube(g,.20,.50,'#a8998b',-.65+i*.58,-.56).rotation.z=Math.PI/2;
    break;}
   case 'P07':{const bird=group(g);ball(bird,.53,'#323a45',0,.10);
    ball(bird,.29,'#323a45',.29,.43);cone(bird,.18,.45,'#dda45d',.62,.43).rotation.z=-Math.PI/2;
    break;}
   case 'P08':{trophy(g);ball(g,.26,'#cb8861',.45,1.10);break;}
   case 'X02':{const uniform=group(g);box(uniform,1.02,1.18,.13,'#638fa8',0,.08);
    for(const x of [-.65,.65])box(uniform,.50,.42,.16,'#638fa8',x,.48);
    box(uniform,.09,.73,.14,'#e8d5b2',0,.12,.12);break;}
   case 'X03':car(g);break;
   case 'X04':{box(g,1.58,.50,1.13,'#9ca9cc',0,-.12);
    box(g,1.52,.23,1.04,'#d8cee5',0,.24);break;}
   case 'X06':{for(let i=0;i<4;i++){
    const b=group(g,-.86+i*.56,-.04,0);
    book(b,i%2?'#e7c4a2':'#b7cccf');b.rotation.y=(i-1.5)*.38}break;}
   case 'X07':{const timetable=group(g);box(timetable,1.60,1.31,.07,'#d7c5a7',0,.14);
    for(let i=0;i<4;i++)box(timetable,1.40,.06,.10,i===3?'#b65c54':'#697f8e',
      0,.56-i*.28,.08);paperStack(g,2,'#f1e4d1',.43,-.49);break;}
   case 'X08':{door(g);book(g,'#dfb998',.6,.03);break;}
   default:throw new Error('R169 no physical prop construction for '+id);
  }
  const special=Object.freeze({
   'K01':'🍆 + 🍌','E06':'板擦！','Q05':'粉笔记者','P04':'口哨！',
   'K06':'辣椒奶茶','X03':'教务车违停','P05':'排球进篮筐'
  });
  sign(g,special[id]||BY_ID[id].name);
 }
 function disposeActive(a){
  root.remove(a.group);
  expired++;
 }
 // R199: unload original Blender source only after its real stage clone
 // has left the arena; otherwise shared GPU geometry would be destroyed.
 function releaseHeroAsset(id){
  const model=heroAssets.get(id);
  if(!model)return true;
  if(active.some(a=>a.id===id)||staged.has(id))return false;
  const geometries=new Set(),materials=new Set(),textures=new Set();
  model.traverse(o=>{
   if(!o.isMesh)return;
   if(o.geometry)geometries.add(o.geometry);
   for(const m of (Array.isArray(o.material)?o.material:[o.material])){
    if(!m)continue;
    materials.add(m);
    for(const key of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap']){
     if(m[key])textures.add(m[key]);
    }
   }
  });
  geometries.forEach(g=>g.dispose());
  materials.forEach(m=>m.dispose());
  textures.forEach(t=>t.dispose());
  heroAssets.delete(id);
  return true;
 }

 function play(message,now=0){
  const card=BY_ID[message?.card];
  const identity=SCHOOL_MAGIC_IDENTITIES[message?.card];
  if(!message||message.type!=='ASDC_R81_SPELL_RESULT'||
   !['player','ai'].includes(message.side)||
   !Number.isInteger(message.serial)||message.serial<=0||
   card?.kind!=='spell'||!identity||
   (message.effect!==undefined&&message.effect!==card.effect)){
   rejected++;return false;
  }
  const target=SPELL_CHOREOGRAPHY[card.id]?.target==='enemy'?
   (message.side==='player'?'ai':'player'):message.side;
  const g=group(root,(target==='player'?-1:1)*1.72,0,0);
  g.name='R169_'+card.id+'_'+identity.prop;
  const t0=performance.now();
  const preready=staged.get(card.id);
  let props;
  if(preready){
   props=preready.props;
   props.position.set(0,1.45,-.30);
   g.add(props);
   staged.delete(card.id);
  }else{
   props=group(g,0,1.45,-.30);
   build(props,card.id);
  }
  const t1=performance.now();
  const batchReceipt=preready?.receipt||staticBatcher?.batch(props,card.id)||null;
  const t2=performance.now();
  if(r174Profile.length<110)r174Profile.push({
   card:card.id,buildMs:+(t1-t0).toFixed(3),
   batchMs:+(t2-t1).toFixed(3),createdAt:t0,
   numLabelTextures:labels.size,
   cacheGeometries:gcache.size,
   cacheMaterials:mcache.size
  });
  props.rotation.y=message.side==='player'?-.24:.24;
  g.traverse(o=>{if(o.isMesh){o.userData.basePosition=o.position.clone();
   o.userData.baseRotation=o.rotation.clone()}});
  const life=reducedMotion?1.4:r200Readable?2.5:2.1;
  if(r200Readable){
   // Sequential magic should stay legible in one wide arena. Do not stack
   // three huge unrelated school props over the opponent reaction.
   for(const prior of active)if(prior.retireAt===undefined)prior.retireAt=now;
  }
  const entry={id:card.id,identity,side:message.side,target,serial:message.serial,
   created:now,duration:life,group:g,props,contacted:false,
   parts:g.children.length,appliedDirectDamage:Number(message.directDamage)||0,batchReceipt};
  active.push(entry);played++;
  distinctProps.add(identity.prop);
  lastBySide[message.side]=card.id;
  const visibleMeshes=[];
  g.traverse(o=>{if(o.isMesh)visibleMeshes.push(o)});
  peakObjects=Math.max(peakObjects,visibleMeshes.length);
  peakDraws=Math.max(peakDraws,visibleMeshes.length);
  while(active.length>maxActive)disposeActive(active.shift());
  return true;
 }

 function playCollateral(incident,anchor,now){
  if(!incident||!anchor||!Number.isFinite(now))return false;
  const main=active.find(x=>x.serial===incident.serial&&x.id===incident.card);
  if(!main||collateral.some(x=>x.serial===incident.serial))return false;
  // Share the original physical school prop geometry and PBR materials,
  // never introduce a generic glowing spectator projectile.
  const g=group(root);
  g.name='R174_REAL_SCHOOL_PROP_TO_SPECTATOR_'+incident.card;
  const prop=main.props.clone(true);
  prop.position.set(0,0,0);prop.rotation.set(0,0,0);
  prop.scale.setScalar(.62);
  g.add(prop);
  const start=new THREE.Vector3(incident.side==='player'?-1.78:1.78,1.55,-.55);
  const end=new THREE.Vector3(anchor.x,anchor.y+1.32,anchor.z+.20);
  g.position.copy(start);
  collateral.push({serial:incident.serial,id:incident.card,start,end,group:g,
   born:now,duration:.96});
  collateralLaunched++;
  while(collateral.length>3){
   const stale=collateral.shift();root.remove(stale.group);collateralExpired++;
  }
  return true;
 }
 function contact(descriptor,now){
  const entry=active.find(a=>a.serial===descriptor?.serial);
  if(!entry)return false;
  entry.contacted=true;entry.contactTime=now;hitAnimations++;
  return true;
 }
 function update(now=0){
  for(let i=collateral.length-1;i>=0;i--){
   const c=collateral[i],t=clip((now-c.born)/c.duration);
   if(t>=1){root.remove(c.group);collateral.splice(i,1);collateralExpired++;continue}
   const flight=smooth(t/.60);
   c.group.position.lerpVectors(c.start,c.end,flight);
   c.group.position.y+=.64*Math.sin(flight*Math.PI);
   c.group.rotation.z=(t*4.5)*(c.id==='E06'?-1:1);
   c.group.scale.setScalar((.7+.3*smooth(t/.20))*(1-smooth((t-.76)/.23)));
  }
  for(let i=active.length-1;i>=0;i--){
   const a=active[i],t=clip((now-a.created)/a.duration);
   if(t>=1 || (r200Readable&&a.retireAt!==undefined&&
      now-a.retireAt>=.26)){
    disposeActive(a);active.splice(i,1);
    if(r200Readable&&a.retireAt!==undefined)gracefulRetirements++;
    continue;
   }
   const appear=smooth(t/(r200Readable?.115:.17)),vanish=1-smooth((t-.83)/.17);
   const throwStage=smooth((t-.12)/.38),impact=smooth((t-.46)/.12);
   const wobble=Math.sin(t*20+a.serial)*.09;
   const isThrow=['教具投掷','黑暗食堂','社团实验','体育荒诞'].includes(a.identity.family);
   // R200: actor-specific wide-shot silhouettes. Only the small eraser
   // grows; large food/gag actors retain their established source scale.
   // No automatic camera zoom, no second camera/portrait pass.
   const scaleBoost=r200Readable&&a.id==='E06'?1.44:1;
   const retire=r200Readable&&a.retireAt!==undefined?
    1-smooth((now-a.retireAt)/.26):1;
   a.group.scale.setScalar((.76+.24*appear)*vanish*scaleBoost*retire);
   const throwDistance=r200Readable&&a.id==='E06'?1.70:1.05;
   a.props.position.x=(a.side==='player'?-1:1)*(isThrow?
    throwDistance*(1-throwStage):.17*Math.sin(t*8));
   a.props.position.y=1.45+(isThrow?
    (r200Readable&&a.id==='E06'?.80:.65)*Math.sin(throwStage*Math.PI):
    .12*Math.sin(t*8))-(a.contacted?.28*impact:0);
   a.props.rotation.z=isThrow?
    ((r200Readable&&a.id==='E06')?throwStage*.95:throwStage*.7)+wobble:
    wobble*.8;
   a.props.rotation.y=t*(a.identity.family==='时空校园'?.70:.23);
   a.props.traverse(o=>{
    const motion=o.userData?.motion;
    const base=o.userData?.basePosition,rotation=o.userData?.baseRotation;
    // R178: the cooked banana and aubergine actually leap separately
    // within the curved wok rather than the entire prop rigidly wobbling.
    // Both baked curved banana ribs and body share exact deterministic motion.
    // K07 is a living custard frog with an independently ringing SCHOOL bell
    // and cloche, not another shared glowing ring or a rigid prop yaw.
    // Six independent original campus gags animate authored Blender actor groups.
    // No per-frame geometries, no shader lights or asset downgrade.
    if(r182AnimateActor(a.id,o,t,a.serial))return;
    if(r183AnimateActor(a.id,o,t,a.serial))return;
    if(r184AnimateActor(a.id,o,t,a.serial))return;
    if(r185AnimateActor(a.id,o,t,a.serial))return;
    if(r186AnimateActor(a.id,o,t,a.serial))return;
    if(a.id==='K07'&&o.isObject3D&&!o.isMesh){
     const frog=o.name.includes('K07_JELLY_FROG_ACTOR');
     const bell=o.name.includes('K07_SCHOOL_BELL_ACTOR');
     const lid=o.name.includes('K07_LIFTED_CLOCHE_ACTOR');
     if(frog||bell||lid){
      if(base)o.position.copy(base);else o.position.set(0,0,0);
      if(rotation)o.rotation.copy(rotation);else o.rotation.set(0,0,0);
      const pulse=Math.abs(Math.sin(t*(frog?13:22)+a.serial*.15));
      if(frog){
       o.position.y+=.27*pulse*smooth(t/.09)*(1-smooth((t-.81)/.16));
       o.rotation.z+=.08*Math.sin(t*15);
      }else if(bell){
       o.position.y+=.31+.20*Math.sin(t*21);
       o.rotation.z+=.35*Math.sin(t*24);
      }else if(lid){
       o.position.y+=.15+.16*Math.sin(t*8);
       o.rotation.z+=.21*Math.sin(t*9+1);
      }
      return;
     }
    }
    if(a.id==='K01'&&o.isMesh){
     const banana=/banana sculpt|banana raised seam/i.test(o.name);
     const eggplant=/aubergine body|calyx forest/i.test(o.name);
     if(banana||eggplant){
      if(base)o.position.copy(base);
      if(rotation)o.rotation.copy(rotation);
      const pulse=banana?Math.sin(t*16+0.7):Math.sin(t*13+2.1);
      const lift=(.13+.16*Math.max(0,pulse))*smooth(t/.12)*
       (1-smooth((t-.80)/.15));
      o.position.y+=lift;
      o.rotation.z+=(banana?.15:-.09)*pulse;
      return;
     }
    }
    if(!motion)return;
    if(base)o.position.copy(base);
    if(rotation)o.rotation.copy(rotation);
    if(motion==='flutter')o.rotation.z+=Math.sin(t*11+o.id)*.18;
    else if(motion==='spin')o.rotation.y+=t*3.4;
    else if(motion==='bounce')o.position.y+=Math.abs(Math.sin(t*10+o.id))*.15;
    else if(motion==='tumble')o.rotation.x+=t*4;
   });
  }
 }
 function dispose(){
  while(collateral.length){const item=collateral.pop();root.remove(item.group)}
  while(active.length)disposeActive(active.pop());
  for(const g of gcache.values())g.dispose();gcache.clear();
  for(const m of mcache.values())m.dispose();mcache.clear();
  for(const texture of labels.values())texture.dispose();labels.clear();
  for(const {host} of staged.values())host.clear();
  staged.clear();
  staticBatcher?.dispose();
  for(const m of labelMaterials.values())m.dispose();labelMaterials.clear();
  root.removeFromParent();
 }
 return {root,play,contact,playCollateral,update,dispose,prepareGpuMaterial,prewarmRealAuthoredHero,registerHeroAsset,releaseHeroAsset,stageOriginalHeroForExistingFrames,
  get prepareReceipts(){return prepareReceipts.map(x=>({...x}))},
  get qaProfile(){return r174Profile.map(x=>({...x}))},
  get r182ActorMotions(){
   return active.filter(a=>R182_HERO_IDS.includes(a.id)).map(a=>{
    const groups=[];
    a.props.traverse(o=>{
     if(o.isObject3D&&!o.isMesh&&o.name.startsWith(a.id+'_')&&
       o.name.endsWith('_ACTOR')){
      groups.push({name:o.name,
       pos:o.position.toArray().map(v=>+v.toFixed(4)),
       rot:o.rotation.toArray().slice(0,3).map(v=>+v.toFixed(4))});
     }
    });
    return{id:a.id,serial:a.serial,groups};
   });
  },
  get r183ActorMotions(){
   return active.filter(a=>R183_HERO_IDS.includes(a.id)).map(a=>{
    const groups=[];
    a.props.traverse(o=>{
     if(o.isObject3D&&!o.isMesh&&o.name.startsWith(a.id+'_')&&
        o.name.endsWith('_ACTOR')){
      groups.push({name:o.name,
       pos:o.position.toArray().map(v=>+v.toFixed(4)),
       rot:o.rotation.toArray().slice(0,3).map(v=>+v.toFixed(4))});
     }
    });
    return{id:a.id,serial:a.serial,groups};
   });
  },
  get r184ActorMotions(){
   return active.filter(a=>R184_HERO_IDS.includes(a.id)).map(a=>{
    const groups=[];
    a.props.traverse(o=>{
     if(o.isObject3D&&!o.isMesh&&o.name.startsWith(a.id+'_')&&
       o.name.endsWith('_ACTOR'))
      groups.push({name:o.name,
       pos:o.position.toArray().map(v=>+v.toFixed(4)),
       rot:o.rotation.toArray().slice(0,3).map(v=>+v.toFixed(4)),
       scl:o.scale.toArray().map(v=>+v.toFixed(4))});
    });
    return{id:a.id,serial:a.serial,groups};
   });
  },
  get r185ActorMotions(){
   return active.filter(a=>R185_HERO_IDS.includes(a.id)).map(a=>{
    const groups=[];
    a.props.traverse(o=>{
     if(o.isObject3D&&!o.isMesh&&o.name.startsWith(a.id+'_')&&o.name.endsWith('_ACTOR'))
      groups.push({name:o.name,
       pos:o.position.toArray().map(v=>+v.toFixed(4)),
       rot:o.rotation.toArray().slice(0,3).map(v=>+v.toFixed(4)),
       scl:o.scale.toArray().map(v=>+v.toFixed(4))});
    });
    return{id:a.id,serial:a.serial,groups};
   });
  },
  get r186ActorMotions(){
   return active.filter(a=>R186_HERO_IDS.includes(a.id)).map(a=>{
    const groups=[];
    a.props.traverse(o=>{
     if(o.isObject3D&&!o.isMesh&&o.name.startsWith(a.id+'_')&&o.name.endsWith('_ACTOR'))
      groups.push({name:o.name,
       pos:o.position.toArray().map(v=>+v.toFixed(4)),
       rot:o.rotation.toArray().slice(0,3).map(v=>+v.toFixed(4)),
       scl:o.scale.toArray().map(v=>+v.toFixed(4))});
    });
    return{id:a.id,serial:a.serial,groups};
   });
  },
  get r179K07ActorMotion(){
   const a=active.find(entry=>entry.id==='K07');
   if(!a)return {active:false,groups:[]};
   const groups=[];
   a.props.traverse(o=>{
    if(o.isObject3D&&!o.isMesh&&/^K07_(JELLY_FROG|SCHOOL_BELL|LIFTED_CLOCHE)_ACTOR/.test(o.name))
     groups.push({name:o.name,y:+o.position.y.toFixed(4),rz:+o.rotation.z.toFixed(4)});
   });
   return {active:true,groups};
  },
  get stats(){return {enabled:true,totalIdentities:SCHOOL_MAGIC_COUNT,
   r200Readable,gracefulRetirements,
   authoredHighDetailAssets:[...heroAssets.keys()],
   collateralLaunched,collateralExpired,collateralActive:collateral.length,
   played,expired,rejected,active:active.length,peakObjects,peakDraws,
   uniqueRenderedProps:distinctProps.size,shaderPointLights:0,
   cacheGeometries:gcache.size,cacheMaterials:mcache.size,
   staticBatch:staticBatcher?.stats||{enabled:false},
   decalTextures:labels.size,hitAnimations,
   lastBySide:{...lastBySide},
   activeIds:active.map(a=>a.id)}}};
}
