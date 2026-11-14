import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11453';
const dir=resolve(import.meta.dirname,'evidence/r146/seven-source-cast');
mkdirSync(dir,{recursive:true});
const ids=['E03','E04','G02','G03','G04','T03','T04'];
const result={passed:false,checks:[],errors:[],views:[]};
const check=(ok,label,d)=>{result.checks.push({pass:!!ok,label});if(!ok)throw Error(label+' '+JSON.stringify(d).slice(0,2000))};
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width]of [['desktop',1440],['portrait',430]]){
  const p=await b.newPage({viewport:{width,height:900}}),errors=[];
  p.on('pageerror',e=>errors.push('JS '+e.message));
  p.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-80))});
  await p.goto(origin+'/r45-duel/?qa=1&seed=146&r146Cast=on',{waitUntil:'domcontentloaded',timeout:90000});
  await p.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
  const roster=ids.map((id,i)=>({uid:'U146'+(i+100),id,hp:8,attack:3,shield:0}));
  const player=roster.slice(0,4),ai=roster.slice(4);
  await p.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage(
    {type:'ASDC_R45_BOARD',units:u,player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id)},location.origin),{player,ai});
  await p.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===7,null,{timeout:40000});
  const readings=[];
  for(let k=0;k<6;k++){
   await p.waitForTimeout(k===0?450:3000);
   readings.push(await p.evaluate(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{actors:q.summonPresence.entries.map(a=>({
     id:a.id,front:a.metrics.frontDot,stage:a.r134JayStage||a.r135PairStage||a.r136CastStage,
     shoes:a.r133ShoeContact||a.r136OriginalFoot,
     arms:a.r131Arms,face:a.r140OriginalFace,
     legs:a.r128FullBody||a.r129FullBody||a.r130FullBody,
     hips:a.r144OriginalPelvis})),drawCalls:q.drawCalls};
   }));
  }
  for(const id of ids){
   const samples=readings.map(r=>r.actors.find(a=>a.id===id));
   check(samples.every(a=>a?.front>.90&&a.stage?.enabled),view+' '+id+' source actor active and correctly facing',samples[0]);
   check(samples.every(a=>a.shoes&&(a.shoes.maxAfter??a.shoes.maxAfterPenetration??99)<.004),
    view+' '+id+' original source feet never penetrate through fifteen seconds',samples.map(a=>a.shoes));
   const progress=x=>x.stage.frames??x.stage.updateFrames??x.stage.activeSeconds*60;
   check(id==='G03'?
    samples.slice(1).every((a,i)=>Math.abs(progress(a)-progress(samples[i]))>8):
    progress(samples.at(-1))-progress(samples[0])>=100,
    view+' '+id+' actual original skinned stage advances for fifteen seconds',samples.map(progress));
   const distinct=new Set(samples.map(a=>JSON.stringify(a.stage.arms??a.stage.sourceArmDirections)));
   check(distinct.size>=4,view+' '+id+' actual original source arms change continually', [...distinct].slice(0,4));
   check(samples.at(-1).arms?.maxWeightedArmVertexTravel>0.0001,
    view+' '+id+' source weighted arm vertices moved, no decorative root-only wiggle',samples.at(-1).arms);
   if(id==='T04')check(samples.at(-1).hips?.highWeightSourceVertices>=4900,
    view+' source Rex real weighted pelvis still connected',samples.at(-1).hips);
  }
  check(readings.every(r=>r.actors.length===7&&r.drawCalls<1750),view+' seven real skins sustained and bounded GPU load',readings.map(r=>r.drawCalls));
  check(errors.length===0,view+' no load/JS errors after sustained seven-source show',errors);
  await p.screenshot({path:resolve(dir,view+'-seven-source-15sec.png')});
  result.views.push({view,readings});
  await p.close();
 }
 result.passed=true;
}catch(e){result.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r146-seven-cast-15sec.json'),JSON.stringify(result,null,2));await b.close()}
console.log('R146_SEVEN_SOURCE_15SEC_REAL_GPU',JSON.stringify({passed:result.passed,checks:result.checks.length,errors:result.errors,views:result.views.map(v=>({view:v.view,maxDrawCalls:Math.max(...v.readings.map(r=>r.drawCalls)),actors:v.readings.at(-1).actors.map(a=>({id:a.id,frame:a.stage.frames??a.stage.updateFrames??a.stage.activeSeconds*60,feet:a.shoes.maxAfter??a.shoes.maxAfterPenetration,weightedArmTravel:a.arms.maxWeightedArmVertexTravel}))}))}));
if(!result.passed)process.exitCode=1;
