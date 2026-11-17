/**
 * Same real public R147 assets and 3D game, served locally from a layered static
 * test server with exactly TWO patched JS modules. No remote changes.
 * QA gates all scheduler changes; renderer meshes, GLBs, textures, actions untouched.
 */
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {createReadStream,existsSync,statSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {once} from 'node:events';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'../..');
const original='/home/master/projects/after-school-duel-r147-hotfix-20261114';
const evidence='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r158-scheduler';
mkdirSync(evidence,{recursive:true});
const mime={'.html':'text/html;charset=utf-8','.mjs':'text/javascript',
 '.js':'text/javascript','.css':'text/css','.json':'application/json',
 '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg',
 '.webp':'image/webp','.woff2':'font/woff2'};
const patched=new Set(['r45-duel/scene/scene.mjs','r45-duel/scene/summon-models.mjs']);
const server=createServer((req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const rel=path.replace(/^\/+/, '')+(path.endsWith('/')?'index.html':'');
  if(!rel||rel.split('/').includes('..'))throw Error('unsafe path');
  const file=resolve(patched.has(rel)?root:original,rel);
  if(!file.startsWith(root+'/')&&!file.startsWith(original+'/'))throw Error('out of scope');
  if(!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end('missing '+rel);return}
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
   'Content-Length':statSync(file).size,'Cache-Control':'no-store'});
  createReadStream(file).pipe(res);
 }catch(e){res.writeHead(500);res.end(String(e))}
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const port=server.address().port;
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const scenarios=(process.env.R158_SCENARIOS||
 'canonical:4,largest-first:4,largest-first:6,canonical:6').split(',').map(x=>{
 const [schedule,concurrency]=x.split(':');return{schedule,concurrency:Number(concurrency)}});
const device=process.env.R158_DEVICE==='mobile'?'mobile':'desktop';
const throttle=process.env.R158_THROTTLE!=='off';
const rate=Number(process.env.R158_DOWN_BPS||'10000000');
const slowdown=Number(process.env.R158_CPU_RATE||'2');
const result={date:new Date().toISOString(),device,throttle,
 rateBytesPerSecond:rate,cpuSlowdown:slowdown,scenarios:[]};
try{
 for(const test of scenarios){
  const mobile=device==='mobile';
  const context=await browser.newContext({
   viewport:mobile?{width:430,height:900}:{width:1280,height:720},
   deviceScaleFactor:mobile?2:1,hasTouch:mobile,isMobile:mobile,
   serviceWorkers:'block'
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message.slice(0,250)));
  page.on('requestfailed',req=>errors.push('NET '+req.url().slice(-90)+' '+req.failure()?.errorText));
  page.on('response',res=>{if(res.status()>=400)errors.push('HTTP '+res.status()+' '+res.url().slice(-80))});
  const cdp=await context.newCDPSession(page);
  await cdp.send('Network.enable');
  if(throttle)await cdp.send('Network.emulateNetworkConditions',{
   offline:false,latency:35,downloadThroughput:rate,uploadThroughput:rate/2});
  if(slowdown>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate:slowdown});
  const query=new URLSearchParams({qa:'1',seed:'158',r125Cache:'off',
    r158Schedule:test.schedule,r158Concurrency:String(test.concurrency)});
  const url='http://127.0.0.1:'+port+'/r45-duel/?'+query;
  const start=Date.now();
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  let ready=true;
  try{await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{
    timeout:process.env.R158_FAST?'50000':'120000',polling:400})}
  catch(e){ready=false;errors.push('sceneReady '+String(e).slice(0,150))}
  let data=null;
  if(ready){
   data=await page.evaluate(()=>{
    const frame=document.querySelector('#stadium').contentWindow;
    const q=frame.__r45SceneQA;
    const info=frame.__ASDC_R158_LOAD_SCHEDULE;
    return{cards:window.__r45QA.cardCount,
      model:frame.__ASDC_LOAD_METRICS?{...frame.__ASDC_LOAD_METRICS}:null,
      schedule:info?{...info}:null,
      summonCount:q.summonModels.length,
      sources:q.sourceMatchesR22,
      cameraSafe:q.r145ActionShot.enabled===false,
      renderCalls:q.drawCalls};
   });
  }
  let battle=false;
  if(ready){
   const units={player:[{uid:'U15801',id:'T01',hp:9,attack:4,shield:0}],
    ai:[{uid:'U15802',id:'E03',hp:8,attack:4,shield:0}]};
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage({
      type:'ASDC_R45_BOARD',units:u,player:['T01'],ai:['E03']},location.origin),units);
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
     .__r45SceneQA.summonPresence?.total===2,null,{timeout:15000});
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R51_COMBAT_EVENTS',pre:u,post:u,
    events:[{type:'exchange',serial:15801,side:'player',from:'T01',to:'E03',
      attacker_uid:'U15801',target_uid:'U15802',damage:1,
      target_hp_after:7,attacker_hp_after:9}]},location.origin),units);
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
     .__r45SceneQA.combatEvents?.active===true,null,{timeout:12000});
   battle=true;
  }
  const success=ready&&battle&&errors.length===0&&
   data?.cards===60&&data?.summonCount===12&&
   data?.sources===true&&data?.cameraSafe===true&&
   data?.model?.modelsVerified===16&&
   data?.model?.downloadedBytes===75569762&&
   data?.schedule?.schedule===test.schedule&&
   data?.schedule?.concurrency===test.concurrency&&
   data?.schedule?.completed?.length===12;
  const sample={...test,pass:success,elapsedMs:Date.now()-start,
   errors,downloadedBytes:data?.model?.downloadedBytes,
   firstFrameReadyMs:data?.model?.firstFrameReadyMs,
   allModelsReadyMs:data?.model?.modelReadyMs,
   completion:data?.schedule?.completed,
   renderCalls:data?.renderCalls,combat:battle};
  result.scenarios.push(sample);
  console.log('R158_SCHEDULER_CASE',JSON.stringify({
   schedule:sample.schedule,concurrency:sample.concurrency,
   pass:success,elapsedMs:sample.elapsedMs,
   modelReadyMs:sample.allModelsReadyMs,firstFrameReadyMs:sample.firstFrameReadyMs,
   errors:errors.length,completion:sample.completion?.slice(-4)
  }));
  await page.close();await context.close();
 }
}finally{
 writeFileSync(resolve(evidence,
  'r158-'+device+'-'+(process.env.R158_REVERSE==='1'?'reverse':'forward')+'.json'),JSON.stringify(result,null,2));
 await browser.close();server.close();
}
console.log('R158_RUN_COMPLETE',JSON.stringify({device,passed:result.scenarios.filter(x=>x.pass).length,
 total:result.scenarios.length,models:result.scenarios.map(x=>({
 key:x.schedule+':'+x.concurrency,ready:x.allModelsReadyMs,firstFrame:x.firstFrameReadyMs}))}));
if(result.scenarios.some(x=>!x.pass))process.exitCode=2;
