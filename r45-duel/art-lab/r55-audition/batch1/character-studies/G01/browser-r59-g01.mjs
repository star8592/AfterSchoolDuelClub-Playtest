import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const BASE=process.env.ASDC_AUDITION_ORIGIN||'http://127.0.0.1:10988';
const dir=resolve(import.meta.dirname,'evidence');mkdirSync(dir,{recursive:true});
let browser,failed=false;const all=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
 for(const [device,w,h] of [['desktop',1440,900],['portrait',430,900]]){
  const p=await browser.newPage({viewport:{width:w,height:h}});
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const response=await p.goto(BASE+'/r45-duel/art-lab/r55-audition/?study=G01-R59',{waitUntil:'domcontentloaded',timeout:38000});
  await p.waitForFunction(()=>window.__R55_AUDITION_QA?.current==='G01'&&
    window.__R55_AUDITION_QA.diagnostics.loaded,null,{timeout:60000});
  await p.waitForTimeout(1800);
  const preview=await p.evaluate(()=>({loaded:window.__R55_AUDITION_QA.diagnostics,
   motion:window.__R55_AUDITION_QA.architectMotion,
   variant:window.__R55_AUDITION_QA.g01StudyVariant}));
  const before=preview.motion?.rightArmQ;
  await p.locator('#attack').click();await p.waitForTimeout(450);
  const after=await p.evaluate(()=>window.__R55_AUDITION_QA.architectMotion?.rightArmQ);
  const armDelta=before&&after?Math.max(...after.map((v,i)=>Math.abs(v-before[i]))):0;
  for(const deg of [0,45,90,180]){
   await p.evaluate(deg=>window.__R55_AUDITION_QA.setOrbit(deg*Math.PI/180),deg);
   await p.waitForTimeout(550);
   await p.locator('.stage').screenshot({path:resolve(dir,device+'-G01-'+deg+'.png')});
  }
  await p.locator('#idle').click();await p.locator('#g01-variant').click();
  await p.waitForFunction(()=>window.__R55_AUDITION_QA?.current==='G01'&&
    !window.__R55_AUDITION_QA.g01StudyVariant &&
    window.__R55_AUDITION_QA.diagnostics.loaded,null,{timeout:45000});
  await p.waitForTimeout(900);
  await p.evaluate(()=>window.__R55_AUDITION_QA.setOrbit(Math.PI));
  await p.locator('.stage').screenshot({path:resolve(dir,device+'-G01-source.png')});
  const original=await p.evaluate(()=>window.__R55_AUDITION_QA.diagnostics);
  const pass=response.status()===200&&preview.variant&&preview.loaded.meshes>30 &&
    preview.motion?.attachedMeshes===30&&armDelta>.02&&
    original.meshes<preview.loaded.meshes&&!errors.length;
  const result={device,pass,preview,original,armDelta,errors};
  console.log('R59_G01_ARCHITECT_GATE',JSON.stringify(result));
  all.push(result);if(!pass)failed=true;
  await p.close();
 }
}catch(e){console.error('R59_G01_BROWSER_ERROR',String(e));failed=true}
finally{writeFileSync(resolve(dir,'results.json'),JSON.stringify(all,null,2)+'\n');
 await browser?.close().catch(()=>{});}
if(failed)process.exitCode=3;
