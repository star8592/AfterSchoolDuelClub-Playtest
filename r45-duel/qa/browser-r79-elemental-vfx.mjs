import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const base=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11019';
const out=resolve(import.meta.dirname,'evidence/r79');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
let result={ok:false,base,error:null};
try{
 const page=await browser.newPage({viewport:{width:1536,height:864}});
 const errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))
   requests.push({status:r.status(),url:r.url()});});
 await page.goto(base+'/r45-duel/?seed=1&qa=1',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady,
   null,{timeout:85000});
 const trigger=async (id,kind,side='player')=>page.evaluate(({id,kind,side})=>{
   const target=document.querySelector('#stadium').contentWindow;
   target.postMessage({type:'ASDC_R46_CARD_PLAY',id,kind,side,name:'R79 QA '+id,cost:1},location.origin);
 },{id,kind,side});
 const before=await page.evaluate(()=>{
   const iframe=document.querySelector('#stadium').contentWindow;
   return{main:window.__r45QA?.gameState||null,vfx:iframe.__r45SceneQA?.elementalVfx};
 });
 await trigger('E01','unit');await page.waitForTimeout(760);
 const portal=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.elementalVfx);
 await page.screenshot({path:resolve(out,'r79-portal-actual-arena.png')});
 await trigger('T06','spell','ai');await page.waitForTimeout(390);
 const lightning=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.elementalVfx);
 await page.screenshot({path:resolve(out,'r79-lightning-actual-arena.png')});
 await trigger('G05','spell');await page.waitForTimeout(450);
 const crystal=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.elementalVfx);
 await page.screenshot({path:resolve(out,'r79-crystal-actual-arena.png')});
 const sameAfter=await page.evaluate(()=>window.__r45QA?.gameState||null);
 result={ok:portal.played===1&&portal.active===1&&portal.activeTypes.includes('portal')&&
 lightning.played===2&&lightning.activeTypes.includes('lightning')&&
 crystal.played===3&&crystal.activeTypes.includes('crystal')&&
 (!before.main||JSON.stringify(before.main)===JSON.stringify(sameAfter))&&
 errors.length===0&&requests.length===0,
 portal,lightning,crystal,requestErrors:requests,jsErrors:errors,beforeGame:before.main,afterGame:sameAfter,
 screenshotNames:['r79-portal-actual-arena.png','r79-lightning-actual-arena.png','r79-crystal-actual-arena.png']};
 await page.close();
}catch(err){result.error=String(err);process.exitCode=7;
}finally{writeFileSync(resolve(out,'r79-vfx-smoke.json'),JSON.stringify(result,null,2)+'\n');
 await browser.close();console.log('R79_RESULT',JSON.stringify(result));
 if(!result.ok)process.exitCode=7;}
