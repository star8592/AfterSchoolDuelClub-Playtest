import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {LESSONS} from '../tutorial.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11100';
const evidence=resolve(import.meta.dirname,'evidence/r100');mkdirSync(evidence,{recursive:true});
const report={origin,passed:false,checks:[],views:[],freeDuel:null,errors:[]};
function check(ok,name,detail){
 report.checks.push({pass:!!ok,name,detail});
 if(!ok)throw Error('R100 '+name+': '+JSON.stringify(detail).slice(0,650));
}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const sceneData=page=>page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.comboDirector);
try{
 for(const [name,width] of [['desktop',1550],['mobile',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=7&mode=tutorial&level=1',
   {waitUntil:'domcontentloaded',timeout:85000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true&&
   document.querySelector('#stadium').contentWindow.__r45SceneQA?.comboDirector?.played===0,
   null,{timeout:145000});
  const initial=await sceneData(page);
  check(!initial.active&&initial.actualProps.chalkSticks===3&&
   initial.actualProps.chalkFragments===18&&initial.actualProps.broadcastSpeakers===2&&
   initial.actualProps.broadcastWaveMeshes===4&&initial.actualProps.posterMeshes>=3&&
   initial.actualProps.shieldMeshes===2,name+' real 3D cinematic assets exist',{initial});
  const view={name,width,combos:[]};
  for(let i=0;i<LESSONS.length;i++){
   const lesson=LESSONS[i];
   check(!(await page.frameLocator('#stadium').locator('#skip-combo').isVisible()),
    name+' no ghost skip before real combo');
   check((await sceneData(page)).active===false,
    name+' no leaked 3D props before chapter '+(i+1));
   await page.locator('.card[data-card-id="'+lesson.cards[0]+'"]:not([disabled])').first().click();
   await page.locator('#play').click();
   const before=await sceneData(page);
   check(before.played===i,name+' first card alone did NOT fake combo',{before});
   await page.locator('.card[data-card-id="'+lesson.cards[1]+'"]:not([disabled])').first().click();
   await page.locator('#play').click();
   await page.waitForFunction((effect)=>{
    const sc=document.querySelector('#stadium').contentWindow.__r45SceneQA?.comboDirector;
    return sc?.active===true&&sc?.last?.effect===effect;
   },lesson.effect,{timeout:18000});
   const started=await sceneData(page);
   check(started.played===i+1&&started.playing.effect===lesson.effect&&started.playing.side==='player',
    name+' 3D director only sees real event '+lesson.effect,{started});
   check(await page.frameLocator('#stadium').locator('#skip-combo').isVisible(),
    name+' accessible skip for actual story animation');
   await page.waitForTimeout(650);
   const mid=await sceneData(page);
   check(mid.active&&mid.phase!=='idle'&&mid.realImpactFrames>=0,
    name+' chapter '+(i+1)+' live scene phases',{mid});
   const category=['chalk','broadcast','poster'][i];
   check(mid.activeEffects[category]===true,name+' correct true 3D prop family '+category,mid.activeEffects);
   await page.screenshot({path:resolve(evidence,name+'-'+lesson.id+'-cinematic.png')});
   view.combos.push({id:lesson.id,effect:started.last.effect,serial:started.last.serial,
    seen3D:category,phase:mid.phase,props:mid.actualProps});
   if(i===0){
    await page.frameLocator('#stadium').locator('#skip-combo').click();
    await page.waitForFunction(()=>!document.querySelector('#stadium').contentWindow.__r45SceneQA?.comboDirector?.active,
     null,{timeout:5000});
    const skipped=await sceneData(page);
    check(skipped.skipped>=1&&!skipped.active&&skipped.played===1,
     name+' skip stops props only, never changes real combo receipt',{skipped});
    const phantom=await page.evaluate(()=>window.__r45QA.audio.events.filter(x=>
      x.type==='cue'&&x.detail.startsWith('meteor_impact:player')).length);
    check(phantom===0,name+' skipped pre-impact chalk never plays delayed fake hit',{phantom});
    check(await page.locator('#play').isEnabled(),name+' skip never disables real next chapter');
   }else if(i===1){
    await page.waitForFunction(()=>!document.querySelector('#stadium').contentWindow.__r45SceneQA?.comboDirector?.active,
     null,{timeout:6500});
    const completed=await sceneData(page);
    check(completed.completed>=1&&completed.realImpactFrames>0&&
      !Object.values(completed.activeEffects).some(Boolean),
      name+' natural animation completion removes every prop',{completed});
    const cue=await page.evaluate(()=>window.__r45QA.audio.events.filter(x=>
      x.type==='cue'&&x.detail.startsWith('sonic_wave:player')).length);
    check(cue===1,name+' actual broadcast speaker emits ONE synchronized source SFX',{cue});
   }else{
    // The user may click next immediately; no previous chapter visual can persist.
    check((await sceneData(page)).active,name+' final 3D scene live before graduation');
   }
   check((await page.locator('#play').innerText()).includes(i===2?'自由对战':'进入下一关'),
    name+' R99 gold main continuation is still working');
   if(i<LESSONS.length-1){
    const pre=await sceneData(page);
    await page.locator('#play').click();
    const post=await sceneData(page);
    check(post.played===pre.played&&!post.active&&
      (await page.evaluate(()=>window.__r45QA.tutorial.level))===i+2,
      name+' same iframe new chapter clears old 3D event',{pre,post});
   }else{
    await page.locator('#play').click();
    await page.waitForFunction(()=>window.__r45QA?.sceneReady&&!window.__r45QA.tutorial,
     null,{timeout:150000});
    check(await page.locator('#end').isEnabled(),name+' finishes tutorial into playable real free duel');
   }
  }
  check(errors.length===0,name+' 0 JavaScript/GLB HTTP errors',errors);
  report.errors.push(...errors);report.views.push(view);
  await page.close();
 }
 // A genuine free duel must use the same 3D cinematic, not a tutorial-only trick.
 const p=await browser.newPage({viewport:{width:1400,height:900}});
 p.on('pageerror',e=>report.errors.push('free JS '+e.message));
 await p.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:85000});
 await p.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:140000});
 check((await sceneData(p)).played===0,'free duel starts without artificial combo');
 for(const id of ['E01','T01']){
  await p.locator('.card[data-card-id="'+id+'"]:not([disabled])').first().click();
  await p.locator('#play').click();
 }
 await p.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.comboDirector?.active,
  null,{timeout:15000});
 const free=await sceneData(p);
 check(free.played===1&&free.last.effect==='broadcast_draw'&&
  free.last.side==='player'&&free.activeEffects.broadcast,
  'same real broadcast 3D effect works without tutorial',{free});
 const engine=await p.evaluate(()=>window.__r45QA.events.findLast(e=>e.type==='combo_effect'));
 check(free.last.serial===engine.serial&&free.last.draw===engine.draw,
  'free duel visual receipt is exactly authoritative event',{engine,visual:free.last});
 report.freeDuel={effect:free.last.effect,serial:free.last.serial,actualDraw:free.last.draw};
 await p.close();
 // The two boundary outcomes MUST work in the unrestricted, real 3D game.
 // Do not show a fake unit knockout or a false shield when rules say otherwise.
 for(const [seed,ids,effect,expected] of [
  [9,['E01','G01'],'chalk_direct',{damage:1,shield:0,draw:0}],
  [14,['G05','T05'],'poster_draw',{damage:0,shield:0,draw:1}]
 ]){
  const boundary=await browser.newPage({viewport:{width:1400,height:900}});
  boundary.on('pageerror',e=>report.errors.push('boundary JS '+e.message));
  await boundary.goto(origin+'/r45-duel/?qa=1&seed='+seed,
   {waitUntil:'domcontentloaded',timeout:80000});
  await boundary.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:135000});
  for(const id of ids){
   await boundary.locator('.card[data-card-id="'+id+'"]:not([disabled])').first().click();
   await boundary.locator('#play').click();
  }
  await boundary.waitForFunction(want=>
   document.querySelector('#stadium').contentWindow.__r45SceneQA?.comboDirector?.last?.effect===want,
   effect,{timeout:15000});
  const state=await sceneData(boundary);
  const actual=await boundary.evaluate(()=>window.__r45QA.events.findLast(e=>e.type==='combo_effect'));
  check(state.last.serial===actual.serial&&
    state.last.effect===effect&&state.last.damage===expected.damage&&
    state.last.shield===expected.shield&&state.last.draw===expected.draw,
    'unrestricted duel visual matches actual '+effect,{actual,visual:state.last});
  if(effect==='poster_draw')check(!state.activeEffects.shield,
    'poster DRAW cannot render a fake shield',state.activeEffects);
  if(effect==='chalk_direct')check(state.last.target===null,
    'chalk direct damage cannot render a fake targeted enemy',state.last);
  await boundary.screenshot({path:resolve(evidence,'free-real-'+effect+'.png')});
  await boundary.close();
 }
 // Motion-sensitive players should receive the same AUTHORITATIVE combo event
 // and a short, comprehensible effect instead of a forced prolonged animation.
 const reduced=await browser.newPage({viewport:{width:430,height:900},reducedMotion:'reduce'});
 await reduced.goto(origin+'/r45-duel/?qa=1&seed=7&mode=tutorial&level=1',
  {waitUntil:'domcontentloaded',timeout:80000});
 await reduced.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:130000});
 check(await reduced.evaluate(()=>document.querySelector('#stadium').contentWindow.matchMedia(
  '(prefers-reduced-motion: reduce)').matches),
  'reduced-motion setting reaches actual 3D scene');
 for(const id of ['E01','G01']){
  await reduced.locator('.card[data-card-id="'+id+'"]:not([disabled])').first().click();
  await reduced.locator('#play').click();
 }
 await reduced.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.comboDirector?.played===1,
  null,{timeout:10000});
 await reduced.waitForFunction(()=>!document.querySelector('#stadium').contentWindow.__r45SceneQA?.comboDirector?.active,
  null,{timeout:4000});
 const reducedStat=await sceneData(reduced);
 check(reducedStat.completed===1&&!reducedStat.active&&reducedStat.last.effect==='chalk_hit',
  'real combo completes quickly without prolonged movement for reduced-motion players',reducedStat);
 check(await reduced.locator('#play').isEnabled(),
  'motion preference cannot block the gold next-chapter action');
 await reduced.close();
 report.passed=report.checks.every(x=>x.pass)&&report.errors.length===0;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(evidence,'r100-real-combo-cinematics-report.json'),JSON.stringify(report,null,2));
 console.log('R100_REAL_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,
  errors:report.errors,views:report.views.map(x=>({name:x.name,width:x.width,
  combos:x.combos.map(c=>({id:c.id,effect:c.effect,phase:c.phase}))})),
  freeDuel:report.freeDuel}));
 await browser.close();
}
if(!report.passed)process.exitCode=6;
