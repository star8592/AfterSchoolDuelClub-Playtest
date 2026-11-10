/** Real WebGL screenshots and source-face morph verification for both VRM protagonists. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10997';
const out=resolve(import.meta.dirname,'evidence/r67');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const rows=[];
try{
 for(const id of ['E01','G01'])for(const view of ['full','face']){
  const p=await browser.newPage({viewport:{width:1320,height:760}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await p.goto(`${origin}/r45-duel/qa/r67-vrm-acting-gallery.html?id=${id}&view=${view}`,{waitUntil:'domcontentloaded',timeout:35000});
  await p.waitForFunction(()=>window.__R67_GALLERY?.ready,null,{timeout:70000});
  await p.waitForTimeout(2100);
  const state=await p.evaluate(()=>({id:window.__R67_GALLERY.id,frames:window.__R67_GALLERY.frames,
   models:window.__R67_GALLERY.visibleModels,left:window.__R67_GALLERY.left,right:window.__R67_GALLERY.right}));
  const shot=await p.screenshot({path:resolve(out,`source-${id}-${view}.png`)});
  const pass=state.models===2&&state.frames>=8&&state.left.faceMeshes>=2&&
   state.left.actualExpression<.05&&state.right.actualExpression>.17&&
   state.right.amount>.55&&shot.length>60000&&!errors.length;
  rows.push({id,view,pass,state,screenshotBytes:shot.length,errors});
  console.log('R67_GALLERY_GPU',JSON.stringify(rows.at(-1)));
  await p.close();
 }
}finally{writeFileSync(resolve(out,'gallery-results.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
if(rows.length!==4||rows.some(r=>!r.pass))process.exitCode=3;
