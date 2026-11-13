import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11436';
const actor=process.env.ASDC_R131_ACTOR||'E04';
const baked=process.env.ASDC_R131_BAKED==='on';
const rawMode=process.env.ASDC_R131_RAW==='on';
const directory=baked?(rawMode?'turntable-baked-raw':'turntable-baked-acting'):
 rawMode?(process.env.ASDC_R131_REBIND==='on'?'turntable-raw-rebound':'turntable-raw'):
 'turntable';
const dir=resolve(import.meta.dirname,'evidence/r131',directory);
mkdirSync(dir,{recursive:true});
const report={actor,origin,images:[],errors:[]};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:850}});
 page.on('pageerror',e=>report.errors.push(e.message));
 const raw=rawMode;
 await page.goto(origin+'/r45-duel/?qa=1&seed=131&r119Rig='+actor+
  (baked?'&r131BakedRest=on':'')+
  (raw?'&r131RawPose=on'+(process.env.ASDC_R131_REBIND==='on'?'&r131RestRebind=on':''):
   '&r128Body=on&r129Body=on&r130Body=on&r131Arms=on'),
 {waitUntil:'domcontentloaded',timeout:85000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:210000});
 await page.evaluate(id=>document.querySelector('#stadium').contentWindow.postMessage({
  type:'ASDC_R45_BOARD',player:[id],ai:[],
  units:{player:[{id,uid:'U13171',hp:5,attack:3,shield:0}],ai:[]}},location.origin),actor);
 await page.waitForFunction(id=>document.querySelector('#stadium').contentWindow.__r45SceneQA
  .summonPresence.entries.some(x=>x.id===id),actor,{timeout:26000});
 const study=(fn,args)=>page.evaluate(([name,params])=>{
  return document.querySelector('#stadium').contentWindow.__r45SceneQA[name](...params);
 },[fn,args]);
 await study('setStudyCloseup',[actor]);
 if(!raw)await study('studyAction',[actor,'idle']);
 for(const angle of [0,90,180,270]){
  await study('setStudyViewAngle',[angle]);
  await page.waitForTimeout(290);
  const a=await page.evaluate(id=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return q.summonPresence.entries.find(x=>x.id===id);
  },actor);
  const img=resolve(dir,actor+'-angle-'+angle+'.png');
  await page.screenshot({path:img});
  report.images.push({angle,img,frontDot:a.metrics.frontDot,
   minY:a.metrics.minY,withinFrame:a.metrics.withinFrame,
   ndc:a.metrics.ndcBounds,
   modelSource:await page.evaluate(id=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.summonModels.find(x=>x.id===id)?.file,actor)});
 }
 await page.close();
}catch(e){report.errors.push(String(e))}
finally{await browser.close();}
writeFileSync(resolve(dir,actor+'-turntable.json'),JSON.stringify(report,null,2));
console.log('R131_TURNTABLE',JSON.stringify({actor,angles:report.images.map(x=>x.angle),
 errors:report.errors}));
if(report.errors.length)process.exitCode=1;
