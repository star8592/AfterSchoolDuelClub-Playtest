import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11122';
const dir=resolve(import.meta.dirname,'evidence/r117-hand');mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[]};
const check=(v,label,d)=>{report.checks.push({passed:!!v,label,data:d});if(!v)throw Error(label+': '+JSON.stringify(d).slice(0,450))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP:'+r.status())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=117',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:160000});
  let hand=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.handCards);
  check(hand?.actors.length===2&&hand.actors.every(x=>x.wristTracked),
    view+' authentic VRM wrist anchors loaded',hand);
  const post=async(side,id,serial)=>page.evaluate(async({side,id,serial})=>{
   const {BY_ID}=await import('./engine.mjs');const c=BY_ID[id];
   document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R46_CARD_PLAY',side,id,name:c.name,cost:c.cost,
    kind:c.kind,serial},location.origin);
  },{side,id,serial});
  await post('player','E03',1170001);
  await page.waitForTimeout(620);
  hand=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.handCards);
  const player=hand.actors.find(x=>x.side==='player');
  check(player.visible&&player.shown===1&&player.wristGap<.11,
   view+' genuine illustrated card follows right wrist',player);
  check(player.lastPainted==='E03',view+' real R109 E03 painting, not placeholder',player);
  await page.screenshot({path:resolve(dir,view+'-physical-painted-hand-card.png')});
  await post('ai','G03',1170002);
  await page.waitForTimeout(440);
  hand=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.handCards);
  check(hand.actors.every(x=>x.shown===1)&&hand.actors.every(x=>x.wristGap<.11),
   view+' independent duelists hold their own distinct cards',hand);
  await page.waitForTimeout(2500);
  hand=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.handCards);
  check(hand.actors.every(x=>!x.visible),view+' release prop after cinematic, no lingering holograms',hand);
  check(errors.length===0,view+' no script or missing artwork',errors);
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r117-hand-report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log('R117_HAND_CARD_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
