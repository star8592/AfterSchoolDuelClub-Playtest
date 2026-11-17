/**
 * Real Chrome Vulkan proof for R157.
 * Same R147 HTML/scene/rules/assets across BOTH local isolated origins,
 * except R157 source replaces ONLY 12 .glb.gz and their 16-item digest map.
 * Tests original vs R157, desktop and mobile, both 12 real GLB and gameplay.
 */
import{createRequire}from'node:module';
import{createServer}from'node:http';
import{createReadStream,existsSync,statSync,readFileSync,writeFileSync}from'node:fs';
import{resolve,extname}from'node:path';
import{once}from'node:events';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const cwd=resolve(import.meta.dirname,'../..');
const source='/home/master/projects/after-school-duel-r147-hotfix-20261114';
const output=resolve(import.meta.dirname,'evidence/r157-strict-lossless');
const expected=JSON.parse(readFileSync(resolve(output,'repack.json')));
const types={'.html':'text/html;charset=utf-8','.mjs':'text/javascript',
'.js':'text/javascript','.css':'text/css','.json':'application/json',
'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg',
'.webp':'image/webp','.woff2':'font/woff2'};
function serveRoot(which){
 const allowR157=which==='optimized';
 const server=createServer((req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost');
   const decoded=decodeURIComponent(url.pathname);
   const rel=decoded.replace(/^\/+/, '')+(decoded.endsWith('/')?'index.html':'');
   if(!rel||rel.split('/').includes('..'))throw Error('untrusted path');
   const newFile=resolve(cwd,rel),oldFile=resolve(source,rel);
   const okBranch=allowR157&&
    (rel==='r45-duel/r125-asset-fingerprints.js'||
     rel.startsWith('r45-duel/assets/summons/')&&rel.endsWith('.glb.gz'));
   const selected=okBranch&&existsSync(newFile)?newFile:oldFile;
   if(!selected.startsWith(source+'/')&&!selected.startsWith(cwd+'/'))
    throw Error('outside allowed sources');
   if(!existsSync(selected)||!statSync(selected).isFile()){
     res.writeHead(404);res.end('missing '+rel);return}
   res.writeHead(200,{'Content-Type':types[extname(selected)]||'application/octet-stream',
    'Content-Length':statSync(selected).size,'Cache-Control':'public,max-age=600'});
   createReadStream(selected).pipe(res);
  }catch(e){res.writeHead(500);res.end(String(e))}
 });
 return server;
}
const servers=[serveRoot('baseline'),serveRoot('optimized')];
for(const s of servers){s.listen(0,'127.0.0.1');await once(s,'listening')}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const results=[];
const order=process.env.R157_REVERSE==='1'?
 [['optimized',430,900,2],['baseline',430,900,2],['optimized',1280,720,1],['baseline',1280,720,1]]:
 [['baseline',1280,720,1],['optimized',1280,720,1],['baseline',430,900,2],['optimized',430,900,2]];
try{
 for(const [kind,width,height,dpr] of order){
  const port=servers[kind==='optimized'?1:0].address().port;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,
    hasTouch:width<600,isMobile:width<600,serviceWorkers:'allow'});
  const page=await context.newPage(),errors=[],responses=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{
   if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url());
   if(r.url().includes('.glb.gz'))responses.push(r.url().split('/').pop())});
  const start=Date.now();
  const url='http://127.0.0.1:'+port+'/r45-duel/?qa=1&seed=157';
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:65000});
  let loaded=true;
  try{await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:90000,polling:400})}
  catch(e){loaded=false;errors.push('ready '+String(e).slice(0,180))}
  let stats=null,combat=false,backfill=false;
  if(loaded){
   stats=await page.evaluate(()=>{
     const frame=document.querySelector('#stadium').contentWindow;
     const q=frame.__r45SceneQA;
     return {cards:window.__r45QA.cardCount,
       sceneReady:window.__r45QA.sceneReady,
       data:{...frame.__ASDC_LOAD_METRICS},
       summonModels:q.summonModels.length,
       sourceMatchesR22:q.sourceMatchesR22,
       cameraSafe:!q.r145ActionShot.enabled,
       sampleDrawCalls:q.drawCalls};
   });
   const board={player:[{uid:'U15701',id:'T01',hp:9,attack:4,shield:0}],
    ai:[{uid:'U15702',id:'E03',hp:8,attack:4,shield:0}]};
   await page.evaluate(v=>document.querySelector('#stadium').contentWindow.postMessage({
      type:'ASDC_R45_BOARD',units:v,player:['T01'],ai:['E03']},location.origin),board);
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
     .__r45SceneQA.summonPresence?.total===2,null,{timeout:15000});
   await page.evaluate(v=>document.querySelector('#stadium').contentWindow.postMessage({
     type:'ASDC_R51_COMBAT_EVENTS',pre:v,post:v,events:[
     {type:'exchange',serial:15701,side:'player',from:'T01',to:'E03',
      attacker_uid:'U15701',target_uid:'U15702',damage:1,
      target_hp_after:7,attacker_hp_after:9}]},location.origin),board);
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
      .__r45SceneQA.combatEvents?.active===true,null,{timeout:10000});
   combat=true;
   try{await page.waitForFunction(async()=>{
     const c=await caches.open('asdc-r125-immutable-models-v1');
     return (await c.keys()).length===16;
   },null,{timeout:30000,polling:400});backfill=true}
   catch(e){errors.push('cache backfill '+String(e).slice(0,130))}
   const cacheKeys=await page.evaluate(async()=>{
     const c=await caches.open('asdc-r125-immutable-models-v1');
     return (await c.keys()).map(req=>new URL(req.url).pathname.split('/').pop());
   });
   stats.cacheKeys=cacheKeys;
   await page.locator('#stadium').screenshot({path:resolve(output,`${kind}-${width}-r157-game.png`)});
  }
  const expectedBytes=kind==='optimized'?
   75569762-expected.saved_bytes:75569762;
  const pass=loaded&&combat&&backfill&&errors.length===0&&
    stats?.sceneReady&&stats?.cards===60&&
    stats?.sourceMatchesR22===true&&stats?.cameraSafe===true&&
    stats?.summonModels===12&&stats?.data?.modelsVerified===16&&
    stats?.data?.downloadedBytes===expectedBytes&&
    stats.cacheKeys.length===16;
  const result={kind,viewport:`${width}x${height}@${dpr}`,pass,
    elapsedMs:Date.now()-start,errors,stats,
    gzipRequests:responses.length,combat,backfill};
  results.push(result);
  console.log('R157_REAL_BROWSER_CASE',JSON.stringify({
   kind,viewport:result.viewport,pass:result.pass,elapsedMs:result.elapsedMs,
   bytes:stats?.data?.downloadedBytes,cards:stats?.cards,
   models:stats?.data?.modelsVerified,cache:stats?.cacheKeys?.length,
   combat,errors}));
  await page.close();await context.close();
 }
}finally{
 writeFileSync(resolve(output,process.env.R157_REVERSE==='1'?'browser-r157-reverse.json':'browser-r157.json'),
    JSON.stringify({results,losslessShaGuarantee:expected.gltf_binary_byte_identical},null,2));
 await browser.close();
 await Promise.all(servers.map(s=>new Promise(resolve=>s.close(resolve))));
}
if(results.some(x=>!x.pass))process.exitCode=2;
