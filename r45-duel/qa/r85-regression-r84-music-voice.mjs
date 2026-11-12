import {createRequire} from 'node:module';
import{writeFileSync,mkdirSync}from'node:fs';
import{resolve}from'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const URL='http://127.0.0.1:11025/r45-duel/?qa=1&seed=1';
const EVIDENCE=resolve(import.meta.dirname,'evidence/r85');
mkdirSync(EVIDENCE,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=user-gesture-required','--enable-webgl',
 '--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const results={pass:false,errors:[],checks:[]};
try{
 for(const [name,viewport] of [['desktop',{width:1600,height:900}],['mobile',{width:430,height:900}]]){
  const page=await browser.newPage({viewport});
  page.on('pageerror',e=>results.errors.push(name+':'+e.message));
  page.on('response',r=>{
   if(r.status()>=400&&r.url().includes('/r45-duel/assets/audio/'))
    results.errors.push(name+':HTTP '+r.status()+' '+r.url());
  });
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:48000});
  await page.waitForFunction(()=>window.__r45QA?.cardCount>0,null,{timeout:45000});
  await page.locator('#hand .card:not([disabled])').first().click();
  await page.waitForFunction(()=>window.__r45QA.audio.counters.musicStart>=1&&
   window.__r45QA.audio.decodedCues===17,null,{timeout:48000});
  const audioBefore=await page.evaluate(()=>window.__r45QA.audio);
  await page.locator('#play').click();
  await page.waitForFunction(()=>window.__r45QA.audio.counters.voice>=1,null,{timeout:22000});
  await page.locator('#end').click();
  await page.waitForFunction(()=>window.__r45QA.audio.musicHistory.length>=1,null,{timeout:23000});
  await page.waitForTimeout(1900);
  const afterRound=await page.evaluate(()=>window.__r45QA.audio);
  const selected=[];
  for(let i=0;i<3;i++){
    await page.waitForTimeout(780);
    await page.evaluate(()=>window.__r45QA.audioVoiceSample('E01','enter'));
    const item=await page.evaluate(()=>window.__r45QA.audio.voiceVariantHistory.at(-1)?.variant);
    selected.push(item);
  }
  const audioAfter=await page.evaluate(()=>window.__r45QA.audio);
  await page.screenshot({path:resolve(EVIDENCE,'r84-real-game-'+name+'.png')});
  const pass=audioBefore.requested&&audioBefore.enabled&&
   audioBefore.musicTracks.length===7&&
   audioBefore.counters.musicStart>=1&&
   afterRound.musicHistory.length>=1&&
   afterRound.counters.musicStart>=2&&
   new Set(selected).size===3&&
   audioAfter.counters.voice>=1;
  results.checks.push({name,pass,opening:audioBefore.musicKind,
   tracks:audioBefore.musicTracks,
   roundTrack:afterRound.musicKind,musicHistory:afterRound.musicHistory,
   selectedVoiceVariants:selected,
   voicesPlayed:audioAfter.counters.voice,voiceHistory:audioAfter.voiceVariantHistory.slice(-7),
   audioErrors:audioAfter.counters.errors});
  await page.close();
 }
 results.pass=results.checks.every(r=>r.pass)&&!results.errors.length;
}catch(e){results.errors.push(String(e))}
finally{writeFileSync(resolve(EVIDENCE,'r84-music-voice-browser.json'),
 JSON.stringify(results,null,2)+'\n');
 console.log('R84_MUSIC_VOICE_BROWSER',JSON.stringify(results));
 await browser.close();if(!results.pass)process.exitCode=5;}
