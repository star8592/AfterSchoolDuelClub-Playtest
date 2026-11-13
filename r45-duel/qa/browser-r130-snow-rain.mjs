import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11433';
const out=resolve(import.meta.dirname,'evidence/r130');
mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[],views:[],origin};
function check(ok,label,details){
 report.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+JSON.stringify(details).slice(0,1250));
}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
const units={player:[{uid:'U13001',id:'G02',hp:5,attack:3,shield:0}],
 ai:[{uid:'U13002',id:'T03',hp:5,attack:3,shield:0}]};
async function read(page){
 return page.evaluate(()=>{
  const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return{
   cast:q.summonPresence.entries.filter(x=>['G02','T03'].includes(x.id)),
   loaded:q.summonModels.filter(x=>['G02','T03'].includes(x.id)),
   probe:q.summonPresence.r119TrueSkinVertices.filter(x=>['G02','T03'].includes(x.id)),
   total:q.summonPresence.total,
   hp:window.__r45QA.hp,drawCalls:q.drawCalls
  };
 });
}
try{
 for(const [view,width]of[['desktop',1440],['portrait',430]]){
  for(const mode of ['off','on']){
   const page=await browser.newPage({viewport:{width,height:900}}),errs=[];
   page.on('pageerror',e=>errs.push('JS:'+e.message));
   page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errs.push('HTTP:'+r.status()+' '+r.url())});
   await page.goto(origin+'/r45-duel/?qa=1&seed=130&r119Rig=G02,T03&r130Body='+mode,
    {waitUntil:'domcontentloaded',timeout:85000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:190000});
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',units:u,player:['G02'],ai:['T03']},location.origin),units);
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===2,
    null,{timeout:30000});
   await page.waitForTimeout(620);
   const init=await read(page);
   check(init.cast.length===2&&init.loaded.every(x=>x.file?.endsWith('-Skinned-R119.glb')),
    view+' '+mode+' original high-resolution G02 and T03 skinned GLBs in actual stadium',init.loaded);
   check(init.probe.length===2&&init.probe.every(x=>x.valid&&x.skinnedMeshes>=6),
    view+' '+mode+' original weighted meshes are visible and source bound',init.probe);
   check(init.cast.every(x=>x.metrics.frontDot>.94&&x.playingClips.includes('R119_Skeletal_Idle')),
    view+' '+mode+' both actors aim at opponent and true source animation is running',init.cast);
   if(mode==='on'){
    for(const e of init.cast){
     const body=e.r130FullBody;
     check(body?.source==='real_original_source_weighted_vertices'&&body.actor===e.id&&
      body.sourceLowerTracks===8&&body.jointNames.length===8&&
      body.weightedVertexWeight>.35&&body.sourceClipCount===7,
      view+' '+e.id+' source weighted thigh shin ankle and toe tracks, not fake bones',body);
     check(Object.values(body.hierarchyProof.chains).every(x=>x.restDrift<.00001),
      view+' '+e.id+' original bind world pose preserved',body.hierarchyProof);
     check(e.id==='G02'?Object.values(body.hierarchyProof.chains).every(x=>x.alreadyLinked):
      Object.values(body.hierarchyProof.chains).every(x=>!x.alreadyLinked),
      view+' '+e.id+' source partial hierarchy recognized and selectively fixed',body.hierarchyProof);
    }
   }else check(init.cast.every(e=>e.r130FullBody===null||e.r130FullBody===undefined),
    view+' '+mode+' R119 old source leg animations remain available',init.cast);
   await page.screenshot({path:resolve(out,view+'-'+mode+'-snow-rain-idle.png')});
   await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R46_CARD_PLAY',side:'player',kind:'unit',id:'G02',serial:130001},location.origin));
   await page.waitForTimeout(870);
   await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R46_CARD_PLAY',side:'ai',kind:'unit',id:'T03',serial:130002},location.origin));
   await page.waitForTimeout(1100);
   const action=await read(page);
   check(action.total===2&&action.drawCalls<1450&&action.hp.player===20&&action.hp.ai===20,
    view+' '+mode+' visual only, no rule mutation or GPU draw-call explosion',action);
   if(mode==='on'){
    for(const e of action.cast){
     const p=e.r130FullBody;
     check(p?.frames>20&&p.legFrames>8&&p.maxLegAngle>.025,
      view+' '+e.id+' animation visibly turns original deform joints over time',p);
     check(p?.maxLegVertexTravel>.0004&&p?.maxFootTravel>.003,
      view+' '+e.id+' ORIGINAL skin vertex and independent feet actually move',p);
    }
   }
   await page.screenshot({path:resolve(out,view+'-'+mode+'-snow-rain-active.png')});
   await page.waitForTimeout(2300);
   const reset=await read(page);
   check(reset.cast.every(e=>e.playingClips.includes('R119_Skeletal_Idle')&&e.metrics.frontDot>.94),
    view+' '+mode+' G02/T03 return to opponent-facing idle without residual action',reset.cast);
   check(errs.length===0,view+' '+mode+' no Chrome JS or HTTP errors',errs);
   report.views.push({view,mode,actors:action.cast.map(x=>({
    actor:x.id,motion:x.r130FullBody,metrics:x.metrics
   })),drawCalls:action.drawCalls});
   await page.close();
  }
 }
 report.passed=true;
}catch(e){report.errors.push(String(e));}
finally{
 writeFileSync(resolve(out,'r130-snow-rain-source-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R130_SNOW_RAIN_SPECIAL_REAL_BODY',JSON.stringify({passed:report.passed,
 checks:report.checks.length,errors:report.errors,failed:report.checks.filter(x=>!x.pass),
 views:report.views.map(v=>({view:v.view,mode:v.mode,
 actors:v.actors.map(a=>({id:a.actor,travel:a.motion?.maxLegVertexTravel,
 foot:a.motion?.maxFootTravel,angle:a.motion?.maxLegAngle}))}))}));
if(!report.passed)process.exitCode=1;
