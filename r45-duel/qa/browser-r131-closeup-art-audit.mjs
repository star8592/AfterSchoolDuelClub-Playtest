import{createRequire}from'node:module';
import{writeFileSync,mkdirSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11436';
const dir=resolve(import.meta.dirname,process.env.ASDC_R131_BAKED==='on'?'evidence/r131/baked-qa':'evidence/r131');
mkdirSync(dir,{recursive:true});
const ids=(process.env.ASDC_R131_IDS||'E03,E04,G02,G03,G04,T03,T04').split(',');
const enabled='r119Rig=all&r128Body=on&r129Body=on&r130Body=on&r131Arms=on'+(process.env.ASDC_R131_BAKED==='on'?'&r131BakedRest=on':'');
const rep={passed:false,origin,checks:[],views:[],errors:[],actors:[]};
function check(ok,label,details){
 rep.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+String(JSON.stringify(details)).slice(0,750));
}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]].filter(([v])=>(process.env.ASDC_R131_VIEWS||'desktop,portrait').split(',').includes(v))){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errs=[];page.on('pageerror',e=>errs.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errs.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=131&'+enabled,
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,
   null,{timeout:220000});
  const api=(fn,args)=>page.evaluate(([method,data])=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return typeof q[method]==='function'?q[method](...data):false;
  },[fn,args]);
  async function read(id){
   return page.evaluate(target=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    const a=q.summonPresence.entries.find(x=>x.id===target);
    return{
     actor:a?.id,side:a?.side,kind:a?.kind,visible:a?.visible,
     metrics:a?.metrics,clips:a?.playingClips,
     camera:q.studyCloseup,
     bones:a?.r128FullBody||a?.r129FullBody||a?.r130FullBody||null,
     upper:a?.r131Arms||null,
     model:q.summonModels.find(x=>x.id===target)?.file,
     drawCalls:q.drawCalls
    };
   },id);
  }
  for(const id of ids){
   const u={player:[{uid:'U13101',id,hp:5,attack:3,shield:0}],
    ai:[{uid:'U13102',id:'M02',hp:5,attack:3,shield:0}]};
   await page.evaluate(units=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',units,player:[units.player[0].id],ai:['M02']},location.origin),u);
   try{
    await page.waitForFunction(expected=>document.querySelector('#stadium').contentWindow
     .__r45SceneQA.summonPresence.entries.some(x=>x.id===expected),id,{timeout:8000});
   }catch(e){
    const board=await page.evaluate(()=>{
     const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
     return{ready:q.ready,shown:q.shownCards,units:q.summonPresence.entries.map(x=>x.id)};
    }).catch(e=>({read:String(e)}));
    throw Error('R131 sync '+id+' '+JSON.stringify({errs,board,timeout:String(e)}).slice(0,1800));
   }
   check(await api('setStudyCloseup',[id]),view+' '+id+' QA-only camera can track actual source actor');
   check(await api('studyAction',[id,'idle']),view+' '+id+' source idle action controllable');
   await page.waitForTimeout(450);
   const idle=await read(id);
   check(idle.model?.endsWith(process.env.ASDC_R131_BAKED==='on'&&id==='E04'?
    '-Skinned-R131-BakedRest-PILOT.glb':'-Skinned-R119.glb')&&idle.camera===id&&
    idle.metrics?.frontDot>.94&&idle.metrics?.sourceHeelsY?.every(x=>Number.isFinite(x)),
    view+' '+id+' real high-poly skin closeup source and true shoe joints',idle);
   check(idle.upper?.source==='actual_original_author_skinned_arm_hierarchy'&&
    idle.upper.actor===id&&idle.upper.maxBindRestDrift<1e-5&&
    idle.upper.changedParentLinks>=4&&idle.upper.originalVertexWeight>.35,
    view+' '+id+' genuine original upper arm/forearm/wrist/finger hierarchy and bind-rest preserved',idle.upper);
   if(view==='desktop')
    await page.screenshot({path:resolve(dir,view+'-'+id+'-idle.png')});
   check(await api('studyAction',[id,'attack']),view+' '+id+' attack action');
   await page.waitForTimeout(250);
   const attackWindup=await read(id);
   await page.waitForTimeout(230);
   const attackPeak=await read(id);
   if(view==='desktop')
    await page.screenshot({path:resolve(dir,view+'-'+id+'-attack.png')});
   await page.waitForTimeout(670);
   check(await api('studyAction',[id,'hit']),view+' '+id+' true hit action');
   await page.waitForTimeout(230);
   const hit=await read(id);
   if(view==='desktop')
    await page.screenshot({path:resolve(dir,view+'-'+id+'-hit.png')});
   await page.waitForTimeout(710);
   check(await api('studyAction',[id,'celebrate']),view+' '+id+' victory action');
   await page.waitForTimeout(340);
   const celebrate=await read(id);
   if(view==='desktop')
    await page.screenshot({path:resolve(dir,view+'-'+id+'-celebrate.png')});
   await page.waitForTimeout(800);
   check(await api('studyAction',[id,'idle']),view+' '+id+' restored to idle');
   await page.waitForTimeout(410);
   const restored=await read(id);
   check(restored.upper?.frames>35&&restored.upper.maxSourceWristTravel>.020&&
    restored.upper.maxWeightedArmVertexTravel>.001,
    view+' '+id+' source weighted hand and wrist truly move (not unused bones)',restored.upper);
   check(restored.metrics.frontDot>.94&&restored.clips.includes('R119_Skeletal_Idle'),
    view+' '+id+' correct opponent orientation and original idle after all actions',restored);
   const f=(x)=>({state:x?.clips?.[0],minY:x?.metrics?.minY,
    height:x?.metrics?.height,heels:x?.metrics?.sourceHeelsY,
    front:x?.metrics?.frontDot,drawCalls:x?.drawCalls});
   rep.actors.push({view,id,idle:f(idle),attackWindup:f(attackWindup),
    attackPeak:f(attackPeak),hit:f(hit),celebrate:f(celebrate),
    restored:f(restored),source:id,
    armData:restored.upper||null,
    jointData:(attackPeak.bones||null),
    maxMinYAcrossStates:Math.max(...[idle,attackWindup,attackPeak,hit,celebrate,restored].map(x=>x.metrics.minY)),
    minMinYAcrossStates:Math.min(...[idle,attackWindup,attackPeak,hit,celebrate,restored].map(x=>x.metrics.minY))});
   check(errs.length===0,view+' '+id+' no missing source asset or JS exception',errs);
  }
  rep.views.push({view,width,drawCalls:rep.actors.filter(x=>x.view===view).map(x=>({
   id:x.id,draw:x.attackPeak.drawCalls}))});
  await page.close();
 }
 rep.passed=true;
}catch(e){rep.errors.push(String(e));}
finally{
 writeFileSync(resolve(dir,'r131-seven-closeup-art-report.json'),JSON.stringify(rep,null,2));
 await browser.close();
}
console.log('R131_SEVEN_SOURCE_CLOSEUP',JSON.stringify({passed:rep.passed,checks:rep.checks.length,
 errors:rep.errors,failed:rep.checks.filter(x=>!x.pass),
 grounding:rep.actors.map(x=>({view:x.view,id:x.id,
 idle:x.idle.minY,attack:x.attackPeak.minY,hit:x.hit.minY,celebrate:x.celebrate.minY,
 peakHeels:x.attackPeak.heels}))}));
if(!rep.passed)process.exitCode=1;
