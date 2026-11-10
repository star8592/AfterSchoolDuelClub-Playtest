import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root='http://127.0.0.1:10976/r45-duel/art/portrait-studio.html?id=';
let b;
try{
 b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
 // Warm up the first GPU WebGL shader pipeline. First context screenshots
 // can be an all-white unpainted compositor surface even after rAF.
 {
  const warm=await b.newPage({viewport:{width:480,height:650}});
  await warm.goto(root+'E01&angle=3.14159',{waitUntil:'domcontentloaded',timeout:30000});
  await warm.waitForFunction('window.__portraitQA?.ready',null,{timeout:60000});
  await warm.waitForTimeout(550);
  await warm.close();
 }
 for(const [id,expectedBones] of [['E01',148],['G01',107]]){
  const p=await b.newPage({viewport:{width:480,height:650},deviceScaleFactor:1,hasTouch:false});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(root+id,{waitUntil:'domcontentloaded',timeout:30000});
  await p.waitForFunction('window.__portraitQA?.ready',null,{timeout:60000});
  const q=await p.evaluate(()=>({id:window.__portraitQA.id,bones:window.__portraitQA.bones,meshes:window.__portraitQA.meshes}));
  if(q.bones!==expectedBones||q.meshes<25||errors.length)throw Error('INVALID_REAL_MESH '+id+' '+JSON.stringify({q,errors}));
  await p.waitForTimeout(330);
  await p.screenshot({path:resolve(import.meta.dirname,'../art/portrait-src/'+id+'-vrm-portrait.png'),omitBackground:true});
  console.log('R46_AUTHENTIC_VRM_CARD_PORTRAIT',JSON.stringify(q));
  await p.close();
 }
// Convert only actual captured VRM renders into production card crops.
 execFileSync('python3',[resolve(import.meta.dirname,'../art/build-card-crops.py')],{stdio:'inherit'});
}catch(e){console.error('CARD_PORTRAIT_PIPELINE_FAILED',String(e));process.exitCode=2}
finally{await b?.close().catch(()=>{})}
