import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.R68_ORIGIN||'http://127.0.0.1:11087';
const folder=process.env.R68_PATH||'/r68-t02-fit/';
const output=resolve(import.meta.dirname,'evidence');mkdirSync(output,{recursive:true});
let browser,failed=false;const results=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
 for(const model of ['round','chef','mpfb']){
  for(const [device,width,height] of [['desktop',1440,900],['portrait',430,900]]){
   const page=await browser.newPage({viewport:{width,height}});
   const errors=[];page.on('pageerror',e=>errors.push('JS '+e.message));
   page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
   const resp=await page.goto(base+folder+'?model='+model,{waitUntil:'domcontentloaded',timeout:40000});
   await page.waitForFunction(()=>window.__R68_QA?.loaded===true,null,{timeout:90000});
   await page.waitForTimeout(260);
   const qa=await page.evaluate(()=>({
    model:window.__R68_QA.selected,human:window.__R68_QA.human,
    menu:window.__R68_QA.menu,clips:window.__R68_QA.clips,
    gpu:window.__R68_QA.renderer,errors:window.__R68_QA.errors
   }));
   const shouldBones=model==='mpfb'?53:80;
   const ok=resp.status()===200&&qa.model===model&&qa.human.bones===shouldBones&&
    qa.human.skinned>=2&&qa.menu.meshes===43&&qa.clips.length===5&&errors.length===0&&qa.errors.length===0;
   await page.locator('#stage').screenshot({path:resolve(output,model+'-'+device+'.png')});
   await page.locator('button[data-angle="90"]').click();
   await page.waitForTimeout(120);
   const record={device,model,ok,http:resp.status(),...qa,errors};
   results.push(record);console.log('R68_T02_HAIR_CLOTHES_REAL_GPU',JSON.stringify(record));
   if(!ok)failed=true;await page.close();
  }
 }
}catch(e){failed=true;console.error('R68_COMPARISON_QA_ERROR',String(e));}
finally{writeFileSync(resolve(output,'qa-results.json'),JSON.stringify(results,null,2)+'\n');await browser?.close().catch(()=>{});}
if(failed)process.exitCode=3;
