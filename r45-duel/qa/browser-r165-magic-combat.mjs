/**
 * Isolated R165 real browser Web duel regression.
 * Uses all original R147 models/textures/animations; only optional
 * 8 motif choreography and exact primitive geometry reuse are overlaid.
 */
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r165-magic-combat';
mkdirSync(out,{recursive:true});
const device=process.env.R165_DEVICE||'desktop',mobile=device==='mobile';
const order=(process.env.R165_ORDER||'original,optimized').split(',');
const cards=['S04','P01','P04','P07','P08','X03','X07','X08'];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const report={date:new Date().toISOString(),device,order,cases:[]};
try{
 for(const variant of order){
  const opt=variant==='optimized';
  const context=await browser.newContext({viewport:mobile?{width:430,height:900}:{width:1280,height:720},
   deviceScaleFactor:mobile?2:1,hasTouch:mobile,isMobile:mobile,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-90))});
  const u='http://127.0.0.1:18665/r45-duel/?qa=1&seed=165'+
   (opt?'&r163MagicVariety=on&r163MagicPool=on':'');
  await page.goto(u,{waitUntil:'domcontentloaded',timeout:55000});
  let ready=true;
  try{await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{
   timeout:100000,polling:400})}
  catch(e){ready=false;errors.push('sceneReady '+String(e).slice(0,130))}
  let state=null;
  if(ready){
   const init=await page.evaluate(async()=>{
    const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
    const mod=await import('/r45-duel/scene/magic-arsenal.mjs');
    const engine=await import('/r45-duel/engine.mjs');
    const board={player:[{uid:'U16501',id:'T01',hp:9,attack:4,shield:0}],
     ai:[{uid:'U16502',id:'E03',hp:8,attack:4,shield:0}]};
    f.postMessage({type:'ASDC_R45_BOARD',units:board,player:['T01'],ai:['E03']},
     location.origin);
    return {
     motifs:mod.MAGIC_MOTIF_COUNT,
     cards:window.__r45QA.cardCount,
     effectMap:Object.fromEntries(
      ['S04','P01','P04','P07','P08','X03','X07','X08'].map(id=>[id,engine.BY_ID[id].effect])),
     initial:q.magicArsenal.played,
     assets:f.__ASDC_LOAD_METRICS.modelsVerified,
     bytes:f.__ASDC_LOAD_METRICS.downloadedBytes
    };
   });
   const events=[];
   for(let i=0;i<cards.length;i++){
    const card=cards[i],serial=165001+i;
    const before=await page.evaluate(()=>{
     const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
     return{played:q.magicArsenal.played,impact:q.spellImpact.played};
    });
    await page.evaluate(({card,serial,effect})=>{
     const f=document.querySelector('#stadium').contentWindow;
     f.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',serial,
       card,effect,damage:1,directDamage:1,targetUids:['U16502']},location.origin);
    },{card,serial,effect:init.effectMap[card]});
    await page.waitForFunction(before=>{
     const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
     return q.magicArsenal.played>before.played&&q.spellImpact.played>before.impact;
    },before,{timeout:7000});
    const count=await page.evaluate(()=>{
     const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
     return{played:q.magicArsenal.played,impact:q.spellImpact.played,
       stats:q.magicArsenal,drawCalls:q.drawCalls};
    });
    events.push({card,serial,...count});
    await page.waitForTimeout(400);
   }
   state=await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
    return {models:f.__ASDC_LOAD_METRICS.modelsVerified,
      download:f.__ASDC_LOAD_METRICS.downloadedBytes,
      cards:window.__r45QA.cardCount,magic:q.magicArsenal,
      impact:q.spellImpact,sourceIdentity:q.sourceMatchesR22,
      cameraSafe:!q.r145ActionShot.enabled,
      drawCalls:q.drawCalls};
   });
   state.init=init;state.events=events;
   await page.locator('#stadium').screenshot({path:resolve(out,
    'r165-'+device+'-'+variant+'-combat.png')});
  }
  const pass=ready&&errors.length===0&&state?.models===16&&
   state?.download===75569762&&state?.cards===60&&
   state?.sourceIdentity&&state?.cameraSafe&&
   state?.events.length===8&&state?.init.motifs===(opt?40:32)&&
   state?.magic.poolEnabled===opt&&
   (opt?state.magic.geometryCacheHits>0&&state.magic.cachedGeometries>0:
    state.magic.cachedGeometries===0)&&
   state.magic.played>=state.init.initial+8;
  report.cases.push({variant,pass,errors,state});
  console.log('R165_MAGIC_COMBAT_CASE',JSON.stringify({device,variant,pass,
    motifs:state?.init.motifs,played:state?.magic.played,
    cache:state?.magic.cachedGeometries,
    hits:state?.magic.geometryCacheHits,
    drawCalls:state?.drawCalls,errors}));
  await page.close();await context.close();
 }
}finally{
 writeFileSync(resolve(out,'r165-'+device+'-'+order.join('-')+'.json'),
  JSON.stringify(report,null,2));
 await browser.close();
}
if(report.cases.some(x=>!x.pass))process.exitCode=2;
