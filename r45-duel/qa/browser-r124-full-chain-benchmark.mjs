/**
 * R124: combined real-rule hit, physical card, actor close-up, voice and frame-time QA.
 * This benchmark is a GPU Chrome observation, NOT representative phone hardware FPS.
 */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=(process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11424').replace(/\/$/,'');
const dir=resolve(import.meta.dirname,'evidence/r124-full-chain');
mkdirSync(dir,{recursive:true});
const report={passed:false,origin,checks:[],views:[],errors:[]};
function check(ok,label,data){report.checks.push({pass:!!ok,label});if(!ok)throw Error(label+': '+JSON.stringify(data).slice(0,700));}
function pctl(xs,f){if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y);return +a[Math.floor((a.length-1)*f)].toFixed(2);}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-webgl',
 '--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url());});
  const start=Date.now();
  await page.goto(origin+'/r45-duel/?qa=1&deck=kitchen&seed=8',
   {waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
  await page.waitForFunction(()=>window.__r45QA?.audio?.assetsReady===true,null,{timeout:24000});
  const readyMs=Date.now()-start;
  const initial=await page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {hp:window.__r45QA.hp,hosts:q.duelistHosts.length,
    fingers:q.handCards.actors.map(x=>x.realFingerBones),elements:q.spellContactFX?.elements};
  });
  check(initial.hosts===2&&initial.fingers.every(x=>x===15),view+' real two-host skeleton/fingers',initial);
  check(initial.elements===15&&initial.hp.ai===20,view+' ready elemental system and engine baseline',initial);
  await page.evaluate(()=>{
   const w=document.querySelector('#stadium').contentWindow;
   const p={phase:'idle',idle:[],fight:[],lens:0,maxGrip:0,maxDraw:0,
    maxContacts:0,maxFx:0,painted:false,stopped:false,frame:0};
   w.__r124Probe=p;
   let prev=0;
   function tick(t){
    if(p.stopped)return;
    if(prev&&t>prev)p[p.phase].push(t-prev);
    prev=t;
    if(++p.frame%6===0){
     const q=w.__r45SceneQA,card=q.handCards;
     p.lens+=Number(q.heroLens?.visible||false);
     p.maxGrip=Math.max(p.maxGrip,...card.actors.map(x=>x.grip));
     p.maxDraw=Math.max(p.maxDraw,q.drawCalls||0);
     p.maxContacts=Math.max(p.maxContacts,q.r121ContactReceipts||0);
     p.maxFx=Math.max(p.maxFx,q.spellContactFX?.spawned||0);
     p.painted ||= card.actors.some(x=>x.lastPainted==='K01');
    }
    w.requestAnimationFrame(tick);
   }
   w.requestAnimationFrame(tick);
  });
  await page.waitForTimeout(1200);
  check(await page.locator('.card[data-card-id="K01"]:not([disabled])').count()>0,
   view+' real K01 available on player hand');
  await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r124Probe.phase='fight');
  await page.locator('.card[data-card-id="K01"]:not([disabled])').first().click();
  await page.locator('#play').click();
  await page.waitForFunction(()=>document.querySelector('#stadium')?.contentWindow?.__r45SceneQA?.r121ContactReceipts>=1,null,{timeout:22000});
  await page.waitForTimeout(2600);
  const state=await page.evaluate(()=>{
   const w=document.querySelector('#stadium').contentWindow,q=w.__r45SceneQA;
   w.__r124Probe.stopped=true;
   return {hp:window.__r45QA.hp,
    events:window.__r45QA.events.filter(e=>e.type==='card_play'&&e.card==='K01'),
    hit:q.hostHits.ai,fx:q.spellContactFX,contacts:q.r121ContactReceipts,
    voices:window.__r45QA.audio?.voiceVariantHistory||[],probe:w.__r124Probe,
    load:w.__ASDC_LOAD_METRICS||null};
  });
  check(state.hp.ai===19&&state.events.length===1&&state.events[0].spellOutcome?.directDamage===1,
   view+' single real K01 rule damage',state);
  check(state.hit?.damage===1&&state.hit?.element==='absurd',
   view+' real 3D actor receives correct magic',state.hit);
  check(state.contacts===1&&state.fx.spawned>=1&&state.fx.ruleMutations===0,
   view+' contact receipt cannot double damage',state);
  check(state.probe.lens>0&&state.probe.maxGrip>.7&&state.probe.painted,
   view+' 3D actor closeup + actual painted card + source finger grasp',state.probe);
  check(state.voices.some(x=>x.id==='HOST_AI'&&x.kind==='hurt'),
   view+' actor hurt voice triggered by rules',state.voices);
  // R124 must stay below the previous entire-stadium inset peak (~1211).
  // Frame-time P95 is observed rather than hard-gated (CI GPUs vary).
  check(state.probe.maxDraw<1050&&errors.length===0,
   view+' host-only 3D inset avoids duplicate stadium rendering, no JS/HTTP errors',
   {draw:state.probe.maxDraw,errors});
  const perf={readyMs,load:state.load,
   idle:{frames:state.probe.idle.length,p50Ms:pctl(state.probe.idle,.5),
    p95Ms:pctl(state.probe.idle,.95),over33ms:state.probe.idle.filter(x=>x>33.3).length},
   fight:{frames:state.probe.fight.length,p50Ms:pctl(state.probe.fight,.5),
    p95Ms:pctl(state.probe.fight,.95),over33ms:state.probe.fight.filter(x=>x>33.3).length},
   maxDrawCalls:state.probe.maxDraw};
  await page.screenshot({path:resolve(dir,view+'-full-chain.png')});
  report.views.push({view,width,perf,contacts:state.contacts,voiceEvents:state.voices.length});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e));}
finally{writeFileSync(resolve(dir,'r124-full-chain-report.json'),JSON.stringify(report,null,2));await browser.close();}
console.log('R124_FULL_CHAIN',JSON.stringify({passed:report.passed,
 checks:report.checks.length,errors:report.errors,views:report.views,
 failed:report.checks.filter(x=>!x.pass)}));
if(!report.passed)process.exitCode=1;
