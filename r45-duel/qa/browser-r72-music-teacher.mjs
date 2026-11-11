/** R72: source school teacher playable card, both camps, real GLB/IK in stadium. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createGame} from '../engine.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11002';
const out=resolve(import.meta.dirname,'evidence/r72');mkdirSync(out,{recursive:true});
const seed=Array.from({length:2500},(_,i)=>i+1).find(x=>createGame(x).hand.player.includes('M01'));
if(!seed)throw Error('No M01 seed');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const rows=[];
try{
 for(const [name,width,height] of [['desktop',1600,900],['portrait',430,900]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(`${origin}/r45-duel/?qa=1&seed=${seed}`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:100000});
  const start=await page.evaluate(()=>({cards:window.__r45QA.cardCount,round:window.__r45QA.round,hand:window.__r45QA.hand,modelCount:document.querySelector('#stadium').contentWindow.__r45SceneQA.summonModels.length}));
  const scene=page.locator('#stadium');
  await page.locator('#end').click();
  await page.waitForFunction(()=>window.__r45QA?.round===2,null,{timeout:25000});
  await page.locator('#hand .card[data-card-id="M01"]').click();
  await page.locator('#play').click();
  const played=await page.evaluate(()=>({board:window.__r45QA.board.player[0].map(x=>x.id),events:window.__r45QA.events.filter(e=>e.type==='card_play').map(e=>e.card)}));
  await page.screenshot({path:resolve(out,`play-${name}-M01-card.png`)});
  // Separate camera-space specimen after the authentic card-play proof above:
  // do not let any prior E01/G01 scripted cinematic defer M01 board updates.
  await page.goto(`${origin}/r45-duel/?qa=1&seed=1`,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:80000});
  const info=await page.evaluate(async()=>{
   const f=document.querySelector('#stadium').contentWindow;
   f.postMessage({type:'ASDC_R45_BOARD',player:['M01','E01'],ai:['M01','G01'],units:{
    player:[{id:'M01',uid:'U7201',hp:5,attack:2,shield:0},{id:'E01',uid:'U7202',hp:2,attack:1,shield:0}],
    ai:[{id:'M01',uid:'U8201',hp:5,attack:2,shield:0},{id:'G01',uid:'U8202',hp:3,attack:1,shield:0}]}},location.origin);
   for(let wait=0;wait<150;wait++){
    if(f.__r45SceneQA.summonPresence.entries.filter(x=>x.id==='M01').length===2)break;
    await new Promise(r=>setTimeout(r,95));
   }
   const samples=[];
   for(let i=0;i<40;i++){
    await new Promise(r=>setTimeout(r,85));
    const q=f.__r45SceneQA.summonPresence;
    samples.push({i,roles:q.entries.filter(x=>x.id==='M01').map(x=>({id:x.id,side:x.side,kind:x.kind,
     within:x.metrics.withinFrame,front:x.metrics.frontDot,minY:x.metrics.minY,
     height:x.metrics.height,clip:x.motion?.clip,posture:x.motion?.posture,
     approved:x.artApproved}))});
   }
   return samples;
  });
  await page.screenshot({path:resolve(out,`stadium-${name}-music-teacher.png`)});
  const bySide=['player','ai'].map(side=>{
   const values=info.flatMap(s=>s.roles.filter(x=>x.side===side));
   const entrance=Math.max(...values.map(v=>v.posture?.entranceAmount||0));
   const errors=values.flatMap(v=>v.posture?.arms?.map(a=>a.error)||[]);
   return{side,frames:values.length,entrance:+entrance.toFixed(3),
    maxHandError:+Math.max(0,...errors).toFixed(3),
    rightFacing:values.every(v=>v.front>.98),
    inFrame:values.every(v=>v.within),
    minHeight:Math.min(...values.map(v=>v.height)),maxHeight:Math.max(...values.map(v=>v.height)),
    ground:Math.max(...values.map(v=>Math.abs(v.minY))),
    allReal:values.every(v=>v.kind==='gltf-instance'&&v.approved===false),
    playingIdle:values.some(v=>v.clip==='Idle')};
  });
  const pass=start.cards===19&&start.modelCount===11&&played.board.includes('M01')&&
    played.events.includes('M01')&&bySide.every(x=>x.frames>25&&x.entrance>.65&&
     x.maxHandError<.10&&x.rightFacing&&x.inFrame&&
     x.minHeight>=1.85&&x.maxHeight<=2.20&&x.ground<.09&&x.allReal&&x.playingIdle)&&!errors.length;
  const row={name,seed,pass,start,played,bySide,errors};rows.push(row);
  console.log('R72_MUSIC_TEACHER_LIVE',JSON.stringify(row));
  await page.close();
 }
}finally{writeFileSync(resolve(out,'music-teacher-results.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
if(rows.length!==2||rows.some(x=>!x.pass))process.exitCode=3;
