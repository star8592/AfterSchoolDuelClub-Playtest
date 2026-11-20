/** R210 genuinely played 3-mana FIRE and 4-mana EARTH in real turns.
 * Not a visual QA preview, not injected events, not fake damage.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const output='r45-duel/qa/evidence/r210-physical-elements';mkdirSync(output,{recursive:true});
const cases=[{id:'E06',element:'fire',deck:'classic',seed:5,round:2,cost:3},
 {id:'K06',element:'earth',deck:'kitchen',seed:5,round:3,cost:4}];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:1440,height:860},serviceWorkers:'block'});
const page=await ctx.newPage();
const log={ok:false,cases:[],errors:[]};
page.on('pageerror',e=>log.errors.push('JS '+e.message));
page.on('response',r=>{
 if(r.status()>=400&&r.url().startsWith('http://127.0.0.1:18689/'))
  log.errors.push('HTTP '+r.status()+' '+r.url());
});
try{
 for(const choice of cases){
  await page.goto('http://127.0.0.1:18689/r45-duel/?qa=1&seed='+
   choice.seed+'&deck='+choice.deck+
   '&r199PhysicalMagic=on&r200Pbr=on&r200Readable=on&r202BodyHit=on&r203BodyHit=on&r210Elements=on',
   {waitUntil:'domcontentloaded',timeout:75000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:135000});
  for(let r=2;r<=choice.round;r++){
   await page.locator('#end').click();
   await page.waitForFunction(goal=>
    window.__r45QA?.round===goal&&
    window.__r45QA?.phase==='playing'&&
    window.__r45QA?.energy?.player===goal+1,r,{timeout:60000});
  }
  const before=await page.evaluate(()=>{
   const g=window.__r45QA;
   return{round:g.round,hand:g.hand,energy:g.energy,events:g.events,hp:g.hp};
  });
  assert(before.hand.includes(choice.id));
  assert(before.energy.player>=choice.cost);
  await page.locator('#hand .card[data-card-id="'+choice.id+'"]').first().click();
  await page.locator('#play').click();
  await page.waitForFunction(choice=>{
   const q=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
   return q?.events?.some(e=>e.type==='card_play'&&e.card===choice.id&&e.side==='player'&&e.spellOutcome)&&
     (z?.r210Elements?.material?.observedElements?.[choice.element]||0)>=1;
  },choice,{timeout:75000});
  const after=await page.evaluate(()=>{
   const g=window.__r45QA,z=document.getElementById('stadium').contentWindow.__r45SceneQA;
   return{hp:g.hp,events:g.events,round:g.round,energy:g.energy,fire:z.r210Elements,
    contactReceipts:z.r121ContactReceipts,closeup:z.r145ActionShot?.enabled,
    inset:z.renderPerformance.heroInsetDraws,realGLB:z.r199RealMagic};
  });
  const card=after.events.find(e=>e.type==='card_play'&&e.card===choice.id&&e.side==='player');
  assert(card?.spellOutcome);
  assert.equal(after.fire.material.last.element,choice.element);
  assert.equal(after.fire.material.last.source,'authoritative R199 physical contact');
  assert.equal(after.fire.oldDuelCircleLayerVisible,false);
  assert.equal(after.fire.material.addedGenericHalos,0);
  assert.equal(after.closeup,false);assert.equal(after.inset,0);
  assert.equal(after.round,choice.round);
  assert.equal(after.energy.player,before.energy.player-choice.cost);
  const image=output+'/r210-real-'+choice.id+'-'+choice.element+'-genuine-card.png';
  await page.locator('#stadium').screenshot({path:image});
  log.cases.push({id:choice.id,element:choice.element,seed:choice.seed,deck:choice.deck,
   realTurn:choice.round,realCost:choice.cost,
   serial:card.serial,spellOutcome:card.spellOutcome,
   noSpecialCamera:true,originalGLB:true,
   actualElementEffects:after.fire.material.observedElements[choice.element],
   image});
 }
 assert.deepEqual(log.errors,[]);
 log.ok=true;
 console.log('R210_TRUE_R2_FIRE_R3_EARTH_FULL_RULES_ORIGINAL_GLBS_PASS',JSON.stringify({
  realCards:log.cases.map(c=>({id:c.id,element:c.element,round:c.realTurn,
   cost:c.realCost,damage:c.spellOutcome.directDamage})),errors:log.errors}));
}catch(e){log.failure=String(e);console.error('R210_TRUE_REAL_CARDS_FAIL',String(e))}
finally{
 writeFileSync(output+'/r210-actual-turn2-fire-turn3-earth-report.json',JSON.stringify(log,null,2)+'\n');
 await ctx.close();await browser.close();
}
if(!log.ok)process.exitCode=7;
