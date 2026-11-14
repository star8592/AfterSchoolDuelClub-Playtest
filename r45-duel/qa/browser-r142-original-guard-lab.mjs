import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11448';
const dir=resolve(import.meta.dirname,'evidence/r142/guard-lab');
mkdirSync(dir,{recursive:true});
const report={passed:false,origin,views:[],checks:[],errors:[]};
const check=(ok,label,detail)=>{report.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+': '+JSON.stringify(detail).slice(0,1600))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errors.push('HTTP '+r.status()+' '+r.url().slice(-100))});
  await page.goto(origin+'/r45-duel/?qa=1&seed=142&r134Jay=on&r135Pair=on',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:220000});
  for(const id of ['T04','G03']){
   const units={player:[{uid:'U14201',id,hp:7,attack:4,shield:0}],
    ai:[{uid:'U14202',id:'M02',hp:7,attack:3,shield:0}]};
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow
    .postMessage({type:'ASDC_R45_BOARD',units:u,player:[u.player[0].id],
     ai:['M02']},location.origin),units);
   await page.waitForFunction(who=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.summonPresence.entries.some(x=>x.id===who),id,
    {timeout:30000});
   const read=()=>page.evaluate(who=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    const a=q.summonPresence.entries.find(x=>x.id===who);
    return a&&{actor:who,legs:a.r129FullBody,armSource:a.r131Arms,
     stage:a.r135PairStage||a.r134JayStage,shoes:a.r133ShoeContact,
     front:a.metrics.frontDot,screenWidth:a.metrics.coverageWidth,
     drawCalls:q.drawCalls};
   },id);
   const poses={};
   for(const kind of ['idle','attack','hit','celebrate']){
    const played=await page.evaluate(([who,k])=>document.querySelector('#stadium')
     .contentWindow.__r45SceneQA.studyAction(who,k),[id,kind]);
    check(played===true,view+' '+id+' '+kind+' real actor action',played);
    await page.waitForTimeout(kind==='idle'?510:kind==='hit'?480:kind==='celebrate'?550:600);
    const sample=await read();poses[kind]=sample;
    check(sample.legs?.source==='real_original_skinned_deform_bones'&&
      sample.legs?.runtimeLegTracks===8,
     view+' '+id+' '+kind+' original weighted thigh/knee/foot/toe',sample);
    check(sample.stage?.enabled&&sample.front>.9,
     view+' '+id+' '+kind+' original authored pose faces opponent',sample);
    check(sample.shoes?.enabled&&sample.shoes.maxAfterPenetration<=.0015,
     view+' '+id+' '+kind+' no original shoe ground penetration',sample.shoes);
    await page.screenshot({path:resolve(dir,view+'-'+id+'-'+kind+'.png')});
    await page.waitForTimeout(160);
   }
   const end=await read();
   check((end.stage?.sourceTracks??end.stage?.sourceRigTrackCount)===(id==='T04'?17:16),
    view+' '+id+' exactly original upper+lower'+(id==='T04'?'+pelvis':'')+' tracks',
    end.stage);
   check(end.legs.maxLegVertexTravel>=(id==='T04'?.027:.051),
    view+' '+id+' weighted original leg vertex travel actually visible',
    end.legs);
   check(end.shoes.maxAfterPenetration<=.0015,
    view+' '+id+' no penetration throughout full action chain',end.shoes);
   check(end.shoes.maxAppliedLift<=.105,
    view+' '+id+' bounded floor compensation not cumulative floating',end.shoes);
   report.views.push({view,id,poses,end});
  }
  check(errors.length===0,view+' no JS or GLB asset failure',errors);
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r142-guard-lab-original-source.json'),
 JSON.stringify(report,null,2));await browser.close()}
console.log('R142_REAL_SOURCE_GUARD_LAB',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors,
 views:report.views.map(x=>({view:x.view,id:x.id,
  legTravel:x.end.legs.maxLegVertexTravel,
  shoePenetration:x.end.shoes.maxAfterPenetration,
  maxFloorLift:x.end.shoes.maxAppliedLift,
  sourceTracks:x.end.stage.sourceTracks??x.end.stage.sourceRigTrackCount,
  attackCoverage:x.poses.attack.screenWidth,
  idleCoverage:x.poses.idle.screenWidth}))}));
if(!report.passed)process.exitCode=1;
