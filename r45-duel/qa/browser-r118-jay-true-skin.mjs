import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11124';
const dir=resolve(import.meta.dirname,'evidence/r118-jay');mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[],states:[]};
const check=(v,label,data)=>{report.checks.push({passed:!!v,label,data});if(!v)throw Error(label+':'+JSON.stringify(data).slice(0,850))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  for(const variant of ['R118-true-skin','R97-production']){
   const page=await browser.newPage({viewport:{width,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status())});
   const variantParam=variant==='R118-true-skin'?'&g03Study=rig':'';
   await page.goto(origin+'/r45-duel/?qa=1&seed=118'+variantParam,
      {waitUntil:'domcontentloaded',timeout:65000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:170000});
   const filename=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonModels.find(x=>x.id==='G03')?.file);
   check(filename===(variant==='R118-true-skin'?'G03-Jay-Skinned-R86.glb':'G03-Jay-Landing-R97.glb'),
    view+' selected expected physical G03 source '+variant,filename);
   await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage({
     type:'ASDC_R45_BOARD',units:{player:[{uid:'U118',id:'G03',hp:6,attack:3,shield:0}],ai:[]},
     player:['G03'],ai:[]},location.origin));
   await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===1,null,{timeout:26000});
   await page.waitForTimeout(1200);
   const q=()=>page.evaluate(()=>{
    const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{model:s.summonPresence.entries.find(x=>x.id==='G03'),
      motion:s.summonPresence.r117CharacterMotion.find(x=>x.id==='G03'),
      calls:s.drawCalls};
   });
   const before=await q();await page.waitForTimeout(800);const after=await q();
   const m=after.motion;
   if(variant==='R118-true-skin'){
    check(m.enabled&&m.mode==='skinned-joints'&&m.skinBones>=250,
      view+' REAL Jay armature actually connected to visible mesh',m);
    check(m.boneFrameWrites>10&&m.maxAngle>.009,
      view+' actual joint quaternion animation changes',m);
    check(after.model.clips===0&&after.model.playingClips.includes('R86_Skeletal_Idle'),
      view+' authentic live-skin idle clip playing',after.model);
   }else{
    check(m.mode==='authored-morph-deformation'&&!m.enabled,
     view+' rollback production film actor honest morph mode',m);
   }
   check(after.model.metrics.frontDot>.95,view+' facing actual opponent without reverse',after.model);
   check(after.calls<1200&&errors.length===0,view+' GPU performance and no 404 errors',errors);
   await page.screenshot({path:resolve(dir,view+'-'+variant+'.png')});
   report.states.push({view,variant,model:after.model,motion:m});
   await page.close();
  }
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r118-jay-true-skin-report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log('R118_REAL_SKIN_PILOT',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
