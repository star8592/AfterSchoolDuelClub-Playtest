import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11441';
const dir=resolve(import.meta.dirname,'evidence/r135/original-pair');
mkdirSync(dir,{recursive:true});
const rep={passed:false,checks:[],views:[],errors:[],origin};
const check=(pass,label,details)=>{
 rep.checks.push({pass:!!pass,label});
 if(!pass)throw Error(label+' '+JSON.stringify(details).slice(0,1150));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=135&r135Pair=E03,T04',
    {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:210000});
  const read=id=>page.evaluate(target=>{
   const x=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const a=x.summonPresence.entries.find(u=>u.id===target);
   return{actor:target,file:x.summonModels.find(z=>z.id===target)?.file,
    id:a?.id,sourceArms:a?.r131Arms||null,legs:a?.r129FullBody||null,
    stage:a?.r135PairStage||null,shoe:a?.r133ShoeContact||null,
    facing:a?.metrics?.frontDot,portraitCoverage:a?.metrics?.coverageHeight,
    clips:a?.playingClips,drawCalls:x.drawCalls};
  },id);
  for(const id of ['E03','T04']){
   const units={player:[{uid:'U13501',id,hp:5,attack:3,shield:0}],
    ai:[{uid:'U13502',id:'M02',hp:5,attack:3,shield:0}]};
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',units:u,player:[u.player[0].id],ai:['M02']},location.origin),units);
   await page.waitForFunction(who=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.summonPresence.entries.some(x=>x.id===who),id,{timeout:12000});
   await page.waitForTimeout(550);
   const idle=await read(id);
   const expected=id+'-'+(id==='E03'?'Ellie':'Rex')+'-Skinned-R132-BakedRest-PILOT.glb';
   check(idle.file===expected&&idle.stage?.enabled&&idle.stage.sourceTracks===(id==='T04'?17:16)&&
    idle.legs?.runtimeLegTracks===8,
    view+' '+id+' original artist high-poly source leg + torso tracks',idle);
   check(idle.sourceArms?.source==='actual_original_author_skinned_arm_hierarchy'&&
    idle.sourceArms?.originalVertexWeight>.35&&idle.shoe?.enabled&&
    idle.facing>.92,
    view+' '+id+' original artist weighted wrist/outsole and opponent facing',idle);
   await page.screenshot({path:resolve(dir,view+'-'+id+'-idle.png')});
   const act=kind=>page.evaluate(([who,k])=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.studyAction(who,k),[id,kind]);
   check(await act('attack'),view+' '+id+' attack triggered on source joints');
   await page.waitForTimeout(id==='E03'?490:620);
   const attack=await read(id);
   await page.screenshot({path:resolve(dir,view+'-'+id+'-attack.png')});
   check(attack.stage.currentClip==='R119_Skeletal_Attack'&&
    attack.stage.arms.L?.down>.25&&attack.stage.arms.R?.down>.15,
    view+' '+id+' high-poly attack cannot show T-pose arms',attack.stage);
   await page.waitForTimeout(1550);
   const afterAttack=await read(id);
   check(afterAttack.stage.currentClip==='R119_Skeletal_Idle'&&
    afterAttack.stage.returns>=1,
    view+' '+id+' attack settles back into breathing idle',afterAttack.stage);
   check(await act('hit'),view+' '+id+' genuine source hit triggered');
   await page.waitForTimeout(id==='E03'?320:490);
   const hit=await read(id);
   await page.screenshot({path:resolve(dir,view+'-'+id+'-hit.png')});
   check(hit.stage.currentClip==='R119_Skeletal_Hit',
    view+' '+id+' visible true-reaction segment',hit.stage);
   await page.waitForTimeout(1450);
   const afterHit=await read(id);
   check(afterHit.stage.currentClip==='R119_Skeletal_Idle',
    view+' '+id+' source hit released, normal pose resumed',afterHit.stage);
   check(await act('celebrate'),view+' '+id+' source distinct victory triggered');
   await page.waitForTimeout(id==='E03'?470:660);
   const victory=await read(id);
   await page.screenshot({path:resolve(dir,view+'-'+id+'-celebrate.png')});
   check(victory.stage.currentClip==='R119_Skeletal_Celebrate'&&
    (id==='E03'?victory.stage.lift>.05:victory.stage.lift===0)&&
    victory.stage.arms.L?.down>.20&&victory.stage.arms.R?.down>.14,
    view+' '+id+' celebration uses bounded original bone silhouette',victory.stage);
   await page.waitForTimeout(1620);
   const restored=await read(id);
   const history=restored.stage.history;
   const lastVictory=history.lastIndexOf('R119_Skeletal_Celebrate');
   check(lastVictory>=0&&history.slice(lastVictory+1).includes('R119_Skeletal_Idle')&&
    restored.stage.returns>=3&&restored.stage.transitions>=5,
    view+' '+id+' full action returned to idle (automatic new life gesture permitted)',
    restored.stage);
   check(restored.sourceArms?.maxWeightedArmVertexTravel>.001&&
    restored.legs?.maxLegVertexTravel>.001&&
    restored.shoe?.maxAfterPenetration<=.0015&&
    restored.facing>.92,
    view+' '+id+' render-bound weighted arm+leg move and shoe grounded',restored);
   check(errors.length===0,view+' '+id+' no JS/HTTP regression',errors);
   rep.views.push({view,id,idle,attack,hit,victory,restored});
  }
  await page.close();
 }
 const perId=id=>rep.views.filter(v=>v.id===id).map(x=>x.idle.stage.identity);
 check(perId('E03').every(x=>x==='cheer-leap-whistle')&&
  perId('T04').every(x=>x==='heavy-door-block-wall'),
  'Ellie and Rex must not be one generic animation clone',rep.views.map(v=>v.idle.stage));
 rep.passed=true;
}catch(e){rep.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r135-pair-original-source-stage.json'),
 JSON.stringify(rep,null,2));await browser.close()}
console.log('R135_PAIR_HIGH_POLY_REAL_SOURCE',JSON.stringify({
 passed:rep.passed,checks:rep.checks.length,errors:rep.errors,
 views:rep.views.map(v=>({view:v.view,id:v.id,model:v.idle.file,
 sourceTracks:v.idle.stage.sourceTracks,armVertex:v.restored.sourceArms?.maxWeightedArmVertexTravel,
 legVertex:v.restored.legs?.maxLegVertexTravel,shoe:v.restored.shoe?.maxAfterPenetration,
 transitions:v.restored.stage.transitions,returns:v.restored.stage.returns}))}));
if(!rep.passed)process.exitCode=1;
