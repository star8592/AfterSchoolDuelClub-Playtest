/** R68: all nine actual skinned humanoids visibly pose on their real summon turn. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10998';
const out=resolve(import.meta.dirname,'evidence/r68');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const output=[];
try{
 for(const [view,width,height] of [['wide',1600,900],['portrait',430,900]]){
  const p=await browser.newPage({viewport:{width,height}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  p.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()}: ${r.url()}`)});
  await p.goto(`${origin}/r45-duel/?qa=1&seed=1`,{waitUntil:'domcontentloaded',timeout:45000});
  await p.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:70000});
  const pending=p.evaluate(async()=>{
   const f=document.querySelector('#stadium').contentWindow;
   const ids={player:['E01','E03','E04','G02','G01'],ai:['G03','G04','T03','T04','G01']};
   const units=Object.fromEntries(Object.entries(ids).map(([side,values])=>
    [side,values.map((id,i)=>({id,uid:'U'+(side==='player'?1:2)+(i+10),hp:8,attack:2,shield:0}))]));
   f.postMessage({type:'ASDC_R45_BOARD',...ids,units},location.origin);
   const samples=[];
   for(let i=0;i<35;i++){
    await new Promise(r=>setTimeout(r,105));
    const s=f.__r45SceneQA.summonPresence;
    samples.push({i,actors:s.entries.map(e=>({id:e.id,side:e.side,
     front:e.metrics.frontDot,frame:e.metrics.withinFrame,height:e.metrics.height,
     ground:e.metrics.minY,
     entrance:e.vrmActing?.entranceAmount??e.motion?.posture?.entranceAmount??null,
     wrists:e.vrmActing?.heroPose?.arms||null}))});
   }
   return samples;
  });
  await p.waitForTimeout(1070);
  await p.screenshot({path:resolve(out,`arena-${view}-nine-humanoids-entrance.png`)});
  const samples=await pending;
  const entries=samples.flatMap(s=>s.actors),groups=new Map();
  for(const e of entries){const id=e.side+':'+e.id;if(!groups.has(id))groups.set(id,[]);groups.get(id).push(e)}
  const rows=[...groups.entries()].map(([id,v])=>({id,
   entrancePeak:Math.max(...v.map(x=>x.entrance||0)),
   minFront:Math.min(...v.map(x=>x.front)),
   framesInView:v.every(x=>x.frame),
   minGround:Math.min(...v.map(x=>x.ground)),
   maxHeight:Math.max(...v.map(x=>x.height)),
   maxWristError:Math.max(0,...v.flatMap(x=>x.wrists?Object.values(x.wrists).map(y=>y.error):[]))
  }));
  const pass=rows.length===10&&rows.every(x=>x.entrancePeak>.68&&
   x.minFront>.98&&x.framesInView&&x.minGround>-.09&&x.maxHeight<2.6&&x.maxWristError<.09)&&!errors.length;
  output.push({view,pass,rows,errors});console.log('R68_LIVE_ARRIVAL',JSON.stringify(output.at(-1)));
  await p.close();
 }
}finally{writeFileSync(resolve(out,'live-entrance-results.json'),JSON.stringify(output,null,2)+'\n');await browser.close()}
if(output.length!==2||output.some(x=>!x.pass))process.exitCode=3;
