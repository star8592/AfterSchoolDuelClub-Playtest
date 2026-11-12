const{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright'),fs=require('fs'),path=require('path');
const root='/mnt/data/game-assets/after-school-duel/r80-mainport-qa',origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11081';
const ids=['E03','E04','G02','G03','G04','T03','T04'],rows=[];
const max=(s,key)=>Math.max(0,...s.parts.map(x=>x.weights[key]||0));
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
try{for(const[view,width,height]of[['desktop',1440,900],['portrait',430,900]]){
 const p=await browser.newPage({viewport:{width,height}}),errors=[];
 p.on('pageerror',e=>errors.push('JS '+e.message));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))errors.push('HTTP '+r.status()+' '+r.url().slice(0,175))});
 await p.goto(origin+'/r45-duel/r97-landing-review.html',{waitUntil:'domcontentloaded',timeout:90000});
 await p.waitForFunction(()=>window.__R88_REVIEW_QA?.ready===true,null,{timeout:170000});
 const tests=[];
 for(let i=0;i<ids.length;i++){
  if(i){await p.locator('#characters .person').nth(i).click();await p.waitForFunction(id=>window.__R88_REVIEW_QA?.ready===true&&window.__R88_REVIEW_QA.currentId===id,ids[i],{timeout:150000});}
  const snaps=await p.evaluate(()=>{const s=window.__R97_MOTION_QA;return{idle:s.seek('Idle',.2),step:s.seek('Attack',.32),land:s.seek('Attack',.60),finish:s.seek('Attack',.91),retreat:s.seek('Hit',.40),brace:s.seek('Hit',.75),hitFinish:s.seek('Hit',.94),reset:s.seek('Idle',.20)}});
  const a=snaps;const proper=a.idle?.role===ids[i]&&a.land?.clip==='Attack'&&a.brace?.clip==='Hit';
  const shapes=a.land.parts.some(x=>Object.hasOwn(x.weights,'Land'))&&a.brace.parts.some(x=>Object.hasOwn(x.weights,'Brace'));
  const curves={step:max(a.step,'Step'),earlyLand:max(a.step,'Land'),land:max(a.land,'Land'),lateStep:max(a.land,'Step'),finishLand:max(a.finish,'Land'),retreat:max(a.retreat,'Retreat'),earlyBrace:max(a.retreat,'Brace'),brace:max(a.brace,'Brace'),lateRetreat:max(a.brace,'Retreat'),finishBrace:max(a.hitFinish,'Brace'),resetLand:max(a.reset,'Land'),resetBrace:max(a.reset,'Brace')};
  const floorOK=['idle','step','land','finish','retreat','brace','hitFinish'].every(k=>a[k].bounds&&a[k].bounds.minY>=a.idle.bounds.minY-.055);
  const curveOK=curves.step>.7&&curves.earlyLand<.16&&curves.land>.75&&curves.lateStep<.32&&curves.finishLand<.55&&curves.retreat>.7&&curves.earlyBrace<.25&&curves.brace>.7&&curves.lateRetreat<.28&&curves.finishBrace<.55&&curves.resetLand<.02&&curves.resetBrace<.02;
  const ok=proper&&shapes&&floorOK&&curveOK;
  tests.push({id:ids[i],ok,proper,shapes,floorOK,curveOK,curves,baseline:a.idle.bounds,contact:a.land.bounds,recovery:a.brace.bounds});
  if(!ok)console.log('R97_CONTACT_ERROR',view,JSON.stringify(tests.at(-1)));
  if(i===0||i===3||i===6){await p.evaluate(()=>window.__R97_MOTION_QA.seek('Attack',.60));await p.locator('#viewport').screenshot({path:path.join(root,`r97-${view}-${ids[i]}-land.png`)});}
 }
 const pass=!errors.length&&tests.length===7&&tests.every(x=>x.ok);rows.push({view,pass,errors,tests});
 console.log('R97_CONTACT_GATE',JSON.stringify({view,pass,errors,tests}));await p.close();
}}finally{fs.writeFileSync(path.join(root,'r97-landing-qa.json'),JSON.stringify(rows,null,2));await browser.close()}
if(rows.length!==2||rows.some(r=>!r.pass))process.exitCode=5;
})().catch(e=>{console.error('R97_CONTACT_QA_EXCEPTION',e);process.exitCode=9});
