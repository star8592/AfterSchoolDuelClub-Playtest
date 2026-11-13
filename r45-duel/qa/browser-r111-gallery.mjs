import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const ORIGIN=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11111';
const path=resolve(import.meta.dirname,'evidence/r111');mkdirSync(path,{recursive:true});
const report={passed:false,checks:[],errors:[]};
const check=(ok,title,detail)=>{report.checks.push({ok:!!ok,title,detail});if(!ok)throw Error(title+' '+JSON.stringify(detail))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
try{
 for(const [label,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[],models=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text())});
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(ORIGIN))errors.push('HTTP '+r.status())});
  page.on('request',r=>{if(/\.(glb|vrm)(?:\?|$)/.test(r.url()))models.push(r.url())});
  await page.goto(ORIGIN+'/r45-duel/qa/r111-magic-gallery.html',
    {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__r111GalleryQA?.stats?.played>=1,null,{timeout:25000});
  check(await page.locator('select#card option').count()===46,label+' full 46 spells listed');
  check((await page.locator('#title').textContent())==='蛤蟆布丁警报',
    label+' correct first featured spell');
  for(const id of ['K01','P05','X08','T06']){
   const result=await page.evaluate(id=>window.__r111GalleryQA.castId(id),id);
   check(result,label+' '+id+' selectable');
  }
  const v=await page.evaluate(()=>window.__r111GalleryQA.stats);
  check(v.played===5&&v.active<=4&&v.motifCount===32,
   label+' four active bounded and real 32 motifs',v);
  check(models.length===0,label+' magic preview no 3D model downloads');
  await page.screenshot({path:resolve(path,label+'-magic-gallery.png')});
  check(errors.length===0,label+' 0 JS/GLSL/network errors',errors);
  await page.close();
 }
 report.passed=report.checks.every(x=>x.ok);
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(path,'r111-magic-gallery.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R111_GALLERY_QA',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors}));
 await browser.close();
}
if(!report.passed)process.exitCode=4;
