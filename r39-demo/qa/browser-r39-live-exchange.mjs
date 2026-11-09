import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'../..'),port=10952;
const folder=resolve(import.meta.dirname,'evidence');mkdirSync(folder,{recursive:true});
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
const pause=ms=>new Promise(res=>setTimeout(res,ms));
try{
 await pause(300);
 browser=await chromium.launch({headless:true,executablePath:'/home/master/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1366,height:850}});
 const errors=[];page.on('pageerror',e=>errors.push('JS '+e.message));page.on('response',res=>{if(res.status()>=400)errors.push('HTTP '+res.status()+' '+res.url())});
 const resp=await page.goto('http://127.0.0.1:'+port+'/r39-demo/?mode=duel&seed=1&qaR25=1&qaR23=1',{waitUntil:'domcontentloaded',timeout:40000});
 await page.locator('#hand .card[data-card-id="E01"]').waitFor({timeout:20000});
 await page.locator('#home3d-start').click();
 const onStart=await page.evaluate(()=>({top:window.scrollY,arenaY:document.getElementById('cinematic-arena').getBoundingClientRect().top,
  theater:document.body.dataset.theater,live3dButton:document.getElementById('stage3d-mode').textContent.trim()}));
 await page.locator('#hand .card[data-card-id="E01"]').click();
 await page.locator('#arena-lane-0').click();
 await page.locator('#end-turn').click();
 await page.waitForFunction("document.getElementById('round-num').textContent==='02'",null,{timeout:22000});
 const afterFirst=await page.evaluate(()=>({round:document.getElementById('round-num').textContent,
   aiLane0:document.querySelector('#arena-lane-count-0')?.textContent,hand:[...document.querySelectorAll('#hand .card')].map(c=>c.dataset.cardId)}));
 if(!afterFirst.aiLane0.includes('敌 2'))throw Error('SEED_CHANGED_GAME_STATE '+JSON.stringify(afterFirst));
 await page.locator('#end-turn').click();
 await page.waitForFunction("document.getElementById('performance-stage').dataset.live3d==='playing'",null,{timeout:25000});
 const live=await page.evaluate(()=>{
  const stage=document.getElementById('performance-stage');
  const f=document.querySelector('#performance-3d-slot iframe');
  const q=f?.contentWindow?.__duelMotionQA;
  return{stage:stage.dataset.live3d,overlayVisible:!stage.hidden,mode:q?.activeLive3D?.mode,
    source:q?.activeLive3D?.source,coreEvent:q?.facts,serial:q?.activeLive3D?.serial,
    models:q?.rigs?.length,draws:q?.renderDrawCalls?.calls,
    round:document.getElementById('round-num').textContent,
    playerHP:document.getElementById('player-hp').textContent,
    aiHP:document.getElementById('ai-hp').textContent};
 });
 await page.screenshot({path:resolve(folder,'R39_live_real_card_E01_G01.png'),type:'png'});
 const report={http:resp.status(),seed:1,onStart,afterFirst,live,errors,
  passed:resp.status()===200&&onStart.theater==='on'&&onStart.arenaY>=-40&&
   onStart.arenaY<200&&live.overlayVisible&&live.stage==='playing'&&live.models===2&&
   live.mode==='live'&&live.source==='EXACT_LIVE_MAIN_CORE_EVENT'&&live.coreEvent?.from==='E01'&&
   live.coreEvent?.to==='G01'&&live.coreEvent?.damage===2&&live.coreEvent?.serial===7&&
   live.draws>0&&errors.length===0};
 writeFileSync(resolve(folder,'live-game-proof.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R39_ACTUAL_GAME_3D_EXCHANGE',JSON.stringify(report));
 if(!report.passed)process.exitCode=3;
}catch(e){console.error('R39_ACTUAL_GAME_3D_TEST_FAILED',String(e));process.exitCode=2;}
finally{await browser?.close().catch(()=>{});server.kill('SIGTERM')}
