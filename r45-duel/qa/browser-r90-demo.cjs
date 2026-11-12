const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright'),fs=require('fs'),path=require('path');
const root='/mnt/data/game-assets/after-school-duel/r80-mainport-qa',base=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11081',report=[];
(async()=>{const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
try{for(const [view,width,height] of [['desktop',1440,900],['portrait',430,900]]){
 const p=await b.newPage({viewport:{width,height}}),errors=[];
 p.on('pageerror',e=>errors.push('JS '+e.message));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))errors.push('HTTP '+r.status()+' '+r.url().slice(0,150))});
 await p.goto(base+'/r45-duel/r90-combat-review.html',{waitUntil:'domcontentloaded',timeout:85000});
 await p.waitForFunction(()=>window.__R90_SHOWCASE_QA?.ready===true,null,{timeout:170000});
 const snaps=[];
 for(const id of ['E03','E04','G02','G03','G04','T03','T04']){
  const before=await p.evaluate(()=>window.__R90_SHOWCASE_QA.completed);
  await p.locator('#roles .role[data-id="'+id+'"]').click();
  await p.locator('#fire').click();
  await p.waitForFunction(n=>window.__R90_SHOWCASE_QA.completed>n,before,{timeout:12500});
  const info=await p.evaluate(()=>({q:{...window.__R90_SHOWCASE_QA},scene:document.querySelector('#arena').contentWindow.__r45SceneQA.combatEvents}));
  const ok=info.q.role===id&&info.q.mode==='on'&&info.scene.r90MotionEnabled&&info.scene.r90ImpactTriggers>=1;
  snaps.push({id,ok,completed:info.q.completed,impacts:info.q.impacts});
 }
 await p.screenshot({path:path.join(root,`r90-demo-${view}-new.png`)});
 const beforeCombo=await p.evaluate(()=>({complete:window.__R90_SHOWCASE_QA.completed,impacts:window.__R90_SHOWCASE_QA.impacts}));
 await p.locator('#combo').click();await p.waitForFunction(c=>window.__R90_SHOWCASE_QA.completed>c,beforeCombo.complete,{timeout:16000});
 const comboAfter=await p.evaluate(()=>({...window.__R90_SHOWCASE_QA}));
 const comboOK=comboAfter.impacts-beforeCombo.impacts===3;
 await p.locator('#mode').click();await p.waitForFunction(()=>window.__R90_SHOWCASE_QA?.ready===true&&window.__R90_SHOWCASE_QA.mode==='off',null,{timeout:170000});
 const legacyBefore=await p.evaluate(()=>window.__R90_SHOWCASE_QA.completed);
 await p.locator('#fire').click();await p.waitForFunction(n=>window.__R90_SHOWCASE_QA.completed>n,legacyBefore,{timeout:14500});
 const legacy=await p.evaluate(()=>({q:{...window.__R90_SHOWCASE_QA},scene:document.querySelector('#arena').contentWindow.__r45SceneQA.combatEvents}));
 await p.screenshot({path:path.join(root,`r90-demo-${view}-legacy.png`)});
 const legacyOK=legacy.q.mode==='off'&&legacy.q.ready&&!legacy.scene.r90MotionEnabled&&legacy.scene.r90ImpactTriggers===0;
 const pass=!errors.length&&snaps.every(x=>x.ok)&&comboOK&&legacyOK;
 const row={view,pass,errors,snaps,comboOK,comboAfter,legacyOK,legacy};report.push(row);
 console.log('R90_SHOWCASE_GATE',JSON.stringify({view,pass,roles:snaps,comboOK,legacyOK,errors}));
 await p.close();
}}finally{fs.writeFileSync(path.join(root,'r90-demo-qa.json'),JSON.stringify(report,null,2));await b.close()}
if(report.length!==2||report.some(x=>!x.pass))process.exitCode=5;
})().catch(e=>{console.error('R90_DEMO_QA_ERROR',e);process.exitCode=9});
