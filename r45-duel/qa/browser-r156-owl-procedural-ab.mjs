/**
 * Real Chrome Vulkan game scene A/B: T01 original vs R156 procedural normal variants.
 * Local layered static server reads MAIN for untouched resources, the isolated
 * branch for only modified code & QA GLBs; no modifications to public Pages.
 */
import{createRequire}from'node:module';
import{createServer}from'node:http';
import{createReadStream,existsSync,statSync,mkdirSync,writeFileSync}from'node:fs';
import{resolve,extname}from'node:path';
import{once}from'node:events';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'../..');
const fallback='/home/master/projects/after-school-duel-r147-hotfix-20261114';
const evidence='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118';
mkdirSync(evidence,{recursive:true});
const mime={'.html':'text/html;charset=utf-8','.mjs':'text/javascript',
 '.js':'text/javascript','.css':'text/css','.json':'application/json',
 '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg',
 '.webp':'image/webp','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const rel=path.replace(/^\/+/, '')+(path.endsWith('/')?'index.html':'');
  if(!rel||rel.split('/').includes('..'))throw Error('unsafe path');
  const pref=resolve(root,rel),fallbackPath=resolve(fallback,rel);
  const p=existsSync(pref)?pref:fallbackPath;
  if(!p.startsWith(root+'/')&&!p.startsWith(fallback+'/'))throw Error('out of scope');
  if(!existsSync(p)||!statSync(p).isFile()){res.writeHead(404);res.end('404 '+rel);return}
  res.writeHead(200,{'Content-Type':mime[extname(p)]||'application/octet-stream',
    'Content-Length':statSync(p).size,'Cache-Control':'public,max-age=600'});
  createReadStream(p).pipe(res);
 }catch(e){res.writeHead(500);res.end(String(e))}
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const port=server.address().port;
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage',
 '--autoplay-policy=no-user-gesture-required']});
const withR155=process.env.R156_WITH_R155==='1';
const output={date:new Date().toISOString(),withR155,environment:'Z890 Chrome Vulkan, local layered static server',cases:[]};
try{
 const modes=process.env.R156_ONLY?[process.env.R156_ONLY]:
   process.env.R156_ORDER==='reverse'?['512','1024','default']:['default','1024','512'];
 for(const mode of modes){
  const context=await browser.newContext({
    viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'allow'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text().slice(0,300))});
  page.on('requestfailed',req=>errors.push('FETCH '+req.url().slice(-120)+' '+req.failure()?.errorText));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-100))});
  const url='http://127.0.0.1:'+port+'/r45-duel/?qa=1&seed=156'+
    (mode!=='default'?'&r156OwlNormal='+mode:'')+
    (withR155?'&r155VrmLite=on':'');
  const started=Date.now();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
  let ready=true;
  try{await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:process.env.R156_FAST_DIAG?20000:90000,polling:300})}
  catch(e){errors.push('sceneReady '+String(e));ready=false}
  if(!ready){
   const diag=await page.evaluate(()=>{
     const f=document.querySelector('#stadium')?.contentWindow;
     return {body:f?.document?.querySelector('#loading')?.innerText?.slice(0,700),
       loadingError:f?.document?.querySelector('#loading')?.dataset?.error,
       loadMetrics:f?.__ASDC_LOAD_METRICS,qa:!!f?.__r45SceneQA,
       readyParent:window.__r45QA?.sceneReady};
   });
   errors.push('DIAGNOSTIC '+JSON.stringify(diag));
  }
  let snapshot=null;
  if(ready){
   snapshot=await page.evaluate(()=>{
    const f=document.querySelector('#stadium'),s=f.contentWindow.__r45SceneQA,
      load=f.contentWindow.__ASDC_LOAD_METRICS;
    return{ready:window.__r45QA.sceneReady,qaMode:s.owlNormalVariant,vrmLite:s.runtimeVrmLite,
      cardCount:window.__r45QA.cardCount,summons:s.summonModels.length,
      owlFile:s.summonModels.find(m=>m.id==='T01')?.file,
      normalTextures:s.owlNormalTextureSizes,
      source:s.sourceMatchesR22,render:s.renderPerformance,
      r147Shot:s.r145ActionShot.enabled,
      load:{...load},drawCalls:s.drawCalls};
   });
  }
  let cache=null,combat=false,closeup=false;
  if(ready){
   const units={player:[{uid:'U15601',id:'T01',hp:9,attack:4,shield:0}],
     ai:[{uid:'U15602',id:'E03',hp:8,attack:4,shield:0}]};
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage(
     {type:'ASDC_R45_BOARD',units:u,player:['T01'],ai:['E03']},location.origin),units);
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA
     .summonPresence?.total===2,null,{timeout:15000});
   closeup=await page.evaluate(()=>document.querySelector('#stadium').contentWindow
     .__r45SceneQA.setStudyCloseup('T01'));
   await page.waitForTimeout(1300);
   await page.locator('#stadium').screenshot({path:resolve(evidence,'r156-owl-'+mode+(withR155?'-combined':'')+'-closeup.png')});
   // Separate wide-court combat screenshot with the original safe camera.
   await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.setStudyCloseup(null));
   await page.waitForTimeout(400);
   await page.locator('#stadium').screenshot({path:resolve(evidence,'r156-owl-'+mode+(withR155?'-combined':'')+'-wide.png')});
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage(
     {type:'ASDC_R51_COMBAT_EVENTS',pre:u,post:u,
      events:[{type:'exchange',serial:15601,side:'player',from:'T01',to:'E03',
       attacker_uid:'U15601',target_uid:'U15602',damage:1,
       target_hp_after:7,attacker_hp_after:9}]},location.origin),units);
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
     .__r45SceneQA.combatEvents?.active===true,null,{timeout:10000});
   combat=true;
   try{
    await page.waitForFunction(async()=>{
     const cache=await caches.open('asdc-r125-immutable-models-v1');
     return (await cache.keys()).length>=16;
    },null,{timeout:50000,polling:500});
   }catch(e){errors.push('cache timeout '+String(e).slice(0,110))}
   cache=await page.evaluate(async()=>{
    const c=await caches.open('asdc-r125-immutable-models-v1');
    const keys=(await c.keys()).map(req=>new URL(req.url).pathname.split('/').pop());
    return{count:keys.length,owl:keys.filter(k=>k.includes('T01-Owl-Innerscene')),
      vrmLite:keys.filter(k=>k.endsWith('-R155-Runtime.vrm')).length};
   });
  }
  const expected=mode==='default'?'T01-Owl-Innerscene-R84.glb':
    'T01-Owl-Innerscene-R156-HybridNormal-'+mode+'.glb';
  const dims=mode==='default'?2048:Number(mode);
  const ok=ready&&combat&&closeup&&snapshot?.qaMode===mode&&
    snapshot?.vrmLite===withR155&&cache?.vrmLite===(withR155?4:0)&&
    snapshot?.owlFile===expected&&snapshot?.summons===12&&snapshot?.cardCount===60&&
    snapshot?.source===true&&snapshot?.r147Shot===false&&
    snapshot?.normalTextures.length===2&&
    snapshot?.normalTextures.every(t=>t.width===dims&&t.height===dims)&&
    snapshot?.load?.modelsVerified===16&&cache?.count===16&&
    cache?.owl.length===1&&cache.owl[0]===expected+'.gz'&&errors.length===0;
  const result={mode,ok,ready,combat,closeup,elapsedMs:Date.now()-started,
    cache,errors,snapshot};
  output.cases.push(result);
  console.log('R156_BROWSER_CASE',JSON.stringify(result));
  await page.close();await context.close();
 }
}finally{
 writeFileSync(resolve(evidence,withR155?'r156-r155-combined.json':
     process.env.R156_ORDER==='reverse'?'r156-browser-ab-reverse.json':'r156-browser-ab.json'),JSON.stringify(output,null,2));
 await browser.close();server.close();
}
console.log('R156_BROWSER_AB_COMPLETE',JSON.stringify(output.cases.map(x=>({
 mode:x.mode,ok:x.ok,bytes:x.snapshot?.load?.downloadedBytes,
 modelReadyMs:x.snapshot?.load?.modelReadyMs,firstFrameReadyMs:x.snapshot?.load?.firstFrameReadyMs,
 dimensions:x.snapshot?.normalTextures?.map(t=>t.width),cache:x.cache?.count,errors:x.errors.length
}))));
if(output.cases.some(x=>!x.ok))process.exitCode=2;
