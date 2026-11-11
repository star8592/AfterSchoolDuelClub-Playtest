const{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const fs=require('fs'),path=require('path');
const root='/mnt/data/game-assets/after-school-duel/r80-mainport-qa', origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11081';
const ids=['E03','E04','G02','G03','G04','T03','T04'],log=[];
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
try{for(const [mode,width,height] of [['desktop',1440,900],['portrait',430,900]]){
 const p=await browser.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push('JS '+e.message));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))errors.push('HTTP '+r.status()+' '+r.url())});
 await p.goto(origin+'/r45-duel/r89-animation-review.html',{waitUntil:'domcontentloaded',timeout:75000});
 await p.waitForFunction(()=>window.__R88_REVIEW_QA?.ready===true,null,{timeout:120000});
 const tests=[];
 for(let i=0;i<ids.length;i++){
  if(i>0){await p.locator('#characters .person').nth(i).click();await p.waitForFunction(id=>window.__R88_REVIEW_QA?.ready===true&&window.__R88_REVIEW_QA?.currentId===id,ids[i],{timeout:110000})}
  const base=await p.evaluate(()=>window.__R88_REVIEW_QA);
  await p.locator('button[data-clip="Attack"]').click();await p.waitForTimeout(120);const att=await p.evaluate(()=>window.__R88_REVIEW_QA);
  await p.locator('button[data-clip="Hit"]').click();await p.waitForTimeout(120);const hit=await p.evaluate(()=>window.__R88_REVIEW_QA);
  const ok=base.ready&&base.currentId===ids[i]&&base.clips.sort().join(',')==='Attack,Hit,Idle'&&att.clip==='Attack'&&hit.clip==='Hit'&&!base.error;
  tests.push({id:ids[i],ok,clips:base.clips,attack:att.clip,hit:hit.clip});
  if(i===3)await p.screenshot({path:path.join(root,`r89-review-${mode}.png`)});
 }
 const report={mode,pass:!errors.length&&tests.every(t=>t.ok)&&tests.length===7,errors,tests};log.push(report);console.log('R88_REVIEW_GATE',JSON.stringify(report));await p.close();
}}finally{fs.writeFileSync(path.join(root,'r89-review-qa.json'),JSON.stringify(log,null,2));await browser.close()}
if(log.length!==2||log.some(x=>!x.pass))process.exitCode=4;
})().catch(e=>{console.error('REVIEW_QA_ERROR',e);process.exitCode=9});
