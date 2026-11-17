import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {basename,resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'../assets/model');
const original=resolve('/home/master/projects/after-school-duel-r147-hotfix-20261114/r45-duel/assets/model');
const sceneSource=readFileSync(resolve(import.meta.dirname,'../scene/scene.mjs'),'utf8');
const output='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118';
const variants=process.env.ASDC_R155_REVERSE==='1'?
 ['r155-lite','baseline']:['baseline','r155-lite'];
const report={at:new Date().toISOString(),name:'R155 runtime-asset structural preservation + real Chrome game readiness',variants:[]};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage',
 '--autoplay-policy=no-user-gesture-required'
]});
try{
 for(const name of variants){
  const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],routed=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await page.route('**/r45-duel/scene/scene.mjs*',route=>route.fulfill({
    status:200,body:sceneSource,contentType:'text/javascript'}));
  // Both original and lite VRMs are fulfilled from the SAME local SSD,
  // making this a model content / load contract comparison, not a CDN race.
  await page.route('**/r45-duel/assets/model/*.vrm*',route=>{
    const uri=new URL(route.request().url()),file=basename(uri.pathname);
    const lite=file.endsWith('-R155-Runtime.vrm');
    const path=resolve(lite?root:original,file);
    routed.push({file,lite});
    return route.fulfill({path,status:200,contentType:'application/octet-stream'});
  });
  const u='https://star8592.github.io/AfterSchoolDuelClub-Playtest/r45-duel/?qa=1&seed=155&r125Cache=off'+
    (name==='r155-lite'?'&r155VrmLite=on':'');
  const start=Date.now();
  await page.goto(u,{waitUntil:'domcontentloaded',timeout:80000});
  let ready=true;
  try{await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:95000,polling:500})}
  catch(e){ready=false;errors.push(String(e))}
  const info=await page.evaluate(()=>{
    const f=document.querySelector('#stadium')?.contentWindow;
    const q=f?.__r45SceneQA,m=f?.__ASDC_LOAD_METRICS;
    return {
      ready:window.__r45QA?.sceneReady??null,
      twelveModels:q?.summonModels?.length,
      sourceMatchesR22:q?.sourceMatchesR22??null,
      realDuelists:q?.duelistHosts?.map(x=>({id:x.id,bones:x.bones,source:x.source})),
      lite:q?.runtimeVrmLite,
      load:m?{...m}:null,
      draws:q?.drawCalls,sceneError:window.__r45QA?.sceneError,
      r147Camera:q?.r145ActionShot?.enabled
    };
  });
  const good=ready&&info.twelveModels===12&&info.load?.modelsVerified===16&&
    info.lite===(name==='r155-lite')&&info.sceneError===false&&
    info.r147Camera===false&&errors.length===0&&routed.length===4;
  const sample={name,ready,good,elapsedMs:Date.now()-start,errors,info,routed};
  report.variants.push(sample);
  await page.screenshot({path:resolve(output,name+'-r155-vrm.png')});
  console.log('R155_BROWSER_CASE',JSON.stringify(sample));
  await page.close();await context.close();
 }
}finally{
  writeFileSync(resolve(output,process.env.ASDC_R155_REVERSE==='1'?'r155-vrm-browser-reverse.json':'r155-vrm-browser.json'),JSON.stringify(report,null,2));
  await browser.close();
}
console.log('R155_BROWSER_COMPLETE',JSON.stringify(report.variants.map(x=>({name:x.name,good:x.good,ready:x.ready,downloadedBytes:x.info.load?.downloadedBytes,firstFrameReadyMs:x.info.load?.firstFrameReadyMs,errors:x.errors.length}))));
if(report.variants.some(x=>!x.good))process.exitCode=2;
