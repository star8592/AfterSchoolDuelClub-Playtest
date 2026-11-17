import{createRequire}from'node:module';
import{createServer}from'node:http';
import{createReadStream,existsSync,statSync,writeFileSync}from'node:fs';
import{resolve,join,extname,normalize}from'node:path';
import{once}from'node:events';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'../..');
const fallback=process.env.ASDC_R155_BASE_ROOT||
 '/home/master/projects/after-school-duel-r147-hotfix-20261114';
const evidence='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118';
const errors=[];
const kinds={'.html':'text/html;charset=utf-8','.mjs':'text/javascript',
 '.js':'text/javascript','.css':'text/css','.json':'application/json',
 '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg',
 '.webp':'image/webp','.woff2':'font/woff2'};
const server=createServer((req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const rel=path.replace(/^\/+/, '')+(path.endsWith('/')?'index.html':'');
  if(!rel||rel.split('/').includes('..'))throw Error('unsafe path');
  const preferred=resolve(root,rel);
  const p=existsSync(preferred)?preferred:resolve(fallback,rel);
  if(!p.startsWith(root+'/')&&!p.startsWith(resolve(fallback)+'/'))throw Error('out of scope');
  if(!existsSync(p)||!statSync(p).isFile()){
   res.writeHead(404);res.end('404 '+rel);return;
  }
  res.writeHead(200,{'Content-Type':kinds[extname(p)]||'application/octet-stream',
   'Content-Length':statSync(p).size,'Cache-Control':'public,max-age=600'});
  createReadStream(p).pipe(res);
 }catch(e){res.writeHead(500);res.end(String(e))}
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const port=server.address().port;
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const cases=[];
try{
 for(const lite of [false,true]){
  const ctx=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'allow'});
  const page=await ctx.newPage(),fail=[];
  page.on('pageerror',e=>fail.push(e.message));
  page.on('response',r=>{if(r.status()>=400)fail.push('HTTP '+r.status()+' '+r.url())});
  const url='http://127.0.0.1:'+port+'/r45-duel/?qa=1&seed=155'+(lite?'&r155VrmLite=on':'');
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:85000});
  let backfill=false;
  try{
   await page.waitForFunction(async()=>{
    const c=await caches.open('asdc-r125-immutable-models-v1');
    return (await c.keys()).length>=16;
   },null,{timeout:60000,polling:400});
   backfill=true;
  }catch(e){fail.push('backfill: '+String(e).slice(0,120))}
  const current=await page.evaluate(async()=>{
   const c=await caches.open('asdc-r125-immutable-models-v1');
   const keys=(await c.keys()).map(x=>new URL(x.url).pathname.split('/').pop());
   const frame=document.querySelector('#stadium').contentWindow;
   return{
    parentReady:window.__r45QA.sceneReady,
    currentModels:frame.__r45SceneQA?.summonModels.length,
    variant:frame.__r45SceneQA?.runtimeVrmLite,
    downloadedBytes:frame.__ASDC_LOAD_METRICS.downloadedBytes,
    keys
   };
  });
  const safety=await page.evaluate(()=>{
    const q=window.__r45QA,scene=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return {cards:q?.cardCount,cam:scene?.r145ActionShot?.enabled,
      models:scene?.summonModels?.map(x=>({id:x.id,file:x.file})),
      sourceIdentity:scene?.sourceMatchesR22,errors:q?.sceneError};
  });
  const units={player:[{uid:'U15501',id:'E03',hp:8,attack:4,shield:0}],
    ai:[{uid:'U15502',id:'T04',hp:8,attack:4,shield:0}]};
  await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage(
    {type:'ASDC_R45_BOARD',units:u,player:['E03'],ai:['T04']},location.origin),units);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.summonPresence?.total===2,null,{timeout:15000});
  await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage(
    {type:'ASDC_R51_COMBAT_EVENTS',pre:u,post:u,
      events:[{type:'exchange',serial:15501,side:'player',from:'E03',to:'T04',
        attacker_uid:'U15501',target_uid:'U15502',damage:1,
        target_hp_after:7,attacker_hp_after:8}]},location.origin),units);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.combatEvents?.active===true,null,{timeout:15000});
  const combat=true;
  const normal=current.keys.filter(x=>x.endsWith('.vrm')&&!x.includes('-R155-Runtime.vrm'));
  const alt=current.keys.filter(x=>x.includes('-R155-Runtime.vrm'));
  const ok=current.parentReady&&safety.cards===60&&safety.cam===false&&
   safety.sourceIdentity===true&&safety.errors===false&&combat&&
   safety.models?.length===12&&current.currentModels===12&&
   current.variant===lite&&current.keys.length===16&&
   (lite?alt.length===4&&normal.length===0:normal.length===4&&alt.length===0)&&
   fail.length===0&&backfill;
  const out={lite,backfill,ok,errors:fail,safety:{cards:safety.cards,
   r147Cam:safety.cam,sourceIdentity:safety.sourceIdentity,combat},metrics:{modelCount:current.currentModels,
   bytes:current.downloadedBytes,cached:current.keys.length,originalVRMs:normal.length,
   runtimeVRMs:alt.length}};
  cases.push(out);
  console.log('R155_SERVICE_WORKER_VARIANT',JSON.stringify(out));
  await page.close();await ctx.close();
 }
}finally{
 writeFileSync(resolve(evidence,'r155-cache-variant.json'),JSON.stringify({cases},null,2));
 await browser.close();server.close();
}
if(cases.some(x=>!x.ok))process.exitCode=2;
