/** Real Chrome GPU capture: NOT a synthetic/rendered product animation. */
import assert from'node:assert/strict';
import{createRequire}from'node:module';
import{mkdirSync,copyFileSync,writeFileSync}from'node:fs';
import{execFileSync}from'node:child_process';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r202-body-impact';
mkdirSync(dir,{recursive:true});
const ids=['E06','Q05','K01','K07','P07'];
const errors=[],receipt={source:'Chrome/Vulkan/WebGL2 real gameplay',
 screenSize:'1440x860',videoCapture:'Playwright real page video, silent by design',
 ids,errors,pass:false};
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const c=await b.newContext({viewport:{width:1440,height:860},
 recordVideo:{dir,size:{width:1152,height:688}},
 serviceWorkers:'block'});
const page=await c.newPage();
page.on('pageerror',e=>errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
try{
 const url='http://127.0.0.1:18689/r45-duel/?qa=1&r199PhysicalMagic=on&r199Showcase=on&r200Pbr=on&r200Readable=on&r202BodyHit=on&seed=173';
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:120000});
 await page.waitForFunction(()=>document.querySelectorAll('.r199-spells button').length===46);
 await page.waitForTimeout(300);
 let n=0;
 for(const id of ids){
  await page.locator('.r199-launch').click();
  await page.locator('.r199-spells button[data-magic-id="'+id+'"]').click();
  n++;
  await page.waitForFunction(value=>{
   const m=document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r199RealMagic?.stage;
   return m?.previewBodyContacts>=value;
  },n,{timeout:55000});
  await page.waitForTimeout(1800);
  const frame=await page.evaluate(()=>{
   const z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
   return {id:z?.r202HostImpact?.ai?.id,head:z?.r202HostImpact?.ai?.time,
    prop:z?.r199RealMagic?.stage?.lastBySide?.player,zoom:z?.r145ActionShot?.enabled,
    old:z?.magicArsenal?.played,inset:z?.renderPerformance?.heroInsetDraws};
  });
  assert.equal(frame.id,id);
  assert.equal(frame.zoom,false);assert.equal(frame.inset,0);assert.equal(frame.old,0);
  receipt[id]=frame;
 }
 await page.waitForTimeout(400);
 assert.deepEqual(errors,[]);
 receipt.pass=true;
}finally{
 const video=page.video();
 await c.close();
 const original=await video.path();
 copyFileSync(original,dir+'/r202-five-real-opponent-hits-silent.webm');
 await b.close();
}
if(receipt.pass){
 execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error',
 '-i',dir+'/r202-five-real-opponent-hits-silent.webm',
 '-c:v','libx264','-preset','veryfast','-crf','27',
 '-pix_fmt','yuv420p','-r','18',
 '-an','-movflags','+faststart',
 dir+'/r202-five-real-opponent-hits-silent.mp4']);
 console.log('R202_GENUINE_CHROME_5_SIGNATURE_VIDEO_PASS',JSON.stringify({
  identities:ids,noCloseups:true,silent:true,errors:[]}));
}
writeFileSync(dir+'/r202-genuine-browser-film.json',JSON.stringify(receipt,null,2)+'\n');
