import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11115';
const out=resolve(import.meta.dirname,'evidence/r113-voice');mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[],screenshots:[]};
const ok=(test,title,data)=>{report.checks.push({passed:!!test,title,data});
 if(!test)throw Error(title+' '+JSON.stringify(data).slice(0,600))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-webgl',
 '--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=113',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady&&window.__r45QA?.audio?.assetsReady,null,{timeout:160000});
  const sample=()=>page.evaluate(()=>window.__r45QA.audio);
  let initial=await sample();
  if(!initial.enabled&&initial.requested){
   await page.locator('#audio-toggle').click();
   await page.locator('#audio-toggle').click();
  }
  await page.waitForFunction(()=>window.__r45QA.audio.enabled,null,{timeout:10000});
  initial=await sample();
  ok(initial.paClipCount===9,view+' 9 genuine Qwen3 PA/social sources',initial.paClipCount);
  ok(initial.voiceClipCount===16,view+' original actor manifest isolated',initial.voiceClipCount);
  let spoken=initial.lastSpoken;
  if(spoken?.id!=='STADIUM_PA'){
   const started=await page.evaluate(()=>window.__r45QA.audioPASample('start'));
   ok(started,view+' actual PA start triggers real Opus',started);
   await page.waitForFunction(()=>window.__r45QA.audio.lastSpoken?.id==='STADIUM_PA',null,{timeout:15000});
  }
  spoken=(await sample()).lastSpoken;
  ok(spoken.text==='同学们注意！放学后决斗社，现在开战！',
    view+' audio/caption text are identical',spoken);
  await page.screenshot({path:resolve(out,view+'-qwen-pa-subtitles.png')});
  report.screenshots.push(view+'-qwen-pa-subtitles.png');
  await page.waitForFunction(()=>!window.__r45QA.audio.voicePlaying,null,{timeout:12000});
  const social=await page.evaluate(()=>window.__r45QA.audioSocialSample(
   'player','嘘……听说食堂今天又做茄子炒香蕉。'));
  ok(social,view+' real low-voice banter',social);
  await page.waitForFunction(()=>window.__r45QA.audio.lastSpoken?.variant==='whisper_player',null,{timeout:10000});
  const socialText=(await sample()).lastSpoken;
  ok(socialText.id==='HOST_PLAYER'&&socialText.text==='嘘……听说食堂今天又做茄子炒香蕉。',
   view+' cast voice and text preserve speaker identity',socialText);
  await page.locator('#audio-toggle').click();
  const muted=await sample();
  ok(!muted.requested&&!await page.evaluate(()=>window.__r45QA.audioPASample('win_player')),
   view+' persistent mute blocks new PA',muted);
  ok(errors.length===0,view+' no JavaScript/assets failures',errors);
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r113-qwen-pa-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R113_QWEN_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
