import{createRequire}from'node:module';import{mkdirSync,writeFileSync}from'node:fs';import{resolve}from'node:path';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out=resolve(import.meta.dirname,'evidence/r85');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const report={ok:false,checks:[],errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 page.on('pageerror',e=>report.errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))
  report.errors.push('HTTP '+r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:11025/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:70000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:130000});
 const five=['E03','E04','G02','G04','T03'];
 const models=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonModels);
 const lookup=Object.fromEntries(models.map(x=>[x.id,x]));
 const names=Object.fromEntries(five.map(id=>[id,lookup[id]?.file]));
 const modelOK=five.every(id=>lookup[id]?.file.endsWith('-R85-Acting.glb'));
 const payload={type:'ASDC_R45_BOARD',player:['E03','E04','G02'],ai:['G04','T03'],
  units:{player:['E03','E04','G02'].map((id,i)=>({id,uid:'U851'+i,hp:9,attack:2})),
         ai:['G04','T03'].map((id,i)=>({id,uid:'U852'+i,hp:9,attack:2}))}};
 await page.evaluate(msg=>document.querySelector('#stadium').contentWindow.postMessage(msg,location.origin),payload);
 await page.waitForFunction(()=>{
  const qa=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return qa.summonPresence?.entries?.length===5&&qa.summonPresence.entries.every(x=>x.motion?.artistMorph?.meshes>=5);
 },null,{timeout:28000});
 await page.waitForTimeout(4500); // compositor and shaders settled
 const entries=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.entries);
 await page.screenshot({path:resolve(out,'r85-five-recasts-real-stadium.png')});
 // Real card and damage event source in camera-stable format.
 const combat={type:'ASDC_R51_COMBAT_EVENTS',
 events:[{type:'exchange',side:'player',from:'E03',to:'G04',attacker_uid:'U8510',target_uid:'U8520',damage:2,blocked:0,serial:85018,target_hp_after:7,attacker_hp_after:9}],
 pre:payload.units,post:payload.units};
 await page.evaluate(msg=>document.querySelector('#stadium').contentWindow.postMessage(msg,location.origin),combat);
 await page.waitForTimeout(365);
 const action=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.entries);
 await page.screenshot({path:resolve(out,'r85-five-recasts-attack-in-real-stadium.png')});
 await page.waitForTimeout(1350);
 const restored=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.entries);
 const attack=action.find(x=>x.id==='E03')?.motion?.artistMorph;
 const hit=action.find(x=>x.id==='G04')?.motion?.artistMorph;
 const pass=modelOK&&entries.length===5&&entries.every(x=>x.visible&&x.motion?.artistMorph?.meshes>=5)&&
  entries.every(x=>x.metrics?.frontDot>.75)&&
  attack?.mode==='attack'&&attack?.live?.[1]>.05&&
  hit?.mode==='hit'&&hit?.live?.[2]>.05&&
  restored.every(x=>x.motion?.artistMorph?.mode==='idle');
 report.checks.push({name:'five distinct film models on real two-sided game board',pass,
  names,allVisible:entries.every(x=>x.visible),
  dimensions:entries.map(x=>({id:x.id,w:x.metrics.width,h:x.metrics.height,foot:x.metrics.minY,front:x.metrics.frontDot,withinFrame:x.metrics.withinFrame,actor:x.motion.artistMorph})),
  action:{attack,hit},restored:restored.map(x=>({id:x.id,morph:x.motion.artistMorph}))});
 report.ok=pass&&report.errors.length===0;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r85-five-recasts-real-game.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R85_FIVE_REAL_GAME',JSON.stringify(report));await browser.close();if(!report.ok)process.exitCode=8;
}
