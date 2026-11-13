import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11429';
const folder=resolve(import.meta.dirname,'evidence/r126');
mkdirSync(folder,{recursive:true});
const report={passed:false,origin,checks:[],errors:[],samples:[]};
function check(pass,name,detail){
 report.checks.push({pass:!!pass,name});
 if(!pass)throw Error(name+':'+JSON.stringify(detail).slice(0,700));
}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-webgl',
 '--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errs=[];
  page.on('pageerror',e=>errs.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errs.push('HTTP '+r.status()+' '+r.url());});
  await page.goto(origin+'/r45-duel/?qa=1&seed=8&deck=kitchen&r122Crowd=force',
   {waitUntil:'domcontentloaded',timeout:80000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
  const first=await page.evaluate(()=>{
   const a=document.querySelector('#stadium').contentWindow.__r45SceneQA.stadiumAmbience.audience;
   return{skinned:a.skinnedRealActors,bones:a.boneDrivenActors,source:a.teacherSourceMotion,cast:a.realModelIds};
  });
  check(first.cast.length===8&&first.skinned>=1&&first.source?.sourceSkinnedMeshes>=10&&
   first.source?.sourceBones>=24,view+' M01 is original visible source skin, not whole-body proxy',first);
  await page.evaluate(()=>{
   const w=document.querySelector('#stadium').contentWindow;
   const units={player:[{uid:'U1261',id:'M01',hp:5,attack:2,shield:0}],
    ai:[{uid:'U1262',id:'M02',hp:5,attack:3,shield:0}]};
   w.postMessage({type:'ASDC_R45_BOARD',units,player:['M01'],ai:['M02']},location.origin);
  });
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===2);
  await page.waitForTimeout(1050);
  const idle=await page.evaluate(()=>{
   const e=document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.entries;
   return e.find(x=>x.id==='M01');
  });
  check(idle?.playingClips?.includes('Idle')&&idle.playingClips.includes('R126_M01_Conduct'),
   view+' M01 actual SOURCE Idle + additive conducting clip running',idle?.playingClips);
  check(idle?.r126TeacherMotion?.trackedJoints>=5&&idle.r126TeacherMotion.maxRealJointAngle>.05,
   view+' shoulder elbow torso neck physically articulated',idle?.r126TeacherMotion);
  await page.locator('.card[data-card-id="K01"]:not([disabled])').first().click();
  await page.locator('#play').click();
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.stadiumAmbience.audience.supervisorActs,
   null,{timeout:18000});
  await page.waitForTimeout(320);
  const action=await page.evaluate(()=>{
   const sc=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{audience:sc.stadiumAmbience.audience,health:window.__r45QA.hp};
  });
  check(action.audience.teacherSourceMotion?.maxRealJointAngle>.15&&
   action.audience.teacherSourceMotion?.sourceSkinnedMeshes>=10,
   view+' original M01 source bones animate real speech-order staging',action.audience.teacherSourceMotion);
  check(action.health.ai===19,view+' source skeletal upgrade cannot modify authentic spell rule',action.health);
  await page.screenshot({path:resolve(folder,view+'-M01-source-bone-order.png')});
  check(errs.length===0,view+' no runtime or HTTP errors',errs);
  report.samples.push({view,idle:idle.r126TeacherMotion,order:action.audience.teacherSourceMotion});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e));}
finally{
 writeFileSync(resolve(folder,'r126-music-teacher-source-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R126_NATIVE_M01_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
