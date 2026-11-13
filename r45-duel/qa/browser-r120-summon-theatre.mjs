import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11132';
const dir=resolve(import.meta.dirname,'evidence/r120-summons');mkdirSync(dir,{recursive:true});
const cast=['E02','E03','E04','G02','G03','G04','M01','M02','T01','T02','T03','T04'];
const report={passed:false,origin,checks:[],errors:[],samples:[]};
function check(ok,label,data){report.checks.push({pass:!!ok,label,data});if(!ok)throw Error(label+' '+JSON.stringify(data).slice(0,700))}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push('JS:'+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push('HTTP:'+r.status())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=120',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:165000});
  const get=()=>page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{summons:q.summonPresence,game:window.__r45QA.board,drawCalls:q.drawCalls};
  });
  const start=await get();
  let gestureSerial=1201000;
  for(const batch of [cast.slice(0,10),cast.slice(10)]){
   const units={player:batch.slice(0,5).map((id,i)=>({id,uid:'U'+(110+i),hp:5,attack:3,shield:0})),
    ai:batch.slice(5).map((id,i)=>({id,uid:'U'+(210+i),hp:5,attack:3,shield:0}))};
   await page.evaluate(units=>document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',units,player:units.player.map(u=>u.id),ai:units.ai.map(u=>u.id)},location.origin),units);
   await page.waitForFunction(n=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===n,
    batch.length,{timeout:30000});
   let after=await get();
   check(after.summons.entries.every(x=>x.metrics.frontDot>.88),
    view+' all genuine avatars face opponents without reversing',after.summons.entries.map(x=>({id:x.id,dot:x.metrics.frontDot})));
   for(const row of [...units.player.map(x=>({side:'player',...x})),
      ...units.ai.map(x=>({side:'ai',...x}))]){
    await page.evaluate(({id,side,serial})=>document.querySelector('#stadium').contentWindow.postMessage(
     {type:'ASDC_R46_CARD_PLAY',side,id,kind:'unit',serial},location.origin),
     {id:row.id,side:row.side,serial:++gestureSerial});
    await page.waitForTimeout(440);
    after=await get();
    const x=after.summons.r120CharacterTheatre.find(x=>x.id===row.id&&x.side===row.side);
    const expected=after.summons.r102Comedy.active.some(y=>y.id===row.id);
    check(expected&&x?.performance?.actualSourceModel===true,
     view+' '+row.id+' actual source mesh performs grand entrance',x);
    check(['windup','spotlight','recover'].includes(x.performance.phase),
     view+' '+row.id+' three-stage gesture with independent personality',x);
    report.samples.push({view,id:row.id,style:x.identity,phase:x.performance.phase,
     clip:x.performance.clip,drawCalls:after.drawCalls});
   }
   await page.screenshot({path:resolve(dir,view+'-stage-'+batch[0]+'.png')});
  }
  const ids=report.samples.filter(x=>x.view===view).map(x=>x.style);
  check(new Set(ids).size===cast.length,view+' 12 DISTINCT character theatrical identities',ids);
  const final=await get();
  check(JSON.stringify(final.game)===JSON.stringify(start.game),
   view+' comedic motions never change game rules, costs, or HP');
  check(final.drawCalls<1400&&errors.length===0,
   view+' GPU drawcall limit / no 404 or JS',{draw:final.drawCalls,errors});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r120-summon-theatre-report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log('R120_SUMMON_THEATRE',JSON.stringify({passed:report.passed,checks:report.checks.length,
 errors:report.errors,failed:report.checks.filter(x=>!x.pass)}));
if(!report.passed)process.exitCode=1;
