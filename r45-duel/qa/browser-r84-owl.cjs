const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const fs=require('fs'),path=require('path');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11081',out=path.join(__dirname,'evidence/r84');fs.mkdirSync(out,{recursive:true});
const browserOptions={headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']};
(async()=>{const browser=await chromium.launch(browserOptions);let rows=[];
try{for(const [viewport,width,height] of [['wide',1440,900],['portrait',430,900]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push('JS:'+e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))errors.push('HTTP '+r.status()+' '+r.url())});
 let reply=[];page.on('console',e=>{if(e.type()==='error')errors.push('CONSOLE:'+e.text().slice(0,250))});
 const response=await page.goto(`${origin}/r45-duel/?qa=1&seed=2`,{waitUntil:'domcontentloaded',timeout:50000});
 try{await page.waitForFunction(()=>window.__r45QA?.sceneReady,{timeout:80000})}catch(e){errors.push('BOOT:'+String(e))}
 const pageLoaded=await page.evaluate(()=>{const q=document.querySelector('#stadium')?.contentWindow?.__r45SceneQA;return{ready:q?.ready,modelCount:q?.summonModels?.length,models:q?.summonModels?.filter(x=>['E03','G02','T03','T01'].includes(x.id))}});
 const units={player:[{id:'T01',uid:'U101',hp:7,attack:2,shield:0},{id:'G02',uid:'U102',hp:7,attack:2,shield:0},{id:'T03',uid:'U103',hp:7,attack:2,shield:0},{id:'E03',uid:'U104',hp:7,attack:2,shield:0}],ai:[{id:'T01',uid:'U201',hp:7,attack:2,shield:0},{id:'E03',uid:'U202',hp:7,attack:2,shield:0},{id:'T03',uid:'U203',hp:7,attack:2,shield:0},{id:'E03',uid:'U204',hp:7,attack:2,shield:0}]};
 await page.evaluate(units=>{document.querySelector('#stadium').contentWindow.postMessage({type:'ASDC_R45_BOARD',player:units.player.map(x=>x.id),ai:units.ai.map(x=>x.id),units},location.origin)},units);
 try{await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.total===8,null,{timeout:30000})}catch(e){errors.push('SPAWN:'+String(e))}
 await page.waitForTimeout(900);const state=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence);
 await page.screenshot({path:path.join(out,`r84-${viewport}-summons.png`)});
 await page.evaluate(units=>{const post=structuredClone(units);post.ai[0].hp=5;document.querySelector('#stadium').contentWindow.postMessage({type:'ASDC_R51_COMBAT_EVENTS',pre:units,post,events:[{type:'exchange',side:'player',from:'T01',to:'E03',attacker_uid:'U101',target_uid:'U201',serial:1234,damage:2,target_hp_after:5,attacker_hp_after:7}]},location.origin)},units);
 await page.waitForTimeout(410);
 const combat=await page.evaluate(()=>({presence:document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence,seq:document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonSequence}));
 await page.screenshot({path:path.join(out,`r84-${viewport}-combat.png`)});
 const newActors=state?.entries.filter(x=>['E03','G02','T03','T01'].includes(x.id))||[];
 const actorPass=newActors.length===8&&newActors.every(x=>x.visible&&x.inView&&x.metrics?.height>(x.id==='T01'?1.0:1.8)&&x.metrics?.height<2.65&&Math.abs(x.metrics?.minY)<.10&&x.metrics?.frontDot>.60);
 const pass=errors.length===0&&response.status()===200&&pageLoaded.ready===true&&pageLoaded.modelCount===10&&pageLoaded.models.length===4&&pageLoaded.models.every(x=>x.file.includes('BlenderStudio-R83')||x.file.includes('Innerscene-R84'))&&actorPass&&combat.presence?.total===8;
 rows.push({viewport,pass,pageLoaded,actorPass,entries:newActors.map(x=>({id:x.id,side:x.side,height:x.metrics.height,minY:x.metrics.minY,frontDot:x.metrics.frontDot,inView:x.inView,clips:x.clips})),combatCount:combat.presence?.total,errors});
 console.log('R80_MAINPORT_GAMING_GATE',JSON.stringify(rows.at(-1)));await page.close();
}}finally{fs.writeFileSync(path.join(out,'r84-local-qa.json'),JSON.stringify(rows,null,2));await browser.close()}
 if(rows.length!==2||rows.some(x=>!x.pass))process.exitCode=5;
})().catch(e=>{console.error(e);process.exitCode=9});
