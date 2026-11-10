import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const BASE=process.env.ASDC_AUDITION_ORIGIN||'http://127.0.0.1:10985';
const dir=resolve(import.meta.dirname,'evidence');mkdirSync(dir,{recursive:true});
let browser,failed=false;const results=[];
try{
browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
for(const [name,w,h] of [['desktop',1440,900],['portrait',430,900]]){
 const p=await browser.newPage({viewport:{width:w,height:h}});
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 const response=await p.goto(BASE+'/r45-duel/art-lab/r55-audition/?study=E02-R57',{waitUntil:'domcontentloaded',timeout:36000});
 await p.waitForFunction(()=>window.__R55_AUDITION_QA?.diagnostics?.loaded&&window.__R55_AUDITION_QA.current==='E02',null,{timeout:55000});
 await p.waitForTimeout(1300);
 const stages=[];
 for(const [action,expect] of [['idle','idle'],['walk','bank'],['attack','attack']]){
  await p.locator('#'+action).click();
  await p.waitForTimeout(220);
  const a=await p.evaluate(()=>window.__R55_AUDITION_QA.paperMotion);
  await p.waitForTimeout(330);
  const b=await p.evaluate(()=>window.__R55_AUDITION_QA.paperMotion);
  const moved=Math.abs(a.y-b.y)+Math.abs(a.z-b.z)+Math.abs(a.roll-b.roll);
  const pass=a.mode===expect&&moved>.002;
  stages.push({action,expected:expect,pass,moved:Number(moved.toFixed(4))});
 }
 await p.locator('#idle').click();await p.waitForTimeout(450);
 for(const degrees of [0,45,90,180]){
  await p.evaluate(x=>window.__R55_AUDITION_QA.setOrbit(x*Math.PI/180,.79,
   window.innerWidth<600?8.7:6.6),degrees);
  await p.waitForTimeout(420);
  await p.locator('.stage').screenshot({path:resolve(dir, name+'-paper-beauty-'+degrees+'.png')});
 }
 const state=await p.evaluate(()=>({flight:window.__R55_AUDITION_QA.paperMotion,
  camera:window.__R55_AUDITION_QA.orbit,mode:window.__R55_AUDITION_QA.e02StudyVariant}));
 const pass=response.status()===200&&stages.every(x=>x.pass)&&state.mode&&!errors.length;
 results.push({name,pass,stages,state,errors});
 console.log('R57_PAPER_MOTION_GATE',JSON.stringify({name,pass,stages,errors}));
 if(!pass)failed=true;
 await p.close();
}
}catch(e){console.error('R57_PAPER_MOTION_FAILED',String(e));failed=true}
finally{writeFileSync(resolve(dir,'motion-results.json'),JSON.stringify(results,null,2)+'\n');await browser?.close().catch(()=>{});}
if(failed)process.exitCode=3;
