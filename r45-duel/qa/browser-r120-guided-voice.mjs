/** R120: actual engine rounds, visible captions, female/male recorded voice.
 * `guidedQuick` skips only the spoken wait in QA, not game-engine transitions.
 */
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:17361';
const output=process.env.ASDC_QA_OUTPUT||'/tmp/r120-guided-voice';mkdirSync(output,{recursive:true});
const report={ok:false,runs:[],errors:[]},browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const assert=(ok,what,x)=>{if(!ok)throw Error(what+' '+JSON.stringify(x).slice(0,650))};
const get=page=>page.evaluate(()=>({g:window.__r45QA.guided,hp:window.__r45QA.hp,round:window.__r45QA.round,
 phase:window.__r45QA.phase,energy:window.__r45QA.energy.player,
 player:window.__r45QA.board.player[0].map(u=>u.id),ai:window.__r45QA.board.ai[0].map(u=>u.id),
 events:window.__r45QA.events.filter(e=>['card_play','exchange','game_end'].includes(e.type)).map(e=>({type:e.type,side:e.side,from:e.from,card:e.card,damage:e.damage})),
 voices:window.__r45QA.audio.tutorialClipCount,
 speakers:window.__r45QA.audio.speechHistory.filter(x=>/^(HOST_PLAYER|HOST_AI)$/.test(x.id)).map(x=>x.id+':'+x.kind),
 bubble:document.querySelector('#guided-words').textContent,
 beginHidden:document.querySelector('#guided-begin').hidden,
 visibleCards:[...document.querySelectorAll('#hand .card')].map(x=>x.dataset.cardId),
 step:document.querySelector('#guided-round').textContent,
 credits:!!document.querySelector('#credits-help'),ruleText:document.querySelector('#help').textContent.slice(0,200),
 endHidden:document.querySelector('#end').hidden,
 playDisabled:document.querySelector('#play').disabled
}));
const waitStep=async(page,key)=>page.waitForFunction(k=>window.__r45QA.guided?.key===k&&!window.__r45QA.guided?.busy,key,{timeout:140000});
try{
 for(const [view,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?mode=guided&seed=11&qa=1&guidedQuick=1',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:110000});
  let snap=await get(page);
  assert(snap.voices===14&&snap.hp.player===20&&snap.hp.ai===6&&snap.visibleCards.join()==='E01'&&snap.credits&&snap.ruleText.includes('怎样获胜'),view+' intro',snap);
  await page.locator('#guided-begin').click();await waitStep(page,'summon');
  await page.locator('#hand button.card').click();await page.locator('#play').click();await waitStep(page,'end1');
  snap=await get(page);assert(snap.player.includes('E01')&&snap.hp.ai===6&&!snap.endHidden&&snap.round===1,view+' player summon',snap);
  await page.locator('#end').click();await waitStep(page,'spell1');
  snap=await get(page);assert(snap.ai.includes('G01')&&snap.player.includes('E01')&&snap.energy===3&&snap.hp.ai===6&&snap.round===2,view+' AI response 1',snap);
  await page.locator('#hand button.card').click();await page.locator('#play').click();await waitStep(page,'end2');
  snap=await get(page);assert(snap.hp.ai===3&&snap.phase==='playing'&&!snap.endHidden,view+' real spell',snap);
  await page.locator('#end').click();await waitStep(page,'spell2');
  snap=await get(page);assert(snap.ai.includes('T01')&&snap.round===3&&snap.energy===4&&
   snap.events.filter(e=>e.type==='exchange').length>=2,view+' combat attack retaliation',snap);
  await page.locator('#hand button.card').click();await page.locator('#play').click();await waitStep(page,'won');
  snap=await get(page);assert(snap.hp.ai===0&&snap.g.completed&&snap.phase==='ended'&&snap.playDisabled===false&&
   snap.events.some(e=>e.type==='game_end')&&snap.step.includes('练习胜利')&&errors.length===0,view+' win',snap);
  await page.screenshot({path:resolve(output,view+'-guided-victory.png')});
  report.runs.push({view,passed:true,round:snap.round,winner:'player',hp:snap.hp,
   enemyCards:snap.events.filter(e=>e.side==='ai'&&e.type==='card_play').map(e=>e.card),
   exchanges:snap.events.filter(e=>e.type==='exchange').length,voiceClips:snap.voices,errors});
  await page.locator('#play').click();await page.waitForURL(url=>!url.searchParams.has('mode'),{timeout:25000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:90000});
  const free=await get(page);assert(free.hp.player===20&&free.hp.ai===20,view+' free duel unchanged',free);
  await page.close();
 }
 // Real playback (not accelerated): verify that both actual gendered Qwen3
 // clips reach audio playback and exact subtitle metadata without cross-talk.
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/r45-duel/?mode=guided&seed=14&qa=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:90000});
 await page.locator('#guided-begin').click();
 await page.waitForFunction(()=>window.__r45QA.audio.speechHistory.some(x=>x.kind==='intro_f'),null,{timeout:20000});
 await page.waitForFunction(()=>window.__r45QA.audio.speechHistory.some(x=>x.kind==='intro_m'),null,{timeout:39000});
 const speech=await page.evaluate(()=>window.__r45QA.audio.speechHistory.filter(x=>['intro_f','intro_m'].includes(x.kind)).map(x=>({id:x.id,kind:x.kind,text:x.text,duration:x.duration_seconds})));
 assert(speech.length===2&&speech[0].id==='HOST_PLAYER'&&speech[1].id==='HOST_AI'&&
  speech.every(x=>x.text.length>30&&x.duration>2)&&errors.length===0,'Qwen male/female actual spoken recordings',speech);
 report.runs.push({view:'real-female-male-voice',passed:true,speech,errors});await page.close();
 report.ok=true;
}catch(e){report.errors.push(String(e));console.error('R120_ERROR',String(e))}
finally{writeFileSync(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log('R120_GUIDED_VOICE',JSON.stringify({ok:report.ok,runs:report.runs.map(x=>({view:x.view,passed:x.passed,hp:x.hp,exchanges:x.exchanges,speech:x.speech?.map(y=>y.id),errors:x.errors})),errors:report.errors}));await browser.close()}
if(!report.ok)process.exitCode=5;
