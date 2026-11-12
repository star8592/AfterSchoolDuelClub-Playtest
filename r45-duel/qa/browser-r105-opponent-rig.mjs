import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {SOURCE_FRONT_YAW,faceOpponentYaw} from '../scene/summon-orientation.mjs';
const require=createRequire(import.meta.url);
const{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11104';
const dir=resolve(import.meta.dirname,'evidence/r105');mkdirSync(dir,{recursive:true});
const report={origin,passed:false,checks:[],errors:[],snapshots:[],frontalDots:{}};
function check(valid,title,detail=null){
 report.checks.push({pass:!!valid,title,detail});
 if(!valid)throw Error('R105 CHECK FAILED '+title+' '+JSON.stringify(detail).slice(0,800));
}
const ids=Object.keys(SOURCE_FRONT_YAW);
const batches=[ids.slice(0,4),ids.slice(4,8),ids.slice(8,12),ids.slice(12)];
for(const id of ids)for(const side of ['player','ai']){
 const yaw=faceOpponentYaw(id,side)+SOURCE_FRONT_YAW[id];
 const opponentDot=Math.sin(yaw)*(side==='player'?1:-1),spectatorDot=Math.cos(yaw);
 check(opponentDot>.999&&Math.abs(spectatorDot)<.001,
  'actual '+id+' '+side+' faces the opponent, not the spectator',
  {opponentDot,spectatorDot});
 report.frontalDots[id+':'+side]={opponentDot,spectatorDot};
}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const screen=(p)=>p.evaluate(()=>{
 const f=document.querySelector('#stadium').contentWindow.__r45SceneQA;
 return {camera:f.framing,units:f.summonPresence,models:f.summonModels?.length};
});
try{
 for(const [view,width,height] of [['desktop',1440,900],['phone',430,900]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=11',
   {waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:140000});
  await page.waitForTimeout(520);
  const open=await screen(page);
  const pitch=open.camera?.composition?.cameraPitchDeg;
  check(pitch>11&&pitch<22,view+' truly low audience cinematic pitch',open.camera);
  check(open.models===12,view+' real GLB registry preserved',open.models);
 check(open.camera.realDuelistBounds?.length===2&&
  open.camera.realDuelistBounds.every(x=>x.fullyVisible),
  view+' BOTH genuine platform duelists full body IN FRAME, not cropped',
  open.camera.realDuelistBounds);
  const hosts=await page.evaluate(()=>
   document.querySelector('#stadium').contentWindow.__r45SceneQA.duelistHosts);
  check(hosts.length===2&&hosts.every(h=>h.independentFromSummons)&&
    new Set(hosts.map(h=>h.modelSource)).size===2,
    view+' permanent duelists use two unique CC0 VRMs NOT any summon identity',
    hosts.map(h=>({id:h.id,source:h.modelSource,bones:h.bones,skins:h.skins})));
  check(hosts.every(h=>h.bones>=80&&h.skins>=2&&
    ['R','L'].every(side=>h.posture.arms[side]?.drop<-.22&&
      h.posture.ik[side]?.error<.25)),
    view+' both high-resolution podium VRM rigs bend shoulders elbows wrists',
    hosts.map(h=>({id:h.id,posture:h.posture})));
  await page.screenshot({path:resolve(dir,view+'-front-new.png')});
  report.snapshots.push({view,mode:'front',camera:open.camera});
  for(let i=0;i<batches.length;i++){
   const batch=batches[i],units={player:[],ai:[]};
   for(let j=0;j<batch.length;j++){
    const id=batch[j],card={uid:'U'+(4100+i*10+j),id,hp:5,attack:2,shield:0};
    units.player.push(card);
    units.ai.push({...card,uid:'U'+(4200+i*10+j)});
   }
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',units:u,
    player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id)},location.origin),units);
   await page.waitForFunction(n=>{
    const f=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return f?.summonPresence?.total===n;
   },batch.length*2,{timeout:20000});
   await page.waitForTimeout(400);
   const sight=await screen(page);
   const visible=sight.units.entries.filter(u=>u.visible);
   check(visible.length===batch.length*2,view+' group '+i+' actor count',sight.units.total);
   check(visible.every(u=>u.metrics.frontDot>.98),
     view+' group '+i+' all 3D actors face their opponent directly',
     visible.map(u=>({id:u.id,side:u.side,dot:u.metrics.frontDot})));
   check(visible.every(u=>u.inView),view+' group '+i+' actors framed correctly',
     visible.map(u=>({id:u.id,side:u.side,inView:u.inView,position:u.position})));
   const vrms=visible.filter(u=>['E01','G01'].includes(u.id));
   if(vrms.length)check(vrms.every(u=>['R','L'].every(hand=>
     u.metrics.pose?.arms[hand]?.valid&&
     u.metrics.pose.arms[hand].drop<-.24)),
     view+' group '+i+' BOTH original and cloned VRM summons have relaxed elbows',
     vrms.map(u=>({id:u.id,side:u.side,kind:u.kind,pose:u.metrics.pose})));
   await page.screenshot({path:resolve(dir,view+'-front-batch'+(i+1)+'.png')});
   report.snapshots.push({view,batch,visible:visible.length,pitch});
  }
  await page.locator('#camera-right').click();
  await page.waitForTimeout(600);
  const fortyFive=await screen(page);
  check(Math.abs(fortyFive.camera.yaw-45)<1,view+' 45-degree orbit remains functional',fortyFive.camera.yaw);
  await page.locator('#camera-reset').click();
  await page.waitForTimeout(600);
  const reset=await screen(page);
  check(Math.abs(reset.camera.yaw)<1,view+' front camera reset stays correct',reset.camera.yaw);
  check(errors.length===0,view+' zero errors/GLB 404',errors);
  await page.close();
 }
 report.passed=report.checks.every(x=>x.pass)&&!report.errors.length;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(dir,'r105-opponent-rig-report.json'),JSON.stringify(report,null,2));
 console.log('R105_OPPONENT_RIG_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,
  errors:report.errors,snapshots:report.snapshots.map(x=>({view:x.view,batch:x.batch,pitch:x.pitch,
   cameraY:x.camera?.composition?.cameraY}))}));
 await browser.close();
}
if(!report.passed)process.exitCode=7;
