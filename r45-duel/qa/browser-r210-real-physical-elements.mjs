/**
 * R210 real GPU Chrome: audit old halo sources, compare R210, show ALL
 * 15 material elements in *scene-only QA art previews*, then use actual
 * rule cards for physical contacts. QA previews never change HP/card events.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r210-physical-elements';
mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
  '--enable-webgl','--use-angle=vulkan',
  '--enable-features=Vulkan,DefaultANGLEVulkan',
  '--disable-software-rasterizer','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1440,height:860},serviceWorkers:'block'});
const page=await context.newPage();
const report={pass:false,baseline:{},gallery:[],realCards:[],errors:[]};
const base='http://127.0.0.1:18689/r45-duel/';
const addon='&r199PhysicalMagic=on&r200Pbr=on&r200Readable=on&r202BodyHit=on&r203BodyHit=on';
const on=addon+'&r210Elements=on';
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{
 if(r.url().startsWith('http://127.0.0.1:18689/')&&r.status()>=400)
  report.errors.push('HTTP '+r.status()+' '+r.url());
});
async function goto(query){
 await page.goto(base+'?qa=1&'+query,{waitUntil:'domcontentloaded',timeout:75000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:130000});
 await page.waitForFunction(()=>{
  const z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
  return !!z&&z.frameCount>5;
 },null,{timeout:20000});
}
async function snap(){
 return page.evaluate(()=>{
  const g=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
  return {
   hp:g.hp,round:g.round,phase:g.phase,events:g.events,
   hand:g.hand,energy:g.energy,
   r210:z.r210Elements,score:z.scoreboard,
   originalProps:z.r199RealMagic,comedy:z.comedySpectacle,
   closeup:z.r145ActionShot?.enabled,
   inset:z.renderPerformance.heroInsetDraws,
   drawCalls:z.drawCalls
  };
 });
}
try{
 await goto('seed=1&deck=science'+addon);
 report.baseline=await snap();
 assert.equal(report.baseline.r210.enabled,false);
 assert.equal(report.baseline.r210.oldDuelCircleLayerVisible,true);
 assert.equal(report.baseline.r210.oldSummonCircleLayerPresent,true);
 await page.locator('#stadium').screenshot({path:dir+'/r210-00-baseline-original-halo-layers.png'});
 await goto('seed=1&deck=science'+on);
 const first=await snap();
 assert.equal(first.r210.enabled,true);
 assert.equal(first.r210.profiles,15);
 assert.equal(first.r210.oldDuelCircleLayerVisible,false);
 assert.equal(first.r210.oldSummonCircleLayerPresent,false);
 assert.equal(first.r210.oldComicHaloFree,true);
 assert.equal(first.r210.originalR199PropsEnabled,true);
 assert(first.r210.comboGenericHalosSuppressed>=7);
 await page.locator('#stadium').screenshot({path:dir+'/r210-01-clean-original-stadium-no-halo.png'});
 const groups=[
  ['E06','T05','K06'], // fire, water, earth
  ['S04','P07','Q05'], // lightning, ice, wind
  ['K03','G05','E05'], // wood, metal, light
  ['Q07','Q03','Q04'], // shadow, mind, sound
  ['S01','S07','K01']  // time, space, absurd
 ];
 const expected=['fire','water','earth','electric','ice','wind',
  'wood','metal','light','shadow','mind','sound','time','space','absurd'];
 for(let i=0;i<groups.length;i++){
  const before=await snap();
  const accepted=await page.evaluate(cards=>document.getElementById('stadium').
   contentWindow.__r45SceneQA.previewR210CardElements(cards),groups[i]);
  assert.equal(accepted,true,'scene-only QA previews');
  await page.waitForTimeout(290);
  const after=await snap();
  assert.deepEqual(after.hp,before.hp,'preview never damages real players');
  assert.deepEqual(after.events,before.events,'no fake card engine actions');
  assert.deepEqual(after.energy,before.energy);
  assert(after.r210.material.active<=3&&after.r210.material.maxDrawCalls<=6);
  assert.equal(after.r210.material.addedGenericHalos,0);
  assert.equal(after.r210.material.addedPointLights,0);
  const file=dir+'/r210-'+String(i+2).padStart(2,'0')+'-QA-three-material-elements.png';
  await page.locator('#stadium').screenshot({path:file});
  report.gallery.push({cards:groups[i],source:'QA visual preview, no game rules',
   element:after.r210.material.last.element,instances:after.r210.material.last.instances,
   drawCalls:after.drawCalls,path:file});
 }
 const galleryEnd=await snap();
 for(const element of expected)
  assert(galleryEnd.r210.material.observedElements[element]>=1,
   '15 distinct material silhouettes '+element);
 // Actual, legal source-GLB spell + canonical contact (NOT a QA preview).
 for(const choice of [
  {id:'S08',deck:'science',seed:1,element:'electric'},
  {id:'Q05',deck:'classroom',seed:2,element:'wind'},
  {id:'T05',deck:'classic',seed:4,element:'water'}]){
  await goto('seed='+choice.seed+'&deck='+choice.deck+on);
  const b=await snap();
  assert(b.hand.includes(choice.id),'authentic hand '+choice.id);
  const card=page.locator('#hand .card[data-card-id="'+choice.id+'"]').first();
  await card.click();
  await page.locator('#play').click();
  await page.waitForFunction(expected=>{
   const q=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
   return !!q.events.find(x=>x.type==='card_play'&&x.card===expected.id&&x.side==='player'&&x.spellOutcome)&&
    (z?.r210Elements?.material?.observedElements?.[expected.element]||0)>0;
  },choice,{timeout:65000});
  const a=await snap();
  const played=a.events.find(e=>e.type==='card_play'&&e.card===choice.id);
  assert(played?.spellOutcome,'must be real source card settlement');
  assert(a.r210.material.last.source==='authoritative R199 physical contact');
  assert.equal(a.r210.material.gameplayMutations,0);
  assert.equal(a.closeup,false);assert.equal(a.inset,0);
  assert.equal(a.r210.oldDuelCircleLayerVisible,false);
  const file=dir+'/r210-real-'+choice.id+'-'+choice.element+'.png';
  await page.locator('#stadium').screenshot({path:file});
  report.realCards.push({id:choice.id,element:choice.element,
   serial:played.serial,rule:played.spellOutcome,source:'real player hand/GLB',
   physicalEffects:a.r210.material.observedElements[choice.element],
   cameraWide:true,image:file});
 }
 assert.deepEqual(report.errors,[]);
 report.pass=true;
 console.log('R210_15_DIFFERENT_MATERIAL_ELEMENTS_HALO_REMOVAL_REAL_CHROME_PASS',
  JSON.stringify({pass:true,qaVisualFamilies:expected.length,
   actualRuleCards:report.realCards.map(x=>x.id),
   noErrors:true,originalRealGLB:true,originalRuleHP:true,legacyCircleRootDisabled:true}));
}catch(error){console.error('R210_REAL_CHROME_ERROR',String(error));report.failure=String(error)}
finally{
 writeFileSync(dir+'/r210-real-gpu-and-all-elements-report.json',JSON.stringify(report,null,2)+'\n');
 await context.close();await browser.close();
}
if(!report.pass)process.exitCode=7;
