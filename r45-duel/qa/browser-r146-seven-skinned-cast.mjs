import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11453';
const dir=resolve(import.meta.dirname,'evidence/r146/seven-source-cast');
mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[],views:[]};
const check=(good,label,data)=>{report.checks.push({pass:!!good,label});
 if(!good)throw Error(label+' '+JSON.stringify(data).slice(0,1700))};
const ids=['E03','E04','G02','G03','G04','T03','T04'];
const expected={
 E03:'E03-Ellie-Skinned-R132-BakedRest-PILOT.glb',
 E04:'E04-Phil-Skinned-R131-BakedRest-PILOT.glb',
 G02:'G02-Snow-Skinned-R132-BakedRest-PILOT.glb',
 G03:'G03-Jay-Skinned-R132-BakedRest-PILOT.glb',
 G04:'G04-Victoria-Skinned-R132-BakedRest-PILOT.glb',
 T03:'T03-Rain-Skinned-R132-BakedRest-PILOT.glb',
 T04:'T04-Rex-Skinned-R144-WeightedPelvis-PILOT.glb'
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errors.push('HTTP '+r.status()+' '+r.url().slice(-90))});
  await page.goto(origin+'/r45-duel/?qa=1&seed=146&r146Cast=on',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
   {timeout:130000});
  const models=await page.evaluate(()=>document.querySelector('#stadium')
   .contentWindow.__r45SceneQA.summonModels);
  for(const id of ids)check(models.find(x=>x.id===id)?.file===expected[id],
   view+' '+id+' genuine original weighted source model actually loaded',
   models.find(x=>x.id===id));
  const roster=id=>({id,uid:'U146'+(ids.indexOf(id)+10),hp:8,attack:4,shield:0});
  const units={player:ids.slice(0,4).map(roster),
   ai:ids.slice(4).map(roster)};
  await page.evaluate(u=>document.querySelector('#stadium')
   .contentWindow.postMessage({type:'ASDC_R45_BOARD',
    player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id),
    units:u},location.origin),units);
  await page.waitForFunction(()=>document.querySelector('#stadium')
   .contentWindow.__r45SceneQA.summonPresence?.total===7,null,
   {timeout:25000});
  const read=()=>page.evaluate(()=>{
   const qa=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{entries:qa.summonPresence.entries,
    weighted:qa.summonPresence.r119TrueSkinVertices,
    drawCalls:qa.drawCalls,modelCount:qa.summonModels.length,
    perf:qa.renderPerformance};
  });
  const first=await read();
  check(first.entries.length===7,view+' all seven original author actors staged',first);
  check(Number.isFinite(first.drawCalls)&&first.drawCalls<1800,
   view+' physically rendered 7 highpoly actors without GPU blowup',first.drawCalls);
  const per={};
  for(const id of ids){
   const a=first.entries.find(x=>x.id===id);
   const v=first.weighted.find(x=>x.id===id);
   check(a?.visible===true&&a.metrics.frontDot>.9,
    view+' '+id+' original source faces real opponent',a?.metrics);
   check(a?.r131Arms?.source==='actual_original_author_skinned_arm_hierarchy'&&
    a.r131Arms.changedParentLinks>=4&&
    a.r131Arms.validatedParentLinks>=a.r131Arms.changedParentLinks&&
    a.r131Arms.maxBindRestDrift<.0001,
    view+' '+id+' genuine original source shoulders and wrists linked',a?.r131Arms);
   check(a?.r140OriginalFace?.enabled===true,
    view+' '+id+' source face and jaw morph available',a?.r140OriginalFace);
   const stage=a?.r134JayStage||a?.r135PairStage||a?.r136CastStage;
   check(stage?.enabled===true,
    view+' '+id+' original individualized performer sequencer active',stage);
   check(v?.valid===true&&v?.skinWeight>.28,
    view+' '+id+' actual original source skinned arm vertex is bound',v);
   if(['E03','E04','G03','G04','T04'].includes(id))
    check(a.r143SourceTrunk?.changedParentLinks>=4,
     view+' '+id+' original R143 torso transmission chain active',a?.r143SourceTrunk);
   if(id==='T04')check(a.r144OriginalPelvis?.enabled===true&&
    a.r144OriginalPelvis.highWeightSourceVertices>=4900,
    view+' Rex original truly weighted pelvis kept',a?.r144OriginalPelvis);
   per[id]={file:expected[id],frontDot:a.metrics.frontDot,
    width:a.metrics.coverageWidth,
    originalBindingWeight:v.skinWeight,
    sourceLegs:a.r128FullBody||a.r129FullBody||a.r130FullBody,
    sourceShoulder:a.r131Arms?.source,
    sourceFace:a.r140OriginalFace?.source,
    performer:stage?.identity||null};
  }
  await page.screenshot({path:resolve(dir,view+'-seven-real-source-cast.png')});
  check(errors.length===0,view+' zero JS/GLB/hardware load errors',errors);
  report.views.push({view,drawCalls:first.drawCalls,actors:per,
   models:models.filter(x=>ids.includes(x.id))});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r146-seven-cast-load-and-real-weight.json'),
 JSON.stringify(report,null,2));await browser.close()}
console.log('R146_REAL_SEVEN_SKINNED_CAST_GPU',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors,
 views:report.views.map(v=>({view:v.view,drawCalls:v.drawCalls,
  ids:Object.keys(v.actors)}))}));
if(!report.passed)process.exitCode=1;
