/** R70: real browser sound-gate (autoplay, mix control, all music/foley). */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11000';
const dest=resolve(import.meta.dirname,'evidence/r70');mkdirSync(dest,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const results=[];
try{
 for(const [name,w,h] of [['wide',1600,900],['portrait',430,900]]){
  const page=await browser.newPage({viewport:{width:w,height:h}}),errors=[],bad=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))bad.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:50000});
  // Audio UI must work even when 3D GPU is temporarily unavailable.
  await page.waitForFunction(()=>window.__r45QA?.cardCount>0,null,{timeout:25000});
  const initial=await page.evaluate(()=>window.__r45QA.audio);
  const blocked=initial.enabled===false&&initial.counters.musicStart===0;
  await page.locator('#audio-toggle').click();
  await page.waitForFunction(()=>window.__r45QA.audio.decodedCues===9,null,{timeout:45000});
  await page.waitForFunction(()=>window.__r45QA.audio.counters.musicStart>=1,null,{timeout:15000});
  const started=await page.evaluate(()=>window.__r45QA.audio);
  // Audio settings must be adjustable with real elements, not fake labels.
  await page.locator('#audio-settings summary').click();
  await page.locator('#audio-music').evaluate(el=>{el.value='33';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#audio-sfx').evaluate(el=>{el.value='64';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#audio-voice').evaluate(el=>{el.value='80';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#audio-settings summary').click();
  const cards=page.locator('#hand .card:not([disabled])');
  const selectable=await cards.count();
  if(selectable)await cards.first().click();
  const play=page.locator('#play');
  const allowed=selectable&&await play.isEnabled();
  if(allowed)await play.click();
  await page.waitForTimeout(250);
  const after=await page.evaluate(()=>window.__r45QA.audio);
  const button=await page.locator('#audio-toggle').getAttribute('aria-pressed');
  await page.screenshot({path:resolve(dest,`audio-${name}.png`)});
  await page.locator('#audio-toggle').click();
  const muted=await page.evaluate(()=>window.__r45QA.audio.enabled===false);
  const pass=blocked&&started.decodedCues===9&&started.counters.musicStart>=1&&
    after.counters.cue>=1&&after.volume.music===.33&&after.volume.sfx===.64&&
    after.volume.voice===.8&&button==='true'&&muted&&!errors.length&&!bad.length;
  const row={name,pass,blocked,selectable,allowed,initial,started,after,muted,errors,bad};
  results.push(row);console.log('R70_REAL_AUDIO_BROWSER',JSON.stringify({name,pass,blocked,
   decoded:started.decodedCues,musicStart:started.counters.musicStart,
   sfx:after.counters.cue,voices:after.voiceClipCount,mute:muted,errors,bad}));
  await page.close();
 }
}finally{writeFileSync(resolve(dest,'audio-browser-results.json'),JSON.stringify(results,null,2)+'\n');await browser.close()}
if(results.length!==2||results.some(x=>!x.pass))process.exitCode=2;
