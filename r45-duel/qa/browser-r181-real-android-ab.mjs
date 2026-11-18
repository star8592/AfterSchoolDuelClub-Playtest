/** A genuine Android Chrome DevTools session over USB ADB. Nothing simulated.
 * Attaches only to the Android page opened by this project's QA; unrelated
 * browser tabs, accounts and apps are never read or modified.
 */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const state=process.env.R181_BATCH==='on'?'on':'off';
const full=process.env.R181_ANDROID_FULL==='on';
const out=resolve(import.meta.dirname,'evidence/r181-real-android',state+(full?'-full':'-core'));
mkdirSync(out,{recursive:true});
const errors=[];
const report={batch:state,full,device:'Samsung SM-G9910 Android 15 Chrome 157 genuine GPU',
 remoteDebug:'ADB USB CDP, no simulator',errors,pass:false};
const browser=await chromium.connectOverCDP('http://127.0.0.1:19222',{timeout:20000});
try{
 const ctx=browser.contexts()[0];
 if(!ctx)throw Error('Android Chrome CDP has no browser context');
 const tab=ctx.pages().find(p=>p.url().includes('/r181-android-gpu-preflight.html'))||
  ctx.pages().find(p=>p.url().startsWith('http://127.0.0.1:18681/r45-duel/?'));
 if(!tab)throw Error('Only the requested dedicated duel QA tab may be used');
 tab.on('pageerror',e=>errors.push('JS '+e.message));
 tab.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-85))});
 const params=new URLSearchParams({qa:'1',seed:'173',
  r180StadiumBatch:'on',r181HairBatch:state,r122Crowd:'off'});
 if(full){
  params.set('r169SchoolMagic','on');
  params.set('r175HeroE06','on');
  params.set('r178HeroK01','on');
  params.set('r179HeroK07','on');
  params.set('r172BatchStatic','on');
 }
 const target='http://127.0.0.1:18681/r45-duel/?'+params;
 report.testUrl=target;
 const begin=Date.now();
 await tab.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
 await tab.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{
  timeout:145000,polling:500});
 report.wallToReadyMs=Date.now()-begin;
 report.sample=await tab.evaluate(async()=>{
  const iframe=document.querySelector('#stadium')?.contentWindow;
  const qa=iframe?.__r45SceneQA;
  if(!qa)throw Error('Scene QA API is inaccessible on real Android');
  const gl=iframe.document.querySelector('canvas')?.getContext('webgl2')||
   iframe.document.querySelector('canvas')?.getContext('webgl');
  let gpu=null;
  if(gl){
   const debug=gl.getExtension('WEBGL_debug_renderer_info');
   gpu=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
  }
  const intervals=[];
  // rAF timestamps and performance.now can differ on some Android Chrome
  // timing paths. Use consecutive rAF callbacks with the same timebase.
  let last=await new Promise(resolve=>requestAnimationFrame(resolve));
  for(let i=0;i<130;i++){
   const now=await new Promise(resolve=>requestAnimationFrame(resolve));
   intervals.push(now-last);last=now;
  }
  intervals.sort((a,b)=>a-b);
  const avg=intervals.reduce((a,b)=>a+b,0)/intervals.length;
  return {
   userAgent:navigator.userAgent,devicePixelRatio:devicePixelRatio,
   screen:{innerWidth,innerHeight,screenWidth:screen.width,screenHeight:screen.height},
   gpu,
   scene:qa.r179RenderInventory,
   stadiumBatch:qa.r180StadiumBatch,
   hairBatch:qa.r181HairBatch,
   modelsVerified:iframe.__ASDC_LOAD_METRICS?.modelsVerified,
   sourceBytes:iframe.__ASDC_LOAD_METRICS?.downloadedBytes,
   authored:qa.r169SchoolMagic?.authoredHighDetailAssets,
   frameSample130:{avgMs:+avg.toFixed(2),minMs:+intervals[0].toFixed(2),
    medianMs:+intervals[65].toFixed(2),
    p95Ms:+intervals[Math.floor(intervals.length*.95)].toFixed(2),
    p99Ms:+intervals[Math.floor(intervals.length*.99)].toFixed(2),
    maxMs:+intervals.at(-1).toFixed(2)}
  };
 });
 await tab.screenshot({path:resolve(out,'s21-real-android.png')});
 report.pass=errors.length===0&&report.sample.modelsVerified===16&&
  report.sample.sourceBytes===75569762&&
  report.sample.stadiumBatch.enabled===true&&
  report.sample.hairBatch.enabled===(state==='on')&&
  report.sample.scene.drawCallsLastFrame>0;
 console.log('R181_REAL_ANDROID',JSON.stringify({pass:report.pass,
  state,wallToReadyMs:report.wallToReadyMs,gpu:report.sample.gpu,
  sceneCalls:report.sample.scene.drawCallsLastFrame,
  frames:report.sample.frameSample130,
  models:report.sample.modelsVerified,
  errors}));
}catch(e){
 report.failure=String(e);
 errors.push(String(e));
 console.log('R181_ANDROID_GAME_FAILURE',JSON.stringify({batch:state,full,error:String(e)}));
}finally{
 writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
if(!report.pass)process.exitCode=2;
