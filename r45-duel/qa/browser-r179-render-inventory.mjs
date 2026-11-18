import {createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out=resolve(import.meta.dirname,'evidence/r179-sculpted-props');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 page.on('pageerror',e=>errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:18679/r45-duel/?qa=1&seed=173&r169SchoolMagic=on&r172BatchStatic=on&r175HeroE06=on&r178HeroK01=on&r179HeroK07=on',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:110000});
 await page.waitForTimeout(350);
 const report=await page.evaluate(()=>{
  const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
  return{sourceModels:f.__ASDC_LOAD_METRICS.modelsVerified,
   originalBytes:f.__ASDC_LOAD_METRICS.downloadedBytes,
   render:q.r179RenderInventory,
   authored:q.r169SchoolMagic.authoredHighDetailAssets};
 });
 report.errors=errors;
 report.pass=errors.length===0&&report.sourceModels===16&&
  report.render.drawCallsLastFrame>0&&report.authored.length===3;
 writeFileSync(resolve(out,'r179-render-inventory.json'),JSON.stringify(report,null,2));
 console.log('R179_RENDER_INVENTORY',JSON.stringify({pass:report.pass,
  drawCalls:report.render.drawCallsLastFrame,meshCount:report.render.estimatedMeshes,
  roots:report.render.roots.slice(0,10),errors:report.errors}));
 await page.close();
}finally{await browser.close()}
