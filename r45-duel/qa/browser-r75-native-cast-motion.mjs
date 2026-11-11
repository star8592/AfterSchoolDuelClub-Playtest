/** R75: original GLB direct Meshopt/WebP, real skeleton animations and gym. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const base=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11006';
const dir=resolve(import.meta.dirname,'evidence/r75');mkdirSync(dir,{recursive:true});
const scenes=[
 ['kids','idle',0,0],['kids','idle',90,0],['kids','wave',0,1],['kids','cheer',45,1],
 ['coaches','idle',0,0],['coaches','cheer',0,1],['coaches','talk',45,0],
 ['adult','idle',0,0],['adult','talk',90,1],['adult','clap',0,0],
 ['canteen','cheer',0,1],['canteen','clap',180,0],
 ['kids','dance',180,1],['canteen','dance',45,1]
];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const result=[];
try{
 for(const [group,motion,angle,venue] of scenes){
  const page=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push('JS '+String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text().slice(0,350))});
  await page.goto(`${base}/r45-duel/qa/r75-native-character-casting.html?group=${group}&motion=${motion}&angle=${angle}&venue=${venue}`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__R75_CAST_QA?.ready,null,{timeout:90000});
  await page.waitForTimeout(motion==='idle'?2300:3200);
  const q=await page.evaluate(()=>window.__R75_CAST_QA);
  const png=Buffer.from(await page.evaluate(()=>document.querySelector('#stage').toDataURL('image/png').split(',')[1]),'base64');
  const filename=`${group}-${motion}-${angle}-${venue?'gym':'studio'}.png`;
  writeFileSync(resolve(dir,filename),png);
  const tall=q.models.every(m=>m.sourceHeight>1.2&&m.sourceHeight<2.5&&m.sourceDepth<1.5);
  const animated=q.models.every(m=>m.tracked/m.sourceTracks>=.75&&m.observedMovement>.015&&m.movedBones>=2);
  const valid=q.models.length===4&&q.models.every(m=>m.pass&&m.bones>=79&&m.tris>=6000)&&tall&&animated;
  const pass=valid&&png.length>35000&&errors.length===0;
  const row={group,motion,angle,venue,pass,pngBytes:png.length,frames:q.frames,models:q.models,errors};result.push(row);
  console.log('R75_NATIVE_GPU_CAST_MOTION',JSON.stringify({group,motion,angle,venue,pass,pngBytes:png.length,
    models:q.models.map(m=>({id:m.id,tris:m.tris,bones:m.bones,tracks:m.tracked,motion:m.observedMovement,moved:m.movedBones,h:m.sourceHeight})),errors}));
  await page.close();
 }
}finally{writeFileSync(resolve(dir,'native-motion-results.json'),JSON.stringify(result,null,2)+'\n');await browser.close()}
if(result.length!==scenes.length||result.some(x=>!x.pass))process.exitCode=4;
