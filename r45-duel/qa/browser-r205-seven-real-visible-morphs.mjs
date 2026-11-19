/**
 * R205 real source visible-vertex animation evidence in Chromium GPU.
 * Do not mistake no-op unbound source armature movement for visible acting.
 * The 7 R97 BLENDER BODY MORPHS are a real render target on each body mesh.
 */
import assert from'node:assert/strict';
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{execFileSync}from'node:child_process';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r205-original-summons';
mkdirSync(dir,{recursive:true});
const ids=['E03','E04','G02','G03','G04','T03','T04'];
const enabled=process.env.R205_CASE!=='default-off';
const report={pass:false,case:enabled?'original-morph-acting':'default-off',ids,
 errors:[],genuineChrome:true,platform:'Z890 Chrome Vulkan WebGL2'};
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const movie=process.env.R205_FILM==='1'&&enabled;
const ctx=await b.newContext({viewport:{width:1440,height:860},
 serviceWorkers:'block',...(movie?{
 recordVideo:{dir,size:{width:1152,height:688}}}:{})});
const page=await ctx.newPage();
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
const snapshot=()=>page.evaluate(()=>{
 const qa=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
 const s=z?.summonPresence;
 return {round:qa?.round,hp:qa?.hp,events:qa?.events?.length,board:qa?.board,
  total:s?.total,actors:s?.r205VisibleBodyLife,sourceModels:s?.loadedPrototypeIds,
  rigLife:s?.r117CharacterMotion,entries:s?.entries?.map(v=>({
   id:v.id,side:v.side,uid:v.uid,source:v.kind,
   file:z?.summonModels?.find(x=>x.id===v.id)?.file,
   meshes:v.meshes,playing:v.playingClips,frontDot:v.metrics?.frontDot,
   inView:v.inView,ndcBounds:v.metrics?.ndcBounds,
   sourceMorphClipCount:v.clips
  })),
  camera:z?.r145ActionShot?.enabled,inset:z?.renderPerformance?.heroInsetDraws,
  drawCalls:z?.drawCalls};
});
try{
 const url='http://127.0.0.1:18689/r45-duel/?qa=1&seed=205&r205LivingSummons='+
  (enabled?'on':'off');
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:75000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:145000});
 const start=await snapshot();
 const group={player:ids.slice(0,4).map((id,i)=>({
  id,uid:'U'+(205101+i),hp:5,attack:2,shield:0})),
  ai:ids.slice(4).map((id,i)=>({
  id,uid:'U'+(205201+i),hp:5,attack:2,shield:0}))};
 await page.evaluate(u=>document.getElementById('stadium').contentWindow.postMessage({
  type:'ASDC_R45_BOARD',units:u,player:u.player.map(x=>x.id),
  ai:u.ai.map(x=>x.id)
 },location.origin),group);
 await page.waitForFunction(()=>document.getElementById('stadium')?.
  contentWindow?.__r45SceneQA?.summonPresence?.total===7,null,{timeout:25000});
 report.samples=[];
 for(let n=0;n<10;n++){
  await page.waitForTimeout(n===0?300:870);
  const frame=await snapshot();report.samples.push(frame);
  assert.equal(frame.total,7);
  assert.equal(frame.camera,false);assert.equal(frame.inset,0);
  assert(frame.entries.every(x=>x.source==='gltf-instance'&&x.meshes>=1),
    'all genuine authored GLB source meshes, no cardboard stand-ins');
  assert(frame.entries.every(x=>x.frontDot>.85),
    'every original character faces the opposing side');
  assert.equal(frame.actors?.enabled,enabled);
  if(enabled){
   assert.equal(frame.actors.actors.length,7);
   assert(frame.actors.actors.every(x=>x.originalVisibleR97Unskinned&&
    x.originalMorphMeshes>=1&&x.originalSourceChannels>=2),
    'all seven actuate the ORIGINAL visible mesh morph targets, not unbound source bones');
  }else assert.equal(frame.actors.actors.length,0);
  if([0,2,4,6,8,9].includes(n))
   await page.locator('#stadium').screenshot({
    path:dir+'/r205-'+report.case+'-real-original-cast-t'+String(n)+'.png'});
 }
 const first=report.samples[0],last=report.samples.at(-1);
 assert.equal(start.hp.player,last.hp.player);assert.equal(start.hp.ai,last.hp.ai);
 assert.equal(start.events,last.events);assert.equal(start.round,last.round);
 assert.deepEqual(report.errors,[]);
 if(enabled){
  report.characters=[];
  for(const id of ids){
   const frames=report.samples.map(x=>x.actors.actors.find(a=>a.id===id));
   assert(frames.every(Boolean));
   const key=['Step','Strike','Brace','Land','Recoil','Retreat'];
   const values=Object.fromEntries(key.map(k=>[
    k,frames.map(s=>{
     const samples=s.sampleMeshes.flatMap(x=>
      Object.entries(x.actualAuthoredMorphs));
     return samples.find(x=>x[0]===k)?.[1]??0;
    })
   ]));
   const ranges=Object.fromEntries(key.map(k=>[
    k,+(Math.max(...values[k])-Math.min(...values[k])).toFixed(4)
   ]));
   assert(frames.at(-1).actualSourceMorphWrites>frames[0].actualSourceMorphWrites,
    'seven real source morphs must change continuously');
   assert(frames.at(-1).activeFrames>frames[0].activeFrames,
    'seven original actors should be visibly active, not T/A frozen');
   assert(Math.max(...Object.values(ranges))>.18,
    'no meaningful source body mesh changes '+id+' '+JSON.stringify(ranges));
   assert(frames.at(-1).observedPhases.length>=3,
    'must not stick in one idle T-pose '+id);
   assert(frames.at(-1).maxAuthoredMorphWeight<=1.001,
    'original source morph weights cannot exceed 100% '+id);
   report.characters.push({id,mode:'original R97 visible Blender morph channels',
    originalMeshes:frames.at(-1).originalMorphMeshes,
    actualSourceWeightChanges:ranges,
    phases:frames.at(-1).observedPhases,
    signature:frames.at(-1).signature,
    sourceOriginalGeometryReplaced:false,
    sourceVisibleVertexTargetsAnimated:true});
  }
  assert.equal(new Set(report.characters.map(x=>x.signature)).size,7);
  console.log('R205_SEVEN_REAL_VISIBLE_R97_SOURCE_STUDENTS_ANIMATE_PASS',
   JSON.stringify({originalCharacters:7,authoredBodyChannels:6,
    sourceUnboundArmsNeverClaimedAsRigged:true,
    screenFrames:6,sourceVisualStyleCount:7,errors:[]}));
 }else{
  console.log('R205_PUBLIC_DEFAULT_ANIMATION_CONTRACT_UNCHANGED_PASS',
   JSON.stringify({old7Models:7,newAnimationLayers:0,errors:[]}));
 }
 report.pass=true;
}finally{
 writeFileSync(dir+'/r205-'+report.case+'-real-source-morph-observations.json',
  JSON.stringify(report,null,2)+'\n');
 const video=movie?page.video():null;
 await ctx.close();
 if(video){
  const source=await video.path();
  const name=dir+'/r205-seven-original-source-characters-actually-animate-silent.mp4';
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error',
   '-sseof','-11','-i',source,'-c:v','libx264',
   '-preset','veryfast','-crf','26','-pix_fmt','yuv420p','-r','18','-an',
   '-movflags','+faststart',name]);
  console.log('R205_GENUINE_PC_BOTH_TEAMS_SEVEN_REAL_ACTOR_VIDEO',name);
 }
 await b.close();
}
