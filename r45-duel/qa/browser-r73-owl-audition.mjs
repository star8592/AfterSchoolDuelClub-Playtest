import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11003';
const dest=resolve(import.meta.dirname,'evidence/r73');mkdirSync(dest,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const rows=[];
try{
 for(const [name,w,h] of [['wide',1600,900],['portrait',430,900]]){
  const page=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  for(const angle of [0,45,90,180]){
   const res=await page.goto(`${origin}/r45-duel/qa/r73-owl-audition.html?angle=${angle}`,{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>window.__R73_OWL_QA?.ready,null,{timeout:60000});
   await page.waitForFunction(()=>window.__R73_OWL_QA?.frames>=10,null,{timeout:15000});
   const q=await page.evaluate(()=>window.__R73_OWL_QA);
   await page.waitForTimeout(380);
   await page.screenshot({path:resolve(dest,`${name}-${angle}-compare.png`)});
   // The GPU compositor occasionally yields a white initial screenshot. The
   // actual on-canvas WebGL readback is kept independently for real pixel QA.
   let png=await page.evaluate(()=>document.querySelector('#canvas').toDataURL('image/png').split(',')[1]);
   let pngBytes=Buffer.from(png,'base64');
   // Vulkan headless may return an unpainted first frame. Never count it.
   // Retry the viewer once rather than accepting an all-black evidence PNG.
   if(pngBytes.length<(w>=800?45000:18000)){
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__R73_OWL_QA?.ready&&window.__R73_OWL_QA?.frames>=18,null,{timeout:60000});
    await page.waitForTimeout(750);
    png=await page.evaluate(()=>document.querySelector('#canvas').toDataURL('image/png').split(',')[1]);
    pngBytes=Buffer.from(png,'base64');
    await page.screenshot({path:resolve(dest,`${name}-${angle}-compare.png`)});
   }
   writeFileSync(resolve(dest,`${name}-${angle}-canvas.png`),pngBytes);
   const roles=q.models;
   const ok=res.status()===200&&roles.length===3&&q.frames>=10&&
     roles[0].triangles<1000&&roles[1].triangles>3000&&roles[2].triangles>13000&&
     roles[2].triangles<30000&&roles[2].skinned>=15&&
     roles[2].animations.length===4&&!errors.length;
   rows.push({name,angle,ok,frames:q.frames,models:roles,errors});
   console.log('R73_BLENDER_OWL_AUDITION',JSON.stringify({name,angle,ok,frames:q.frames,
     tris:roles.map(x=>Math.round(x.triangles)),skins:roles.map(x=>x.skinned),
     clips:roles.map(x=>x.animations),errors}));
  }
  await page.close();
 }
}finally{writeFileSync(resolve(dest,'owl-audition-results.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
if(rows.length!==8||rows.some(x=>!x.ok))process.exitCode=2;
