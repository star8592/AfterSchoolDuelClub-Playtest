/** R211: genuine rules-played E06, T05, S08; no QA-only fake contact. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r212-perf-audit';mkdirSync(dir,{recursive:true});
const cases=[
 {id:'E06',element:'fire',deck:'classic',seed:5,round:2,cost:3},
 {id:'T05',element:'water',deck:'classic',seed:4,round:1,cost:null},
 {id:'S08',element:'electric',deck:'science',seed:1,round:1,cost:2}
];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:1440,height:860},serviceWorkers:'block'});
const page=await ctx.newPage();
const log={ok:false,realRulesOnly:true,cases:[],errors:[]};
page.on('pageerror',e=>log.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400&&r.url().includes(':18691/'))log.errors.push('HTTP '+r.status()+' '+r.url())});
try{
 for(const c of cases){
  const url='http://10.10.10.138:18693/r45-duel/?qa=1&seed='+c.seed+
    '&deck='+c.deck+'&r199PhysicalMagic=on&r200Pbr=on&r200Readable=on'+
    '&r202BodyHit=on&r203BodyHit=on&r210Elements=on&r211CinematicVfx=on&r212StadiumBatch=on';
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:75000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:135000});
  for(let r=2;r<=c.round;r++){
    await page.locator('#end').click();
    await page.waitForFunction(goal=>window.__r45QA?.round===goal&&
      window.__r45QA?.phase==='playing'&&window.__r45QA?.energy?.player===goal+1,
      r,{timeout:60000});
  }
  const before=await page.evaluate(()=>({round:window.__r45QA.round,
   energy:window.__r45QA.energy,hand:window.__r45QA.hand,hp:window.__r45QA.hp}));
  assert(before.hand.includes(c.id),'card in real player hand '+c.id);
  if(c.cost)assert(before.energy.player>=c.cost);
  await page.locator('#hand .card[data-card-id="'+c.id+'"]').first().click();
  await page.locator('#play').click();
  await page.waitForFunction(c=>{
    const q=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
    return q?.events?.some(e=>e.type==='card_play'&&e.card===c.id&&e.side==='player'&&e.spellOutcome)&&
     (z?.r211CinematicVfx?.material?.observedCards?.[c.id]||0)>=1;
  },c,{timeout:65000});
  const after=await page.evaluate(()=>{const q=window.__r45QA,z=document.getElementById('stadium').contentWindow.__r45SceneQA;
    return {round:q.round,energy:q.energy,hp:q.hp,
      events:q.events,fx:z.r211CinematicVfx,old:z.r210Elements,originalGLB:z.r199RealMagic,
      camera:z.r145ActionShot,render:z.renderPerformance,drawCalls:z.drawCalls};});
  const event=after.events.find(e=>e.type==='card_play'&&e.card===c.id&&e.side==='player');
  assert(event?.spellOutcome);
  assert.equal(after.fx.material.gameplayMutations,0);
  assert.equal(after.fx.material.addedGenericHalos,0);
  assert.equal(after.old.material.spawned,0);
  assert.equal(after.round,c.round);
  assert.equal(after.camera.enabled,false);
  assert.equal(after.render.heroInsetDraws,0);
  if(c.cost)assert.equal(after.energy.player,before.energy.player-c.cost);
  const image=dir+'/r212-real-'+c.id+'-'+c.element+'-actual-gameplay.png';
  await page.locator('#stadium').screenshot({path:image});
  log.cases.push({id:c.id,element:c.element,realTurn:c.round,
   serial:event.serial,spellOutcome:event.spellOutcome,energyBefore:before.energy.player,
   energyAfter:after.energy.player,oldR210Replacement:true,originalGLB:!!after.originalGLB.enabled,
   fullWideView:true,drawCalls:after.drawCalls,image});
 }
 assert.deepEqual(log.errors,[]);
 log.ok=true;
}catch(e){log.failure=String(e);console.error('R211_ACTUAL_RULES_FAILED',String(e))}
finally{
 writeFileSync(dir+'/r212-three-real-cards-rules-chrome.json',JSON.stringify(log,null,2)+'\n');
 await ctx.close();await browser.close();
 console.log('R212_THREE_REAL_RULE_CARDS',JSON.stringify(log));
}
if(!log.ok)process.exitCode=7;
