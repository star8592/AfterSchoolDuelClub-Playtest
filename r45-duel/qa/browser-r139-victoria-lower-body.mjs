import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11445';
const out=resolve(import.meta.dirname,'evidence/r139/victoria');
mkdirSync(out,{recursive:true});
const result={passed:false,origin,checks:[],views:[],errors:[]};
const check=(ok,label,data)=>{result.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+JSON.stringify(data).slice(0,1000))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push('HTTP '+r.status())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=136&r136Cast=on',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:225000});
  const units={player:[{uid:'U13901',id:'G04',hp:5,attack:3,shield:0}],
   ai:[{uid:'U13902',id:'M02',hp:5,attack:3,shield:0}]};
  await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage({
   type:'ASDC_R45_BOARD',units:u,player:['G04'],ai:['M02']},location.origin),units);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.summonPresence.entries.some(x=>x.id==='G04'),null,{timeout:40000});
  const read=()=>page.evaluate(()=>{
   const scene=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const a=scene.summonPresence.entries.find(x=>x.id==='G04');
   return{id:a.id,front:a.metrics.frontDot,screenWidth:a.metrics.coverageWidth,
    stage:a.r136CastStage,legs:a.r129FullBody,shoe:a.r136OriginalFoot,
    arms:a.r131Arms,clip:a.playingClips,drawCalls:scene.drawCalls};
  });
  const poses={};
  for(const kind of ['idle','attack','hit','celebrate']){
   const played=await page.evaluate(k=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.studyAction('G04',k),kind);
   check(played,view+' '+kind+' real rig action started');
   await page.waitForTimeout(kind==='idle'?600:kind==='hit'?520:650);
   poses[kind]=await read();
   check(poses[kind].stage?.enabled&&poses[kind].front>.90,
    view+' '+kind+' original source and enemy facing',poses[kind]);
   check(poses[kind].shoe?.enabled&&poses[kind].shoe.maxAfter<=.004,
    view+' '+kind+' actual Victoria boots clear court',poses[kind].shoe);
   await page.screenshot({path:resolve(out,view+'-victoria-'+kind+'.png')});
   await page.waitForTimeout(270);
  }
  const post=await read();
  const travel=post.legs?.maxLegVertexTravel||0;
  check(post.legs?.source==='real_original_skinned_deform_bones'&&
    post.legs?.runtimeLegTracks===8,
    view+' genuine thigh/knee/ankle/toe skinned deformer',post.legs);
  check(travel>.040,view+' G04 weighted real leg motion exceeds .040',travel);
  check(poses.attack.screenWidth>poses.idle.screenWidth+.003,
    view+' attack distant silhouette discernible',poses);
  check(errors.length===0,view+' no JS/HTTP error',errors);
  result.views.push({view,poses,post});
  await page.close();
 }
 result.passed=true;
}catch(e){result.errors.push(String(e))}
finally{writeFileSync(resolve(out,'r139-victoria-stage.json'),JSON.stringify(result,null,2));
 await browser.close()}
console.log('R139_VICTORIA_REAL_LOWER_BODY',JSON.stringify({
 passed:result.passed,checks:result.checks.length,errors:result.errors,
 views:result.views.map(v=>({view:v.view,legTravel:v.post.legs.maxLegVertexTravel,
  minBootDepth:v.post.shoe?.last?.minAfter,
  maxPenetration:v.post.shoe?.maxAfter,
  attackCoverage:v.poses.attack.screenWidth,
  idleCoverage:v.poses.idle.screenWidth}))}));
if(!result.passed)process.exitCode=1;
