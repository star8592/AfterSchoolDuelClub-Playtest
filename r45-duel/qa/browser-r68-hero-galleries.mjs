/** Browser art acceptance: actual shoulders, elbows, wrists and rendered images. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10998';
const out=resolve(import.meta.dirname,'evidence/r68');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const rows=[];
try{
 for(const id of ['E01','G01'])for(const view of ['full','face']){
  const p=await browser.newPage({viewport:{width:1320,height:760}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  p.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()}: ${r.url()}`)});
  await p.goto(`${origin}/r45-duel/qa/r68-vrm-hero-gallery.html?id=${id}&view=${view}&mode=entrance`,{waitUntil:'domcontentloaded',timeout:35000});
  await p.waitForFunction(()=>window.__R68_GALLERY?.ready,null,{timeout:70000});
  await p.waitForTimeout(1400);
  const qa=await p.evaluate(()=>({left:window.__R68_GALLERY.left,right:window.__R68_GALLERY.right,frames:window.__R68_GALLERY.frames}));
  const shot=await p.screenshot({path:resolve(out,`vrm-${id}-${view}-hero.png`)});
  const e=qa.right.heroPose.arms,hero=qa.right.entranceAmount;
  const pass=hero>.95&&['R','L'].every(x=>e[x].error<.06)&&
   qa.frames>20&&shot.byteLength>65000&&!errors.length;
  rows.push({id,view,pass,hero,arms:e,bytes:shot.byteLength,errors});
  console.log('R68_VRM_HERO_VISUAL',JSON.stringify(rows.at(-1)));
  await p.close();
 }
 for(const group of [0,1]){
  const p=await browser.newPage({viewport:{width:1600,height:680}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(`${origin}/r45-duel/qa/r68-glb-hero-gallery.html?mode=entrance&group=${group}`,{waitUntil:'domcontentloaded',timeout:40000});
  await p.waitForFunction(()=>window.__R68_GALLERY?.ready,null,{timeout:70000});
  await p.waitForTimeout(650);
  const qa=await p.evaluate(()=>window.__R68_GALLERY);
  const image=await p.screenshot({path:resolve(out,`glb-entry-group${group}.png`)});
  const poses=qa.poses.map(x=>({id:x.id,entrance:x.posture?.entranceAmount||0,arms:x.posture?.arms||[],center:x.center,size:x.size}));
  const pass=poses.length>2&&poses.every(x=>x.entrance>.5&&x.arms.length===2)&&image.byteLength>55000&&!errors.length;
  rows.push({id:'GLB',group,pass,poses,bytes:image.byteLength,errors});
  console.log('R68_GLB_HERO_VISUAL',JSON.stringify(rows.at(-1)));
  await p.close();
 }
}finally{writeFileSync(resolve(out,'hero-gallery-results.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
if(rows.length!==6||rows.some(x=>!x.pass))process.exitCode=3;
