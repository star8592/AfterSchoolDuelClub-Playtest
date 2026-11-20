/** R207 real GPU Chrome + real HTMLAudioElement, no text masquerading as speech. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root='r45-duel/qa/evidence/r207-idle-voices';
mkdirSync(root,{recursive:true});
const report={pass:false,errors:[],checks:[],clips:[],source:'real Chrome WebGL2/Qwen3 local Opus'};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
  '--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
  '--disable-software-rasterizer','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1440,height:860},serviceWorkers:'block'});
const page=await context.newPage();
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.url().startsWith('http://127.0.0.1:18689/')&&r.status()>=400)
 report.errors.push('HTTP '+r.status()+' '+r.url())});
const snap=()=>page.evaluate(()=>{
 const qa=window.__r45QA;
 return{hp:qa.hp,round:qa.round,events:qa.events,phase:qa.phase,
  r207:qa.r207Chatter,audio:qa.audio,
  bubble:document.getElementById('spoken-words')?.textContent,
  bubbleHidden:document.getElementById('spoken-dialogue')?.hidden,
  camera:document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r145ActionShot?.enabled}
});
try{
 await page.goto('http://127.0.0.1:18689/r45-duel/?qa=1&seed=3&r207Chatter=on&r207Quick=on&r205LivingSummons=on&r206MusicTeacher=on&r204Caster=on',
  {waitUntil:'domcontentloaded',timeout:75000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:120000});
 await page.waitForFunction(()=>window.__r45QA?.audio?.assetsReady===true,null,{timeout:30000});
 // Native audio may require a gesture in a stricter browser. This explicit
 // UI gesture follows the actual shipped audio toggle state machine.
 if(!(await snap()).audio.enabled){
  await page.locator('#audio-toggle').click();
  await page.locator('#audio-toggle').click();
 }
 await page.waitForFunction(()=>window.__r45QA?.audio?.enabled===true,null,{timeout:15000});
 const beginning=await snap();
 assert(beginning.r207.quick&&beginning.r207.registeredCharacters===16);
 await page.waitForFunction(()=>window.__r45QA?.audio?.speechHistory?.some(x=>x.kind==='idle'),
  null,{timeout:60000});
 const first=await snap();
 const rec=first.audio.speechHistory.filter(x=>x.kind==='idle').at(-1);
 assert(rec&&rec.text&&rec.duration_seconds>.5);
 assert.equal(first.bubble,rec.text);
 assert.equal(first.camera,false);
 assert.deepEqual(first.hp,beginning.hp);
 assert.deepEqual(first.events,beginning.events);
 await page.screenshot({path:root+'/r207-real-chrome-idle-speaker-and-subtitle.png'});
 report.checks.push({kind:'real-scheduled-idle-speaking',id:rec.id,
  text:rec.text,variant:rec.variant,duration:rec.duration_seconds});
 await page.waitForFunction(()=>window.__r45QA.audio.speechHistory.filter(x=>x.kind==='idle').length>=2,null,{timeout:60000});
 const second=await snap();
 const said=second.audio.speechHistory.filter(x=>x.kind==='idle');
 assert(said.length>=2);
 assert.notEqual(said.at(-1).id,said.at(-2).id,'two consecutive voices must not repeat one person');
 assert.deepEqual(second.hp,beginning.hp);
 assert.deepEqual(second.events,beginning.events);
 report.checks.push({kind:'no-rules-mutation-while-idle',round:second.round,
  transcriptCount:said.length,uniqueSpeakerCount:new Set(said.map(x=>x.id)).size});
 // Test genuine, character-matched M01 recorded idle without inventing 3D
 // lip sync for source models that lack a driven face morph.
 await page.waitForFunction(()=>!window.__r45QA.audio.voicePlaying&&
  window.__r45QA.audio.voiceQueue.length===0,null,{timeout:20000});
 const ok=await page.evaluate(()=>window.__r45QA.r207VoiceSample('M01'));
 assert.equal(ok,true);
 await page.waitForFunction(()=>window.__r45QA.audio.speechHistory.some(x=>x.id==='M01'&&x.kind==='idle'),
  null,{timeout:16000});
 const music=await snap();
 const spoken=music.audio.speechHistory.filter(x=>x.id==='M01'&&x.kind==='idle').at(-1);
 assert(spoken.text.includes('拍')||spoken.text.includes('指挥'));
 assert.equal(music.bubble,spoken.text);
 report.checks.push({kind:'original-m01-voice-and-caption',text:spoken.text,variant:spoken.variant});
 await page.screenshot({path:root+'/r207-real-chrome-music-teacher-voice-caption.png'});
 await page.goto('http://127.0.0.1:18689/r45-duel/?qa=1&seed=3',
  {waitUntil:'domcontentloaded',timeout:75000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:120000});
 const off=await snap();
 assert.equal(off.r207.enabled,false);
 assert.equal(await page.evaluate(()=>window.__r45QA.r207VoiceSample('M01')),false);
 report.checks.push({kind:'default-production-off',pass:true});
 assert.deepEqual(report.errors,[]);
 report.pass=true;
 console.log('R207_REAL_CHROME_16_CHARACTERS_RANDOM_RECORDED_IDLE_VOICE_PASS',
  JSON.stringify({checks:report.checks,errors:report.errors}));
}finally{
 writeFileSync(root+'/r207-real-chrome-scheduler-report.json',JSON.stringify(report,null,2)+'\n');
 await context.close();await browser.close();
}
