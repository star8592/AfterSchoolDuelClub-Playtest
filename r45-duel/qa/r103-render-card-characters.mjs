import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11103';
const dest=resolve(import.meta.dirname,'../art/r103-raw');
mkdirSync(dest,{recursive:true});
const glbs=['E02','E03','E04','G02','G03','G04','M01','M02','T01','T02','T03','T04'];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:450,height:620},deviceScaleFactor:1});
 let errors=[];page.on('pageerror',e=>errors.push(e.message));
 // One long-lived page renders every model with isolated, bound GPU limits.
 for(const id of glbs){
  await page.goto(origin+'/r45-duel/art/r103-studio.html?id='+id,{waitUntil:'domcontentloaded',timeout:75000});
  await page.waitForFunction(()=>window.__R103Studio?.ready||window.__R103Studio?.error,null,{timeout:110000});
  const stat=await page.evaluate(()=>({ready:window.__R103Studio.ready,error:window.__R103Studio.error,
    ...window.__R103Studio.extent}));
  if(!stat.ready||stat.meshes<1||errors.length)throw Error(id+' cannot produce authentic mesh portrait: '+JSON.stringify({stat,errors}));
  await page.waitForTimeout(250);
  await page.screenshot({path:resolve(dest,id+'.png'),omitBackground:true});
  console.log('REAL_3D_ACTOR_CARD_ART',id,JSON.stringify(stat));
 }
}finally{await browser.close()}
