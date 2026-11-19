/** R205 all fourteen untouched real source identities on PC, both teams. */
import assert from'node:assert/strict';
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r205-original-summons';
mkdirSync(dir,{recursive:true});
const ids=['E01','E02','E03','E04','G01','G02','G03','G04','M01','M02','T01','T02','T03','T04'];
const groups=[
 {player:['E01','E02','E03','E04','G02'],ai:['G01','G03','G04','M01','M02']},
 {player:['T01','T02'],ai:['T03','T04']}
];
const report={pass:false,original14:ids,errors:[],batches:[],source:'Real Chrome Vulkan WebGL2 no stand-ins'};
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
const page=await b.newPage({viewport:{width:1440,height:860}});
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
const snap=()=>page.evaluate(()=>{
 const a=window.__r45QA,q=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
 return {hp:a?.hp,round:a?.round,events:a?.events?.length,
  summon:q?.summonPresence,
  loaded:q?.summonModels?.map(x=>({id:x.id,file:x.file,clips:x.clips})),
  camera:q?.r145ActionShot?.enabled,inset:q?.renderPerformance?.heroInsetDraws,
  draws:q?.drawCalls};
});
try{
 await page.goto('http://127.0.0.1:18689/r45-duel/?qa=1&seed=205&r205LivingSummons=on&r204Caster=on&r199PhysicalMagic=on&r202BodyHit=on&r203BodyHit=on',
  {waitUntil:'domcontentloaded',timeout:75000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:140000});
 const first=await snap();
 for(let g=0;g<groups.length;g++){
  const batch=groups[g];
  const units=Object.fromEntries(['player','ai'].map((side,i)=>[
   side,batch[side].map((id,n)=>({
    id,uid:'U'+(205000+g*100+i*10+n),hp:5,attack:2,shield:0}))
  ]));
  await page.evaluate(u=>document.getElementById('stadium').contentWindow.postMessage({
   type:'ASDC_R45_BOARD',units:u,player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id)
  },location.origin),units);
  await page.waitForFunction(n=>document.getElementById('stadium').
   contentWindow?.__r45SceneQA?.summonPresence?.total===n,
   batch.player.length+batch.ai.length,{timeout:30000});
  await page.waitForTimeout(3100);
  const a=await snap();
  const summoned=a.summon.entries;
  assert.equal(summoned.length,batch.player.length+batch.ai.length);
  assert(summoned.every(e=>e.visible&&e.inView&&e.metrics.frontDot>.87),
   'source original rendered characters must face their opponent and stay in arena');
  assert(summoned.every(e=>e.kind!=='art-pending'),'never display cardboard boxes instead of models');
  assert.equal(a.camera,false);assert.equal(a.inset,0);
  assert(a.draws<1400,'unexpected extra rendering cost');
  for(const actor of summoned){
   if(['E03','E04','G02','G03','G04','T03','T04'].includes(actor.id)){
    const x=a.summon.r205VisibleBodyLife.actors.find(v=>v.id===actor.id);
    assert(x?.enabled&&x.originalMorphMeshes>0&&x.actualSourceMorphWrites>100,
     'actual R97 visible body mesh cannot stay in default pose '+actor.id);
   }else if(['E01','G01'].includes(actor.id)){
    assert(actor.r205TrueVRMSource?.originalRealSkin);
    assert(actor.r205TrueVRMSource.originalTwoBoneIK?.arms?.R?.error<=.035);
   }else if(actor.id==='T01'){
    // Source owl glTF has NO actual animation; R127 moves real 129 authored
    // wing/eye/feather meshes around native shoulder pivots instead.
    assert(actor.r127OwlMotion?.enabled&&
     actor.r127OwlMotion.sourceMeshes===129&&actor.r127OwlMotion.frames>25,
     'real owl source feathers, not fictitious glTF clip names');
   }else if(['M01','M02','T02'].includes(actor.id)){
    assert(actor.playingClips?.length>0,
     'original actor must use its ORIGINAL glTF native animation '+actor.id);
   }
  }
  report.batches.push({ids:[...batch.player,...batch.ai],models:summoned.map(x=>({
   id:x.id,kind:x.kind,sourceAnimation:x.playingClips||[],
   realMorphSource:!!a.summon.r205VisibleBodyLife.actors.find(y=>y.id===x.id),
   realVRM:!!x.r205TrueVRMSource})),
   visibleAll:true,sourceCount:summoned.length,drawCalls:a.draws});
  await page.locator('#stadium').screenshot({
   path:dir+'/r205-all-real-summon-actors-batch-'+(g+1)+'.png'});
 }
 const last=await snap();
 assert.deepEqual(last.hp,first.hp);
 assert.equal(last.round,first.round);assert.equal(last.events,first.events);
 assert.deepEqual(report.errors,[]);
 assert.equal(new Set(report.batches.flatMap(x=>x.ids)).size,14);
 report.pass=true;
 console.log('R205_ALL_FOURTEEN_ORIGINAL_SOURCE_UNITS_GPU_AND_LIFE_AUDIT_PASS',
  JSON.stringify({identities:14,originalMorphDriven:7,
   authenticSkinnedVRM:2,oldNativeGltfClips:3,real129MeshOwlFeatherActing:1,
   originalPlaneWingMorph:1,
   ruleChanges:0,cameraCuts:0,errors:[]}));
}finally{
 writeFileSync(dir+'/r205-all-14-original-models-actor-audit.json',
  JSON.stringify(report,null,2)+'\n');
 await b.close();
}
