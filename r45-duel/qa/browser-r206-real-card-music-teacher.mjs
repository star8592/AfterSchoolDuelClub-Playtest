/**
 * Real Chrome, actual M01 card from hand and authoritative combat event:
 * prove artist's 10 skinned meshes pose correctly in the REAL match.
 */
import assert from 'node:assert/strict';
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r206-real-m01-conductor';
mkdirSync(dir,{recursive:true});
const report={pass:false,errors:[],source:'real Chrome duel actual M01 from player hand',steps:[]};
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage',
 '--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:1440,height:860},serviceWorkers:'block'});
const p=await ctx.newPage();
p.on('pageerror',e=>report.errors.push('JS '+e.message));
p.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
const snap=()=>p.evaluate(()=>{
 const g=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
 return {round:g?.round,energy:g?.energy,hp:g?.hp,hand:g?.hand,
  events:g?.events,board:g?.board,
  m01:z?.summonPresence?.entries?.find(x=>x.id==='M01'&&x.side==='player'),
  originalSource:z?.summonModels?.find(x=>x.id==='M01')?.file,
  camera:z?.r145ActionShot?.enabled,inset:z?.renderPerformance?.heroInsetDraws,
  drawCalls:z?.drawCalls};
});
try{
 await p.goto('http://127.0.0.1:18689/r45-duel/?qa=1&seed=3&deck=classic&r206MusicTeacher=on',
  {waitUntil:'domcontentloaded',timeout:70000});
 await p.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:130000});
 const init=await snap();report.steps.push({type:'initial',...init});
 assert(init.hand.includes('M01')&&init.energy.player===2,'seed3 original M01 cost3 starts at energy2');
 await p.locator('#end').click();
 await p.waitForFunction(()=>window.__r45QA?.round>=2,null,{timeout:35000});
 const round2=await snap();report.steps.push({type:'energy-after-real-turn',...round2});
 assert(round2.energy.player>=3,'R206 cannot grant mana; must wait real round 2');
 assert(round2.hand.includes('M01'),'original 3-cost teacher card must remain');
 const card=p.locator('#hand .card[data-card-id="M01"]').first();
 assert(await card.count());
 await card.click();assert(await p.locator('#play').isEnabled());
 await p.locator('#play').click();
 await p.waitForFunction(()=>{
  const g=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
  return g.events.some(e=>e.type==='card_play'&&e.card==='M01'&&e.side==='player')&&
   z?.summonPresence?.entries?.some(x=>x.id==='M01'&&x.side==='player'&&x.r206Conductor?.armFrames>12);
 },null,{timeout:30000});
 await p.waitForTimeout(450);
 const entrance=await snap();report.steps.push({type:'real-card-played',...entrance});
 await p.locator('#stadium').screenshot({
  path:dir+'/r206-M01-real-hand-summon-idle.png'});
 assert(entrance.m01.r206Conductor.enabled);
 assert(entrance.m01.r206Conductor.sourceMeshesStillBound===10);
 assert.equal(entrance.originalSource,'M01-MusicTeacher-PolyforkSchoolTeacher.glb');
 const originalSerial=entrance.events.find(e=>e.type==='card_play'&&e.card==='M01'&&e.side==='player')?.serial;
 assert(Number.isInteger(originalSerial));
 // The actual rule engine, rather than a QA-only movement command, must
 // produce subsequent actor actions. Do not assume M01 attacks the turn it
 // was summoned (a unit has summoning sickness).
 await p.locator('#end').click();
 await p.waitForTimeout(1100);
 const aftermath=await snap();report.steps.push({type:'real-next-turn',...aftermath});
 assert.equal(aftermath.m01?.id,'M01','real teacher must survive first turn');
 assert.equal(aftermath.camera,false);assert.equal(aftermath.inset,0);
 await p.locator('#stadium').screenshot({
  path:dir+'/r206-M01-real-duel-after-turn.png'});
 // R206 corrects actual M01 posture after authoritative scene movement.
 const stats=aftermath.m01.r206Conductor;
 assert(stats?.arms?.Left?.dropRatio>.55);
 assert(stats?.arms?.Right?.dropRatio>.30);
 assert(stats?.sourceGeometryReplaced===false);
 // Round 3: only the REAL rules engine, not fake demo preview, decides
 // whether the actual summoned M01 attacks an opponent.
 if(aftermath.round>=3&&aftermath.m01?.hp>0){
  await p.locator('#end').click();
  await p.waitForFunction(()=>{
   const q=window.__r45QA;
   return q?.events?.some(e=>e.type==='exchange'&&
    e.side==='player'&&e.from==='M01');
  },null,{timeout:23000});
  const exchange=await snap();
  report.steps.push({type:'real-authoritative-m01-attacks',...exchange});
  await p.locator('#stadium').screenshot({
   path:dir+'/r206-M01-actual-rules-combat-attack.png'});
  assert(exchange.m01?.r206Conductor?.enabled);
  assert(exchange.m01.r206Conductor.observedStages.some(x=>
   x==='fortissimo-strike'||x==='conductor-windup'),
   'real rule exchange must trigger true teacher conductor strike');
 }
 assert.deepEqual(report.errors,[]);
 report.summary={originalGlb:entrance.originalSource,
  authenticCardPlayed:true,authenticManaAtPlay:round2.energy.player,
  sourceSkinnedMeshes:stats.originalSkinnedMeshes,
  bodyBones:stats.originalSourceBones,
  atLeastNaturalPoseAfterRealTurn:true,
  noAutoCloseups:true,errors:[]};
 report.pass=true;
 console.log('R206_REAL_GAME_M01_FROM_HAND_AND_NATURAL_POSE_PASS',JSON.stringify(report.summary));
}finally{
 writeFileSync(dir+'/r206-real-card-M01-rule-and-source-pose.json',
  JSON.stringify(report,null,2)+'\n');
 await ctx.close();await b.close();
}
