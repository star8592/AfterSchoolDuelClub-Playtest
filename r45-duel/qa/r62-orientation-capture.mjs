import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
try{
 for(const id of ['E02','E03','G02','T01','T02']){
  const p=await browser.newPage({viewport:{width:1152,height:440}});
  p.on('pageerror',e=>console.log('FACE_ERR',id,String(e)));
  await p.goto('http://127.0.0.1:10992/r45-duel/qa/r62-orientation-view.html?id='+id,{waitUntil:'domcontentloaded',timeout:20000});
  await p.waitForFunction(()=>window.__R62_FACE_QA?.ready,null,{timeout:45000});
  await p.screenshot({path:'r45-duel/qa/evidence/r62/source-front-'+id+'.png'});
  console.log('FACE_OK',id,JSON.stringify(await p.evaluate(()=>window.__R62_FACE_QA)));
  await p.close();
 }
}finally{await browser.close()}
