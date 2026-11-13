import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11439';
const dir=resolve(import.meta.dirname,'evidence/r134');
mkdirSync(dir,{recursive:true});
const r={passed:false,origin,checks:[],views:[],errors:[]};
const check=(pass,label,data)=>{
 r.checks.push({pass:!!pass,label});
 if(!pass)throw Error(label+' '+JSON.stringify(data).slice(0,1000));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',rs=>{if(rs.url().startsWith(origin)&&rs.status()>=400)errors.push('HTTP '+rs.status()+' '+rs.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=134&r134Jay=on',
    {waitUntil:'domcontentloaded',timeout:100000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:220000});
  const query=()=>page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const a=q.summonPresence.entries.find(x=>x.id==='G03');
   return{source:q.summonModels.find(x=>x.id==='G03')?.file,
    actor:a?.id,modelKind:a?.kind,sourceSkin:a?.r129FullBody?.source,
    sourceLegs:a?.r129FullBody?.runtimeLegTracks,
    weightedLegTravel:a?.r129FullBody?.maxLegVertexTravel,
    stage:a?.r134JayStage,
    originalArms:a?.r131Arms,
    contact:a?.r133ShoeContact,
    clipNames:a?.playingClips,orientation:a?.metrics?.frontDot,
    minY:a?.metrics?.minY,coverage:a?.metrics?.coverageHeight,
    sceneDrawCalls:q.drawCalls};
  });
  const board={player:[{uid:'U13403',id:'G03',hp:5,attack:3,shield:0}],
   ai:[{uid:'U13402',id:'M02',hp:5,attack:2,shield:0}]};
  await page.evaluate(units=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R45_BOARD',units,player:['G03'],ai:['M02']},location.origin),board);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
   .__r45SceneQA.summonPresence.entries.some(x=>x.id==='G03'),null,{timeout:12000});
  const action=kind=>page.evaluate(a=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.studyAction('G03',a),kind);
  await page.waitForTimeout(450);
  const initial=await query();
  check(initial.source==='G03-Jay-Skinned-R132-BakedRest-PILOT.glb'&&
   initial.stage?.enabled&&initial.originalArms?.source===
   'actual_original_author_skinned_arm_hierarchy',
   view+' real original weighted/source character shown in duel',initial);
  check(initial.sourceLegs===8&&initial.stage.sourceRigTrackCount>=16&&
   initial.contact?.enabled&&initial.orientation>.94,
   view+' true full-body+contact source character rather than static puppet',initial);
  await page.screenshot({path:resolve(dir,view+'-r134-g03-official-camera-idle.png')});
  const samples=[initial];
  for(let i=0;i<4;i++){await page.waitForTimeout(780);samples.push(await query())}
  check(samples.every(x=>x.source===initial.source&&x.stage?.enabled),
   view+' source actor stays live while idle',samples);
  check(await action('attack'),view+' source attack invoked');
  await page.waitForTimeout(510);const attack=await query();
  await page.screenshot({path:resolve(dir,view+'-r134-g03-official-camera-attack.png')});
  await page.waitForTimeout(890);const attackRestored=await query();
  check(attack.stage?.currentClip==='R119_Skeletal_Attack'&&
   attackRestored.stage?.currentClip==='R119_Skeletal_Idle'&&
   attackRestored.stage.transitions>=2,
   view+' attack returns to continuous idle instead of frozen final pose',
   {attack:attack.stage,rest:attackRestored.stage});
  check(await action('hit'),view+' original source hit triggered');
  await page.waitForTimeout(350);const hit=await query();
  await page.waitForTimeout(950);const hitRestored=await query();
  check(hit.stage?.currentClip==='R119_Skeletal_Hit'&&
   hitRestored.stage?.currentClip==='R119_Skeletal_Idle',
   view+' hit blends back into naturally breathing posture',
   {hit:hit.stage,rest:hitRestored.stage});
  check(await action('celebrate'),view+' original source celebration triggered');
  await page.waitForTimeout(430);const celebrate=await query();
  await page.screenshot({path:resolve(dir,view+'-r134-g03-official-camera-celebrate.png')});
  await page.waitForTimeout(1400);const finish=await query();
  check(celebrate.stage?.currentClip==='R119_Skeletal_Celebrate'&&
   finish.stage?.currentClip==='R119_Skeletal_Idle'&&finish.stage.transitions>=5&&
   finish.stage.transitions>=4,
   view+' victory returns to actual continuous idle with crossfades',
   {celebrate:celebrate.stage,finish:finish.stage});
  check(finish.originalArms?.maxWeightedArmVertexTravel>.001&&
   finish.stage?.sourceRigTrackCount>=16&&finish.contact?.maxAfterPenetration<=.0015,
   view+' actual source weighted arms move and outsole remains grounded',finish);
  check(errors.length===0,view+' no HTTP failures / JS exceptions',errors);
  r.views.push({view,width,initial,samples:samples.map(x=>x.stage),
   attack:attack.stage,hit:hit.stage,celebrate:celebrate.stage,finish});
  await page.close();
 }
 r.passed=true;
}catch(e){r.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r134-jay-acting-pilot.json'),JSON.stringify(r,null,2));await browser.close()}
console.log('R134_JAY_SOURCE_ACTING_PILOT',JSON.stringify({
 passed:r.passed,checks:r.checks.length,errors:r.errors,
 failed:r.checks.filter(c=>!c.pass),
 views:r.views.map(v=>({view:v.view,originalWeightedArm:v.finish.originalArms?.maxWeightedArmVertexTravel,
 fullBodyTracks:v.finish.stage?.sourceRigTrackCount,transitions:v.finish.stage?.transitions,
 autoIdleReturns:v.finish.stage?.autoIdleReturns,contact:v.finish.contact?.maxAfterPenetration}))}));
if(!r.passed)process.exitCode=1;
