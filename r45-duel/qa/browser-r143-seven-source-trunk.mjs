import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11449';
const dir=resolve(import.meta.dirname,'evidence/r143/source-trunk');
mkdirSync(dir,{recursive:true});
const pilot=['E03','E04','G03','G04','T04'];
const native=['G02','T03'];
const report={passed:false,checks:[],views:[],errors:[],origin};
const check=(ok,label,value)=>{report.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+JSON.stringify(value).slice(0,1100))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errors.push('HTTP '+r.status()+' '+r.url().slice(-80))});
  await page.goto(origin+'/r45-duel/?qa=1&seed=143&r134Jay=on&r135Pair=on&r136Cast=on&r143Rig=on',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:210000});
  const read=actor=>page.evaluate(id=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const s=q.summonPresence.entries.find(x=>x.id===id);
   return s?{
    id,stage:s.r134JayStage||s.r135PairStage||s.r136CastStage,
    trunk:s.r143SourceTrunk,sourceArms:s.r131Arms,
    legs:s.r129FullBody||s.r128FullBody||s.r130FullBody,
    shoes:s.r133ShoeContact||s.r136OriginalFoot,
    face:s.r140OriginalFace,
    front:s.metrics.frontDot,coverage:s.metrics.coverageWidth,
    clips:s.playingClips,drawCalls:q.drawCalls
   }:null;
  },actor);
  const actors={};
  for(const id of [...pilot,...native]){
   const units={player:[{uid:'U14301',id,hp:5,attack:4,shield:0}],
    ai:[{uid:'U14302',id:'M02',hp:5,attack:3,shield:0}]};
   await page.evaluate(units=>document.querySelector('#stadium')
    .contentWindow.postMessage({type:'ASDC_R45_BOARD',units,
     player:[units.player[0].id],ai:['M02']},location.origin),units);
   await page.waitForFunction(who=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.summonPresence.entries.some(x=>x.id===who),
    id,{timeout:45000});
   const result={};
   for(const action of ['idle','attack','hit','celebrate']){
    const launched=await page.evaluate(([who,kind])=>document.querySelector('#stadium')
     .contentWindow.__r45SceneQA.studyAction(who,kind),[id,action]);
    check(launched===true,view+' '+id+' '+action+' original source clip launched');
    await page.waitForTimeout(action==='idle'?470:action==='hit'?390:550);
    const state=await read(id);result[action]=state;
    check(state?.front>.9&&state?.stage?.enabled,
     view+' '+id+' '+action+' real high-poly source and enemy facing',state);
    check(state?.sourceArms?.source==='actual_original_author_skinned_arm_hierarchy',
     view+' '+id+' '+action+' original weighted wrist bindings',state?.sourceArms);
    check(state?.legs?.source==='real_original_skinned_deform_bones'&&
      state.legs.runtimeLegTracks===8,
     view+' '+id+' '+action+' true weighted leg deformation',state?.legs);
    check(state?.face?.enabled&&state.face.state===action[0].toUpperCase()+action.slice(1),
     view+' '+id+' '+action+' original face performance tied to source action',state?.face);
    check(state?.shoes?.maxAfterPenetration<=.002||
     state?.shoes?.maxAfter<=.002,
     view+' '+id+' '+action+' original support footwear not penetrating',state?.shoes);
    if(pilot.includes(id)){
     check(state.trunk?.enabled===true&&
      state.trunk.changedParentLinks>=(id==='E04'?4:5)&&
      state.trunk.maxBindRestDrift<=2e-5&&
      state.trunk.maxRenderedRestDrift<=2e-4&&
      state.trunk.actualWeightedVertices.length===4,
      view+' '+id+' '+action+' real flat torso repaired with zero bind/rest drift',
      state?.trunk);
    }else{
     check(state.trunk===null,
      view+' '+id+' '+action+' naturally connected Snow/Rain rig unchanged',
      state?.trunk);
    }
    if(action==='attack'||action==='hit')
     await page.screenshot({path:resolve(dir,view+'-'+id+'-'+action+'.png')});
    await page.waitForTimeout(130);
   }
   actors[id]={trunk:result.idle.trunk,
    legs:{maxWeightedTravel:result.celebrate.legs.maxLegVertexTravel,
     originalLegTracks:result.celebrate.legs.runtimeLegTracks},
    face:result.celebrate.face.state,
    idleCoverage:result.idle.coverage,
    attackCoverage:result.attack.coverage,
    shoes:result.celebrate.shoes};
  }
  check(errors.length===0,view+' no original GLB/VRM/JS errors',errors);
  report.views.push({view,actors});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r143-torso-7-source-gpu.json'),
 JSON.stringify(report,null,2));await browser.close()}
console.log('R143_REAL_TRUNK_REBIND_7_ACTORS',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors,
 views:report.views.map(v=>({view:v.view,actors:Object.fromEntries(
 Object.entries(v.actors).map(([id,r])=>[id,{
  bindingLinks:r.trunk?.changedParentLinks||0,
  restDrift:r.trunk?.maxRenderedRestDrift||0,
  legTravel:r.legs.maxWeightedTravel}]))}))}));
if(!report.passed)process.exitCode=1;
