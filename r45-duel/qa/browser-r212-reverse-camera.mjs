import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r212-perf-audit';mkdirSync(dir,{recursive:true});
const base='http://10.10.10.138:18693/r45-duel/?qa=1&seed=1&deck=science&r199PhysicalMagic=on&r210Elements=on&r211CinematicVfx=on';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const results={ok:false,cases:[],errors:[]};
try{
 for(const name of ['baseline','batched']){
  const ctx=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>results.errors.push(name+':'+e.message));
  await page.goto(base+(name==='batched'?'&r212StadiumBatch=on':''),{waitUntil:'domcontentloaded',timeout:75000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:130000});
  for(let i=0;i<4;i++)await page.locator('#camera-right').click();
  await page.waitForTimeout(1500);
  const audit=await page.evaluate(()=>{
   const z=document.getElementById('stadium').contentWindow.__r45SceneQA;
   return {yaw:z.r145ActionShot.orbitDegrees,
    drawCalls:z.drawCalls,banks:z.stadiumSeatBanks,
    audience:z.stadiumAmbience?.audience?.loaded,meshes:z.auditRenderTree().visibleMeshes,
    batch:z.r212StadiumBatch};
  });
  await page.screenshot({path:dir+'/r212-'+name+'-reverse-camera-real-gpu.png'});
  assert(Math.abs(audit.yaw)>=170,'must actually visit 180-degree camera');
  assert(audit.banks.reverse.visible===true,'reverse 3D bleacher must stay visible');
  results.cases.push({name,...audit});
  await ctx.close();
 }
 assert.deepEqual(results.errors,[]);
 const [before,after]=results.cases;
 assert.equal(before.audience,8);
 assert.equal(after.audience,8);
 assert(after.drawCalls<before.drawCalls);
 assert.equal(after.banks.reverse.seatCount,before.banks.reverse.seatCount);
 results.ok=true;
}catch(e){results.failure=String(e)}
finally{
 await browser.close();
 writeFileSync(dir+'/r212-reverse-camera-regression.json',JSON.stringify(results,null,2)+'\n');
 console.log('R212_REVERSE_REGRESSION',JSON.stringify(results).slice(0,11000));
}
if(!results.ok)process.exitCode=7;
