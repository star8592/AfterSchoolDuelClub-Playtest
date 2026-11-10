import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const base='http://127.0.0.1:10972/r42-demo/';
const dest=resolve(import.meta.dirname,'evidence');mkdirSync(dest,{recursive:true});
let browser;const reports=[];
const snapshot=async p=>p.evaluate(()=>({
 hand:[...document.querySelectorAll('#hand .card')].map(c=>c.dataset.cardId),
 energy:document.getElementById('energy').textContent,
 round:document.getElementById('round-num').textContent,
 zones:[0,1,2].map(i=>document.getElementById('arena-lane-count-'+i).textContent),
 chosen:document.getElementById('r42-chosen-card').textContent,
 target:document.getElementById('r42-target-select').value,
 confirmDisabled:document.getElementById('r42-confirm-play').disabled,
 opponent:document.getElementById('r42-opponent-feedback').textContent,
 prompt:document.getElementById('prompt').textContent,
 selected:[...document.querySelectorAll('#hand .card.selected')].map(c=>c.dataset.cardId),
 bodyWidth:document.documentElement.scrollWidth,viewportWidth:document.documentElement.clientWidth
}));
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
  '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
  '--disable-software-rasterizer','--disable-dev-shm-usage']});
 for(const [device,w,h,seed,card,target] of [
  ['desktop',1366,850,1,'E01',0],['mobile',430,900,1,'E01',0],
  ['ordinary',1280,820,5,'E02',0],['target-switch',430,900,1,'E01',2]]){
  const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',res=>{if(res.status()>=400)errors.push('HTTP '+res.status()+' '+res.url())});
  const res=await page.goto(base+'?mode=duel&seed='+seed+'&qaR41=1&qaR23=1',{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForSelector('#hand .card[data-card-id="'+card+'"]',{timeout:25000});
  const initial=await snapshot(page);
  await page.locator('#hand .card[data-card-id="'+card+'"]').click();
  const selected=await snapshot(page);
  // Critical invariant: card selection alone cannot alter game rules.
  const untouched=initial.hand.join(',')===selected.hand.join(',')&&
    initial.energy===selected.energy&&initial.zones.join(',')===selected.zones.join(',')&&
    initial.round===selected.round;
  if(!untouched)throw Error('CARD_SELECTION_MUTATED_GAME '+device);
  if(target!==0)await page.locator('#r42-target-select').selectOption(String(target));
  const beforeConfirm=await snapshot(page);
  await page.locator('#r42-confirm-play').click();
  await page.waitForFunction('document.querySelectorAll("#hand .card").length===4',null,{timeout:14000});
  const deployed=await snapshot(page);
  const selectedGone=deployed.hand.length===4&&!deployed.hand.includes(card);
  const zoneCorrect=deployed.zones[target].includes('我 1')&&deployed.zones.filter((x,i)=>i!==target).every(x=>x.includes('我 0'));
  const aiNotYet=deployed.round==='01'&&!deployed.opponent.includes('AI 已出牌');
  await page.screenshot({path:resolve(dest,'r42-'+device+'-explicit-card-confirm.png'),fullPage:false});
  await page.locator('#end-turn').click();
  await page.waitForFunction("document.getElementById('round-num').textContent==='02'",null,{timeout:16000});
  const afterAI=await snapshot(page);
  const aiReplied=afterAI.opponent.includes('AI 已出牌')&&afterAI.round==='02';
  let realBattle=null;
  if(target===0&&card==='E01'){
   await page.locator('#end-turn').click();
   await page.waitForFunction("document.getElementById('performance-stage').dataset.live3d==='playing'",null,{timeout:36000});
   await page.waitForFunction("document.querySelector('#performance-3d-slot iframe')?.contentWindow?.__r42FightQA?.ready",null,{timeout:18000});
   realBattle=await page.evaluate(()=>{
    const q=document.querySelector('#performance-3d-slot iframe')?.contentWindow?.__r42FightQA;
    return{source:document.getElementById('performance-stage').dataset.characterSource,
      mode:q?.mode,event:q?.payload?.event,
      roles:q?.roles?.map(r=>({id:r.id,asset:r.asset,bones:r.bones})),
      frames:q?.frameCount,renderer:q?.renderer};
   });
   await page.screenshot({path:resolve(dest,'r42-'+device+'-real-r22-combat.png'),fullPage:false});
   await page.locator('#performance-skip').click();
  }
  const passed=res.status()===200&&untouched&&beforeConfirm.confirmDisabled===false&&
   beforeConfirm.selected.includes(card)&&beforeConfirm.target===String(target)&&selectedGone&&
   zoneCorrect&&aiNotYet&&aiReplied&&
   (realBattle===null||(realBattle.source==='R22_E01_G01_VRM'&&realBattle.mode==='live'&&
     realBattle.event?.from==='E01'&&realBattle.event?.to==='G01'&&
     realBattle.roles?.[0]?.bones===148&&realBattle.roles?.[1]?.bones===107))&&
   deployed.bodyWidth<=deployed.viewportWidth+3&&!errors.length;
  const report={device,http:res.status(),initial,selected,beforeConfirm,deployed,afterAI,realBattle,
    untouched,selectedGone,zoneCorrect,aiNotYet,aiReplied,errors,passed};
  reports.push(report);
  console.log('R42_SELECT_CONFIRM_REAL_PLAYER_QA',JSON.stringify(report));
  if(!passed){process.exitCode=3;break;}
  await page.close();
 }
 writeFileSync(resolve(dest,'select-confirm-player-proof.json'),JSON.stringify(reports,null,2)+'\n');
}catch(err){console.error('R42_SELECT_CONFIRM_TEST_FAILED',String(err),JSON.stringify(reports).slice(-700));
 process.exitCode=2;}
finally{await browser?.close().catch(()=>{})}
