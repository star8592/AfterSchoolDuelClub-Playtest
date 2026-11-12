import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11094';
const out=resolve(import.meta.dirname,'evidence/r94');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const report={origin,ok:false,tests:[],errors:[],versions:{},models:[],sound:{}};
const check=(pass,name,detail={})=>{report.tests.push({name,pass:!!pass,...detail});if(!pass)throw Error('ASSERT: '+name)};
async function open(seed,width=1440){
 const p=await browser.newPage({viewport:{width,height:900}});
 p.on('pageerror',e=>report.errors.push('JS '+e.message));
 p.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))
  report.errors.push('HTTP '+r.status()+' '+r.url().slice(0,230))});
 await p.goto(origin+'/r45-duel/?qa=1&seed='+seed,{waitUntil:'domcontentloaded',timeout:90000});
 await p.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:150000});
 return p;
}
try {
 let p=await open(3);
 await p.waitForFunction(()=>window.__r45QA.audio.assetsReady===true,null,{timeout:45000});
 const start=await p.evaluate(()=>{
  const qa=window.__r45QA, s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return{sound:qa.audio,models:s.summonModels,cards:document.querySelectorAll('.card').length};
 });
 report.sound.initial={provider:start.sound.provider,requested:start.sound.requested,
  assetsReady:start.sound.assetsReady,voiceClipCount:start.sound.voiceClipCount,
  musicTracks:start.sound.musicTracks.length};
 report.models=start.models.map(x=>({id:x.id,file:x.file,meshes:x.meshes}));
 check(start.sound.requested&&start.sound.provider==='Qwen3-TTS'&&
  start.sound.assetsReady&&start.sound.voiceClipCount===16&&
  start.sound.musicTracks.length===7,'default audio, voice catalog and seven soundtracks ready',report.sound.initial);
 // The official mainline advanced seven animation-capable summons from
 // Footwork-R93 to Knee-R96. Do not fail the unrelated R94 audio/gameplay gate
 // merely because production model names were correctly upgraded.
 const kneeIds=['E03','E04','G02','G03','G04','T03','T04'];
 check(start.models.length===12&&['M01','M02'].every(id=>start.models.some(x=>x.id===id&&x.meshes>0)) &&
  kneeIds.every(id=>start.models.some(x=>x.id===id&&x.file.includes('Knee-R96')&&x.meshes>=18)),
  'current R96 knee model registry plus M01/M02 are genuine 3D', {ids:start.models.map(x=>x.id)});
 await p.locator('#end').click();
 await p.locator('.card[data-card-id="M01"]:not([disabled])').first().click();
 await p.locator('#play').click();
 await p.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.entries?.some(x=>x.id==='M01'&&x.side==='player'),null,{timeout:15000});
 const music=await p.evaluate(()=>({audio:window.__r45QA.audio,board:window.__r45QA.board}));
 report.sound.afterGesture={requested:music.audio.requested,enabled:music.audio.enabled,
  musicStart:music.audio.counters.musicStart,decodedCues:music.audio.decodedCues,errors:music.audio.counters.errors,
  voiceClips:music.audio.voiceClipCount};
 check(music.board.player[0].some(x=>x.id==='M01')&&music.audio.requested,
  'M01 is playable and has a visible real 3D summon');
 check(music.audio.decodedCues>=9&&music.audio.counters.errors===0,
  'real audio cues successfully decoded without source errors',report.sound.afterGesture);
 await p.screenshot({path:resolve(out,'r94-music-teacher-stage.png')});
 await p.close();

 p=await open(6);
 await p.locator('#end').click();
 await p.locator('.card[data-card-id="M02"]:not([disabled])').first().click();
 await p.locator('#play').click();
 await p.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.entries?.some(x=>x.id==='M02'&&x.side==='player'),null,{timeout:15000});
 const m02=await p.evaluate(()=>window.__r45QA.board.player[0].some(x=>x.id==='M02'));
 check(m02,'M02 cafeteria aunt is playable and rendered with actual GLB');
 await p.screenshot({path:resolve(out,'r94-cafeteria-aunt-stage.png')});
 await p.close();

 for(const [seed,expected,width] of [[1,'player',1440],[2,'ai',1440],[28,'draw',430]]){
  p=await open(seed,width);
  const terminal=await p.evaluate(()=>{
   let actions=0;
   while(window.__r45QA.phase==='playing'&&actions<300){
    const card=document.querySelector('.card:not([disabled])');
    if(card){card.click();document.querySelector('#play').click()}
    else document.querySelector('#end').click();
    actions++;
   }
   return{phase:window.__r45QA.phase,round:window.__r45QA.round,actions,
    hp:window.__r45QA.hp,engineWinner:window.__r45QA.events.findLast(e=>e.type==='game_end')?.winner};
  });
  check(terminal.phase==='ended'&&terminal.engineWinner===expected,
   'actual 20-card duel reaches '+expected,terminal);
  await p.locator('#result-overlay').waitFor({state:'visible',timeout:13000});
  const dialog=await p.evaluate(()=>({
   winner:document.querySelector('#result-overlay').dataset.outcome,
   hp:{player:+document.querySelector('#result-player-hp').textContent,
       ai:+document.querySelector('#result-ai-hp').textContent},
   width:document.querySelector('#result-overlay .result-panel').getBoundingClientRect().width
  }));
  check(dialog.winner===expected&&dialog.hp.player===terminal.hp.player&&
   dialog.hp.ai===terminal.hp.ai&&dialog.width<=width,
   expected+' real match score dialog and responsive layout',dialog);
  await p.locator('#result-rematch').click();
  await p.waitForFunction(()=>window.__r45QA?.round===1&&window.__r45QA?.phase==='playing',null,{timeout:40000});
  const reset=await p.evaluate(()=>({
   hp:window.__r45QA.hp,units:window.__r45QA.board.player[0].length+window.__r45QA.board.ai[0].length,
   hidden:document.querySelector('#result-overlay').hidden}));
  check(reset.hp.player===20&&reset.hp.ai===20&&reset.units===0&&reset.hidden,
   'rematch resets full game after '+expected,reset);
  await p.close();
 }
 report.ok=report.tests.every(x=>x.pass)&&report.errors.length===0;
}catch(error){report.errors.push(String(error))}
finally{writeFileSync(resolve(out,'r94-convergence-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({
 ok:report.ok,tests:report.tests.length,passed:report.tests.filter(x=>x.pass).length,
 errors:report.errors,sound:report.sound,models:report.models
},null,2));await browser.close()}
if(!report.ok)process.exitCode=5;
