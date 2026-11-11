/** Verify in-game browser streaming of actual 1.7B Qwen3-TTS output. */
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11000';
const dest=resolve(import.meta.dirname,'evidence/r70');mkdirSync(dest,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const rows=[];
try{
 for(const [device,w,h] of [['wide',1600,900],['portrait',430,900]]){
  const page=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/assets/audio'))errors.push(`HTTP ${r.status()} ${r.url()}`)});
  await page.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForFunction(()=>window.__r45QA?.cardCount>0,null,{timeout:30000});
  const prior=await page.evaluate(()=>window.__r45QA.audio);
  await page.locator('#audio-toggle').click();
  await page.waitForFunction(()=>window.__r45QA.audio.voiceClipCount>=11,null,{timeout:45000});
  await page.waitForFunction(()=>window.__r45QA.audio.decodedCues===9,null,{timeout:45000});
  const requested=await page.evaluate(()=>window.__r45QA.audioVoiceSample('E01'));
  await page.waitForFunction(()=>window.__r45QA.audio.counters.voice>=1,null,{timeout:15000});
  const playing=await page.evaluate(()=>window.__r45QA.audio);
  await page.waitForFunction(()=>!window.__r45QA.audio.voicePlaying,null,{timeout:15000});
  const after=await page.evaluate(()=>window.__r45QA.audio);
  const pass=!prior.enabled&&requested&&playing.musicDucked&&playing.voicePlaying&&
    !after.musicDucked&&!after.voicePlaying&&after.counters.voice>=1&&
    after.counters.errors===0&&after.voiceClipCount>=11&&!errors.length;
  rows.push({device,pass,requested,prior,playing,after,errors});
  console.log('R70_QWEN3_TTS_REAL_PLAYBACK',JSON.stringify({device,pass,requested,voiceCount:after.voiceClipCount,
   duckedDuring:playing.musicDucked,duckedAfter:after.musicDucked,plays:after.counters.voice,errors}));
  await page.close();
 }
}finally{writeFileSync(resolve(dest,'qwen3-voice-browser.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
if(rows.length!==2||rows.some(x=>!x.pass))process.exitCode=3;
