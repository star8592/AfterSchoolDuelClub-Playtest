import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.R67_ORIGIN||'http://127.0.0.1:11085';
const DIR=resolve(import.meta.dirname,'evidence/r67');mkdirSync(DIR,{recursive:true});
let browser,failed=false;const rows=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
 for(const [device,width,height] of [['desktop',1440,900],['portrait',430,900]]){
  const p=await browser.newPage({viewport:{width,height}});
  const errors=[];p.on('pageerror',e=>errors.push('JS '+e.message));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const response=await p.goto(BASE+'/r67-t02-duo/',{waitUntil:'domcontentloaded',timeout:42000});
  await p.waitForFunction(()=>window.__T02_DUO_QA?.loaded,null,{timeout:85000});
  await p.waitForTimeout(350);
  const initial=await p.evaluate(()=>({
    stats:window.__T02_DUO_QA.stats,clips:window.__T02_DUO_QA.clipNames,
    arm:window.__T02_DUO_QA.rightArm
  }));
  await p.locator('button[data-human="Serve_Menu"]').click();
  await p.waitForTimeout(540);
  const arm=await p.evaluate(()=>window.__T02_DUO_QA.rightArm);
  const delta=Math.hypot(...arm.map((x,i)=>x-initial.arm[i]));
  await p.locator('#c').screenshot({path:resolve(DIR,'viewer-'+device+'-serve.png')});
  const ok=response.status()===200&&initial.stats.meshes===59&&
   initial.stats.skinnedMeshes>=11 && initial.stats.bones>=53 &&
   initial.clips.length===9 && delta>.05 && errors.length===0;
  const row={device,ok,meshes:initial.stats.meshes,bones:initial.stats.bones,
   skins:initial.stats.skinnedMeshes,clips:initial.clips,armDelta:delta,errors};
  rows.push(row);console.log('R67_T02_PUBLIC_VIEWER_REAL_GPU',JSON.stringify(row));
  if(!ok)failed=true;await p.close();
 }
}catch(e){failed=true;console.error('R67_T02_VIEWER_FAILED',String(e));}
finally{writeFileSync(resolve(DIR,'viewer-results.json'),JSON.stringify(rows,null,2)+'\n');await browser?.close().catch(()=>{});}
if(failed)process.exitCode=3;
