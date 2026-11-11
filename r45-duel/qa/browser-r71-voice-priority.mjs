/** R71: real Chromium speech queue priority + ducking; audio-only acceptance. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11001';
const out=resolve(import.meta.dirname,'evidence/r71');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const rows=[];
try{
 for(const [screen,w,h] of [['desktop',1600,900],['mobile',430,900]]){
  const p=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  p.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/assets/audio'))errors.push('HTTP '+r.status()+' '+r.url())});
  await p.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:50000});
  await p.waitForFunction(()=>window.__r45QA?.cardCount>0,null,{timeout:40000});
  await p.locator('#audio-toggle').click();
  await p.waitForFunction(()=>window.__r45QA.audio.decodedCues===9&&window.__r45QA.audio.voiceClipCount>=12,null,{timeout:50000});
  const scheduled=await p.evaluate(()=>['E01','G01','T01'].map(id=>window.__r45QA.audioVoiceSample(id)));
  const entrances=await p.evaluate(()=>window.__r45QA.audio);
  const attack=await p.evaluate(()=>window.__r45QA.audioVoiceSample('G01','attack'));
  await p.waitForFunction(()=>window.__r45QA.audio.currentVoiceKey==='G01:attack',null,{timeout:6000});
  const combat=await p.evaluate(()=>window.__r45QA.audio);
  await p.screenshot({path:resolve(out,`${screen}-queue-priority.png`)});
  await p.waitForFunction(()=>{const a=window.__r45QA.audio;return !a.voicePlaying&&a.voiceQueue.length===0&&a.counters.voice>=3},null,{timeout:42000});
  const drained=await p.evaluate(()=>window.__r45QA.audio);
  const accepted=scheduled.every(Boolean)&&entrances.voiceQueue.length===2&&entrances.voicePlaying&&attack&&
    combat.currentVoiceKey==='G01:attack'&&combat.counters.voiceInterrupted>=1&&
    combat.musicDucked&&drained.voiceQueue.length===0&&!drained.musicDucked&&!drained.voicePlaying&&
    drained.counters.errors===0&&!errors.length;
  // Static click-driven mute must clear an active voice and its pending queue.
  const requeued=await p.evaluate(()=>[window.__r45QA.audioVoiceSample('E03'),window.__r45QA.audioVoiceSample('E04')]);
  await p.locator('#audio-toggle').click();
  const stopped=await p.evaluate(()=>window.__r45QA.audio);
  const muted=!stopped.enabled&&!stopped.voicePlaying&&!stopped.musicDucked&&stopped.voiceQueue.length===0;
  const pass=accepted&&requeued.every(Boolean)&&muted;
  const row={screen,pass,scheduled,attack,entrances,combat,drained,stopped,errors};rows.push(row);
  console.log('R71_QWEN_QUEUE_PRIORITY',JSON.stringify({screen,pass,scheduled,attack,
   attackCurrent:combat.currentVoiceKey,interrupted:combat.counters.voiceInterrupted,
   voicePlayed:drained.counters.voice,queueDrained:drained.voiceQueue.length===0,
   musicUnducked:!drained.musicDucked,muted,errors}));
  await p.close();
 }
}finally{writeFileSync(resolve(out,'priority-results.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
if(rows.length!==2||rows.some(x=>!x.pass))process.exitCode=3;
