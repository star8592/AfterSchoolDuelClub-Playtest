import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [device,width,height] of [['desktop',1280,720],['mobile',430,900]]){
  const p=await b.newPage({viewport:{width,height}});
  await p.goto('http://127.0.0.1:18664/r45-duel/?qa=1&r164Broadcast=on&seed=164',
   {waitUntil:'domcontentloaded',timeout:55000});
  await p.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:85000});
  const d=await p.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const out={};
   for(const z of [-11,-8,-6,-4]){
    for(const y of [2.5,3.5,4.5,5.5,6.5]){
     const pos=q.projectQA(7,y,z);out[z+':'+y]=pos.map(x=>Math.round(x*100)/100);
    }
   }
   return out;
  });
  console.log('R164_LOCATION_PROJECTION',device,JSON.stringify(d));
  await p.close();
 }
}finally{await b.close()}
