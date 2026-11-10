/** R63 source-art front-angle visual audit: no gameplay modifications. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10992';
const ids=(process.env.ASDC_R63_IDS||'E02,E03,E04,G02,G03,G04,T01,T02,T03,T04').split(',');
const out='r45-duel/qa/evidence/r63';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer','--disable-dev-shm-usage']});
const results=[];
try{
 for(const id of ids){
  const page=await browser.newPage({viewport:{width:1152,height:440}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(/CONTEXT_LOST_WEBGL|WebGLRenderer: Context Lost/i.test(m.text()))errors.push('WebGL context lost')});
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  try{
   await page.goto(origin+'/r45-duel/qa/r62-orientation-view.html?id='+id,{waitUntil:'domcontentloaded',timeout:20000});
   await page.waitForFunction(()=>window.__R62_FACE_QA?.ready,null,{timeout:50000});
   await page.waitForTimeout(750);
   const qa=await page.evaluate(()=>window.__R62_FACE_QA);
   const shot=await page.screenshot({path:`${out}/${id}-four-angles.png`});
   const gpu=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2');const ex=gl?.getExtension('WEBGL_debug_renderer_info');return {lost:gl?.isContextLost(),renderer:ex?gl.getParameter(ex.UNMASKED_RENDERER_WEBGL):'unknown'}});
   if(shot.byteLength<30000)errors.push('Possible blank WebGL output: PNG '+shot.byteLength+' bytes');
   if(!qa.meshes)errors.push('No mesh in source model');
   if(gpu.lost)errors.push('WebGL context currently lost');
   if(id==='E02'){
    await page.goto(origin+'/r45-duel/qa/r62-orientation-view.html?id=E02&top=1',{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForFunction(()=>window.__R62_FACE_QA?.ready,null,{timeout:45000});
    await page.waitForTimeout(350);
    await page.screenshot({path:`${out}/E02-top-four-angles.png`});
   }
   results.push({...qa,gpu,pngBytes:shot.byteLength,errors,pass:errors.length===0});
  }catch(e){results.push({id,pass:false,error:String(e),errors});}
  await page.close();
  console.log('R63_SOURCE_FOUR_ANGLES',JSON.stringify(results.at(-1)));
 }
}finally{await browser.close();writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2)+'\n')}
if(results.some(x=>!x.pass))process.exitCode=2;
