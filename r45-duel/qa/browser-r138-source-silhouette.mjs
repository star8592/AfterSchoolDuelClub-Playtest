import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11444';
const out=resolve(import.meta.dirname,'evidence/r138/visible-silhouette');
mkdirSync(out,{recursive:true});
const result={passed:false,origin,samples:[],checks:[],errors:[]};
const check=(value,label)=>{result.checks.push({pass:!!value,label});
 if(!value)throw Error(label)};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
const ids=['G02','G04','T03'];
try{
 for(const [view,width]of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{
   if(r.url().startsWith(origin)&&r.status()>=400)
    errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=136&r136Cast=on',
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:225000});
  const inspect=(id)=>page.evaluate(who=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const a=q.summonPresence.entries.find(x=>x.id===who);
   if(!a)return null;
   return{id:a.id,front:a.metrics.frontDot,
    bbox:a.metrics.ndcBounds,coverageWidth:a.metrics.coverageWidth,
    coverageHeight:a.metrics.coverageHeight,stage:a.r136CastStage,
    feet:a.r136OriginalFoot,armSkin:a.r131Arms,
    fullBody:a.r130FullBody||a.r129FullBody||a.r128FullBody};
  },id);
  for(const id of ids){
   const u={player:[{uid:'R13801',id,hp:6,attack:3,shield:0}],
    ai:[{uid:'R13802',id:'M02',hp:6,attack:3,shield:0}]};
   await page.evaluate(units=>
    document.querySelector('#stadium').contentWindow.postMessage({
     type:'ASDC_R45_BOARD',units,player:[units.player[0].id],ai:['M02']
    },location.origin),u);
   await page.waitForFunction(who=>
    document.querySelector('#stadium').contentWindow
     .__r45SceneQA.summonPresence.entries.some(a=>a.id===who),id,
     {timeout:40000});
   const poses={};
   for(const kind of ['idle','attack','hit','celebrate']){
    check(await page.evaluate(([who,state])=>document.querySelector('#stadium')
      .contentWindow.__r45SceneQA.studyAction(who,state),[id,kind]),
      view+' '+id+' '+kind+' action started');
    await page.waitForTimeout(kind==='idle'?330:kind==='hit'?410:460);
    poses[kind]=await inspect(id);
    check(poses[kind]?.stage?.enabled&&poses[kind].front>.9,
      view+' '+id+' '+kind+' genuine source and correct facing');
    await page.screenshot({path:resolve(out,view+'-'+id+'-'+kind+'.png')});
    await page.waitForTimeout(200);
   }
   const index=side=>Math.abs((poses.celebrate?.stage?.arms?.[side]?.spread||0)-
    (poses.idle?.stage?.arms?.[side]?.spread||0));
   const visibleDelta=+(['L','R'].reduce((n,side)=>n+index(side),0)).toFixed(4);
   result.samples.push({view,id,visibleDelta,poses});
  }
  check(errors.length===0,view+' no JS/HTTP resource errors');
  await page.close();
 }
 result.passed=true;
}catch(e){result.errors.push(String(e))}
finally{writeFileSync(resolve(out,'r138-visibility-baseline.json'),
 JSON.stringify(result,null,2));await browser.close()}
console.log('R138_REAL_SCREENSPACE_ACTION_BASELINE',
 JSON.stringify({passed:result.passed,checks:result.checks.length,
 errors:result.errors,samples:result.samples.map(({view,id,visibleDelta,poses})=>({
 view,id,visibleDelta,
 idleSpread:poses.idle?.stage?.arms,
 attackSpread:poses.attack?.stage?.arms,
 celebrateSpread:poses.celebrate?.stage?.arms,
 idleCoverage:poses.idle?.coverageWidth,
 attackCoverage:poses.attack?.coverageWidth,
 celebrateCoverage:poses.celebrate?.coverageWidth
 }))}));
if(!result.passed)process.exitCode=1;
