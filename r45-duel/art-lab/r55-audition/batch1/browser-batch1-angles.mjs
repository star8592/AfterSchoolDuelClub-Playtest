import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const BASE=process.env.ASDC_AUDITION_ORIGIN||'http://127.0.0.1:10983';
const output=resolve(import.meta.dirname,'evidence');mkdirSync(output,{recursive:true});
const ids=['E02','T02','T01','G01'],angles=[0,45,90,180];
const results=[];let browser,failed=false;
try{
browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
for(const [name,width,height] of [['desktop',1440,900],['portrait',430,900]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
 const response=await page.goto(BASE+'/r45-duel/art-lab/r55-audition/',{waitUntil:'domcontentloaded',timeout:35000});
 await page.waitForFunction(()=>window.__R55_AUDITION_QA?.roster===18,null,{timeout:50000});
 for(const id of ids){
  await page.evaluate(id=>window.__R55_AUDITION_QA.selectById(id),id);
  await page.waitForFunction(id=>{
   const q=window.__R55_AUDITION_QA;
   return q.current===id&&(q.diagnostics.loaded||q.diagnostics.error);
  },id,{timeout:30000});
  // GPU shaders compile lazily on first view of a GLB, notably E02.
  // Wait for stable frames before judging visible geometry.
  await page.waitForTimeout(1700);
  for(const degrees of angles){
   await page.evaluate(degrees=>window.__R55_AUDITION_QA.setOrbit(degrees*Math.PI/180),degrees);
   await page.waitForTimeout(550);
   const nameForFile=`${name}-${id}-${degrees}.png`;
   await page.locator('.stage').screenshot({path:resolve(output,nameForFile)});
   const q=await page.evaluate(()=>({id:window.__R55_AUDITION_QA.current,
     ...window.__R55_AUDITION_QA.diagnostics,orbit:window.__R55_AUDITION_QA.orbit.azimuth,
     canvas:Array.from(document.querySelector('#canvas').getBoundingClientRect().toJSON?[
       document.querySelector('#canvas').getBoundingClientRect().width,
       document.querySelector('#canvas').getBoundingClientRect().height
     ]:[])}));
   const pass=response.status()===200&&q.id===id&&q.loaded&&q.meshes>0&&
    !q.error&&Math.abs(q.orbit-degrees*Math.PI/180)<.0001&&!errors.length;
   results.push({name,id,degrees,pass,model:q});
   console.log('BATCH1_ANGLE_GATE',JSON.stringify({name,id,degrees,pass,meshes:q.meshes,animations:q.animations,errors}));
   if(!pass)failed=true;
  }
 }
 await page.close();
}
}catch(e){console.error('BATCH1_QA_FAILED',String(e));failed=true}
finally{writeFileSync(resolve(output,'results.json'),JSON.stringify(results,null,2)+'\n');await browser?.close().catch(()=>{})}
if(failed)process.exitCode=3;
