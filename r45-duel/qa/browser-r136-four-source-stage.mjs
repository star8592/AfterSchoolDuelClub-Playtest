import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11442';
const dir=resolve(import.meta.dirname,'evidence/r136/four-source');
mkdirSync(dir,{recursive:true});
const result={passed:false,checks:[],views:[],errors:[],origin};
const check=(ok,label,extra)=>{
 result.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+String(JSON.stringify(extra)).slice(0,1400));
};
const ids=(process.env.R136_QA_ACTORS||'E04,G02,G04,T03').split(',');
const names={
 E04:'E04-Phil-Skinned-R131-BakedRest-PILOT.glb',
 G02:'G02-Snow-Skinned-R132-BakedRest-PILOT.glb',
 G04:'G04-Victoria-Skinned-R132-BakedRest-PILOT.glb',
 T03:'T03-Rain-Skinned-R132-BakedRest-PILOT.glb'};
const identities={
 E04:'fast-relay-footwork',
 G02:'blackboard-thinker-spell',
 G04:'commanding-planner-authority',
 T03:'rapid-handoff-courier'};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
try{
 for(const [view,width] of (process.env.R136_QA_DESKTOP_ONLY?[['desktop',1440]]:[['desktop',1440],['portrait',430]])){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{
   if(r.url().startsWith(origin)&&r.status()>=400)
    errors.push('HTTP '+r.status()+' '+r.url());
  });
  await page.goto(origin+'/r45-duel/?qa=1&seed=136&r136Cast=on',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:225000});
  const read=id=>page.evaluate(who=>{
   const scene=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const actor=scene.summonPresence.entries.find(x=>x.id===who);
   return{file:scene.summonModels.find(m=>m.id===who)?.file,
    actor:who,identity:actor?.r136CastStage,
    arms:actor?.r131Arms,
    legs:actor?.r129FullBody||actor?.r130FullBody||actor?.r128FullBody,
    facing:actor?.metrics?.frontDot,clip:actor?.playingClips,drawCalls:scene.drawCalls};
  },id);
  for(const id of ids){
   const u={player:[{uid:'U13601',id,hp:5,attack:3,shield:0}],
    ai:[{uid:'U13602',id:'M02',hp:5,attack:3,shield:0}]};
   await page.evaluate(units=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',units,player:[units.player[0].id],ai:['M02']},
    location.origin),u);
   try{
    await page.waitForFunction(who=>document.querySelector('#stadium').contentWindow
     .__r45SceneQA.summonPresence.entries.some(x=>x.id===who),id,{timeout:16000});
   }catch(e){throw Error('summon did not initialize '+id+' '+JSON.stringify(errors)+' '+e.message)}
   await page.waitForTimeout(550);
   const idle=await read(id);
   check(idle.file===names[id]&&idle.identity?.enabled&&
    idle.identity?.identity===identities[id]&&idle.identity?.upperTracks>=7,
    view+' '+id+' original visible character source rig and distinct performance',idle);
   check(idle.arms?.source==='actual_original_author_skinned_arm_hierarchy'&&
    idle.arms.originalVertexWeight>.35&&
    (idle.legs?.sourceLowerTracks||idle.legs?.runtimeLegTracks)>=8&&
    idle.facing>.90,
    view+' '+id+' original render bound high-poly arm and full lower-body source',idle);
   await page.screenshot({path:resolve(dir,view+'-'+id+'-idle.png')});
   const act=kind=>page.evaluate(([who,k])=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.studyAction(who,k),[id,kind]);
   for(const kind of ['attack','hit','celebrate']){
    check(await act(kind),view+' '+id+' '+kind+' original source action started');
    await page.waitForTimeout(kind==='celebrate'?430:320);
    const stage=await read(id);
    const expect='R119_Skeletal_'+(kind==='attack'?'Attack':kind==='hit'?'Hit':'Celebrate');
    check(stage.identity?.history?.includes(expect)&&
     stage.identity?.arms?.L?.down>.13&&stage.identity?.arms?.R?.down>.12,
     view+' '+id+' '+kind+' actually entered original source action and no T pose',
     stage.identity);
    if(kind==='celebrate')
     await page.screenshot({path:resolve(dir,view+'-'+id+'-celebrate.png')});
    await page.waitForTimeout(1350);
   }
   const final=await read(id);
   const hist=final.identity?.history||[];
   const lastCelebrate=hist.lastIndexOf('R119_Skeletal_Celebrate');
   check(hist.includes('R119_Skeletal_Attack')&&hist.includes('R119_Skeletal_Hit')&&
    hist.includes('R119_Skeletal_Celebrate')&&
    lastCelebrate>=0&&hist.slice(lastCelebrate+1).includes('R119_Skeletal_Idle')&&
    final.identity?.returns>=2&&final.identity?.transitions>=5,
    view+' '+id+' source attack-hit-victory all returned to idle despite living auto-gestures',
    final.identity);
   check(final.arms?.maxWeightedArmVertexTravel>.001&&
    (final.legs?.maxLegVertexTravel||0)>.0005,
    view+' '+id+' real original weighted arm+leg vertices follow bones',final);
   result.views.push({view,id,idle,final});
  }
  check(errors.length===0,view+' no game JS/HTTP errors',errors);
  await page.close();
 }
 check(new Set(result.views.map(x=>x.idle.identity.identity)).size===4,
  'four different acting signatures, no copy-pasted identity');
 result.passed=true;
}catch(e){result.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r136-four-source-action.json'),JSON.stringify(result,null,2));await browser.close()}
console.log('R136_FOUR_HIGH_POLY_SOURCE_ACTING',JSON.stringify({
 passed:result.passed,checks:result.checks.length,errors:result.errors,
 views:result.views.map(x=>({view:x.view,id:x.id,tracks:x.idle.identity.upperTracks,
  armTravel:x.final.arms.maxWeightedArmVertexTravel,
  legTravel:x.final.legs?.maxLegVertexTravel,
  returns:x.final.identity.returns}))}));
if(!result.passed)process.exitCode=1;
