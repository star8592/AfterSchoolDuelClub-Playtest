import assert from 'node:assert/strict';
import {createRequire}from'node:module';
import {mkdirSync,writeFileSync}from'node:fs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r202-body-impact';
mkdirSync(dir,{recursive:true});
const ids=(process.env.R202_IDS||'E06,Q05,K01,K07,P07').split(',');
const report={ids,cases:[],errors:[],pass:false};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:1440,height:860},serviceWorkers:'block'});
const page=await ctx.newPage();
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
const snap=()=>page.evaluate(()=>{
 const q=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
 return {rules:{round:q?.round,events:q?.events?.length,hp:q?.hp},
  stage:z?.r199RealMagic?.stage,cache:z?.r199RealMagic?.loadedIds,
  hosts:z?.duelistHosts?.map(h=>({side:h.side,id:h.id,posture:h.posture.phase,
    hit:h.posture.r202Hit,intensity:h.posture.r202Intensity,x:h.x,y:h.y,z:h.z})),
  special:z?.r202HostImpact,oldArsenal:z?.magicArsenal?.played,
  oldImpact:z?.spellImpact?.played,
  camera:z?.r145ActionShot?.enabled,inset:z?.renderPerformance?.heroInsetDraws,
  gallery:document.querySelectorAll('.r199-spells button').length};
});
try{
 const url='http://127.0.0.1:18689/r45-duel/?qa=1&r199PhysicalMagic=on&r199Showcase=on&r200Pbr=on&r200Readable=on&r202BodyHit=on&seed=173';
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:130000});
 await page.waitForFunction(()=>document.querySelectorAll('.r199-spells button').length===46);
 report.before=await snap();
 assert.equal(report.before.stage.r202BodyImpact,true);
 assert.equal(report.before.gallery,46);
 let expected=0;
 for(const [i,id] of ids.entries()){
  await page.locator('.r199-launch').click();
  await page.locator('.r199-spells button[data-magic-id="'+id+'"]').click();
  expected++;
  await page.waitForFunction(arg=>{
   const z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
   return z?.r199RealMagic?.stage?.previewBodyContacts>=arg.expected &&
    z?.r199RealMagic?.stage?.lastBySide?.player===arg.id;
  },{id,expected},{timeout:65000});
  const hit=await snap();
  assert(hit.stage.physicalFlights>=expected);
  assert(hit.stage.previewBodyContacts>=expected);
  assert.equal(hit.camera,false);
  assert.equal(hit.inset,0);
  assert.equal(hit.oldArsenal,0);
  assert.equal(hit.oldImpact,0);
  assert.equal(hit.rules.round,report.before.rules.round);
  assert.equal(hit.rules.events,report.before.rules.events);
  assert.deepEqual(hit.rules.hp,report.before.rules.hp);
  assert.equal(hit.special.ai?.id,id,'Original AI VRM must receive matching reaction');
  assert(hit.stage.physicalConsequences.spawned>=expected);
  // Photograph the physical recoil: the original object has backed away
  // from the face, while real source VRM IK reacts and chalk/food falls.
  await page.waitForTimeout(155);
  const filename='r202-'+String(i+1).padStart(2,'0')+'-'+id+'-actual-opponent-impact.png';
  await page.locator('#stadium').screenshot({path:dir+'/'+filename});
  const visible=hit.stage.activeBodyFlights.find(x=>x.id===id);
  assert(visible&&visible.actualMeshToBodyMeters!==null);
  report.cases.push({id,originalGlbLoaded:hit.cache.includes(id),
    contactDistanceMeters:visible.actualMeshToBodyMeters,
    originalMeshWorld:visible.originalVisibleMeshCenter,
    boneHitWorld:visible.bodyHitWorld,
    originalOpponentHit:hit.special.ai?.id,physicalFlights:hit.stage.physicalFlights,
    physicalPieces:hit.stage.physicalConsequences.spawned,
    beforeHp:report.before.rules.hp,afterHp:hit.rules.hp,image:filename});
  console.log('R202_REAL_OPPONENT_HIT_PASS',JSON.stringify(report.cases.at(-1)));
  await page.waitForTimeout(300);
 }
 report.after=await snap();
 assert.deepEqual(report.errors,[]);
 report.pass=true;
 console.log('R202_REAL_BLENDER_5_BODY_IMPACTS_PASS',JSON.stringify({
  count:report.cases.length,models:report.cases.map(x=>x.id),
  actualOpponentReaction:true,previewRuleDamage:0,autoCloseups:0,errors:[]}));
}finally{
 writeFileSync(dir+'/r202-five-real-opponent-hits.json',JSON.stringify(report,null,2)+'\n');
 await ctx.close();await browser.close();
}
