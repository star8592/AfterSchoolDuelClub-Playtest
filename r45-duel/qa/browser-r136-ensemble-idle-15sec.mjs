import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11442';
const dir=resolve(import.meta.dirname,'evidence/r136/four-source');
mkdirSync(dir,{recursive:true});
const result={passed:false,checks:[],views:[],errors:[],origin};
const check=(v,label,extra)=>{
 result.checks.push({pass:!!v,label});
 if(!v)throw Error(label+' '+String(JSON.stringify(extra)).slice(0,1100));
};
const ids=['E04','G02','G04','T03'];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=136&r136Cast=on',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:225000});
  const u={player:[
   {uid:'U13661',id:'E04',hp:5,attack:3,shield:0},
   {uid:'U13662',id:'G02',hp:5,attack:3,shield:0}
  ],ai:[
   {uid:'U13663',id:'G04',hp:5,attack:3,shield:0},
   {uid:'U13664',id:'T03',hp:5,attack:3,shield:0}
  ]};
  await page.evaluate(units=>document.querySelector('#stadium').contentWindow.postMessage({
   type:'ASDC_R45_BOARD',units,player:['E04','G02'],ai:['G04','T03']},location.origin),u);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
   .__r45SceneQA.summonPresence.entries.length===4,null,{timeout:18000});
  const read=()=>page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{actors:q.summonPresence.entries.map(a=>({
    id:a.id,face:a.metrics.frontDot,source:a.r136CastStage,
    shoes:a.r136OriginalFoot,
    arms:a.r131Arms,
    legs:a.r129FullBody||a.r130FullBody||a.r128FullBody
   })),drawCalls:q.drawCalls};
  });
  const samples=[];
  for(let i=0;i<6;i++){
   await page.waitForTimeout(i===0?450:3000);
   samples.push(await read());
  }
  for(const id of ids){
   const a=samples.map(x=>x.actors.find(v=>v.id===id));
   check(a.every(x=>x?.source?.enabled&&x.face>.90),
    view+' '+id+' sustained source animation, opponent facing',a[0]);
   check(a.every(x=>x.shoes?.enabled&&x.shoes.maxAfter<=.004),
    view+' '+id+' original shoe/lower-body source floor stays clear',a.map(x=>x.shoes));
   const poses=new Set(a.map(x=>JSON.stringify(x.source.arms)));
   check(poses.size>=4,view+' '+id+' real arms change pose in 15 sec',a.map(x=>x.source.arms));
   check(a.at(-1).source.frames-a[0].source.frames>=120,
    view+' '+id+' source mixer never freezes in fifteen seconds',a.map(x=>x.source.frames));
  }
  check(samples.every(x=>x.actors.length===4&&x.drawCalls<1500),
   view+' all four originals staged with bounded drawcalls',samples.map(x=>x.drawCalls));
  check(errors.length===0,view+' no JS/HTTP errors',errors);
  result.views.push({view,samples});
  await page.screenshot({path:resolve(dir,view+'-four-originals-15sec.png')});
  await page.close();
 }
 result.passed=true;
}catch(e){result.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r136-four-ensemble-15sec.json'),
 JSON.stringify(result,null,2));await browser.close()}
console.log('R136_FOUR_REAL_SOURCE_15SEC',JSON.stringify({
 passed:result.passed,checks:result.checks.length,errors:result.errors,
 views:result.views.map(x=>({view:x.view,maxDrawCalls:Math.max(...x.samples.map(y=>y.drawCalls)),
  sourceFaces:x.samples.at(-1).actors.map(a=>({id:a.id,face:a.face,
   maxPenetration:a.shoes.maxAfter,arms:a.source.arms}))}))}));
if(!result.passed)process.exitCode=1;
