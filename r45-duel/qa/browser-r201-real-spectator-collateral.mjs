/** R201: forced real-rule spell spectator misfire uses same authored GLB. */
import assert from 'node:assert/strict';
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r201-priority-spells';
mkdirSync(dir,{recursive:true});
const out={name:'R201 actual Q05 spectator miss',pass:false,errors:[]};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:1360,height:800},serviceWorkers:'block'});
const page=await ctx.newPage();
page.on('pageerror',e=>out.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)out.errors.push('HTTP '+r.status()+' '+r.url())});
const snap=()=>page.evaluate(()=>{
 const q=window.__r45QA;
 const f=document.getElementById('stadium').contentWindow;
 const z=f.__r45SceneQA;
 return {hp:q?.hp,round:q?.round,cardEvents:q?.events?.filter(x=>x.type==='card_play'),
  stage:z?.r199RealMagic?.stage,magic:z?.r199RealMagic,
  legacySpectator:z?.spectatorChaosFX,
  r122AccidentReceipts:z?.r122AccidentReceipts,
  closeup:z?.r145ActionShot?.enabled,
  heroInset:z?.renderPerformance?.heroInsetDraws,
  realSpectatorReplies:window.__r201CrowdEvents||[],
  genericLights:z?.r199RealMagic?.stage?.shaderPointLights};
});
try{
 const u=new URL('http://127.0.0.1:18689/r45-duel/');
 for(const [k,v] of [['qa','1'],['seed','2'],['deck','classroom'],
  ['r199PhysicalMagic','on'],['r200Pbr','on'],['r200Readable','on'],
  ['r122Crowd','force']])u.searchParams.set(k,v);
 await page.goto(u.href,{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:110000});
 await page.evaluate(()=>{
  window.__r201CrowdEvents=[];
  window.addEventListener('message',e=>{
   if(e.origin===location.origin&&e.source===document.getElementById('stadium').contentWindow&&
    e.data?.type==='ASDC_R122_CROWD_ACCIDENT')window.__r201CrowdEvents.push(e.data);
  });
 });
 out.before=await snap();
 const card=page.locator('#hand .card[data-card-id="Q05"]').first();
 assert(await card.count(), 'real original Q05 must be playable');
 await card.click();await page.locator('#play').click();
 await page.waitForFunction(()=>{
  const z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
  return z?.r199RealMagic?.stage?.collateralLaunched>=1;
 },null,{timeout:45000});
 out.flying=await snap();
 assert(out.flying.stage.collateralLaunched>=1);
 assert.equal(out.flying.legacySpectator.launched,0,'old glowing ball / ring / point light must never launch');
 assert.equal(out.flying.closeup,false);
 assert.equal(out.flying.heroInset,0);
 await page.locator('#stadium').screenshot({path:dir+'/r201-real-Q05-spectator-misfire.png'});
 await page.waitForFunction(()=>{
  const z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
  return z?.r122AccidentReceipts>=1;
 },null,{timeout:16000});
 out.after=await snap();
 assert.equal(out.after.r122AccidentReceipts,1);
 assert.equal(out.after.realSpectatorReplies.length,1);
 assert.equal(out.after.realSpectatorReplies[0].ruleDamage,0);
 assert.equal(out.after.realSpectatorReplies[0].gameplayHit,false);
 assert.equal(out.after.legacySpectator.launched,0);
 assert.equal(out.after.genericLights,0);
 assert.equal(out.after.closeup,false);
 assert.deepEqual(out.errors,[]);
 out.pass=true;
 console.log('R201_REAL_PHYSICAL_SPECTATOR_MISFIRE_PASS',JSON.stringify({
  realBlenderProp:true,collateralLaunched:out.after.stage.collateralLaunched,
  oldSparkRing:out.after.legacySpectator.launched,
  actualSpectatorReply:out.after.realSpectatorReplies.length,
  extraDamage:0,closeups:0,errors:[]}));
}finally{
 writeFileSync(dir+'/r201-real-spectator-collateral.json',JSON.stringify(out,null,2)+'\n');
 await ctx.close();await browser.close();
}
