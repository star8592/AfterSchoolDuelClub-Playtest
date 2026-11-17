/**
 * Same original public-safe R147 Web game, QA-only code change limited to
 * stadium-audience.mjs and scene.mjs, with identical 16 models, 60 cards,
 * playback and R147 safety gates.
 */
import{createRequire}from'node:module';
import{createServer}from'node:http';
import{createReadStream,existsSync,statSync,writeFileSync,mkdirSync}from'node:fs';
import{resolve,extname}from'node:path';
import{once}from'node:events';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const cwd=resolve(import.meta.dirname,'../..');
const canonical='/home/master/projects/after-school-duel-r147-hotfix-20261114';
const out='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r160-frames';
mkdirSync(out,{recursive:true});
const mime={'.html':'text/html;charset=utf-8','.mjs':'text/javascript',
'.js':'text/javascript','.css':'text/css','.json':'application/json',
'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg',
'.webp':'image/webp','.woff2':'font/woff2'};
const mods=new Set(['r45-duel/scene/scene.mjs']);
const server=createServer((req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const rel=path.replace(/^\/+/, '')+(path.endsWith('/')?'index.html':'');
  if(!rel||rel.split('/').includes('..'))throw Error('unsafe path');
  const file=resolve(mods.has(rel)?cwd:canonical,rel);
  if(!file.startsWith(cwd+'/')&&!file.startsWith(canonical+'/'))throw Error('out of scope');
  if(!existsSync(file)||!statSync(file).isFile()){
   res.writeHead(404);res.end('missing '+rel);return
  }
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
const configs=(process.env.R160_ORDER==='reverse'?[true,false]:[false,true]);
const viewport=process.env.R160_DEVICE==='mobile'?
 {width:430,height:900,dpr:2}:{width:1280,height:720,dpr:1};
const results=[];
async function sampleFrames(page,number=120){
 return await page.evaluate(async count=>{
  const w=document.querySelector('#stadium').contentWindow;
  const samples=[];
  await new Promise(resolve=>{
   let prev=0;
   const tick=now=>{
    if(prev)samples.push(now-prev);
    prev=now;
    if(samples.length<count)w.requestAnimationFrame(tick);else resolve();
   };
   w.requestAnimationFrame(tick);
  });
  samples.sort((a,b)=>a-b);
  const percentile=q=>samples[Math.min(samples.length-1,Math.floor(q*(samples.length-1)))];
  return {count:samples.length,p50:percentile(.5),p90:percentile(.90),
   p95:percentile(.95),p99:percentile(.99),slow33:samples.filter(x=>x>33.3).length,
   slow50:samples.filter(x=>x>50).length};
 },number);
}
try{
 for(const enabled of configs){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},
   deviceScaleFactor:viewport.dpr,
   isMobile:viewport.width<600,hasTouch:viewport.width<600,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const cdp=await context.newCDPSession(page);
  const cpu=Number(process.env.R160_CPU_RATE||'2');
  if(cpu>1)await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
  const u='http://127.0.0.1:'+port+'/r45-duel/?qa=1&seed=160&r160FrameCache='+
   (enabled?'on':'off');
  await page.goto(u,{waitUntil:'domcontentloaded',timeout:65000});
  let ready=true;
  try{await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
    {timeout:85000,polling:400})}
  catch(e){errors.push('READY '+String(e).slice(0,150));ready=false}
  let idle=null,active=null,state=null;
  if(ready){
   await page.evaluate(()=>{
    const w=document.querySelector('#stadium').contentWindow;
    const impact=w.document.getElementById('impact');
    const portrait=w.document.getElementById('hero-portrait-frame');
    const caption=w.document.getElementById('hero-portrait-caption');
    w.__r160MutationCounts={impact:0,portrait:0,caption:0};
    const obs=new w.MutationObserver(records=>{
     for(const record of records){
      const target=record.target;
      if(target===impact)w.__r160MutationCounts.impact++;
      else if(target===portrait)w.__r160MutationCounts.portrait++;
      else if(target===caption)w.__r160MutationCounts.caption++;
     }
    });
    obs.observe(impact,{attributes:true,childList:true,subtree:false});
    if(portrait)obs.observe(portrait,{attributes:true,childList:true,subtree:false});
    if(caption)obs.observe(caption,{attributes:true,childList:true,subtree:false});
    w.__r160Observer=obs;
   });
   idle=await sampleFrames(page,90);
   const units={player:[{uid:'U16001',id:'T01',hp:9,attack:4,shield:0}],
    ai:[{uid:'U16002',id:'E03',hp:8,attack:4,shield:0}]};
   await page.evaluate(u=>{
    const f=document.querySelector('#stadium').contentWindow;
    f.postMessage({type:'ASDC_R45_BOARD',units:u,player:['T01'],ai:['E03']},location.origin);
    f.postMessage({type:'ASDC_R46_CARD_PLAY',serial:16001,side:'player',id:'E03',kind:'unit'},location.origin);
   },units);
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
     .__r45SceneQA.duelistAction.player.kind==='unit',null,{timeout:6000});
   active=await sampleFrames(page,175);
   await page.evaluate(u=>{
    const f=document.querySelector('#stadium').contentWindow;
    f.postMessage({type:'ASDC_R51_COMBAT_EVENTS',pre:u,post:u,
     events:[{type:'exchange',serial:16002,side:'player',from:'T01',to:'E03',
      attacker_uid:'U16001',target_uid:'U16002',damage:1,
      target_hp_after:7,attacker_hp_after:9}]},location.origin);
   },units);
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.combatEvents.active===true,null,{timeout:7000});
   const combat=await sampleFrames(page,110);
   state=await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
    return {cards:window.__r45QA.cardCount,
     modelsVerified:f.__ASDC_LOAD_METRICS.modelsVerified,
     bytes:f.__ASDC_LOAD_METRICS.downloadedBytes,
     draws:q.drawCalls,actors:q.duelistHosts.length,
     cameraSafe:q.r145ActionShot.enabled===false,
     originals:q.sourceMatchesR22,
     combat:q.combatEvents,
     spectator:q.stadiumAmbience.audience,
     dom:q.r160DOMCache,
     domTexts:{
      impact:f.document.getElementById('impact')?.textContent,
      caption:f.document.getElementById('hero-portrait-caption')?.textContent
     },
     mutations:{...f.__r160MutationCounts},heroLens:q.heroLens};
   });
   state.frameSamples={idle,active,combat};
   await page.locator('#stadium').screenshot({
    path:resolve(out,(enabled?'optimized':'baseline')+'-'+viewport.width+'-combat.png')});
  }
  const success=ready&&state&&errors.length===0&&state.cards===60&&
   state.modelsVerified===16&&state.bytes===75569762&&
   state.cameraSafe&&state.originals&&state.combat?.playedEvents>=1&&
   state.dom.enabled===enabled&&
   (enabled?state.dom.skippedWrites>100:state.dom.skippedWrites===0);
  const result={enabled,success,viewport:viewport.width,errors,state};
  results.push(result);
  console.log('R160_FRAME_CASE',JSON.stringify({
   enabled,success,viewport:viewport.width,errors,
   idle,active,combat:state?.frameSamples?.combat,
   writes:state?.dom?.skippedWrites,
   mutations:state?.mutations,draws:state?.draws,heroLens:state?.heroLens?.frames
  }));
  await page.close();await context.close();
 }
}finally{
 writeFileSync(resolve(out,'r160-'+viewport.width+'-'+
  (process.env.R160_ORDER==='reverse'?'reverse':'forward')+'.json'),
  JSON.stringify({viewport,results},null,2));
 await browser.close();server.close();
}
if(results.some(x=>!x.success))process.exitCode=2;
