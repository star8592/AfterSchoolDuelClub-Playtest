import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const {CARDS}=await import(resolve(import.meta.dirname,'../src/core.mjs'));
const root=resolve(import.meta.dirname,'../..');
const evidence=resolve(import.meta.dirname,'evidence');mkdirSync(evidence,{recursive:true});
const port=10938,server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;
const res=[],pause=ms=>new Promise(ok=>setTimeout(ok,ms));
try{
 await pause(350);
 browser=await chromium.launch({headless:true,
  executablePath:'/home/master/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--enable-unsafe-swiftshader']});
 for(const [name,width,height] of [['desktop',1280,820],['mobile',430,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,acceptDownloads:true});
  const errors=[],networkFailures=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)networkFailures.push({status:r.status(),url:r.url()})});
  const response=await page.goto('http://127.0.0.1:'+port+'/r38-demo/?mode=duel&seed=70&qaR25=1',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction('window.__r25HomeQA?.sourceURL && document.querySelector("#hand .card")',{timeout:30000});
  const initial=await page.evaluate(()=>({
   title:document.title,
   hand:document.querySelectorAll('#hand .card').length,
   cardCount:document.querySelectorAll('#hand .card[data-card-id]').length,
   buttons:[...document.querySelectorAll('#home3d-r19 .home3d-r19-buttons button:not([hidden])')].map(x=>x.textContent.trim()),
   musicVisible:!!document.querySelector('#home3d-music:not([hidden])'),
   source:window.__r25HomeQA?.sourceURL,
   rounds:document.getElementById('round-num').textContent,
   boardLanes:document.querySelectorAll('#lanes .lane').length,
   hasEndTurn:!!document.getElementById('end-turn'),
  }));
  if(initial.musicVisible||initial.cardCount<3||initial.boardLanes!==3||!initial.source.includes('/r22-depth/'))
    throw Error('UI_CORE_GATE '+JSON.stringify(initial));
  await page.locator('#home3d-start').click();
  const playing=await page.evaluate(()=>document.body.dataset.home3d==='playing');
  if(!playing)throw Error('START_BUTTON_FAIL');
  await page.screenshot({path:resolve(evidence,name+'-battle-before.jpg'),type:'jpeg',quality:83,fullPage:false});
  const cardID='E02';
  if(await page.locator('#hand .card[data-card-id="'+cardID+'"]').count()){
   const pre=await page.locator('#energy').textContent();
   await page.locator('#hand .card[data-card-id="'+cardID+'"]').click();
   await page.locator('#arena-lane-0').click();
   await page.waitForTimeout(300);
   const spawned=await page.locator('.player-formation .unit-card[data-card-id="'+cardID+'"]').count();
   const after=await page.locator('#energy').textContent();
   if(!spawned||after===pre)throw Error('CARD_DEPLOY_FAIL '+JSON.stringify({spawned,pre,after}));
  }else throw Error('DETERMINISTIC_E02_NOT_FOUND');
  await page.locator('#end-turn').click();
  const post=await page.evaluate(()=>({round:document.getElementById('round-num').textContent,
    playerHP:document.getElementById('player-hp').textContent, aiHP:document.getElementById('ai-hp').textContent,
    hand:document.querySelectorAll('#hand .card').length,
    journal:document.querySelectorAll('#journal-lines>*').length}));
  await page.screenshot({path:resolve(evidence,name+'-post-turn.jpg'),type:'jpeg',quality:83,fullPage:false});
  if(Number(post.round)<2)throw Error('AI_TURN_FAILED '+JSON.stringify(post));
  await page.locator('#reset').click();
  const reset=await page.evaluate(()=>({round:document.getElementById('round-num').textContent,
    playerHP:document.getElementById('player-hp').textContent, aiHP:document.getElementById('ai-hp').textContent}));
  if(reset.round!=='01'||reset.playerHP!=='20'||reset.aiHP!=='20')throw Error('RESET_FAILED '+JSON.stringify(reset));
  let real3d=false,modelDetails=null;
  try{
   await page.waitForFunction('window.__r25HomeQA.actualVRMReady',null,{timeout:26000});
   real3d=true;
   modelDetails=await page.evaluate(()=>{
    let q=document.getElementById('home3d-r19-iframe').contentWindow.__r22CharacterQA;
    return {ready:q?.ready,realVRMRigs:q?.realVRMRigs?.length,renderer:q?.gpuRenderer||null};
   });
  }catch(e){errors.push('3D_SCENE_NOT_CONFIRMED '+e.message.slice(0,135))}
  await page.screenshot({path:resolve(evidence,name+'-home-final.jpg'),type:'jpeg',quality:83});
  const report={viewport:name,http:response.status(),totalCards:CARDS.length,initial,playing,post,reset,real3d,modelDetails,
    errors,networkFailures,gameplayPassed:response.status()===200&&CARDS.length===18&&playing&&Number(post.round)>=2&&reset.round==='01'};
  console.log('R38_DEMO_BROWSER',JSON.stringify(report));
  res.push(report);await page.close();
 }
 writeFileSync(resolve(evidence,'browser-proof.json'),JSON.stringify(res,null,2)+'\n');
 if(res.some(x=>!x.gameplayPassed))process.exitCode=3;
}catch(e){console.error('R38_DEMO_BROWSER_FAILED',String(e),res);process.exitCode=2;}
finally{await browser?.close().catch(()=>{});server.kill('SIGTERM')}
