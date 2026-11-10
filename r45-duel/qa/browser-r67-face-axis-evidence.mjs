/** Photo evidence for the actual two VRM source fronts: -Z face vs +Z back. */
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10997';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const rows=[];
try{
 for(const id of ['E01','G01'])for(const axis of ['front','back']){
  const page=await browser.newPage({viewport:{width:1320,height:760}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(`${origin}/r45-duel/qa/r67-vrm-acting-gallery.html?id=${id}&view=face&axis=${axis}`,{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>window.__R67_GALLERY?.ready,null,{timeout:80000});
  await page.waitForTimeout(2100);
  const qa=await page.evaluate(()=>({axis:window.__R67_GALLERY.axis,models:window.__R67_GALLERY.visibleModels}));
  const img=await page.screenshot({path:resolve(import.meta.dirname,`evidence/r67/axis-${id}-${axis}.png`)});
  const pass=qa.models===2&&qa.axis===(axis==='front'?'-Z face':'+Z back')&&img.length>60000&&!errors.length;
  rows.push({id,axis,pass,imageBytes:img.length,errors});
  console.log('R67_SOURCE_VRM_FACE_AXIS_PHOTO',JSON.stringify(rows.at(-1)));
  await page.close();
 }
}finally{writeFileSync(resolve(import.meta.dirname,'evidence/r67/axis-results.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
if(rows.length!==4||rows.some(x=>!x.pass))process.exitCode=3;
