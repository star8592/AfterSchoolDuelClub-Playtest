import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';import{resolve}from'node:path';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11007';
const out=resolve(import.meta.dirname,'evidence/r76');mkdirSync(out,{recursive:true});
const cases=[['wide','idle',0,'studio'],['wide','wave',45,'studio'],['wide','cheer',0,'gym'],['wide','dance',45,'gym'],['wide','angry',90,'studio'],['wide','shrug',180,'gym'],['portrait','idle',0,'gym'],['portrait','cheer',45,'gym']];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});let results=[];
try{for(const [viewport,motion,angle,venue]of cases){
 const page=await browser.newPage({viewport:viewport==='wide'?{width:1600,height:900}:{width:430,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push('JS '+String(e)));page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});page.on('console',m=>{if(m.type()==='error')errors.push('console '+m.text().slice(0,300))});
 await page.goto(`${origin}/r45-duel/qa/r76-cartoony-cast-audition.html?motion=${motion}&angle=${angle}&venue=${venue}`,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__R76_CAST_QA?.ready,null,{timeout:70000});await page.waitForTimeout(2300);
 const q=await page.evaluate(()=>window.__R76_CAST_QA);
 const png=Buffer.from(await page.evaluate(()=>document.querySelector('#stage').toDataURL('image/png').split(',')[1]),'base64');
 const filename=`${viewport}-${motion}-${angle}-${venue}.png`;
 writeFileSync(resolve(out,filename),png);
 const geometry=q.characters.length===4&&q.characters.every(x=>x.pass&&x.triangles>22000&&x.bones>=20&&x.animationCount>=9&&x.sourceHeight>.5);
 const animation=q.characters.every(x=>x.observedMotion>.012);
 const pass=geometry&&animation&&png.length>(venue==='gym'?100000:26000)&&errors.length===0;
 results.push({viewport,motion,angle,venue,pass,pngSize:png.length,characters:q.characters,errors});
 console.log('R76_CARTOON_CAST_GPU',JSON.stringify({viewport,motion,angle,venue,pass,pngSize:png.length,chars:q.characters.map(x=>({id:x.id,clip:x.clip,tris:x.triangles,bones:x.bones,motion:x.observedMotion})),errors}));
 await page.close();
 }}finally{writeFileSync(resolve(out,'R76_GPU_RESULTS.json'),JSON.stringify(results,null,2)+'\n');await browser.close()}
if(results.length!==cases.length||results.some(x=>!x.pass))process.exitCode=4;
