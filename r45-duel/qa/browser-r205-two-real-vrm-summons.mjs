import assert from'node:assert/strict';
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r205-original-summons';
mkdirSync(dir,{recursive:true});
const enabled=process.env.R205_CASE!=='default-off';
const report={pass:false,enabled,errors:[],ids:['E01','G01'],frames:[]};
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
const page=await b.newPage({viewport:{width:1440,height:860}});
page.on('pageerror',e=>report.errors.push(e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
const snap=()=>page.evaluate(()=>{
 const a=window.__r45QA,b=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
 return{hp:a?.hp,events:a?.events?.length,round:a?.round,
  camera:b?.r145ActionShot?.enabled,inset:b?.renderPerformance?.heroInsetDraws,
  models:b?.summonPresence?.entries};
});
try{
 await page.goto('http://127.0.0.1:18689/r45-duel/?qa=1&seed=205&r205LivingSummons='+
  (enabled?'on':'off'),{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:150000});
 const before=await snap();
 const units={player:[{uid:'U2051',id:'E01',hp:4,attack:2,shield:0}],
  ai:[{uid:'U2052',id:'G01',hp:4,attack:2,shield:0}]};
 await page.evaluate(u=>document.getElementById('stadium').contentWindow.postMessage({
  type:'ASDC_R45_BOARD',units:u,player:['E01'],ai:['G01']
 },location.origin),units);
 await page.waitForFunction(()=>document.getElementById('stadium').
  contentWindow?.__r45SceneQA?.summonPresence?.total===2,null,{timeout:18000});
 for(let i=0;i<9;i++){
  await page.waitForTimeout(650);
  const f=await snap();
  assert.equal(f.models.length,2);
  assert(f.models.every(x=>x.visible&&x.metrics.frontDot>.95));
  if(enabled)assert(f.models.every(x=>x.r205TrueVRMSource?.originalRealSkin));
  else assert(f.models.every(x=>x.r205TrueVRMSource===null));
  report.frames.push(f);
  if([0,4,8].includes(i))await page.locator('#stadium').screenshot({
   path:dir+'/r205-VRM-E01-G01-'+(enabled?'lively':'default')+'-t'+i+'.png'});
 }
 const last=report.frames.at(-1);
 assert.deepEqual(last.hp,before.hp);
 assert.equal(last.events,before.events);
 assert.equal(last.round,before.round);
 assert.equal(last.camera,false);assert.equal(last.inset,0);
 assert.deepEqual(report.errors,[]);
 if(enabled){
  report.summary=[];
  for(const id of ['E01','G01']){
   const frames=report.frames.map(f=>f.models.find(x=>x.id===id));
   const amps=frames.map(x=>x.r205TrueVRMSource.gestureAmount);
   const range=Math.max(...amps)-Math.min(...amps);
   assert(range>.075,'R205 genuine original VRM arm is frozen '+id);
   for(const m of frames){
    for(const j of ['R','L']){
     const a=m.r205TrueVRMSource.originalTwoBoneIK.arms[j];
     assert(Number.isFinite(a.error)&&a.error<.035,
      'R205 cannot dislocate original source VRM shoulders '+id+' '+j);
    }
   }
   report.summary.push({id,source:'original skinned VRM, two-bone IK',
    min:Math.min(...amps),max:Math.max(...amps),variation:+range.toFixed(4),
    originalRealVisibleSource:true});
  }
 }
 report.pass=true;
 console.log('R205_TWO_ACTUAL_ORIGINAL_SKINNED_VRM_BOARD_PEOPLE_PASS',
  JSON.stringify({enabled,originalE01G01:2,vrmIKErrorBelow035:true,
   distinctRegularGestures:enabled,boardRulesSame:true,errors:[]}));
}finally{
 writeFileSync(dir+'/r205-E01-G01-VRM-'+(enabled?'lively':'default')+'.json',
  JSON.stringify(report,null,2)+'\n');
 await b.close();
}
