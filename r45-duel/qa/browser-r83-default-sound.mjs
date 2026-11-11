import {createRequire} from 'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const require=createRequire(import.meta.url);
const{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out=resolve(import.meta.dirname,'evidence/r83');mkdirSync(out,{recursive:true});
const BASE='http://127.0.0.1:11021/r45-duel/?qa=1&seed=1';
const results=[];
async function restrictive(viewport,name){
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
    '--disable-software-rasterizer','--disable-dev-shm-usage','--autoplay-policy=user-gesture-required']});
 const ctx=await browser.newContext({viewport});const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/assets/audio/'))errors.push('HTTP '+r.status()+' '+r.url())});
 try{
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__r45QA?.cardCount>0,null,{timeout:35000});
  const initial=await page.evaluate(()=>window.__r45QA.audio);
  const pressed=await page.locator('#audio-toggle').getAttribute('aria-pressed');
  // Crucially: NO click on sound-enable. Click only a regular card.
  await page.locator('#hand .card:not([disabled])').first().click();
  await page.waitForFunction(()=>window.__r45QA?.audio?.enabled===true,null,{timeout:20000});
  await page.waitForFunction(()=>window.__r45QA?.audio?.decodedCues===17,null,{timeout:45000});
  await page.waitForFunction(()=>window.__r45QA?.audio?.counters?.musicStart>=1,null,{timeout:25000});
  await page.waitForFunction(()=>window.__r45QA?.audio?.counters?.cue>=1,null,{timeout:12000});
  const afterCard=await page.evaluate(()=>window.__r45QA.audio);
  await page.locator('#play').click();
  await page.waitForFunction(()=>window.__r45QA.audio.counters.voice>=1,null,{timeout:15000});
  const afterPlay=await page.evaluate(()=>window.__r45QA.audio);
  await page.screenshot({path:resolve(out,'r83-sound-on-first-card-'+name+'.png')});
  // A player's explicit "sound off" survives reload; first card must not undo it.
  await page.locator('#audio-toggle').click();
  const muted=await page.evaluate(()=>window.__r45QA.audio);
  await page.reload({waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__r45QA?.cardCount>0,null,{timeout:35000});
  await page.locator('#hand .card:not([disabled])').first().click();
  await page.waitForTimeout(200);
  const stayedMuted=await page.evaluate(()=>window.__r45QA.audio);
  await page.locator('#audio-toggle').click();
  await page.waitForFunction(()=>window.__r45QA?.audio?.enabled===true,null,{timeout:22000});
  const unmuted=await page.evaluate(()=>window.__r45QA.audio);
  const pass=initial.requested&&pressed==='true'&&afterCard.enabled&&
   afterCard.counters.musicStart>=1&&afterCard.counters.cue>=1&&
   afterPlay.counters.voice>=1&&!muted.requested&&!muted.enabled&&
   !stayedMuted.requested&&!stayedMuted.enabled&&
   unmuted.requested&&unmuted.enabled&&!errors.length;
  results.push({name,pass,initial:{requested:initial.requested,enabled:initial.enabled},
   afterCard:{requested:afterCard.requested,enabled:afterCard.enabled,decoded:afterCard.decodedCues,
    musicStart:afterCard.counters.musicStart,firstCardCues:afterCard.counters.cue},
   afterPlay:{voices:afterPlay.counters.voice},persistedMute:!stayedMuted.requested,
   oneClickRestore:unmuted.enabled,errors});
 }catch(e){results.push({name,pass:false,error:String(e),errors})}
 finally{await ctx.close();await browser.close()}
}
async function permissive(){
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__r45QA?.audio?.counters?.musicStart>=1,null,{timeout:27000});
  const state=await page.evaluate(()=>window.__r45QA.audio);
  results.push({name:'autoplay-allowed-launch',pass:state.requested&&state.enabled&&
   state.counters.musicStart>=1&&!errors.length,
   requested:state.requested,enabled:state.enabled,musicStart:state.counters.musicStart,errors});
 }catch(e){results.push({name:'autoplay-allowed-launch',pass:false,error:String(e),errors})}
 finally{await browser.close()}
}
await restrictive({width:1600,height:900},'desktop');
await restrictive({width:430,height:900},'phone');
await permissive();
writeFileSync(resolve(out,'r83-default-sound-browser.json'),JSON.stringify(results,null,2)+'\n');
console.log('R83_DEFAULT_AUDIO',JSON.stringify(results));
if(results.some(x=>!x.pass))process.exitCode=7;
