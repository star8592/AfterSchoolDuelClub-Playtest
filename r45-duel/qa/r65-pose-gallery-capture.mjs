import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10995';
const out=resolve(import.meta.dirname,'evidence/r65');mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
let fails=0;const rows=[];
try{
 for(const mode of ['before','after'])for(const group of [0,1]){
  const p=await b.newPage({viewport:{width:1600,height:680}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  p.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()} ${r.url()}`)});
  try{
   await p.goto(`${origin}/r45-duel/qa/r65-pose-gallery.html?mode=${mode}&group=${group}`,{waitUntil:'domcontentloaded',timeout:35000});
   await p.waitForFunction(()=>window.__R65_GALLERY?.ready,null,{timeout:65000});
   await p.waitForTimeout(1200);
   const qa=await p.evaluate(()=>window.__R65_GALLERY);
   const png=await p.screenshot({path:resolve(out,`gallery-${mode}-${group}.png`)});
   const pass=errors.length===0&&png.length>40000&&qa.ids.length>=3;
   rows.push({mode,group,pass,bytes:png.length,errors,qa});if(!pass)fails++;
   console.log('R65_STUDIO_VISUAL',JSON.stringify({mode,group,pass,bytes:png.length,ids:qa.ids,errors}));
  }catch(e){console.error('R65_STUDIO_CAPTURE',mode,group,String(e));fails++}
  await p.close();
 }
}finally{writeFileSync(resolve(out,'gallery-results.json'),JSON.stringify(rows,null,2)+'\n');await b.close()}
if(fails)process.exitCode=3;
