/** R204 real GPU Chrome: player ACTUALLY throws S08, AI/preview mirror, hit. */
import assert from'node:assert/strict';
import {createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{execFileSync}from'node:child_process';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r204-caster-gestures';
mkdirSync(dir,{recursive:true});
const caseName=process.env.R204_CASE||'real-player';
const report={caseName,pass:false,errors:[],stages:[],genuineChrome:true};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const movie=process.env.R204_FILM==='1';
const ctx=await browser.newContext({
 viewport:{width:1440,height:860},serviceWorkers:'block',
 ...(movie?{recordVideo:{dir,size:{width:1152,height:688}}}:{})
});
const page=await ctx.newPage();
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
const stat=()=>page.evaluate(()=>{
 const q=window.__r45QA,f=document.getElementById('stadium')?.contentWindow;
 const z=f?.__r45SceneQA;
 return{
  caster:z?.r204Caster,sourceHosts:z?.duelistHosts,
  cam:z?.r145ActionShot,inset:z?.renderPerformance?.heroInsetDraws,
  stage:z?.r199RealMagic?.stage,hero:z?.r199RealMagic?.loadedAssetDetails,
  physicalCard:z?.handCards,
  rules:{round:q?.round,hp:q?.hp,events:q?.events?.filter(x=>x.type==='card_play')},
  audio:q?.audio?{played:q.audio.speechHistory}:null,
  oldLights:z?.magicArsenal?.played
 }
});
async function capture(name){
 const s=await stat();
 report.stages.push({name,at:Date.now(),...s});
 await page.locator('#stadium').screenshot({
  path:dir+'/r204-'+caseName+'-'+name+'.png'});
 return s;
}
const protagonist=caseName==='real-player'?'player':'ai';
try{
 if(caseName==='real-player'){
  // Deliberately slow the ORIGINAL Blender source by 2 seconds. The real
  // female character must keep visibly winding up instead of freezing.
  await page.route('**/art/hero-props/S08_*.glb',async route=>{
   await new Promise(ok=>setTimeout(ok,2100));await route.continue();
  });
 }
 const url=new URL('http://127.0.0.1:18689/r45-duel/');
 for(const [k,v]of Object.entries({
  qa:'1',seed:caseName==='real-player'?'1':'173',
  deck:caseName==='real-player'?'science':'classic',
  r199PhysicalMagic:'on',r200Pbr:'on',r200Readable:'on',
  r202BodyHit:'on',r203BodyHit:'on',r204Caster:'on',
  r199Showcase:'on'
 }))url.searchParams.set(k,v);
 await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:70000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:130000});
 await page.waitForFunction(()=>{
  const s=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
  return s?.r204Caster?.enabled===true&&s?.duelistHosts?.length===2;
 },null,{timeout:10000});
 const before=await capture('00-idle');
 if(caseName==='real-player'){
  const card=page.locator('#hand .card[data-card-id="S08"]').first();
  assert(await card.count(),'science seed1 genuinely holds S08');
  await card.click();await page.locator('#play').click();
  await page.waitForFunction(()=>{
   const c=document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r204Caster;
   return c?.actions?.player?.id==='S08';
  },null,{timeout:8000});
  await page.waitForTimeout(440);
  const wind=await capture('01-windup-original-vrm');
  assert(wind.caster.actions.player.phases.includes('windup'));
  assert(wind.sourceHosts.find(x=>x.side==='player').posture.r204Caster.weight>.80);
  const held=wind.physicalCard.actors.find(x=>x.side==='player');
  assert(held?.visible&&held.r204Synced&&!held.r204Released,
   'the authentic painted hand card must REMAIN in the original fingers until GLB launches');
  assert(held.grip>.82&&held.realFingerBones===15,
   'source VRM finger rig must actually hold real card during async source download');
  // If original source already arrived, the cast phase may have started;
  // the same original scene is still guaranteed to synchronize.
 }else{
  await page.evaluate(()=>document.getElementById('stadium').contentWindow.postMessage({
   type:'ASDC_R199_MAGIC_PREVIEW',id:'S08',side:'ai'
  },location.origin));
 }
 await page.waitForFunction(side=>{
  const a=document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r204Caster?.actions?.[side];
  return a?.id==='S08'&&Number.isFinite(a?.releasedAt);
 },protagonist,{timeout:65000});
 const launched=await capture('02-original-3d-prop-launched');
 await page.waitForFunction(side=>{
  const z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
  const a=z?.r204Caster?.actions?.[side];
  const card=z?.handCards?.actors?.find(x=>x.side===side);
  return a?.phases?.includes('throw-snap')&&card?.id==='S08'&&
   card?.r204Synced&&card?.r204Released;
 },protagonist,{timeout:8000});
 const snap=await capture('03-body-throw-snap');
 await page.waitForFunction(side=>{
  const a=document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r204Caster?.actions?.[side];
  return a?.phases?.includes('follow-through');
 },protagonist,{timeout:8000});
 const follow=await capture('04-body-follow-through');
 await page.waitForFunction(side=>{
  const z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
  const a=z?.r204Caster?.actions?.[side];
  return Number.isFinite(a?.hitAt)&&z?.r199RealMagic?.stage?.physicalConsequences?.spawned>=1;
 },protagonist,{timeout:17000});
 const impact=await capture('05-opponent-hit-caster-celebrates');
 await page.waitForFunction(side=>{
  const a=document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r204Caster?.actions?.[side];
  return a?.phases?.includes('hit-celebration');
 },protagonist,{timeout:8000});
 const cheer=await capture('06-hit-celebration-original-vrm');
 await page.waitForTimeout(1070);
 const settled=await capture('07-settled-wide-arena');
 const acts=settled.caster.actions[protagonist];
 assert.equal(acts.id,'S08');
 for(const phase of (caseName==='real-player'?['windup','throw-snap','follow-through','hit-celebration']:['hold-aim','throw-snap','follow-through','hit-celebration']))
  assert(acts.phases.includes(phase),'missing real VRM cast stage '+phase);
 assert(Number.isFinite(acts.releasedAt)&&Number.isFinite(acts.hitAt));
 assert(acts.hitAt>acts.releasedAt,'actual Blender source launch must precede physical impact');
 assert.equal(settled.cam.enabled,false);
 assert.equal(settled.inset,0);
 assert.equal(settled.oldLights,0);
 const originalCard=settled.physicalCard.actors.find(x=>x.side===protagonist);
 assert(originalCard?.r204Synced&&originalCard.r204Released);
 assert.equal(originalCard.visible,false,'real physical card must disappear AFTER true prop throw');
 assert.equal(originalCard.gripMode,'open','all 15 original finger bones must release painted card');
 assert(originalCard.restError<.006,'original VRM fingers must return exactly to anatomical rest');
 assert.equal(settled.stage.actualBodyContacts,
  caseName==='real-player'?1:0);
 assert.equal(settled.stage.previewBodyContacts,
  caseName==='real-player'?0:1);
 assert.deepEqual(settled.sourceHosts.map(h=>h.modelSource),
  before.sourceHosts.map(h=>h.modelSource),
  'must preserve original high-detail VRM identities');
 assert(settled.sourceHosts.every(h=>h.bones>=50&&h.skins>0),
  'original skin/bones must survive full body choreography');
 assert(settled.sourceHosts.every(h=>h.posture.arms?.R?.wristToShoulder>0));
 // Keep a dramatic original VRM action WITHOUT reintroducing the old
 // broken twisted arms. Each real shoulder/elbow/wrist pair is solved
 // within actual physical reach. Zero means exact target solved.
 for(const sample of [launched,snap,follow,impact,cheer]){
  const host=sample.sourceHosts.find(x=>x.side===protagonist);
  for(const hand of ['R','L']){
   const rig=host.posture.ik[hand];
   assert(Number.isFinite(rig.error)&&rig.error<=.018,
    'R204 source '+protagonist+' original '+hand+' arm outside IK reach: '+
     JSON.stringify(rig));
   assert(rig.reach<=rig.segmentLength+.005,
    'source arm joints physically overstretched');
  }
 }
 const a=before.sourceHosts.find(x=>x.side===protagonist).posture.arms.R.worldHand;
 const b=snap.sourceHosts.find(x=>x.side===protagonist).posture.arms.R.worldHand;
 const delta=Math.hypot(...a.map((v,i)=>v-b[i]));
 assert(delta>.12,'throwing hand did not meaningfully travel in 3D world');
 assert(delta<3.0,'arm catastrophically teleported');
 if(caseName==='real-player'){
  const real=settled.rules.events.find(x=>x.card==='S08'&&x.side==='player');
  assert.equal(real.spellOutcome.directDamage,2);
  assert.equal(settled.rules.hp.ai,18);
  assert(settled.audio.played.some(x=>x.id==='HOST_AI'&&x.kind==='r203_S08'));
 }else{
  assert.deepEqual(settled.rules.hp,before.rules.hp);
  assert.equal(settled.rules.events.length,before.rules.events.length);
  assert(settled.audio.played.some(x=>x.id==='HOST_PLAYER'&&x.kind==='r203_S08'));
 }
 report.summary={protagonist,phaseHistory:acts.phases,
  rightWristWorldTravelMeters:+delta.toFixed(3),
  authenticGLB:launched.hero.some(x=>x.id==='S08'),
  modelSource:before.sourceHosts.find(x=>x.side===protagonist).modelSource,
  realRuleDamage:caseName==='real-player'?2:0,
  launchBeforeImpactSeconds:+(acts.hitAt-acts.releasedAt).toFixed(3),
  autoCloseup:false};
 assert.deepEqual(report.errors,[]);
 report.pass=true;
 console.log('R204_SOURCE_VRM_CASTER_VS_REAL_OPPONENT_PASS',JSON.stringify(report.summary));
}finally{
 writeFileSync(dir+'/r204-'+caseName+'-real-caster-gestures.json',JSON.stringify(report,null,2)+'\n');
 const video=movie?page.video():null;
 await ctx.close();
 if(video){
  const original=await video.path();
  const mp4=dir+'/r204-'+caseName+'-genuine-wide-caster-versus-opponent-silent.mp4';
  execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error',
   '-i',original,'-c:v','libx264','-preset','veryfast','-crf','27',
   '-pix_fmt','yuv420p','-r','18','-an','-movflags','+faststart',mp4]);
  console.log('R204_REAL_BROWSER_VIDEO_WRITTEN',mp4);
 }
 await browser.close();
}
