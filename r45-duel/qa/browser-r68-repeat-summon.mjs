/** R68 recycled source meshes must restart hero entrance, then relax without reverting to bind pose. */
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10998';
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const rows=[];let fail=false;
try{
 const p=await browser.newPage({viewport:{width:1600,height:900}}),errors=[];
 p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:70000});
 for(let n=0;n<4;n++){
  const s=await p.evaluate(async n=>{
   const f=document.querySelector('#stadium').contentWindow;
   const ids=['E03','E04','G02','G03','T04'];
   const empty={player:[],ai:[]};
   f.postMessage({type:'ASDC_R45_BOARD',player:[],ai:[],units:empty},location.origin);
   await new Promise(r=>setTimeout(r,180));
   const build=side=>ids.map((id,i)=>({id,uid:'U'+(side==='player'?'1':'2')+n+i,hp:5,attack:2,shield:0}));
   const units={player:build('player'),ai:build('ai')};
   f.postMessage({type:'ASDC_R45_BOARD',player:ids,ai:ids,units},location.origin);
   await new Promise(r=>setTimeout(r,350));
   const entry=f.__r45SceneQA.summonPresence;
   await new Promise(r=>setTimeout(r,2250));
   const idle=f.__r45SceneQA.summonPresence;
   return {entry,idle};
  },n);
  const relevant=s.entry.entries.filter(e=>e.motion?.posture),
   idle=s.idle.entries.filter(e=>e.motion?.posture);
  const pass=relevant.length===10&&idle.length===10&&relevant.every(e=>
    e.motion.clipRunning===true&&e.motion.clip==='Idle'&&
    e.motion.posture.entranceAmount>.70&&e.metrics.frontDot>.98&&e.metrics.withinFrame)&&
    idle.every(e=>e.motion.clipRunning===true&&e.motion.posture.entranceAmount<.05&&
     e.motion.posture.arms.every(a=>a.drop<-.40)&&e.metrics.frontDot>.98);
  rows.push({round:n,pass,visible:relevant.length,
   initialPose:relevant.map(x=>x.motion.posture.entranceAmount),
   relaxed:idle.map(x=>x.motion.posture.entranceAmount),
   running:relevant.every(x=>x.motion.clipRunning)&&idle.every(x=>x.motion.clipRunning),errors:[...errors]});
  console.log('R68_HERO_REPEATED_SPAWN',JSON.stringify(rows.at(-1)));
  if(!pass||errors.length)fail=true;
 }
 await p.close();
}finally{writeFileSync(resolve(import.meta.dirname,'evidence/r68/repeat-results.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
if(fail||rows.length!==4)process.exitCode=3;
