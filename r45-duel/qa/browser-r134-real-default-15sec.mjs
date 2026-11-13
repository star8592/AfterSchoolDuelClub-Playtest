import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11439';
const dir=resolve(import.meta.dirname,'evidence/r134');
mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[],samples:[],origin};
const check=(v,label,extra)=>{
 report.checks.push({pass:!!v,label});
 if(!v)throw Error(label+' '+JSON.stringify(extra).slice(0,850));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
try{
 for(const mode of ['R97_default','R134_pilot']){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errs=[];page.on('pageerror',e=>errs.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errs.push('HTTP '+r.status()+' '+r.url())});
  const q=mode==='R134_pilot'?'&r134Jay=on':'';
  await page.goto(origin+'/r45-duel/?qa=1&seed=134'+q,{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:210000});
  const units={player:[{uid:'U13411',id:'G03',hp:5,attack:3,shield:0}],
   ai:[{uid:'U13412',id:'M02',hp:5,attack:3,shield:0}]};
  await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage({
   type:'ASDC_R45_BOARD',units:u,player:['G03'],ai:['M02']},location.origin),units);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
   .__r45SceneQA.summonPresence.entries.some(x=>x.id==='G03'),null,{timeout:15000});
  const read=()=>page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const a=q.summonPresence.entries.find(x=>x.id==='G03');
   const chef=q.summonPresence.entries.find(x=>x.id==='M02');
   return{source:q.summonModels.find(x=>x.id==='G03')?.file,
    character:a?.r134JayStage,chef:chef?.playingClips||[],
    face:a?.metrics?.frontDot,ground:a?.r133ShoeContact?.maxAfterPenetration,
    drawCalls:q.drawCalls};
  });
  if(mode==='R134_pilot'){
   await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA
    .studyAction('G03','idle'));
  }
  const samples=[];
  for(let i=0;i<6;i++){
   await page.waitForTimeout(i===0?350:3000);
   samples.push(await read());
  }
  const first=samples[0];
  check(first.source===(mode==='R134_pilot'?
   'G03-Jay-Skinned-R132-BakedRest-PILOT.glb':'G03-Jay-Landing-R97.glb'),
   mode+' exact actor selection',first);
  check(samples.every(x=>x.face>.93&&x.source===first.source),
   mode+' actor stays facing enemy for 15 seconds',samples);
  if(mode==='R134_pilot'){
   check(samples.every(x=>x.character?.enabled&&x.character.sourceRigTrackCount>=16),
    mode+' real 16+ skeletal source tracks throughout idle',samples);
   const moving=new Set(samples.map(x=>JSON.stringify(x.character.sourceArmDirections)));
   check(moving.size>=3,mode+' actual shoulders and wrists change through 15s idle',samples);
   check(samples.every(x=>(x.ground??0)<=.0015),
    mode+' original weighted shoe remains clear of floor',samples);
   check(samples.every(x=>x.character.maxPostureCorrection<=1.3),
    mode+' source shoulder correction remains bounded',samples);
  }else{
   check(samples.every(x=>x.character===null),
    mode+' original default R97 never silently selects experimental actor',samples);
  }
  check(errs.length===0,mode+' scene has no runtime or resource errors',errs);
  report.samples.push({mode,data:samples,
   uniqueSourcePoses:mode==='R134_pilot'?
    new Set(samples.map(x=>JSON.stringify(x.character.sourceArmDirections))).size:null});
  await page.screenshot({path:resolve(dir,mode+'-15s-official-farshot.png')});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r134-default-vs-pilot-15s.json'),JSON.stringify(report,null,2));
 await browser.close()}
console.log('R134_15SEC_DEFAULT_VS_REAL_SOURCE',JSON.stringify({
 passed:report.passed,checks:report.checks.length,errors:report.errors,
 modes:report.samples.map(x=>({mode:x.mode,source:x.data[0].source,
 uniqueSourcePoses:x.uniqueSourcePoses}))}));
if(!report.passed)process.exitCode=1;
