const{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright'),fs=require('fs'),path=require('path');
const root='/mnt/data/game-assets/after-school-duel/r80-mainport-qa',base=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11081';
const ids=['E03','E04','G02','G03','G04','T03','T04'],rows=[];
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
try{for(const[view,w,h]of[['desktop',1440,900],['portrait',430,900]]){
const p=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
p.on('pageerror',e=>errors.push('JS '+e.message));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))errors.push('HTTP '+r.status()+' '+r.url().slice(0,150))});
await p.goto(base+'/r45-duel/r96-knee-review.html',{waitUntil:'domcontentloaded',timeout:85000});
await p.waitForFunction(()=>window.__R88_REVIEW_QA?.ready===true,null,{timeout:170000});
const tests=[];
for(let i=0;i<ids.length;i++){
 if(i){await p.locator('#characters .person').nth(i).click();await p.waitForFunction(id=>window.__R88_REVIEW_QA?.ready===true&&window.__R88_REVIEW_QA.currentId===id,ids[i],{timeout:145000})}
 const idle=await p.evaluate(()=>window.__R96_KNEE_QA.sample());
 await p.locator('[data-clip="Attack"]').click();await p.waitForTimeout(235);
 const attack=await p.evaluate(()=>window.__R96_KNEE_QA.sample());
 await p.locator('#viewport').screenshot({path:path.join(root,`r96-${view}-${ids[i]}-attack.png`)});
 await p.locator('[data-clip="Hit"]').click();await p.waitForTimeout(235);
 const hit=await p.evaluate(()=>window.__R96_KNEE_QA.sample());
 const max=(s,key)=>Math.max(0,...s.parts.map(x=>x.weights[key]||0));
 const att=max(attack,'Step'),ret=max(hit,'Retreat');
 const hasMorph=idle.parts.some(x=>Object.hasOwn(x.weights,'Step'))&&idle.parts.some(x=>Object.hasOwn(x.weights,'Retreat'));
 const floorOK=idle.bounds&&attack.bounds&&hit.bounds&&attack.bounds.minY>=idle.bounds.minY-.18&&hit.bounds.minY>=idle.bounds.minY-.18;
 const ok=hasMorph&&attack.clip==='Attack'&&hit.clip==='Hit'&&att>.2&&ret>.2&&floorOK;
 tests.push({id:ids[i],ok,hasMorph,stepWeight:att,retreatWeight:ret,floorOK,bounds:{idle:idle.bounds,attack:attack.bounds,hit:hit.bounds},parts:idle.parts.length});
}
const pass=!errors.length&&tests.length===7&&tests.every(t=>t.ok);rows.push({view,pass,errors,tests});
console.log('R96_KNEE_MORPH_GATE',JSON.stringify({view,pass,errors,tests}));await p.close();
}}finally{fs.writeFileSync(path.join(root,'r96-knee-qa.json'),JSON.stringify(rows,null,2));await browser.close()}
if(rows.length!==2||rows.some(r=>!r.pass))process.exitCode=5;
})().catch(e=>{console.error('R96_KNEE_QA_ERROR',e);process.exitCode=9});
