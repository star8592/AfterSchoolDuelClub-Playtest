/**
 * R133: actual authored SkinnedMesh outsole contact after R132 pose bake.
 * Never treats a root-height counter as proof; sample rendered shoe meshes.
 */
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11438';
const dir=resolve(import.meta.dirname,'evidence/r133');
mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],actors:[],errors:[]};
const check=(okay,label,details)=>{
 report.checks.push({pass:!!okay,label});
 if(!okay)throw Error(label+' '+JSON.stringify(details).slice(0,1000));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errs=[];page.on('pageerror',e=>errs.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errs.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=133&r119Rig=all&r132BakedRest=on&r129Body=on&r130Body=on&r131Arms=on&r133ShoeGround=on',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,
   null,{timeout:200000});
  for(const id of ['E03','G03','T04','G02']){
   const u={player:[{uid:'U13301',id,hp:5,attack:3,shield:0}],ai:[]};
   await page.evaluate(units=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',units,player:[units.player[0].id],ai:[]},location.origin),u);
   await page.waitForFunction(target=>document.querySelector('#stadium').contentWindow
    .__r45SceneQA.summonPresence.entries.some(x=>x.id===target),id,{timeout:19000});
   for(const [phase,delay] of [['idle',410],['attack',460],['hit',320],['celebrate',340],['idle',420]]){
    await page.evaluate(([i,p])=>{
     const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
     q.setStudyCloseup(i);return q.studyAction(i,p);
    },[id,phase]);
    await page.waitForTimeout(delay);
    const state=await page.evaluate(target=>{
     const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
     const entry=q.summonPresence.entries.find(x=>x.id===target);
     return{record:entry?.r133ShoeContact||null,
      ankleY:entry?.metrics?.sourceHeelsY,
      currentMeshFloor:q.studyLowestSourceMeshes(target).slice(0,3),
      actor:entry?.id,model:q.summonModels.find(x=>x.id===target)?.file};
    },id);
    check(state.actor===id&&state.model?.endsWith('-Skinned-R132-BakedRest-PILOT.glb'),
     view+' '+id+' source original R132 model is genuinely loaded',state);
    if(id==='G02'){
     check(state.record===null,view+' G02 remains completely unaffected by three-person R133 pilot',state);
    }else{
     check(state.record?.enabled&&state.record?.source==='two_original_weighted_skinned_outsoles'&&
      state.record.shoes?.length===2&&state.record.last?.shoes.length===2,
      view+' '+id+' reads 2 real source weighted sole meshes',state);
     const last=state.record.last;
     check(Math.min(...last.after)>=-.0015&&state.record.maxAfterPenetration<=.0015,
      view+' '+id+' planted real outsole does not penetrate the court',state);
     check(last.appliedLift>=0&&last.appliedLift<=.08201,
      view+' '+id+' bounded correction, not a synthetic character jump',state);
     const separationBefore=last.before[0]-last.before[1];
     const separationAfter=last.after[0]-last.after[1];
     check(Math.abs(separationBefore-separationAfter)<.001,
      view+' '+id+' original outsole submeshes retain relative world-height separation',last);
    }
    report.actors.push({view,id,phase,...state});
    if(view==='desktop'&&phase==='attack')
     await page.screenshot({path:resolve(dir,'desktop-'+id+'-attack-grounded.png')});
   }
   check(errs.length===0,view+' '+id+' has no model HTTP or JS errors',errs);
  }
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(dir,'r133-source-shoe-contact-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R133_SOURCE_SHOE_CONTACT',JSON.stringify({
 passed:report.passed,checks:report.checks.length,
 failed:report.checks.filter(x=>!x.pass),errors:report.errors,
 summary:report.actors.filter(x=>['G03','T04','E03'].includes(x.id)&&x.phase==='attack').map(x=>({
 view:x.view,id:x.id,prior:x.record?.last?.before,
 after:x.record?.last?.after,lift:x.record?.last?.appliedLift
 }))}));
if(!report.passed)process.exitCode=1;
