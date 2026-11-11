import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11005';const dest=resolve(import.meta.dirname,'evidence/r74/recast');mkdirSync(dest,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
const results=[];try{for(const [viewport,width,height] of [['wide',1600,900],['portrait',430,900]]){
const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()}:${r.url()}`)});
for(const angle of [0,45,90,180]){
await page.goto(`${origin}/r45-duel/qa/r74-character-foundation-audition.html?angle=${angle}`,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForFunction(()=>window.__R74_CAST_QA?.ready&&window.__R74_CAST_QA?.frames>12,null,{timeout:55000});await page.waitForTimeout(400);
const q=await page.evaluate(()=>window.__R74_CAST_QA),pass=q.models.length===4&&q.models.every(m=>m.triangles>6000&&m.bones>=80&&m.skins>=1)&&errors.length===0;
await page.screenshot({path:resolve(dest,`${viewport}-${angle}.png`)});
results.push({viewport,angle,pass,models:q.models,errors:[...errors]});console.log('R74_REAL_RECAST_AUDITION',JSON.stringify({viewport,angle,pass,models:q.models,errors}));
}await page.close();}}
finally{writeFileSync(resolve(dest,'results.json'),JSON.stringify(results,null,2)+'\n');await browser.close();}
if(results.length!==8||results.some(x=>!x.pass))process.exitCode=3;
