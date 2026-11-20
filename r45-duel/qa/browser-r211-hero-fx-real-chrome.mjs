import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const output='r45-duel/qa/evidence/r211-cinematic-vfx';
mkdirSync(output,{recursive:true});mkdirSync('/tmp/asdc-r211-video',{recursive:true});
const result={ok:false,profiles:['E06','T05','S08'],previewsOnly:true,
    sourceGLBContactRequired:true,errors:[],snapshots:[]};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
   '--enable-features=Vulkan,DefaultANGLEVulkan',
   '--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:1364,height:768},
  recordVideo:{dir:'/tmp/asdc-r211-video',size:{width:1364,height:768}},
  serviceWorkers:'block'});
const page=await ctx.newPage(),video=page.video();
page.on('pageerror',e=>result.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400&&r.url().includes(':18691/'))
 result.errors.push('HTTP '+r.status()+' '+r.url())});
try{
 const url='http://10.10.10.138:18692/r45-duel/?qa=1&seed=1&deck=science&r199PhysicalMagic=on&r200Pbr=on&r200Readable=on&r202BodyHit=on&r203BodyHit=on&r210Elements=on&r211CinematicVfx=on';
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:75000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:135000});
 await page.waitForFunction(()=>{
   const q=document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r211CinematicVfx;
   return q?.material?.textureReady?.fire&&q?.material?.textureReady?.water;
 },null,{timeout:30000});
 const before=await page.evaluate(()=>document.getElementById('stadium').contentWindow.__r45SceneQA);
 result.flags={r211:before.r211CinematicVfx.enabled,r210:before.r210Elements.enabled};
 result.drawCallsBefore=before.drawCalls;
 assert.equal(result.flags.r211,true);
 assert(await page.evaluate(()=>document.getElementById('stadium').contentWindow.__r45SceneQA.previewR210CardElements(['E06','T05','S08'])));
 await page.waitForTimeout(440);
 const stats=await page.evaluate(()=>document.getElementById('stadium').contentWindow.__r45SceneQA);
 result.drawCallsWithThree=stats.drawCalls;
 result.r211=stats.r211CinematicVfx.material;
 result.r210=stats.r210Elements.material;
 const shot=output+'/r211-real-chrome-hero-fire-water-electric-qa.png';
 await page.screenshot({path:shot});result.snapshots.push(shot);
 await page.waitForTimeout(550);
 await page.screenshot({path:output+'/r211-real-chrome-hero-decay-qa.png'});
 assert.equal(result.r211.spawned,3);
 assert.equal(result.r210.spawned,0);
 assert.equal(result.r211.maximumSimultaneous,3);
 assert.equal(result.r211.gameplayMutations,0);
 assert.equal(result.r211.addedGlobalLights,0);
 assert.deepEqual(result.errors,[]);
 result.ok=true;
}catch(e){result.failure=String(e);console.error('R211_GPU_QA_FAILURE',String(e));}
finally{
 await page.close();await ctx.close();await browser.close();
 try{
  const p=await video.path(),dst=output+'/r211-original-chrome-three-hero-vfx-qa-silent.mp4';
  execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
    '-i',p,'-c:v','libx264','-preset','veryfast','-crf','26',
    '-pix_fmt','yuv420p','-movflags','+faststart',dst],{timeout:150000});
  const v=execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size',
    '-of','json',dst],{encoding:'utf8'});
  result.video={path:dst,...JSON.parse(v).format};
 }catch(e){result.videoError=String(e);}
 writeFileSync(output+'/r211-hero-vfx-chrome-report.json',JSON.stringify(result,null,2)+'\n');
 console.log('R211_REAL_GPU_QA_RESULT',JSON.stringify(result));
}
if(!result.ok)process.exitCode=7;
