import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11431';
const out=resolve(import.meta.dirname,'evidence/r128');
mkdirSync(out,{recursive:true});
const report={passed:false,origin,checks:[],errors:[],views:[]};
function check(ok,label,detail){
 report.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+JSON.stringify(detail).slice(0,1300));
}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
const actor=[{uid:'U12801',id:'E04',hp:5,attack:3,shield:0}];
const rival=[{uid:'U12802',id:'M02',hp:5,attack:3,shield:0}];
const board={player:actor,ai:rival};
const read=page=>page.evaluate(()=>{
 const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
 const e=q.summonPresence.entries.find(x=>x.id==='E04');
 return{file:q.summonModels.find(x=>x.id==='E04')?.file,actor:e,skins:q.summonPresence.r119TrueSkinVertices.find(x=>x.id==='E04'),
  rig:q.summonPresence.r117CharacterMotion.find(x=>x.id==='E04'),
  hp:window.__r45QA.hp,drawCalls:q.drawCalls,all:q.summonPresence.total};
});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  for(const mode of ['off','on']){
   const page=await browser.newPage({viewport:{width,height:900}}),errs=[];
   page.on('pageerror',e=>errs.push('JS:'+e.message));
   page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errs.push('HTTP '+r.status()+' '+r.url())});
   await page.goto(origin+'/r45-duel/?qa=1&seed=128&r119Rig=E04&r128Body='+mode,{waitUntil:'domcontentloaded',timeout:70000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:175000});
   await page.evaluate(units=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',units,player:['E04'],ai:['M02']},location.origin),board);
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===2,null,{timeout:30000});
   await page.waitForTimeout(500);
   const idle=await read(page);
   check(idle.file?.endsWith('E04-Phil-Skinned-R119.glb')&&idle.skins?.valid&&idle.skins?.skinnedMeshes>=6,
    view+' '+mode+' authentic original source Phil skinned model',idle);
   check(idle.actor?.metrics.frontDot>.94,view+' '+mode+' source rig faces opponent',idle.actor);
   check(idle.actor.playingClips.includes('R119_Skeletal_Idle'),
    view+' '+mode+' source native seven motion clips still operate',idle.actor.playingClips);
   if(mode==='on'){
    const p=idle.actor.r128FullBody;
    check(p?.source==='real_original_skinned_deform_bones'&&p.runtimeLegTracks===8&&
     p.independentLegBones?.length===8&&p.sourceSkinnedMeshes>=6&&p.weightedSourceLegVertexWeight>.35,
     view+' weighted original leg vertex and eight source thigh/knee/ankle/toe channels',p);
   }else check(idle.actor.r128FullBody===null||idle.actor.r128FullBody===undefined,
    view+' old R119 exact original animation available via one toggle',idle.actor.r128FullBody);
   await page.screenshot({path:resolve(out,view+'-'+mode+'-phil-idle.png')});
   await page.evaluate(serial=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R46_CARD_PLAY',side:'player',kind:'unit',id:'E04',serial},location.origin),128000+(mode==='on'?1:2));
   await page.waitForTimeout(900);
   const action=await read(page);
   check(action.all===2&&action.actor?.metrics.frontDot>.85,
    view+' '+mode+' legitimate standing source remains in arena',action);
   if(mode==='on'){
    const body=action.actor.r128FullBody;
    check(body?.frames>12&&body.independentLegFrames>10&&body.maxJointAngle>.09,
     view+' real source knee/thigh/ankle changed continuously',body);
    check(body?.maxLegVertexTravel>.0008,
     view+' actual weighted visible leg vertex changed, not unused skeleton',body);
    check(body?.maxFootHeightSpan>.01,
     view+' opposite shoe positions change relative to root',body);
   }
   await page.screenshot({path:resolve(out,view+'-'+mode+'-phil-step.png')});
   // A convincing gesture must finish on the physical floor and never keep
   // the model hanging in a post-attack pose. Test BOTH toggle positions.
   await page.waitForTimeout(2050);
   const restored=await read(page);
   check(restored.actor?.playingClips?.includes('R119_Skeletal_Idle')&&
    restored.actor.metrics.frontDot>.94,
    view+' '+mode+' source idle regained and facing never reversed',restored.actor);
   check(Math.abs(restored.actor.metrics.minY)<.12&&restored.actor.metrics.height>1.75,
    view+' '+mode+' both shoes settle back at stage floor (no lingering hover)',restored.actor.metrics);
   await page.screenshot({path:resolve(out,view+'-'+mode+'-phil-restored.png')});
   check(errs.length===0,view+' '+mode+' no JS, 404 or 500',errs);
   report.views.push({view,mode,idle:idle.actor.r128FullBody||null,
    action:action.actor.r128FullBody||null,
    footprint:{minY:action.actor.metrics.minY,maxY:action.actor.metrics.maxY,
     width:action.actor.metrics.width,height:action.actor.metrics.height},
    originalSource:action.file,drawCalls:action.drawCalls,errors:errs});
   await page.close();
  }
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r128-phil-pilot-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R128_PHIL_TRUE_LOWER_BODY',JSON.stringify({passed:report.passed,checks:report.checks.length,
 errors:report.errors,failed:report.checks.filter(x=>!x.pass),views:report.views.map(x=>({
 view:x.view,mode:x.mode,action:x.action,footprint:x.footprint}))}));
if(!report.passed)process.exitCode=1;
