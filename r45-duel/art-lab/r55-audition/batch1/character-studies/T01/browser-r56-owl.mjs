import {createRequire} from 'node:module';
import {writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const BASE=process.env.ASDC_AUDITION_ORIGIN||'http://127.0.0.1:10984';
const root=resolve(import.meta.dirname,'evidence');
let browser,failed=false;const logs=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
 for(const [device,width,height] of [['desktop',1440,900],['portrait',430,900]]){
  const p=await browser.newPage({viewport:{width,height}});
  const errors=[];
  p.on('pageerror',e=>errors.push('JS '+String(e)));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const r=await p.goto(BASE+'/r45-duel/art-lab/r55-audition/?study=T01-R56',{waitUntil:'domcontentloaded',timeout:35000});
  await p.waitForFunction(()=>window.__R55_AUDITION_QA?.current==='T01'&&window.__R55_AUDITION_QA.diagnostics.loaded,null,{timeout:50000});
  await p.waitForTimeout(1200);
  const study=await p.evaluate(()=>({variant:__R55_AUDITION_QA.studyVariant,...__R55_AUDITION_QA.diagnostics}));
  for(const degrees of [0,45,90,180]){
   await p.evaluate(deg=>__R55_AUDITION_QA.setOrbit(deg*Math.PI/180),degrees);
   await p.waitForTimeout(380);
   await p.locator('.stage').screenshot({path:resolve(root,device+'-R56-'+degrees+'.png')});
  }
  await p.locator('#attack').click();await p.waitForTimeout(240);
  const attack=await p.locator('#info').textContent();
  await p.locator('#owl-variant').click();
  await p.waitForFunction(()=>window.__R55_AUDITION_QA?.current==='T01'&&!window.__R55_AUDITION_QA.studyVariant&&window.__R55_AUDITION_QA.diagnostics.loaded,null,{timeout:29000});
  await p.waitForTimeout(700);
  await p.evaluate(()=>__R55_AUDITION_QA.setOrbit(0));
  await p.locator('.stage').screenshot({path:resolve(root,device+'-SOURCE-0.png')});
  const original=await p.evaluate(()=>({...__R55_AUDITION_QA.diagnostics,variant:__R55_AUDITION_QA.studyVariant}));
  const pass=r.status()===200&&study.variant&&study.meshes>=20&&study.animations===4&&
   original.meshes===1&&original.animations===4&&!original.variant&&
   /attack/i.test(attack||'')&&!errors.length;
  logs.push({device,pass,study,original,attack,errors});
  console.log('R56_OWL_STUDY_GATE',JSON.stringify({device,pass,study,original,attack,errors}));
  if(!pass)failed=true;
  await p.close();
 }
}catch(e){console.error('R56_OWL_FAILED',String(e));failed=true}
finally{writeFileSync(resolve(root,'results.json'),JSON.stringify(logs,null,2)+'\n');await browser?.close().catch(()=>{})}
if(failed)process.exitCode=3;
