import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11450';
const dir=resolve(import.meta.dirname,'evidence/r144/rex-pelvis');
mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[],views:[]};
const check=(ok,label,detail)=>{report.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+JSON.stringify(detail).slice(0,1300))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[],modes={};
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errors.push('HTTP '+r.status()+' '+r.url().slice(-70))});
  for(const mode of ['old','weighted']){
   const query='?qa=1&seed=144&r135Pair=on'+
    (mode==='weighted'?'&r144Rex=on':'&r144Rex=off');
   await page.goto(origin+'/r45-duel/'+query,
    {waitUntil:'domcontentloaded',timeout:90000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
    {timeout:200000});
   const models=await page.evaluate(()=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.summonModels);
   const model=models.find(x=>x.id==='T04');
   check(!!model&&model.file===(mode==='weighted'?
    'T04-Rex-Skinned-R144-WeightedPelvis-PILOT.glb':
    'T04-Rex-Skinned-R132-BakedRest-PILOT.glb'),
    view+' '+mode+' exact original GLB variant selection',model);
   check(models.find(x=>x.id==='E03')?.file===
    'E03-Ellie-Skinned-R132-BakedRest-PILOT.glb',
    view+' '+mode+' other character author model never swapped',
    models.find(x=>x.id==='E03'));
   const units={player:[{uid:'U14401',id:'T04',hp:7,attack:4,shield:0}],
    ai:[{uid:'U14402',id:'M02',hp:7,attack:3,shield:0}]};
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow
    .postMessage({type:'ASDC_R45_BOARD',units:u,player:['T04'],ai:['M02']},
      location.origin),units);
   await page.waitForFunction(()=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.summonPresence.entries.some(x=>x.id==='T04'),
    null,{timeout:45000});
   const read=()=>page.evaluate(()=>{
    const a=document.querySelector('#stadium').contentWindow.__r45SceneQA
     .summonPresence.entries.find(x=>x.id==='T04');
    return a&&{pelvis:a.r144OriginalPelvis,
     trunk:a.r143SourceTrunk,legs:a.r129FullBody,arms:a.r131Arms,
     shoes:a.r133ShoeContact,face:a.r140OriginalFace,
     stage:a.r135PairStage,facing:a.metrics.frontDot,
     screenWidth:a.metrics.coverageWidth}
   });
   const poses={};
   for(const action of ['idle','attack','hit','celebrate']){
    const started=await page.evaluate(kind=>document.querySelector('#stadium')
     .contentWindow.__r45SceneQA.studyAction('T04',kind),action);
    check(started===true,view+' '+mode+' '+action+' original Rex action started');
    await page.waitForTimeout(action==='idle'?400:action==='hit'?480:550);
    const a=await read();poses[action]=a;
    check(a?.trunk?.enabled===true&&a.trunk.changedParentLinks===5,
     view+' '+mode+' '+action+' source R143 torso remains linked',a?.trunk);
    check(a?.arms?.source==='actual_original_author_skinned_arm_hierarchy',
     view+' '+mode+' '+action+' unchanged source wrist skeleton',a?.arms);
    check(a?.legs?.source==='real_original_skinned_deform_bones'&&
     a.legs.runtimeLegTracks===8,
     view+' '+mode+' '+action+' real knee/boot/toe bones',a?.legs);
    check(a?.face?.enabled===true&&a.face.state===
     action[0].toUpperCase()+action.slice(1),
     view+' '+mode+' '+action+' original source eye/jaw active',a?.face);
    check(a?.facing>.9,view+' '+mode+' '+action+' front faces opponent',a?.facing);
    check(a?.shoes?.maxAfterPenetration<=.0015,
     view+' '+mode+' '+action+' original weighted shoes no ground penetration',
      a?.shoes);
    if(mode==='weighted'){
     check(a?.pelvis?.enabled===true&&
      a.pelvis.source==='original_weighted_source_rex_pelvis'&&
      a.pelvis.sourceVerticesWithNonzeroPelvisWeight>=5000&&
      a.pelvis.highWeightSourceVertices>=4700&&
      a.pelvis.maxRestSkinVertexDrift<=.0002&&
      a.pelvis.sourceChildLinks.length===3,
      view+' '+mode+' '+action+' actual real Rex weighted hips and full source parent links',
      a?.pelvis);
    }else{
     check(a?.pelvis===null,
      view+' '+mode+' '+action+' old Rex unchanged/no invented active hips',
      a?.pelvis);
    }
    if(action==='attack'||action==='celebrate')
     await page.screenshot({path:resolve(dir,view+'-'+mode+'-'+action+'.png')});
    await page.waitForTimeout(100);
   }
   const end=await read();
   check(end.stage?.sourceTracks===(mode==='weighted'?17:16),
    view+' '+mode+' exact real source rig track count',end.stage);
   if(mode==='weighted'){
    check(end.pelvis?.maxHipRotation>.035,
     view+' original hip rotates during real performance',end.pelvis);
    check(end.pelvis?.maxWeightedPelvisVertexTravel>.002,
     view+' actual newly weight-painted waist vertex moves under hip',end.pelvis);
    check(end.legs.maxLegVertexTravel>=.025,
     view+' real skinned boot/thigh movement preserved',end.legs);
   }
   check(end.shoes.maxAfterPenetration<=.0015&&
    end.shoes.maxAppliedLift<=.105,
    view+' '+mode+' non-accumulating bounded original sole correction',end.shoes);
   modes[mode]={model:model.file,poses:{
    idleWidth:poses.idle.screenWidth,attackWidth:poses.attack.screenWidth},
    pelvis:end.pelvis,legTravel:end.legs.maxLegVertexTravel,
    shoeMaxAfter:end.shoes.maxAfterPenetration,
    shoeLift:end.shoes.maxAppliedLift,
    sourceTracks:end.stage.sourceTracks};
  }
  check(errors.length===0,view+' no GPU/JS/asset failures',errors);
  report.views.push({view,modes});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r144-real-weighted-rex-pelvis-gpu.json'),
 JSON.stringify(report,null,2));await browser.close()}
console.log('R144_GENUINE_REX_WEIGHTED_PELVIS_GPU',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors,
 views:report.views.map(v=>({view:v.view,
  modes:Object.fromEntries(Object.entries(v.modes).map(([name,a])=>[name,{
   model:a.model,hips:a.pelvis?.maxHipRotation??0,
   genuineWeightVerts:a.pelvis?.highWeightSourceVertices??0,
   visiblePelvisTravel:a.pelvis?.maxWeightedPelvisVertexTravel??0,
   tracks:a.sourceTracks,shoe:a.shoeMaxAfter}]))}))}));
if(!report.passed)process.exitCode=1;
