/**
 * QA-only real Chrome 3D comparison. Full original R147 assets and page,
 * only scene.mjs and stadium.mjs are overlaid from this isolated branch.
 */
import{createRequire}from'node:module';
import{createServer}from'node:http';
import{createReadStream,existsSync,statSync,writeFileSync,mkdirSync}from'node:fs';
import{resolve,extname}from'node:path';
import{once}from'node:events';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'../..');
const source='/home/master/projects/after-school-duel-r147-hotfix-20261114';
const evidence='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r161-stadium';
mkdirSync(evidence,{recursive:true});
const mime={'.html':'text/html;charset=utf-8','.mjs':'text/javascript',
 '.js':'text/javascript','.css':'text/css','.json':'application/json',
 '.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg',
 '.webp':'image/webp','.woff2':'font/woff2'};
const overlay=new Set(['r45-duel/scene/scene.mjs','r45-duel/scene/stadium.mjs']);
const server=createServer((req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const rel=path.replace(/^\/+/, '')+(path.endsWith('/')?'index.html':'');
  if(!rel||rel.split('/').includes('..'))throw Error('unsafe path');
  const file=resolve(overlay.has(rel)?root:source,rel);
  if(!file.startsWith(root+'/')&&!file.startsWith(source+'/'))throw Error('out of scope');
  if(!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end('404 '+rel);return}
  res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream',
    'Content-Length':statSync(file).size,'Cache-Control':'no-store'});
  createReadStream(file).pipe(res);
 }catch(e){res.writeHead(500);res.end(String(e))}
});
server.listen(0,'127.0.0.1');await once(server,'listening');
const port=server.address().port;
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const viewport=process.env.R161_DEVICE==='mobile'?
 {width:430,height:900,dpr:2}:{width:1280,height:720,dpr:1};
const scenarios=process.env.R161_SCENARIOS?.split(',')||['baseline','batch','inset-off'];
if(process.env.R161_REVERSE==='1')scenarios.reverse();
const report={at:new Date().toISOString(),viewport,scenarios:[],modelSource:'Original R147 16 GLB/VRM'};
async function rafSamples(page,n){
 return await page.evaluate(async amount=>{
  const w=document.querySelector('#stadium').contentWindow;
  const samples=[];
  await new Promise(done=>{
   let last=0;
   const tick=now=>{
    if(last)samples.push(now-last);
    last=now;
    if(samples.length<amount)w.requestAnimationFrame(tick);else done();
   };
   w.requestAnimationFrame(tick);
  });
  samples.sort((a,b)=>a-b);
  const p=q=>samples[Math.min(samples.length-1,Math.floor((samples.length-1)*q))];
  return {n:samples.length,p50:p(.5),p95:p(.95),
   slow33:samples.filter(v=>v>33.3).length,
   slow50:samples.filter(v=>v>50).length};
 },n);
}
try{
 for(const name of scenarios){
  const batch=name==='batch',skipInset=name==='inset-off';
  const context=await browser.newContext({
   viewport:{width:viewport.width,height:viewport.height},
   deviceScaleFactor:viewport.dpr,isMobile:viewport.width<600,
   hasTouch:viewport.width<600,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-100))});
  const cdp=await context.newCDPSession(page);
  const rate=Number(process.env.R161_CPU_RATE||'2');
  if(rate>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate});
  const q=new URLSearchParams({qa:'1',seed:'161',r161Profile:'on',
   r161StadiumBatch:batch?'on':'off',r161Inset:skipInset?'off':'on'});
  const url='http://127.0.0.1:'+port+'/r45-duel/?'+q;
  const t=Date.now();
  let ready=true;
  try{
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
    {timeout:95000,polling:400});
  }catch(e){ready=false;errors.push('ready '+String(e).slice(0,170))}
  let idle=null,active=null,combat=null,snapshot=null;
  if(ready){
   idle=await rafSamples(page,90);
   const units={player:[{uid:'U16101',id:'T01',hp:9,attack:4,shield:0}],
    ai:[{uid:'U16102',id:'E03',hp:8,attack:4,shield:0}]};
   await page.evaluate(u=>{
    const f=document.querySelector('#stadium').contentWindow;
    f.postMessage({type:'ASDC_R45_BOARD',units:u,player:['T01'],ai:['E03']},location.origin);
    f.postMessage({type:'ASDC_R46_CARD_PLAY',serial:16101,side:'player',id:'E03',kind:'unit'},location.origin);
   },units);
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.duelistAction.player.kind==='unit',null,{timeout:7000});
   active=await rafSamples(page,130);
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R51_COMBAT_EVENTS',pre:u,post:u,
    events:[{type:'exchange',serial:16102,side:'player',from:'T01',to:'E03',
     attacker_uid:'U16101',target_uid:'U16102',damage:1,
     target_hp_after:7,attacker_hp_after:9}]},location.origin),units);
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
     .__r45SceneQA.combatEvents?.active===true,null,{timeout:10000});
   combat=await rafSamples(page,90);
   snapshot=await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
    return {
     cards:window.__r45QA.cardCount,
     modelsVerified:f.__ASDC_LOAD_METRICS.modelsVerified,
     receivedBytes:f.__ASDC_LOAD_METRICS.downloadedBytes,
     summonCount:q.summonModels.length,sourceIdentity:q.sourceMatchesR22,
     cameraSafe:!q.r145ActionShot.enabled,
     phase:q.phase,active:q.active,
     combat:q.combatEvents,
     stadium:q.stadium,
     r161:q.r161RenderProfile,
     currentDraws:q.drawCalls,
     heroLens:q.heroLens};
   });
   await page.locator('#stadium').screenshot({path:resolve(evidence,
    name+'-'+viewport.width+'-combat.png')});
  }
  const audit=snapshot?.stadium?.r161Batching;
  const success=!!ready&&errors.length===0&&snapshot?.cards===60&&
   snapshot.modelsVerified===16&&snapshot.receivedBytes===75569762&&
   snapshot.summonCount===12&&snapshot.sourceIdentity&&snapshot.cameraSafe&&
   snapshot.combat?.playedEvents>=1&&audit?.enabled===batch&&
   (batch?(audit.nominalSavedDraws===48&&audit.checksPassed===53&&
    audit.groups.length===5):audit.nominalSavedDraws===0)&&
   snapshot.r161.enabled&&snapshot.r161.qaInsetSkipped===skipInset&&
   (skipInset?snapshot.r161.scenesWithInset===0:
    snapshot.r161.scenesWithInset>0&&snapshot.r161.insetDrawCalls.samples>0);
  const entry={name,success,elapsedMs:Date.now()-t,errors,idle,active,combat,snapshot};
  report.scenarios.push(entry);
  console.log('R161_BROWSER_CASE',JSON.stringify({name,success,elapsedMs:entry.elapsedMs,
   heroFrames:snapshot?.r161?.scenesWithInset,
   mainCpu:snapshot?.r161?.mainCpuSubmissionMs,
   insetCpu:snapshot?.r161?.insetCpuSubmissionMs,
   mainDraws:snapshot?.r161?.mainDrawCalls,
   insetDraws:snapshot?.r161?.insetDrawCalls,
   rAFActive:active,nominalDrawSaved:audit?.nominalSavedDraws,
   currentDraws:snapshot?.currentDraws,errors
  }));
  await page.close();await context.close();
 }
}finally{
 writeFileSync(resolve(evidence,'r161-'+viewport.width+'-'+
 (process.env.R161_REVERSE==='1'?'reverse':'forward')+'.json'),
 JSON.stringify(report,null,2));
 await browser.close();server.close();
}
if(report.scenarios.some(s=>!s.success))process.exitCode=2;
