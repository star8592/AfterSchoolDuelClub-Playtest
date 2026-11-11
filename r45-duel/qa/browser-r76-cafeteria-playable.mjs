import {createRequire} from 'node:module';
import{mkdirSync,writeFileSync}from'node:fs';import{resolve}from'node:path';
import{createGame}from'../engine.mjs';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const base=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11007';const out=resolve(import.meta.dirname,'evidence/r76');mkdirSync(out,{recursive:true});
const seed=Array.from({length:3000},(_,i)=>i+1).find(s=>createGame(s).hand.player.includes('M02'));
if(!seed)throw Error('Cannot draw M02 from valid deck');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
const rows=[];
try{for(const[viewport,width,height]of [['desktop',1600,900],['portrait',430,900]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];
 page.on('pageerror',e=>errors.push('JS '+String(e)));page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
 await page.goto(`${base}/r45-duel/?qa=1&seed=${seed}`,{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:90000});
 const init=await page.evaluate(()=>({cards:window.__r45QA.cardCount,modelCount:document.querySelector('#stadium').contentWindow.__r45SceneQA.summonModels.length}));
 await page.locator('#end').click();await page.waitForFunction(()=>window.__r45QA?.round===2,null,{timeout:30000});
 await page.locator('#hand .card[data-card-id="M02"]').click();await page.locator('#play').click();
 const played=await page.evaluate(()=>({units:window.__r45QA.board.player[0].map(x=>x.id),events:window.__r45QA.events.filter(x=>x.type==='card_play').map(x=>x.card)}));
 await page.screenshot({path:resolve(out,`actual-card-${viewport}.png`)});
 // Direct visual specimen after the authentic play click: clone + two camps.
 await page.goto(`${base}/r45-duel/?qa=1&seed=1`,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:90000});
 const samples=await page.evaluate(async()=>{
  const f=document.querySelector('#stadium').contentWindow;
  f.postMessage({type:'ASDC_R45_BOARD',player:['M02','M02','E01'],ai:['M02','M02','G01'],units:{
    player:[{id:'M02',uid:'U7601',hp:4,attack:3,shield:0},{id:'M02',uid:'U7602',hp:4,attack:3,shield:0},{id:'E01',uid:'U7603',hp:2,attack:1,shield:0}],
    ai:[{id:'M02',uid:'U8601',hp:4,attack:3,shield:0},{id:'M02',uid:'U8602',hp:4,attack:3,shield:0},{id:'G01',uid:'U8603',hp:3,attack:1,shield:0}]}},location.origin);
  for(let i=0;i<180;i++){
   if(f.__r45SceneQA.summonPresence.entries.filter(x=>x.id==='M02').length===4)break;
   await new Promise(ok=>setTimeout(ok,75));
  }
  const snapshots=[];for(let i=0;i<32;i++){
   await new Promise(ok=>setTimeout(ok,90));
   snapshots.push(f.__r45SceneQA.summonPresence.entries.filter(x=>x.id==='M02').map(x=>({
    side:x.side,kind:x.kind,within:x.metrics?.withinFrame,front:x.metrics?.frontDot,
    minY:x.metrics?.minY,height:x.metrics?.height,
    clip:x.motion?.clip,animations:x.motion?.animationCount,artApproved:x.artApproved
   })));
  }return snapshots;
 });
 await page.screenshot({path:resolve(out,`double-camp-${viewport}.png`)});
 const bySide=['player','ai'].map(side=>{
  const a=samples.flatMap(x=>x.filter(v=>v.side===side));
  return{side,frames:a.length,visible:a.length>=60&&a.every(x=>x.within),ground:Math.max(0,...a.map(x=>Math.abs(x.minY))),minHeight:Math.min(...a.map(x=>x.height)),maxHeight:Math.max(...a.map(x=>x.height)),facing:a.every(x=>x.front>.98),nativeIdle:a.some(x=>x.clip==='Idle'),realRig:a.every(x=>x.kind==='gltf-instance'&&x.artApproved===false)};
 });
 const pass=init.cards===20&&init.modelCount===12&&played.units.includes('M02')&&played.events.includes('M02')&&bySide.every(x=>x.frames>=60&&x.visible&&x.ground<.12&&x.minHeight>1.6&&x.maxHeight<2.5&&x.facing&&x.nativeIdle&&x.realRig)&&!errors.length;
 const row={viewport,seed,init,played,bySide,pass,errors};rows.push(row);console.log('R76_M02_PLAYABLE_GLTF',JSON.stringify(row));await page.close();
}}finally{writeFileSync(resolve(out,'R76_M02_PLAYABILITY.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
if(rows.length!==2||rows.some(x=>!x.pass))process.exitCode=3;
