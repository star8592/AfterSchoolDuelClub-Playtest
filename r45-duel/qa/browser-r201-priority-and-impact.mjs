/** R201 real Chrome: prefetch priority + exact physical impact sound handshake. */
import assert from'node:assert/strict';
import {createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r201-priority-spells';
mkdirSync(dir,{recursive:true});
const which=process.env.R201_CASE||'priority',wantImpact=which==='impact';
const report={which,pass:false,networkRequests:[],feedbackEvents:[],errors:[],screens:[]};
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await b.newContext({viewport:{width:1360,height:800},serviceWorkers:'block'});
const page=await ctx.newPage();
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
await page.route('**/art/hero-props/*.glb',async route=>{
 const name=route.request().url().split('/').at(-1);
 const at=performance.now();
 report.networkRequests.push({name,atMs:+at.toFixed(1)});
 if((!wantImpact&&name.startsWith('S08_'))||
    (wantImpact&&name.startsWith('Q05_')))await new Promise(ok=>setTimeout(ok,1600));
 await route.continue();
});
const read=()=>page.evaluate(()=>{
 const q=window.__r45QA,f=document.getElementById('stadium')?.contentWindow;
 const m=f?.__r45SceneQA?.r199RealMagic;
 return{ready:q?.sceneReady,round:q?.round,events:q?.events,
  hp:q?.hp,queue:m?.queue,casts:m?.casts,stage:m?.stage,
  loaded:m?.loadedIds,originals:m?.loadedAssetDetails,
  oldArsenal:f?.__r45SceneQA?.magicArsenal,
  oldImpact:f?.__r45SceneQA?.spellImpact,
  camera:f?.__r45SceneQA?.r145ActionShot,
  hero:f?.__r45SceneQA?.heroLens,
  hostHits:f?.__r45SceneQA?.hostHits,
  receiptCount:f?.__r45SceneQA?.r121ContactReceipts,
  audio:q?.audio?.counters,magicEvents:window.__r201MagicEvents||[],
  canonicalReceipts:window.__r201ContactEvents||[]}
});
try{
 const url=new URL('http://127.0.0.1:18689/r45-duel/');
 for(const [key,value] of [['qa','1'],['r199PhysicalMagic','on'],
  ['r200Pbr','on'],['r200Readable','on'],['seed',wantImpact?'2':'173'],
  ['deck',wantImpact?'classroom':'classic'],['r199Showcase','on']])
  url.searchParams.set(key,value);
 const started=Date.now();
 await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,
  null,{timeout:120000});
 report.startupMs=Date.now()-started;
 await page.evaluate(()=>{
  window.__r201MagicEvents=[];
  window.__r201ContactEvents=[];
  window.addEventListener('message',ev=>{
   if(ev.origin!==location.origin||
     ev.source!==document.getElementById('stadium')?.contentWindow)return;
   if(ev.data?.type==='ASDC_R199_MAGIC_EVENT')
    window.__r201MagicEvents.push({t:performance.now(),...ev.data});
   if(ev.data?.type==='ASDC_R121_SPELL_CONTACT')
    window.__r201ContactEvents.push({t:performance.now(),...ev.data});
  });
 });
 report.before=await read();
 assert.equal(report.before.camera.enabled,false);
 assert.equal(report.before.hero.visible,false);
 assert.equal(report.before.oldArsenal.played,0);
 if(!wantImpact){
  await page.waitForFunction(()=>document.querySelectorAll('.r199-spells button').length===46);
  await page.evaluate(()=>{
   document.getElementById('stadium').contentWindow.postMessage({
    type:'ASDC_R199_MAGIC_PREFETCH',ids:['S08','X01','K01','Q05']
   },location.origin);
  });
  await page.waitForFunction(()=>{
   const q=document.getElementById('stadium').contentWindow.__r45SceneQA.r199RealMagic.queue;
   return q.running===1&&q.backgroundWaiting.includes('X01');
  },null,{timeout:12000});
  // Clicking gallery is a REAL user-initiated urgent action, not a test
  // call into internal loader state.
  await page.locator('.r199-launch').click();
  await page.locator('.r199-spells button[data-magic-id="X01"]').click();
  await page.waitForFunction(()=>{
   const m=document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r199RealMagic;
   return m?.stage.lastBySide.player==='X01'&&m.loadedIds.includes('X01');
  },null,{timeout:60000});
  report.after=await read();
  assert(report.after.queue.promotions>=1,'real cast did not preempt speculative hand loads');
  const s=report.networkRequests.map(x=>x.name.slice(0,3));
  assert.equal(s[0],'S08','first source must already be loading');
  assert.equal(s[1],'X01','urgent real cast should be next original 3D model after running source');
  assert(report.after.magicEvents.some(e=>e.event==='loadPromoted'&&e.id==='X01'));
  assert.equal(report.after.oldArsenal.played,0);
  await page.locator('#stadium').screenshot({path:dir+'/r201-priority-real-3d-magic.png'});
  report.screens.push('r201-priority-real-3d-magic.png');
 }else{
  const spell=page.locator('#hand .card[data-card-id="Q05"]').first();
  assert(await spell.count(),'Seed must hold a real Q05 spell card');
  await spell.click();
  await page.locator('#play').click();
  // Rule effects settle instantly, but the exact 3D actor is artificially
  // held in the real Chrome network for 1600ms. Voice and hit animations
  // must NOT fire at the old .46s fixed timer.
  await page.waitForTimeout(650);
  report.duringDownload=await read();
  assert.equal(report.duringDownload.receiptCount,report.before.receiptCount,
    'premature spectator/host reaction before original GLB appeared');
  assert.equal(report.duringDownload.hostHits.ai.damage,
    report.before.hostHits.ai.damage,
    'premature host stagger before prop contact');
  assert(report.duringDownload.events.some(e=>e.type==='card_play'&&
    e.card==='Q05'&&e.spellOutcome?.directDamage===2),
    'canonical card must settle independently of visual download');
  await page.waitForFunction(()=>{
   const e=window.__r201MagicEvents||[];
   return e.some(x=>x.event==='cast'&&x.id==='Q05')&&
    e.some(x=>x.event==='contact'&&x.id==='Q05');
  },null,{timeout:65000});
  report.after=await read();
  const events=report.after.magicEvents.filter(x=>x.id==='Q05');
  const cast=events.filter(e=>e.event==='cast');
  const contact=events.filter(e=>e.event==='contact');
  assert.equal(cast.length,1,'one actual cast only');
  assert.equal(contact.length,1,'one actual physical impact sound event only');
  assert(cast[0].t<=contact[0].t,'prop must enter before contact foley');
  const canonical=report.after.events.find(e=>e.type==='card_play'&&
    e.card==='Q05'&&e.side==='player'&&e.spellOutcome);
  assert(canonical);
  assert.equal(contact[0].serial,canonical.serial,'contact serial must be rules-authenticated');
  assert.equal(contact[0].directDamage,canonical.spellOutcome.directDamage);
  const hitReceipts=report.after.canonicalReceipts.filter(x=>x.serial===canonical.serial);
  assert.equal(hitReceipts.length,1,'one correctly timed authoritative visual hit receipt');
  assert(report.after.receiptCount===report.before.receiptCount+1,
   'one actual 3D contact receipt, not the rule settle timer');
  assert.equal(report.after.hostHits.ai.damage,2,
   'animated opponent should stagger only after genuine model reached target');
  assert(contact[0].t-cast[0].t>600,
   'actual prop should travel before its contact foley and hurt reaction');
  assert.equal(report.after.oldArsenal.played,0);
  assert.equal(report.after.oldImpact.played,0);
  assert.equal(report.after.camera.enabled,false);
  await page.locator('#stadium').screenshot({path:dir+'/r201-real-Q05-impact-sound.png'});
  report.screens.push('r201-real-Q05-impact-sound.png');
  report.impact={serial:contact[0].serial,realRuleDamage:canonical.spellOutcome.directDamage,
   castToContactMs:+(contact[0].t-cast[0].t).toFixed(1),
   originalModel:report.after.originals.find(x=>x.id==='Q05')?.file};
 }
 assert.deepEqual(report.errors,[]);
 report.pass=true;
 console.log('R201_CHROME_REAL_PC_PASS',JSON.stringify({
  which,startupMs:report.startupMs,
  requested:report.networkRequests.map(x=>x.name),
  promotions:report.after.queue.promotions,
  impact:report.impact,errors:report.errors}));
}finally{
 writeFileSync(dir+'/r201-'+which+'.json',JSON.stringify(report,null,2)+'\n');
 await ctx.close();await b.close();
}
