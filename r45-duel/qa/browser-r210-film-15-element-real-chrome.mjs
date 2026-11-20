/** R210 original Chrome/Three.js GPU screencast, NOT generative imagery.
 * Five strictly QA scene-only element preview groups, then a genuine S08 card.
 * MP4 is silent because Playwright video records pixels only.
 */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const output='r45-duel/qa/evidence/r210-physical-elements';
const rawDir='/tmp/asdc-r210-chrome-video-raw';mkdirSync(rawDir,{recursive:true});
mkdirSync(output,{recursive:true});
const report={ok:false,kind:'original real Chrome GPU video',silent:true,
 previewIsPresentationOnly:true,errors:[],groups:[]};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
  '--enable-features=Vulkan,DefaultANGLEVulkan',
  '--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:1280,height:720},
 recordVideo:{dir:rawDir,size:{width:1280,height:720}},serviceWorkers:'block'});
const page=await ctx.newPage(),video=page.video(),startedAt=Date.now();
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{
 if(r.status()>=400&&r.url().startsWith('http://127.0.0.1:18689/'))
  report.errors.push('HTTP '+r.status()+' '+r.url());
});
try{
 const url='http://127.0.0.1:18689/r45-duel/?qa=1&seed=1&deck=science&r199PhysicalMagic=on&r200Pbr=on&r200Readable=on&r202BodyHit=on&r203BodyHit=on&r210Elements=on';
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:75000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:130000});
 await page.waitForTimeout(900);
 report.skipSeconds=Math.max(0,(Date.now()-startedAt)/1000-.45);
 for(const cards of [['E06','T05','K06'],['S04','P07','Q05'],
  ['K03','G05','E05'],['Q07','Q03','Q04'],['S01','S07','K01']]){
  assert(await page.evaluate(ids=>document.getElementById('stadium').
   contentWindow.__r45SceneQA.previewR210CardElements(ids),cards));
  report.groups.push(cards);
  await page.waitForTimeout(1600);
 }
 // Real legal 2-mana S08 card, not QA preview; real source GLB collision.
 await page.locator('#hand .card[data-card-id="S08"]').first().click();
 await page.locator('#play').click();
 await page.waitForFunction(()=>window.__r45QA?.events?.some(e=>
  e.type==='card_play'&&e.card==='S08'&&e.side==='player'&&e.spellOutcome)&&
  (document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r210Elements?.
  material?.observedElements?.electric||0)>1,null,{timeout:55000});
 await page.waitForTimeout(1400);
 const g=await page.evaluate(()=>window.__r45QA);
 report.realS08=!!g.events.some(e=>e.type==='card_play'&&e.card==='S08'&&e.side==='player');
 assert(report.realS08);
 assert.equal(report.groups.length,5);
 assert.deepEqual(report.errors,[]);
 report.ok=true;
}catch(e){report.failure=String(e);console.error('R210_ORIGINAL_VIDEO_ERROR',String(e))}
finally{
 await page.close();await ctx.close();await browser.close();
 const src=await video.path();
 const dest=output+'/r210-15-elements-original-chrome-gpu-and-real-S08-silent.mp4';
 try{
  execFileSync('ffmpeg',['-nostdin','-y','-hide_banner','-loglevel','error',
   '-ss',String(Math.max(0,report.skipSeconds||0)),'-i',src,
   '-c:v','libx264','-preset','veryfast','-crf','26','-pix_fmt','yuv420p',
   '-movflags','+faststart',dest],{timeout:150000});
  const raw=execFileSync('ffprobe',['-v','error','-show_entries','format=duration,size',
   '-of','default=noprint_wrappers=1:nokey=1',dest],{encoding:'utf8'}).trim().split('\n');
  report.video={path:dest,durationSeconds:Number(raw[0]),bytes:Number(raw[1])};
  console.log('R210_ORIGINAL_REAL_CHROME_SILENT_GPU_VIDEO',JSON.stringify(report));
 }catch(e){report.ok=false;report.videoFailure=String(e);console.error('R210_VIDEO_FFMPEG_ERROR',String(e))}
 writeFileSync(output+'/r210-original-gpu-video-report.json',JSON.stringify(report,null,2)+'\n');
}
if(!report.ok)process.exitCode=7;
