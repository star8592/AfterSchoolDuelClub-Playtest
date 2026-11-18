import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const port=Number(process.env.R164_LOCAL_PORT||18664);
const out='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r164-stadium-broadcast';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const configs=(process.env.R164_CASES||'desktop:on,mobile:on,desktop:off').split(',').map(c=>{
 const [device,mode]=c.split(':');return{device,mode}});
const captureMode=process.env.R164_CAPTURE_MODE||'sync';
const report={at:new Date().toISOString(),captureMode,cases:[]};
try{
 for(const cfg of configs){
  const mobile=cfg.device==='mobile',enabled=cfg.mode==='on';
  const context=await browser.newContext({
   viewport:mobile?{width:430,height:900}:{width:1280,height:720},
   deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-90))});
  await page.goto('http://127.0.0.1:'+port+'/r45-duel/?qa=1&seed=164&r164Broadcast='+cfg.mode+'&r164Capture='+captureMode,
   {waitUntil:'domcontentloaded',timeout:50000});
  let loaded=true;
  try{await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{
   timeout:90000,polling:400})}
  catch(e){loaded=false;errors.push('scene ready '+String(e).slice(0,150))}
  let idle=null,casting=null,hitting=null,after=null;
  if(loaded){
   const values=await page.evaluate(async()=>{
    const m=await import('/r45-duel/engine.mjs');
    return{Q01:m.BY_ID.Q01.effect};
   });
   idle=await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
    return {broadcast:q.stadiumBroadcast,projection:q.broadcastProjected,
     portraitHidden:f.document.querySelector('#hero-portrait-frame').hidden,
     modelCount:f.__ASDC_LOAD_METRICS.modelsVerified,
     bytes:f.__ASDC_LOAD_METRICS.downloadedBytes,
     cards:window.__r45QA.cardCount,drawCalls:q.drawCalls};
   });
   if(enabled){
    await page.locator('#stadium').screenshot({path:resolve(out,cfg.device+'-idle.png')});
    await page.evaluate(effect=>{
     const f=document.querySelector('#stadium').contentWindow;
     const board={player:[{uid:'U16401',id:'T01',hp:9,attack:4,shield:0}],
      ai:[{uid:'U16402',id:'E03',hp:8,attack:4,shield:0}]};
     f.postMessage({type:'ASDC_R45_BOARD',units:board,player:['T01'],ai:['E03']},location.origin);
     f.postMessage({type:'ASDC_R46_CARD_PLAY',side:'player',serial:16401,
      id:'Q01',kind:'spell'},location.origin);
    },values.Q01);
    await page.waitForFunction(()=>{
     const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
     return q.stadiumBroadcast.mode==='cast'&&q.stadiumBroadcast.renderedFrames>=3;
    },null,{timeout:12000});
    casting=await page.evaluate(()=>{
     const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
     return {broadcast:q.stadiumBroadcast,portraitHidden:f.document
      .querySelector('#hero-portrait-frame').hidden,
      lens:q.heroLens,proj:q.broadcastProjected};
    });
    await page.locator('#stadium').screenshot({path:resolve(out,cfg.device+'-cast.png')});
    await page.evaluate(effect=>{
     const f=document.querySelector('#stadium').contentWindow;
     f.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',
      serial:16401,card:'Q01',effect,damage:1,directDamage:1,
      targetUids:['U16402']},location.origin);
    },values.Q01);
    await page.waitForFunction(()=>{
     const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
     return q.stadiumBroadcast.mode==='hit'&&q.stadiumBroadcast.side==='ai'&&
      q.stadiumBroadcast.renderedFrames>=6;
    },null,{timeout:14000});
    hitting=await page.evaluate(()=>{
     const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
     return {broadcast:q.stadiumBroadcast,heroLens:q.heroLens,
      portraitHidden:f.document.querySelector('#hero-portrait-frame').hidden,
      hits:q.actualHostHits,pending:q.pendingSpellContacts};
    });
    await page.locator('#stadium').screenshot({path:resolve(out,cfg.device+'-hit.png')});
    await page.waitForFunction(()=>{
     const b=document.querySelector('#stadium').contentWindow.__r45SceneQA.stadiumBroadcast;
     return b.mode==='idle'&&b.side===null;
    },null,{timeout:9000});
    after=await page.evaluate(()=>{
     const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
     return {broadcast:q.stadiumBroadcast,heroLens:q.heroLens};
    });
   }else{
    await page.evaluate(()=>{
     const f=document.querySelector('#stadium').contentWindow;
     f.postMessage({type:'ASDC_R46_CARD_PLAY',side:'player',serial:16401,
      id:'Q01',kind:'spell'},location.origin);
    });
    await page.waitForTimeout(700);
    await page.locator('#stadium').screenshot({
      path:resolve(out,cfg.device+'-original-foreground.png')});
    casting=await page.evaluate(()=>{
     const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
     return {broadcast:q.stadiumBroadcast,portraitHidden:f.document
      .querySelector('#hero-portrait-frame').hidden,lens:q.heroLens};
    });
   }
  }
  const pass=loaded&&idle?.modelCount===16&&idle?.cards===60&&
   idle?.bytes===75569762&&errors.length===0&&
   (enabled?
    idle?.projection?.screen?.every(p=>Math.abs(p[0])<.97&&Math.abs(p[1])<.80)&&
    idle?.broadcast?.idle&&idle?.broadcast?.screenVisible&&
    idle?.broadcast?.footprintOverlapsScoreboard===false&&
    casting?.broadcast?.mode==='cast'&&casting.broadcast.side==='player'&&
    casting?.broadcast?.cardImageLoaded&&
    casting.broadcast.renderedFrames>=3&&casting.portraitHidden&&
    casting.lens.visible===false&&
    hitting?.broadcast?.mode==='hit'&&hitting.broadcast.side==='ai'&&
    hitting.broadcast.hits>=1&&hitting.portraitHidden&&
    hitting.heroLens.visible===false&&
    after?.broadcast?.idle:
    casting?.broadcast?.enabled===false);
  const row={...cfg,pass,errors,idle,casting,hitting,after};
  report.cases.push(row);
  console.log('R164_LOCAL_CASE',JSON.stringify({
   ...cfg,pass,errors,projection:idle?.projection,
   screenIdle:idle?.broadcast,
   cast:casting?.broadcast,
   hit:hitting?.broadcast,
   hidden:casting?.portraitHidden,
   normalR147:!enabled
  }));
  await page.close();await context.close();
 }
}finally{
 writeFileSync(resolve(out,'r164-local-browser-'+captureMode+'.json'),JSON.stringify(report,null,2));
 await browser.close();
}
if(report.cases.some(c=>!c.pass))process.exitCode=2;
