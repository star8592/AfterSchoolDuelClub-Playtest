import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11441';
const dir=resolve(import.meta.dirname,'evidence/r135/original-pair');
mkdirSync(dir,{recursive:true});
const rep={passed:false,checks:[],views:[],errors:[],origin};
const check=(ok,label,data)=>{
 rep.checks.push({pass:!!ok,label});
 if(!ok)throw Error(label+' '+JSON.stringify(data).slice(0,950));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',x=>{if(x.url().startsWith(origin)&&x.status()>=400)errors.push('HTTP '+x.status()+' '+x.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=135&r135Pair=on',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:210000});
  const u={player:[{uid:'U13511',id:'E03',hp:5,attack:3,shield:0}],
   ai:[{uid:'U13512',id:'T04',hp:5,attack:3,shield:0}]};
  await page.evaluate(units=>document.querySelector('#stadium').contentWindow.postMessage({
   type:'ASDC_R45_BOARD',units,player:['E03'],ai:['T04']},location.origin),u);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.
   __r45SceneQA.summonPresence.entries.length===2,null,{timeout:12000});
  const read=()=>page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{actors:q.summonPresence.entries.map(x=>({
    id:x.id,face:x.metrics.frontDot,stage:x.r135PairStage,
    contact:x.r133ShoeContact,arms:x.r131Arms,
    legs:x.r129FullBody,source:x.id==='E03'||x.id==='T04'?
     q.summonModels.find(m=>m.id===x.id)?.file:null
   })),drawCalls:q.drawCalls};
  });
  const samples=[];
  for(let i=0;i<6;i++){
   await page.waitForTimeout(i===0?420:3000);
   samples.push(await read());
  }
  check(samples.every(s=>s.actors.length===2&&s.actors.every(a=>
   a.stage?.enabled&&a.face>.92&&a.stage.sourceTracks===16)),
   view+' both source actors continuously animate, facing enemy for 15s',samples[0]);
  for(const id of ['E03','T04']){
   const snapshots=samples.map(x=>x.actors.find(a=>a.id===id));
   check(snapshots.every(x=>x?.source?.endsWith('-Skinned-R132-BakedRest-PILOT.glb')&&
    x.contact?.enabled&&x.contact?.maxAfterPenetration<=.0015),
    view+' '+id+' original high-poly and outsole remain supported',snapshots);
   const gestures=new Set(snapshots.map(x=>JSON.stringify(x.stage.arms)));
   check(gestures.size>=4,view+' '+id+' 15s real original wrist/arm changing pose',snapshots.map(x=>x.stage.arms));
   check(snapshots.at(-1).stage.updateFrames>snapshots[0].stage.updateFrames+100,
    view+' '+id+' render-bound source mixer not frozen',snapshots.map(x=>x.stage.updateFrames));
  }
  check(errors.length===0,view+' 15 second idle no asset or code exceptions',errors);
  rep.views.push({view,width,samples,drawCalls:samples.map(x=>x.drawCalls)});
  await page.screenshot({path:resolve(dir,view+'-E03-T04-real-15sec.png')});
  await page.close();
 }
 rep.passed=true;
}catch(e){rep.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r135-pair-original-idle-15sec.json'),JSON.stringify(rep,null,2));
 await browser.close()}
console.log('R135_PAIR_15SEC_SOURCE_IDLE',JSON.stringify({
 passed:rep.passed,checks:rep.checks.length,errors:rep.errors,
 views:rep.views.map(x=>({view:x.view,drawCalls:Math.max(...x.drawCalls)}))}));
if(!rep.passed)process.exitCode=1;
