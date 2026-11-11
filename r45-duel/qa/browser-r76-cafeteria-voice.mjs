import{createRequire}from'node:module';import{mkdirSync,writeFileSync}from'node:fs';import{resolve}from'node:path';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const base=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11007',dest=resolve(import.meta.dirname,'evidence/r76');mkdirSync(dest,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});let rows=[];
try{for(const[viewport,w,h]of [['desktop',1600,900],['portrait',430,900]]){
 const page=await browser.newPage({viewport:{width:w,height:h}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/audio/'))errors.push('HTTP '+r.status()+' '+r.url())});
 await page.goto(`${base}/r45-duel/?qa=1&seed=6`,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:85000});
 await page.locator('#audio-toggle').click();await page.waitForFunction(()=>window.__r45QA.audio.decodedCues===9&&window.__r45QA.audio.voiceClipCount>=13,null,{timeout:40000});
 const begin=await page.evaluate(()=>window.__r45QA.audioVoiceSample('M02','enter'));
 await page.waitForFunction(()=>window.__r45QA.audio.counters.voice>=1,null,{timeout:12000});const duringEnter=await page.evaluate(()=>window.__r45QA.audio);
 await page.waitForFunction(()=>!window.__r45QA.audio.voicePlaying,null,{timeout:14000});
 const attack=await page.evaluate(()=>window.__r45QA.audioVoiceSample('M02','attack'));
 await page.waitForFunction(()=>window.__r45QA.audio.counters.voice>=2,null,{timeout:12000});const duringAttack=await page.evaluate(()=>window.__r45QA.audio);
 await page.waitForFunction(()=>!window.__r45QA.audio.voicePlaying,null,{timeout:14000});const after=await page.evaluate(()=>window.__r45QA.audio);
 const pass=begin&&attack&&duringEnter.currentVoiceKey==='M02:enter'&&duringAttack.currentVoiceKey==='M02:attack'&&after.counters.voice>=2&&!after.musicDucked&&after.counters.errors===0&&errors.length===0;
 const row={viewport,pass,begin,attack,voiceRoles:after.voiceClipCount,voices:after.counters.voice,errors};rows.push(row);console.log('R76_M02_QWEN3_REAL_PLAYBACK',JSON.stringify(row));await page.close();
}}finally{writeFileSync(resolve(dest,'R76_M02_VOICE_QA.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
if(rows.length!==2||rows.some(x=>!x.pass))process.exitCode=4;
