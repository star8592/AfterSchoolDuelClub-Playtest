import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const BASE=process.env.ASDC_AUDITION_ORIGIN||'http://127.0.0.1:10987';
const dir=resolve(import.meta.dirname,'evidence');mkdirSync(dir,{recursive:true});
let browser,failed=false;const results=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
 for(const [name,w,h] of [['desktop',1440,900],['portrait',430,900]]){
  const p=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const response=await p.goto(BASE+'/r45-duel/art-lab/r55-audition/?study=T02-R59',{waitUntil:'domcontentloaded',timeout:35000});
  await p.waitForFunction(()=>window.__R55_AUDITION_QA?.current==='T02'&&window.__R55_AUDITION_QA?.diagnostics?.loaded,null,{timeout:55000});
  await p.waitForTimeout(1800);
  const candidate=await p.evaluate(()=>({
   model:window.__R55_AUDITION_QA.diagnostics,
   art:window.__R55_AUDITION_QA.t02ArtStudyVariant
  }));
  for(const deg of [0,45,90,180]){
   await p.evaluate(v=>window.__R55_AUDITION_QA.setOrbit(v*Math.PI/180),deg);
   await p.waitForTimeout(480);
   await p.locator('.stage').screenshot({path:resolve(dir,name+'-R59-'+deg+'.png')});
  }
  await p.locator('#attack').click();
  const before=await p.evaluate(()=>window.__R55_AUDITION_QA.menuRigState);
  await p.waitForTimeout(470);
  const during=await p.evaluate(()=>window.__R55_AUDITION_QA.menuRigState);
  await p.locator('.stage').screenshot({path:resolve(dir,name+'-R59-flip.png')});
  const moved=Math.abs(during.page[1]-before.page[1]);
  await p.locator('#t02-art').click();
  await p.waitForFunction(()=>window.__R55_AUDITION_QA?.current==='T02' &&
   !window.__R55_AUDITION_QA.t02ArtStudyVariant &&
   window.__R55_AUDITION_QA.diagnostics.loaded,null,{timeout:35000});
  await p.waitForTimeout(1000);
  const previous=await p.evaluate(()=>window.__R55_AUDITION_QA.diagnostics);
  await p.locator('.stage').screenshot({path:resolve(dir,name+'-R58.png')});
  const pass=response.status()===200&&candidate.art&&
    candidate.model.meshes===43&&candidate.model.animations===5&&
    previous.meshes===41&&previous.animations===5&&moved>.15&&!errors.length;
  const row={name,pass,candidate,previous,moved,errors};
  console.log('R59_T02_TEXTURE_GATE',JSON.stringify(row));
  results.push(row);if(!pass)failed=true;
  await p.close();
 }
}catch(e){console.error('R59_T02_ART_FAILED',String(e));failed=true}
finally{writeFileSync(resolve(dir,'results.json'),JSON.stringify(results,null,2)+'\n');
 await browser?.close().catch(()=>{})}
if(failed)process.exitCode=3;
