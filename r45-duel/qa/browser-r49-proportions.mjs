import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out=resolve(import.meta.dirname,'evidence/r49');
mkdirSync(out,{recursive:true});
const variants=[['ultrawide',2560,1080],['wide',1920,1080],['standard',1366,768],['four-three',1024,768],['portrait',430,900],['small',375,667]];
const results=[];let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
  '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
  '--disable-software-rasterizer','--disable-dev-shm-usage']});
 for(const [name,width,height] of variants){
  const p=await browser.newPage({viewport:{width,height}});
  const errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await p.goto((process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10977')+'/r45-duel/?seed=1&qa=1',{waitUntil:'domcontentloaded',timeout:35000});
  await p.waitForFunction('window.__r45QA?.sceneReady',null,{timeout:65000});
  await p.waitForTimeout(500);
  const opening=await p.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const rect=n=>document.querySelector(n).getBoundingClientRect();
   const v=rect('.arena'),h=rect('.hand'),c=rect('.controls');
   return{view:q.framing,occlusion:q.occlusion,arena:[v.x,v.y,v.width,v.height],hand:[h.y,h.height],
    controls:[c.y,c.height],handCount:__r45QA.hand.length,
    screenWidth:document.documentElement.scrollWidth,
    screenHeight:document.documentElement.scrollHeight};
  });
  await p.screenshot({path:resolve(out,name+'-front.png')});
  await p.locator('#camera-right').click();
  await p.waitForTimeout(1050);
  const angle45=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.framing);
  await p.locator('#camera-right').click();
  await p.waitForTimeout(1050);
  const angle90=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.framing);
  await p.screenshot({path:resolve(out,name+'-side.png')});
  await p.locator('#camera-right').click();
  await p.locator('#camera-right').click();
  await p.waitForTimeout(1200);
  const angle180=await p.evaluate(()=>{const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;return{...q.framing,occlusion:q.occlusion}});
  await p.screenshot({path:resolve(out,name+'-back.png')});
  await p.locator('#camera-reset').click();
  await p.waitForTimeout(1000);
  const home=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.framing);
  await p.locator('#hand .card[data-card-id="E01"]').click();
  await p.locator('#play').click();
  const played=await p.evaluate(()=>__r45QA.board.player[0].map(x=>x.id));
  await p.locator('#end').click();
  await p.waitForFunction('window.__r45QA.round===2',null,{timeout:18000});
  const ai=await p.evaluate(()=>__r45QA.board.ai[0].map(x=>x.id));
  const x=opening.view.podiums;
  const within=(n)=>n.front&&Math.abs(n.x)<.95;
  // R49 composition and rear-view occlusion hard gates.
  const comp=opening.view.composition;
  const visual=comp.ring[1]>-.58&&comp.ring[1]<.12&&
   comp.arenaBack[1]>.22&&comp.arenaBack[1]<.90&&
   comp.arenaBack[1]-comp.ring[1]>.40&&
   comp.cameraY>6.5&&opening.controls[0]>.63*height&&
   opening.occlusion.championshipVisible===true&&
   opening.occlusion.reverseVisible===false&&
   angle180.occlusion.championshipVisible===false&&
   angle180.occlusion.reverseVisible===true;
  const passed=visual&&opening.arena[2]===width&&opening.arena[3]===height&&
   opening.screenWidth<=width+2&&opening.screenHeight<=height+2&&
   opening.controls[0]+opening.controls[1]<=height+2&&
   within(x.player)&&within(x.ai)&&
   Math.abs(angle45.yaw-45)<1&&Math.abs(angle90.yaw-90)<1&&
   Math.abs(angle180.yaw-180)<1&&Math.abs(home.yaw)<1&&
   played.includes('E01')&&ai.includes('G01')&&!errors.length;
  const r={name,width,height,opening,angle45,angle90,angle180,home,played,ai,visual,errors,passed};
  results.push(r);
  console.log('R49_VISUAL_COMPOSITION_GATE',JSON.stringify({
   name,passed,visual,view:opening.view,podiums:x,controls:opening.controls,angle45:angle45.yaw,angle90:angle90.yaw,
   angle180:angle180.yaw,reset:home.yaw,errors
  }));
  if(!passed)process.exitCode=3;
  await p.close();
 }
 writeFileSync(resolve(out,'results.json'),JSON.stringify(results,null,2)+'\n');
}catch(e){console.error('R48_IMMERSIVE_FAILED',String(e));process.exitCode=2}
finally{await browser?.close().catch(()=>{})}
