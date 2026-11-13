import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11115';
const out=resolve(import.meta.dirname,'evidence/r113-voice');mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[],diagnostics:[]};
let currentPage=null;
const ok=(valid,name,detail)=>{report.checks.push({passed:!!valid,name,detail});
 if(!valid)throw Error(name+': '+JSON.stringify(detail).slice(0,500))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-webgl',
 '--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});currentPage=page;
  const err=[];page.on('pageerror',e=>err.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))err.push('HTTP '+r.status())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:160000});
  await page.waitForFunction(()=>window.__r45QA.audio.assetsReady&&window.__r45QA.audio.enabled,null,{timeout:12000});
  const finished=await page.evaluate(()=>{
   let clicks=0;
   while(window.__r45QA.phase==='playing'&&clicks<30){
    const end=document.querySelector('#end');
    if(end.disabled)break;end.click();clicks++;
   }
   return {clicks,phase:window.__r45QA.phase,
    winner:window.__r45QA.events.findLast(x=>x.type==='game_end')?.winner};
  });
  ok(finished.phase==='ended'&&['player','ai','draw'].includes(finished.winner),
   view+' actual engine result, never fake victory',finished);
  const kind=finished.winner==='draw'?'draw':'win_'+finished.winner;
  await page.waitForTimeout(1400);
  report.diagnostics.push(await page.evaluate(()=>({
    audio:window.__r45QA.audio,comedy:window.__r45QA.comedy,
    outcome:document.querySelector('#result-overlay')?.dataset.outcome
  })));
  await page.waitForFunction(kind=>
    window.__r45QA.audio.speechHistory.some(x=>x.id==='STADIUM_PA'&&x.kind===kind),
    kind,{timeout:16000});
  const said=await page.evaluate(k=>({
   status:window.__r45QA.audio,
   subtitle:document.querySelector('#spoken-words')?.textContent,
   gameWinner:document.querySelector('#result-overlay')?.dataset.outcome
  }),kind);
  const recorded=said.status.speechHistory.findLast(x=>x.id==='STADIUM_PA'&&x.kind===kind);
  ok(!!recorded&&(recorded.text.includes('获胜')||recorded.text.includes('平手')),
   view+' official Qwen PA for actual result',recorded);
  await page.locator('#result-overlay').waitFor({state:'visible',timeout:14000});
  ok(await page.locator('#result-rematch').isVisible(),
   view+' result panel preserves rematch',null);
  ok(err.length===0,view+' no errors',err);
  await page.screenshot({path:resolve(out,view+'-real-match-result-pa.png')});
  // Switching themed decks after the finished match keeps the same 3D arena.
  // Previously the late VO guard and victory panel survived a real new game.
  const newRound=await page.evaluate(()=>{
   const select=document.querySelector('#deck-select');
   select.value='kitchen';
   select.dispatchEvent(new Event('change',{bubbles:true}));
   return {phase:window.__r45QA.phase,audio:window.__r45QA.audio,
    overlayHidden:document.querySelector('#result-overlay').hidden};
  });
  ok(newRound.phase==='playing'&&newRound.overlayHidden&&
    !newRound.audio.finaleVoiceGuard,
    view+' new deck resets finale microphone and results panel',newRound);
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r113-real-outcome-pa-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R113_REAL_OUTCOME_PA',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
