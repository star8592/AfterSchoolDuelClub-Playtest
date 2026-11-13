import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11432';
const folder=resolve(import.meta.dirname,'evidence/r129');
mkdirSync(folder,{recursive:true});
const ids=['E03','G03','G04','T04'];
const report={passed:false,checks:[],errors:[],views:[],origin};
const check=(ok,label,details)=>{
 report.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+JSON.stringify(details).slice(0,1200));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
const units={player:ids.map((id,i)=>({uid:'U'+(12910+i),id,hp:5,attack:3,shield:0})),
 ai:[{uid:'U12920',id:'M02',hp:5,attack:3,shield:0}]};
async function read(page){
 return page.evaluate(()=>{
  const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return{
   cast:q.summonPresence.entries.filter(x=>['E03','G03','G04','T04'].includes(x.id)),
   total:q.summonPresence.total,
   skins:q.summonPresence.r119TrueSkinVertices.filter(x=>['E03','G03','G04','T04'].includes(x.id)),
   loaded:q.summonModels.filter(x=>['E03','G03','G04','T04'].includes(x.id)),
   drawCalls:q.drawCalls, hp:window.__r45QA.hp
  };
 });
}
try{
 for(const[view,width]of[['desktop',1440],['portrait',430]]){
  for(const mode of ['off','on']){
   const page=await browser.newPage({viewport:{width,height:900}}),errs=[];
   page.on('pageerror',e=>errs.push(e.message));
   page.on('response',r=>{
    if(r.url().startsWith(origin)&&r.status()>=400)
     errs.push('HTTP '+r.status()+' '+r.url());
   });
   await page.goto(origin+'/r45-duel/?qa=1&seed=129&r119Rig='+ids.join(',')+'&r129Body='+mode,
    {waitUntil:'domcontentloaded',timeout:85000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
   await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',units:u,
    player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id)},location.origin),units);
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===5,
    null,{timeout:30000});
   await page.waitForTimeout(550);
   const initial=await read(page);
   check(initial.cast.length===4&&initial.loaded.every(x=>x.file?.endsWith('-Skinned-R119.glb')),
    view+' '+mode+' 4 real source high-fidelity human GLBs in genuine stadium',initial.loaded);
   check(initial.skins.length===4&&initial.skins.every(x=>x.valid&&x.skinnedMeshes>=6),
    view+' '+mode+' four actual source-weighted visible skins',initial.skins);
   check(initial.cast.every(x=>x.metrics.frontDot>.94&&x.playingClips.includes('R119_Skeletal_Idle')),
    view+' '+mode+' all full source actors face correct opponents while posing',initial.cast);
   if(mode==='on'){
    for(const actor of initial.cast){
     const p=actor.r129FullBody;
     check(p?.source==='real_original_skinned_deform_bones'&&p.actor===actor.id&&
      p.runtimeLegTracks===8&&p.weightedSourceLegVertexWeight>.35&&
      p.hierarchy?.sourceHierarchyRepaired===true,
      view+' '+actor.id+' real original 8 leg channels and source weighted vertex',p);
     check(Object.values(p.hierarchy.chains).every(c=>c.restDrift<.000001),
      view+' '+actor.id+' original bind pose preserved after reparent',p.hierarchy);
    }
   }else{
    check(initial.cast.every(x=>!x.r129FullBody),
     view+' original R119 actor movement preserved with r129Body=off',initial.cast);
   }
   await page.screenshot({path:resolve(folder,view+'-'+mode+'-four-source-actors-idle.png')});
   for(let i=0;i<4;i++){
    await page.evaluate(({id,serial})=>document.querySelector('#stadium').contentWindow.postMessage({
     type:'ASDC_R46_CARD_PLAY',side:'player',id,kind:'unit',serial},location.origin),
     {id:ids[i],serial:129000+i});
    await page.waitForTimeout(520);
   }
   // A four-character event parade can briefly starve the last actor on a
   // busy GPU. Sample across the actual clip duration rather than calling
   // a 0.5s animation window a movement failure.
   await page.waitForTimeout(850);
   const after=await read(page);
   check(after.total===5&&after.drawCalls<1500&&after.hp.player===20&&after.hp.ai===20,
    view+' '+mode+' added source animations do not alter HP, gameplay, or explode GPU',after);
   if(mode==='on'){
    for(const e of after.cast){
     const a=e.r129FullBody;
     check(a?.frames>20&&a.maxJointAngle>.065&&a.independentLegFrames>12,
      view+' '+e.id+' original thighs/knees/toes truly articulate during active game',a);
     check(a?.maxLegVertexTravel>.0015&&a.maxFootHeightSpan>.004,
      view+' '+e.id+' weighted real skin vertex and original foot move, not phantom joints',a);
    }
   }
   await page.screenshot({path:resolve(folder,view+'-'+mode+'-four-source-actors-active.png')});
   await page.waitForTimeout(2200);
   const restored=await read(page);
   check(restored.cast.every(e=>e.playingClips.includes('R119_Skeletal_Idle')&&e.metrics.frontDot>.94),
    view+' '+mode+' all four independently settle and face actual opponents after action',restored.cast);
   check(errs.length===0,view+' '+mode+' no asset 404/JS/WebGL exceptions',errs);
   report.views.push({view,mode,actors:after.cast.map(e=>({
    id:e.id,stats:e.r129FullBody||null,sourcePose:e.metrics,clips:e.playingClips})),
    drawCalls:after.drawCalls});
   await page.close();
  }
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(folder,'r129-four-flat-human-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R129_FOUR_REAL_BODY_ACTORS',JSON.stringify({passed:report.passed,
 checks:report.checks.length,errors:report.errors,
 failed:report.checks.filter(x=>!x.pass),samples:report.views.map(v=>({
 view:v.view,mode:v.mode,actors:v.actors.map(a=>({
 id:a.id,vertex:a.stats?.maxLegVertexTravel,shoe:a.stats?.maxFootHeightSpan,
 angle:a.stats?.maxJointAngle}))}))}));
if(!report.passed)process.exitCode=1;
