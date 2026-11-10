import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const cases=[['desktop',1366,850],['mobile',430,900]];
let browser;const proof=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox',
  '--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
 for(const [device,w,h] of cases){
  const p=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  p.on('pageerror',e=>errors.push('JS '+e.message));
  p.on('response',res=>{if(res.status()>=400)errors.push('HTTP '+res.status()+' '+res.url())});
  await p.goto('http://127.0.0.1:10972/r42-demo/?mode=duel&seed=1',{waitUntil:'domcontentloaded',timeout:30000});
  const state=async()=>p.evaluate(()=>({
   hand:[...document.querySelectorAll('#hand .card')].map(x=>x.dataset.cardId),
   energy:document.getElementById('energy').textContent,
   lanes:[0,1,2].map(i=>document.getElementById('arena-lane-count-'+i).textContent),
   turn:document.getElementById('round-num').textContent,
   selected:[...document.querySelectorAll('#hand .card.selected')].map(x=>x.dataset.cardId),
   target:document.getElementById('r42-target-select').value,
   playText:document.getElementById('r42-confirm-play').textContent,
   pending:document.getElementById('r42-confirm-play').disabled
  }));
  const start=await state();
  await p.locator('#hand .card[data-card-id="E01"]').click();
  const selected=await state();
  await p.locator('#arena-lane-1').click();
  const targetAfterChip=await state();
  await p.locator('#hand .card[data-card-id="E02"]').click();
  const changedSelection=await state();
  await p.locator('#hand .card[data-card-id="E02"]').click();
  const canceled=await state();
  await p.locator('#hand .card[data-card-id="E01"]').click();
  await p.locator('#r42-confirm-play').click();
  const confirmed=await state();
  const ruleFields=([start,selected,targetAfterChip,changedSelection,canceled].every(x=>
   x.hand.join(',')===start.hand.join(',')&&x.energy===start.energy&&
   x.lanes.join(',')===start.lanes.join(',')&&x.turn===start.turn));
  const valid=ruleFields&&selected.selected.join(',')==='E01'&&
   targetAfterChip.target==='1'&&changedSelection.selected.join(',')==='E02'&&
   !canceled.selected.length&&canceled.pending&&
   confirmed.hand.length===start.hand.length-1&&confirmed.lanes[1].includes('我 1')&&
   confirmed.lanes[0].includes('我 0')&&confirmed.target==='1'&&!errors.length;
  const item={device,ruleFields,selected:selected.selected,targetAfterChip:targetAfterChip.target,
   changedSelection:changedSelection.selected,canceled:canceled.selected,confirmed,errors,passed:valid};
  console.log('R42_NO_IMPLICIT_CARD_MUTATION',JSON.stringify(item));proof.push(item);
  if(!valid)process.exitCode=3;
  await p.close();
 }
 writeFileSync(resolve(import.meta.dirname,'evidence/selection-invariants-proof.json'),JSON.stringify(proof,null,2)+'\n');
}catch(e){console.error('R42_INVARIANT_TEST_FAILED',String(e));process.exitCode=2}
finally{await browser?.close().catch(()=>{})}
