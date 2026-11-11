const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');const fs=require('fs'),path=require('path');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11081',out=path.join(__dirname,'evidence/r86');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader-webgl','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});let cases=[];
try{for(const [mode,width,height] of [['rig',1440,900],['baseline',1440,900],['rig-phone',430,900]]){
 const page=await b.newPage({viewport:{width,height}}),errors=[];
 page.on('pageerror',e=>errors.push('JS '+e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))errors.push('HTTP '+r.status()+' '+r.url())});
 const rig=mode!=='baseline';await page.goto(`${origin}/r45-duel/?qa=1&seed=1${rig?'&g03Study=rig':''}`,{waitUntil:'domcontentloaded',timeout:95000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:130000});
 const specs=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonModels?.filter(x=>x.id==='G03'));
 const units={player:[{id:'G03',uid:'U101',hp:5,attack:2,shield:0},{id:'T04',uid:'U102',hp:5,attack:2,shield:0}],ai:[{id:'T04',uid:'U201',hp:5,attack:2,shield:0},{id:'G03',uid:'U202',hp:5,attack:2,shield:0}]};
 await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage({type:'ASDC_R45_BOARD',player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id),units:u},location.origin),units);
 await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.total===4,null,{timeout:30000});
 await page.waitForTimeout(750);const idle=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
 await page.screenshot({path:path.join(out,`r86-${mode}-idle.png`)});
 await page.evaluate(u=>{const post=structuredClone(u);post.ai[0].hp=3;document.querySelector('#stadium').contentWindow.postMessage({type:'ASDC_R51_COMBAT_EVENTS',pre:u,post,events:[{type:'exchange',side:'player',from:'G03',to:'T04',attacker_uid:'U101',target_uid:'U201',serial:926,damage:2,attacker_hp_after:5,target_hp_after:3}]},location.origin)},units);
 await page.waitForTimeout(250);const attack=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
 await page.screenshot({path:path.join(out,`r86-${mode}-attack.png`)});
 const entries=idle.entries.filter(x=>x.id==='G03');const fighting=attack.entries.filter(x=>x.id==='G03');const actorsOk=entries.length===2&&entries.every(x=>x.visible&&x.inView&&x.metrics.height>1.8&&x.metrics.height<2.5&&x.metrics.frontDot>.94&&x.metrics.minY>-.12&&x.metrics.minY<.14);
 const clipInfo=x=>({id:x.id,side:x.side,playing:x.motion?.playingClips||x.motion?.clips,clip:x.motion?.clip,native:x.native,metrics:{height:x.metrics?.height,ground:x.metrics?.minY,front:x.metrics?.frontDot}});
 const pass=!errors.length&&actorsOk&&specs.length===1&&(rig?specs[0].file==='G03-Jay-Skinned-R86.glb':specs[0].file==='G03-Jay-BlenderStudio-R80.glb');
 const obj={mode,pass,errors,model:specs[0],idle:entries.map(clipInfo),attack:fighting.map(clipInfo),total:idle.total};cases.push(obj);console.log('R86_GAME_QA',JSON.stringify(obj));await page.close();
}}finally{fs.writeFileSync(path.join(out,'r86-jay-test.json'),JSON.stringify(cases,null,2));await b.close()}
if(cases.length!==3||cases.some(x=>!x.pass))process.exitCode=5;
})().catch(e=>{console.log('R86_QA_ERROR',String(e));process.exitCode=9})
