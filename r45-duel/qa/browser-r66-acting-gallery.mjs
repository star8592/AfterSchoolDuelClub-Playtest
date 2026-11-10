/** R66 real GPU evidence: the seven same source GLB characters in relaxed vs expressive poses. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10996';
const out=resolve(import.meta.dirname,'evidence/r66');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const rows=[];
try{
 for(const mode of ['relaxed','acting'])for(const group of [0,1]){
  const p=await browser.newPage({viewport:{width:1600,height:680}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await p.goto(`${origin}/r45-duel/qa/r66-character-acting-gallery.html?mode=${mode}&group=${group}`,{waitUntil:'domcontentloaded',timeout:40000});
  await p.waitForFunction(()=>window.__R66_GALLERY?.ready,null,{timeout:70000});
  await p.waitForTimeout(550);
  const state=await p.evaluate(()=>window.__R66_GALLERY);
  const image=await p.screenshot({path:resolve(out,`gallery-${mode}-${group}.png`)});
  const checks=state.poses.map(x=>({id:x.id,name:x.acting?.name,clip:x.clip,gestureAmount:x.posture?.gestureAmount,native:x.acting?.native,
   count:x.acting?.gestureCount,size:x.size,center:x.center}));
  const expressions=checks.every(x=>mode!=='acting'||(x.native?x.count>0:x.gestureAmount>.45));
  const pass=errors.length===0&&image.byteLength>45000&&checks.length>=3&&expressions;
  rows.push({mode,group,pass,bytes:image.byteLength,checks,errors});
  console.log('R66_GALLERY',JSON.stringify({mode,group,pass,checks,errors}));
  await p.close();
 }
}finally{writeFileSync(resolve(out,'gallery-results.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
if(rows.length!==4||rows.some(x=>!x.pass))process.exitCode=3;
