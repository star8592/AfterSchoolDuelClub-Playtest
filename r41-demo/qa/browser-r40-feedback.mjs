import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'../..'),port=10964;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;const reports=[];const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
try{
 await sleep(350);
 browser=await chromium.launch({headless:true,executablePath:'/home/master/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--enable-unsafe-swiftshader']});
 for(const [device,width,height,seed,card] of [['desktop',1366,850,5,'E02'],['mobile',430,900,4,'E02']]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',res=>{if(res.status()>=400)errors.push('HTTP '+res.status()+' '+res.url())});
  const response=await page.goto('http://127.0.0.1:'+port+'/r40-demo/?mode=duel&seed='+seed+'&qaR40=1&qaR25=1&qaR23=1',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#hand .card[data-card-id="'+card+'"]',{timeout:22000});
  await page.locator('#home3d-start').click();
  await page.locator('#hand .card[data-card-id="'+card+'"]').click();
  await page.locator('#arena-lane-0').click();
  await page.locator('#end-turn').click();
  await page.waitForFunction("document.getElementById('round-num').textContent==='02'",null,{timeout:20000});
  await page.locator('#end-turn').click();
  await page.waitForFunction('window.__r40CombatQA?.events?.length>0',null,{timeout:18000});
  const combat=await page.evaluate(()=>({
   events:window.__r40CombatQA.events,
   shown:window.__r40CombatQA.visible,
   lastPlayed:window.__r40CombatQA.lastPlayedSerial,
   label:document.getElementById('arena-r40-action').textContent,
   damage:document.getElementById('arena-r40-damage').textContent,
   retaliation:document.getElementById('arena-r40-counter').textContent,
   historyCount:document.querySelectorAll('#arena-r40-combat-list button').length,
   hiddenHistory:document.getElementById('arena-r40-combat-feed').hidden,
   laneFocus:document.getElementById('arena-scene').dataset.focus,
   viewportHeight:document.documentElement.clientHeight
  }));
  await page.locator('#arena-r40-replay').click();
  const before=await page.evaluate(()=>({round:document.getElementById('round-num').textContent,
   hp:document.getElementById('player-hp').textContent,enemyHP:document.getElementById('ai-hp').textContent,
   energy:document.getElementById('energy').textContent,hand:[...document.querySelectorAll('#hand .card')].map(x=>x.dataset.cardId)}));
  await page.waitForTimeout(250);
  await page.screenshot({path:resolve(import.meta.dirname,'evidence/r40-'+device+'-impact.png'),type:'png'});
  await page.locator('#arena-r40-replay').click();
  const after=await page.evaluate(()=>({round:document.getElementById('round-num').textContent,
   hp:document.getElementById('player-hp').textContent,enemyHP:document.getElementById('ai-hp').textContent,
   energy:document.getElementById('energy').textContent,hand:[...document.querySelectorAll('#hand .card')].map(x=>x.dataset.cardId)}));
  const sameState=JSON.stringify(before)===JSON.stringify(after);
  // source event remains exact: seed5 => E02 exchange T02 damage2 counter3; seed4 => E02 direct damage2
  const last=combat.events.find(x=>x.side==='player');
  const exact=last?.damage===2&&(seed===5?last.retaliation===3&&last.summary.includes('食堂隐藏菜单'):last.summary.includes('对方人气'));
  const result={device,seed,http:response.status(),combat,before,after,sameState,exact,errors,
    passed:response.status()===200&&!combat.hiddenHistory&&combat.historyCount>0&&combat.shown&&combat.laneFocus==='0'&&
    last?.serial>0&&combat.lastPlayed>0&&exact&&sameState&&!errors.length};
  console.log('R40_VISIBLE_COMBAT_BROWSER',JSON.stringify(result));reports.push(result);
  if(!result.passed)break;
  await page.close();
 }
 writeFileSync(resolve(import.meta.dirname,'evidence/browser-feedback-proof.json'),JSON.stringify(reports,null,2)+'\n');
 if(reports.length!==2||reports.some(x=>!x.passed))process.exitCode=3;
}catch(err){console.error('R40_QA_EXCEPTION',String(err),JSON.stringify(reports).slice(0,1000));process.exitCode=2}
finally{await browser?.close().catch(()=>{});server.kill('SIGTERM')}
