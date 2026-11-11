import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10999';
const dir=resolve(import.meta.dirname,'evidence/r69');mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const results=[];
try{
 for(const [screen,w,h] of [['wide',1440,850],['portrait',430,870]])for(const angle of [0,45,90,180]){
  const page=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(`${origin}/r45-duel/qa/r69-owl-audition.html?angle=${angle}`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__R69_OWL_QA?.ready,null,{timeout:60000});
  await page.waitForTimeout(480);
  const q=await page.evaluate(()=>window.__R69_OWL_QA),img=await page.screenshot({path:resolve(dir,`${screen}-owl-${angle}.png`)});
  const ok=q.models.length===2&&q.models.every(x=>x.skinned>0&&x.animations.length===4)&&q.models[1].triangles>q.models[0].triangles*5&&!errors.length&&img.length>20000;
  results.push({screen,angle,ok,bytes:img.length,models:q.models,errors});
  console.log('R69_OWL_AUDITION',JSON.stringify({screen,angle,ok,triangles:q.models.map(x=>x.triangles),errors}));
  await page.close();
 }
}finally{writeFileSync(resolve(dir,'owl-audition.json'),JSON.stringify(results,null,2)+'\n');await browser.close()}
if(results.length!==8||results.some(x=>!x.ok))process.exitCode=3;
