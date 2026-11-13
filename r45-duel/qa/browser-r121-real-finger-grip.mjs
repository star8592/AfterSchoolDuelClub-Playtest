import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11142';
const dir=resolve(import.meta.dirname,'evidence/r121-finger-grip');mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[],snapshots:[]};
const check=(ok,label,d)=>{report.checks.push({pass:!!ok,label,d});if(!ok)throw Error(label+': '+JSON.stringify(d).slice(0,800))}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=121',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:170000});
  const stats=()=>page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.handCards.actors);
  let baseline=await stats();
  check(baseline.length===2&&baseline.every(x=>x.realFingerBones===15&&x.restError<.0001),
   view+' BOTH ORIGINAL VRM 15 joint five-finger hands all open at rest',baseline);
  for(const [side,id,serial] of [['player','E03',1210001],['ai','G03',1210002]]){
   await page.evaluate(({side,id,serial})=>document.querySelector('#stadium').contentWindow.postMessage(
    {type:'ASDC_R46_CARD_PLAY',side,id,serial,kind:'unit'},location.origin),{side,id,serial});
   await page.waitForTimeout(860);
   const active=(await stats()).find(x=>x.side===side);
   check(active.visible&&active.gripMode==='grasp'&&active.grip>.93,
    view+' '+side+' source five fingers GRASP physical card',active);
   check(active.realBend>.3&&active.thumbOpposition>.34,
    view+' '+side+' source index/knuckles bend and thumb opposes',active);
   check(active.wristGap<.12&&active.painted&&active.lastPainted===id,
    view+' '+side+' original card art follows real source wrist',active);
   check(active.actualFingerJointNames.every(n=>n.startsWith('J_Bip_R_'))&&
    new Set(active.actualFingerJointNames).size===15,
    view+' '+side+' every finger segment is a unique source rig bone',active);
   await page.screenshot({path:resolve(dir,view+'-'+side+'-finger-grip.png')});
   await page.waitForTimeout(1780);
   const released=(await stats()).find(x=>x.side===side);
   check(!released.visible&&released.gripMode==='open'&&released.restError<.001,
    view+' '+side+' all 15 source finger joints return to EXACT rest with no twist',
    released);
   report.snapshots.push({view,side,active,released});
  }
  check(errors.length===0,view+' no GPU, JS, missing material or card art errors',errors);
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r121-finger-grip-report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log('R121_FINGER_GRIP',JSON.stringify({passed:report.passed,checks:report.checks.length,
 errors:report.errors,failed:report.checks.filter(x=>!x.pass)}));
if(!report.passed)process.exitCode=1;
