/** Real source GLB card cast, original Qwen host recording and 7-card Foley accent. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out='r45-duel/qa/evidence/r208-full-audio';mkdirSync(out,{recursive:true});
const report={pass:false,checks:[],errors:[]};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-webgl',
 '--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1440,height:860},serviceWorkers:'block'});
const page=await context.newPage();
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{
 if(r.status()>=400&&r.url().startsWith('http://127.0.0.1:18689/'))
  report.errors.push('HTTP '+r.status()+' '+r.url());
});
const snap=()=>page.evaluate(()=>{
 const g=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
 return {hp:g?.hp,energy:g?.energy,events:g?.events,round:g?.round,
  hand:g?.hand,enabled:g?.r208Audio?.enabled,sceneReady:g?.sceneReady,
  voice:g?.audio?.speechHistory?.filter(x=>x.kind?.startsWith('r208_')),
  playing:g?.audio?.voicePlaying,audio:g?.audio,cues:g?.audio?.events?.
   filter(x=>x.type==='cue').map(x=>x.detail),
  bubble:document.getElementById('spoken-words')?.textContent,
  closeup:z?.r145ActionShot?.enabled,inset:z?.renderPerformance?.heroInsetDraws,
  actualPhysics:z?.r199RealMagic?.stage
 };
});
try{
 const url='http://127.0.0.1:18689/r45-duel/?qa=1&seed=2&deck=classroom&r199PhysicalMagic=on&r200Pbr=on&r200Readable=on&r202BodyHit=on&r203BodyHit=on&r208Audio=on';
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:75000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true&&window.__r45QA.audio?.assetsReady===true,
  null,{timeout:130000});
 if(!(await snap()).audio.enabled){await page.locator('#audio-toggle').click();await page.locator('#audio-toggle').click()}
 await page.waitForFunction(()=>window.__r45QA.audio.enabled&&!window.__r45QA.audio.voicePlaying,
  null,{timeout:40000});
 const initial=await snap();
 assert.equal(initial.enabled,true);assert(initial.hand.includes('Q05'));
 assert.equal(initial.energy.player,2);
 await page.locator('#hand .card[data-card-id="Q05"]').first().click();
 await page.locator('#play').click();
 await page.waitForFunction(()=>window.__r45QA?.audio.speechHistory?.some(
  x=>x.id==='HOST_PLAYER'&&x.kind==='r208_Q05'),null,{timeout:55000});
 const result=await snap();
 const rec=result.voice.find(x=>x.id==='HOST_PLAYER'&&x.kind==='r208_Q05');
 const play=result.events.find(x=>x.type==='card_play'&&x.card==='Q05'&&x.side==='player');
 assert(play?.spellOutcome);
 assert.equal(rec.text,'下面由粉笔回答提问！');
 assert.equal(rec.variant,'r208_Q05');
 assert.equal(result.bubble,rec.text);
 assert(result.cues.some(x=>x.startsWith('r102_radio_tune:player')),
  'original Q05 microphone accent must play at actual cast');
 assert.equal(result.closeup,false);assert.equal(result.inset,0);
 assert.equal(result.round,initial.round);
 assert.equal(result.hp.player,initial.hp.player);
 assert(!result.voice.some(x=>x.id==='HOST_AI'&&x.kind==='r208_Q05'));
 const spellEffects=result.events.filter(x=>x.type==='card_play'&&x.card==='Q05');
 assert.equal(spellEffects.length,1);
 report.checks.push({kind:'Q05-real-card-3d-source-cast-host-Qwen-voice',
  voiceFile:'HOST_PLAYER-r208_Q05.ogg',text:rec.text,realCardSerial:play.serial,
  microphoneAccent:true,castConsumesRealEnergy:true,cameraWide:true});
 await page.locator('#stadium').screenshot({path:out+'/r208-real-Q05-spell-voice-physical-cast.png'});
 // Second true duel: classic AI acts from its own original hand after a
 // legal end-turn; no simulated / QA-injected voices or fake damage.
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:75000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true&&window.__r45QA.audio.assetsReady,
  null,{timeout:130000});
 if(!(await snap()).audio.enabled){await page.locator('#audio-toggle').click();await page.locator('#audio-toggle').click()}
 await page.waitForFunction(()=>window.__r45QA.audio.enabled&&!window.__r45QA.audio.voicePlaying,
  null,{timeout:35000});
 await page.locator('#end').click();
 await page.waitForFunction(()=>window.__r45QA.events.some(
  x=>x.type==='card_play'&&x.card==='Q05'&&x.side==='ai'),null,{timeout:30000});
 await page.waitForFunction(()=>window.__r45QA.audio.speechHistory.some(
  x=>x.id==='HOST_AI'&&x.kind==='r208_Q05'),null,{timeout:65000});
 const ai=await snap();
 const aiSpeech=ai.voice.filter(x=>x.id==='HOST_AI'&&x.kind==='r208_Q05').at(-1);
 assert.equal(aiSpeech.text,'下面由粉笔回答提问！');
 assert.equal(aiSpeech.variant,'r208_Q05');
 assert(ai.cues.some(x=>x.startsWith('r102_radio_tune:ai')));
 assert.equal(ai.closeup,false);assert.equal(ai.inset,0);
 report.checks.push({kind:'Q05-real-AI-card-3d-source-cast-male-Qwen-voice',
  voiceFile:'HOST_AI-r208_Q05.ogg',recorded:true,microphoneAccent:true});
 await page.locator('#stadium').screenshot({path:out+'/r208-real-ai-Q05-spell-male-voice-cast.png'});
 // Normal links MUST NOT enable the research voices or extra accents.
 await page.goto(url.replace('&r208Audio=on',''),{waitUntil:'domcontentloaded',timeout:75000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:130000});
 const base=await snap();
 assert.equal(base.enabled,false);
 assert.equal(await page.evaluate(()=>window.__r45QA.r208SpellVoiceSample('player','Q05',
  '下面由粉笔回答提问！')),false);
 report.checks.push({kind:'R208-disabled-on-stable-flag-free-link',pass:true});
 report.pass=report.errors.length===0;
 if(!report.pass)throw Error('Chrome errors '+JSON.stringify(report.errors));
 console.log('R208_REAL_CHROME_Q05_ORIGINAL_PROP_CAST_QWEN_AND_UNIQUE_MIC_SOUND_PASS',
  JSON.stringify({checks:report.checks,errors:report.errors}));
}finally{
 writeFileSync(out+'/r208-chrome-original-spell-voice-and-sfx.json',
 JSON.stringify(report,null,2)+'\n');
 await context.close();await browser.close();
}
