import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const BASE=process.env.ASDC_AUDITION_ORIGIN||'http://127.0.0.1:10985';
const dir=resolve(import.meta.dirname,'evidence');mkdirSync(dir,{recursive:true});
let browser,failed=false;const results=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
 for(const [name,w,h] of [['desktop',1440,900],['mobile',430,900]]){
  const p=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const response=await p.goto(BASE+'/r45-duel/art-lab/r55-audition/?study=E02-R57',{waitUntil:'domcontentloaded',timeout:35000});
  await p.waitForFunction(()=>window.__R55_AUDITION_QA?.current==='E02'&&window.__R55_AUDITION_QA.diagnostics.loaded,null,{timeout:60000});
  await p.waitForTimeout(1400);
  const refined=await p.evaluate(()=>({active:window.__R55_AUDITION_QA.e02StudyVariant,...window.__R55_AUDITION_QA.diagnostics}));
  for(const degrees of [0,45,90,180]){
   await p.evaluate(a=>window.__R55_AUDITION_QA.setOrbit(a*Math.PI/180),degrees);
   await p.waitForTimeout(400);
   await p.locator('.stage').screenshot({path:resolve(dir, name+'-R57-'+degrees+'.png')});
  }
  await p.locator('#e02-variant').click();
  await p.waitForFunction(()=>window.__R55_AUDITION_QA?.current==='E02'&&!window.__R55_AUDITION_QA.e02StudyVariant&&window.__R55_AUDITION_QA.diagnostics.loaded,null,{timeout:30000});
  await p.waitForTimeout(1000);
  await p.evaluate(()=>window.__R55_AUDITION_QA.setOrbit(0));
  await p.locator('.stage').screenshot({path:resolve(dir,name+'-SOURCE-0.png')});
  const original=await p.evaluate(()=>({...window.__R55_AUDITION_QA.diagnostics,active:window.__R55_AUDITION_QA.e02StudyVariant}));
  const pass=response.status()===200&&refined.loaded&&refined.meshes===17&&
   refined.animations===0&&original.loaded&&original.meshes===17&&!original.active&&
   !errors.length;
  results.push({name,pass,refined,original,errors});
  console.log('R57_PAPER_MESH_GATE',JSON.stringify({name,pass,refined,original,errors}));
  if(!pass)failed=true;
  await p.close();
 }
}catch(e){console.log('R57_PAPER_ERROR',String(e));failed=true}
finally{writeFileSync(resolve(dir,'results.json'),JSON.stringify(results,null,2)+'\n');await browser?.close().catch(()=>{})}
if(failed)process.exitCode=3;
