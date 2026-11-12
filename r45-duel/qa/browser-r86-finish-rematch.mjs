import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir=resolve(import.meta.dirname,'evidence/r86-matchflow');mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:1024';
const report={ok:false,cases:[],errors:[],states:[]};
page.on('pageerror',e=>report.errors.push(e.message));
const assert=(ok,name,extra={})=>{report.cases.push({name,pass:!!ok,...extra});if(!ok)throw new Error('FAILED: '+name)};
try{
 await page.goto(origin+'/r45-duel/?seed=1&qa=1',{waitUntil:'domcontentloaded',timeout:90000});
 // R101 retains the strict genuine 2-VRM + 12-GLB rendering gate.
 // Engine phase can be playing while the truthful progress meter is below 14/14.
 await page.waitForFunction(()=>window.__r45QA?.phase==='playing'&&
  window.__r45QA?.sceneReady===true,{timeout:145000});
 assert(await page.locator('#result-overlay').isHidden(),'result panel not visible in active match');
 assert(await page.locator('#end').isEnabled(),'end turn button initially enabled');
 const terminal=await page.evaluate(()=>{
   let clicks=0;
   while(window.__r45QA.phase==='playing'&&clicks<30){
     const b=document.querySelector('#end');
     if(b.disabled)break;
     b.click();clicks++;
   }
   return {clicks,phase:window.__r45QA.phase,hp:window.__r45QA.hp,round:window.__r45QA.round,
     winner:window.__r45QA.events.findLast(e=>e.type==='game_end')?.winner};
 });
 report.states.push({terminal});
 assert(terminal.phase==='ended'&&terminal.clicks<=30,'ordinary turns reach terminal end',terminal);
 await page.locator('#result-overlay').waitFor({state:'visible',timeout:8000});
 assert(await page.locator('#result-rematch').isVisible(),'visible prominent rematch action');
 assert(await page.locator('#end').isEnabled()&&
   (await page.locator('#end').innerText()).includes('再来一局'),'bottom rematch action also enabled');
 const scores=await page.evaluate(()=>({
   player:Number(document.querySelector('#result-player-hp').textContent),
   ai:Number(document.querySelector('#result-ai-hp').textContent),
   outcome:document.querySelector('#result-overlay').dataset.outcome,
   title:document.querySelector('#result-title').textContent
 }));
 assert(scores.player===terminal.hp.player&&scores.ai===terminal.hp.ai&&
   scores.outcome===terminal.winner,'result matches authoritative engine',scores);
 await page.screenshot({path:resolve(dir,'match-finished.png')});
 await page.locator('#result-review').click();
 assert(await page.locator('#result-overlay').isHidden(),'review battlefield dismisses result');
 await page.locator('#play').click();
 assert(await page.locator('#result-overlay').isVisible(),'result can reopen from bottom controls');
 await page.locator('#result-rematch').click();
 await page.waitForURL(/seed=2/,{timeout:90000});
 // R101 retains the strict genuine 2-VRM + 12-GLB rendering gate.
 // Engine phase can be playing while the truthful progress meter is below 14/14.
 await page.waitForFunction(()=>window.__r45QA?.phase==='playing'&&
  window.__r45QA?.sceneReady===true,{timeout:145000});
 const reset=await page.evaluate(()=>({
   hp:window.__r45QA.hp,round:window.__r45QA.round,
   board:window.__r45QA.board,
   phase:window.__r45QA.phase,
   overlayHidden:document.querySelector('#result-overlay').hidden,
   endEnabled:!document.querySelector('#end').disabled
 }));
 report.states.push({reset});
 assert(reset.hp.player===20&&reset.hp.ai===20&&reset.round===1&&
   reset.board.player[0].length===0&&reset.board.ai[0].length===0&&
   reset.overlayHidden&&reset.endEnabled,'new match resets scores, actors, rounds and controls',reset);
 await page.screenshot({path:resolve(dir,'rematch-fresh-round.png')});
 const again=await page.evaluate(()=>{let clicks=0;while(window.__r45QA.phase==='playing'&&clicks<30){document.querySelector('#end').click();clicks++}return{clicks,phase:window.__r45QA.phase}});
 assert(again.phase==='ended','second match can also complete',again);
 await page.locator('#result-overlay').waitFor({state:'visible',timeout:8000});
 await page.locator('#result-review').click();
 await page.locator('#end').click();
 await page.waitForURL(/seed=3/,{timeout:90000});
 assert((await page.locator('#round').innerText()).includes('第 1 回合'),'bottom rematch starts another new match');

 // Exercise a real player victory and a real tied turn-limit game from
 // deterministic seeds, using UI clicks rather than changing the engine state.
 // Current 20-card engine's deterministic first-legal-move policy produces
 // real player wins on seed 6 and an HP-equal tie on seed 28. R91's old seed
 // 3/32 expectations came from a different historic card/AI rule baseline;
 // never force game rules to match stale QA seed assumptions.
 for(const [scenarioSeed,expectedOutcome,width] of [[6,'player',1440],[28,'draw',430]]){
  await page.setViewportSize({width,height:900});
  await page.goto(origin+'/r45-duel/?seed='+scenarioSeed+'&qa=1',{waitUntil:'domcontentloaded',timeout:90000});
  // R101 retains the strict genuine 2-VRM + 12-GLB rendering gate.
 // Engine phase can be playing while the truthful progress meter is below 14/14.
 await page.waitForFunction(()=>window.__r45QA?.phase==='playing'&&
  window.__r45QA?.sceneReady===true,{timeout:145000});
  const simulated=await page.evaluate(()=>{
   let actions=0;
   while(window.__r45QA.phase==='playing'&&actions<250){
    const card=document.querySelector('.card:not([disabled])');
    if(card){
     card.click();
     const play=document.querySelector('#play');
     if(play.disabled)throw new Error('Legal card did not enable play button');
     play.click();
    }else{
     const end=document.querySelector('#end');
     if(end.disabled)throw new Error('End turn disabled before terminal');
     end.click();
    }
    actions++;
   }
   return{actions,phase:window.__r45QA.phase,hp:window.__r45QA.hp,
    winner:window.__r45QA.events.findLast(e=>e.type==='game_end')?.winner};
  });
  assert(simulated.phase==='ended'&&simulated.winner===expectedOutcome,
   'real UI completes '+expectedOutcome+' seed',simulated);
  await page.locator('#result-overlay').waitFor({state:'visible',timeout:12000});
  const displayed=await page.evaluate(()=>({
   outcome:document.querySelector('#result-overlay').dataset.outcome,
   hp:{player:Number(document.querySelector('#result-player-hp').textContent),
       ai:Number(document.querySelector('#result-ai-hp').textContent)},
   width:document.querySelector('.result-panel').getBoundingClientRect().width
  }));
  assert(displayed.outcome===expectedOutcome&&displayed.hp.player===simulated.hp.player&&
   displayed.hp.ai===simulated.hp.ai,'result panel is correct for '+expectedOutcome,displayed);
  assert(displayed.width<=width,'result dialog fits viewport '+width+'px',{width,actual:displayed.width});
  await page.screenshot({path:resolve(dir,'result-'+expectedOutcome+'-'+width+'.png')});
  await page.locator('#result-rematch').click();
  await page.waitForFunction(()=>window.__r45QA?.round===1&&window.__r45QA?.phase==='playing'&&window.__r45QA?.sceneReady===true,{timeout:145000});
  assert(await page.locator('#result-overlay').isHidden(),
   'rematch succeeds after '+expectedOutcome);
 }
 report.ok=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();}
if(!report.ok)process.exit(1);
