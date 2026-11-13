import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11131';
const dir=resolve(import.meta.dirname,'evidence/r120-duelists');mkdirSync(dir,{recursive:true});
const report={passed:false,origin,checks:[],errors:[],states:[]};
const check=(v,label,data)=>{report.checks.push({passed:!!v,label,data});if(!v)throw Error(label+' '+JSON.stringify(data).slice(0,700))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=120',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:165000});
  const read=()=>page.evaluate(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {hosts:s.duelistHosts,card:s.handCards,living:s.livingCast,arena:s.arenaLife,
    draw:s.drawCalls,board:window.__r45QA.board};
  });
  const idle=await read();
  check(idle.hosts.length===2&&idle.hosts.every(x=>x.posture?.arms.R?.worldHand),
   view+' original visible VRM duelists ready',idle.hosts);
  const baseline=Object.fromEntries(idle.hosts.map(x=>[x.side,x.posture.arms.R.worldHand[1]]));
  const cards=[['player','E03',1200001],['ai','G03',1200002]];
  for(const [side,id,serial] of cards){
   await page.evaluate(({side,id,serial})=>document.querySelector('#stadium').contentWindow.postMessage(
    {type:'ASDC_R46_CARD_PLAY',side,id,serial,kind:'unit'},location.origin),{side,id,serial});
   await page.waitForTimeout(840);
   const snapshot=await read(),host=snapshot.hosts.find(x=>x.side===side);
   const own=snapshot.card.actors.find(x=>x.side===side);
   check(host.posture.phase==='raise_card'||host.posture.phase==='cast',
    view+' '+side+' explicitly raises a physical card',host.posture);
   check(host.posture.arms.R.worldHand[1]>baseline[side]+.16,
    view+' '+side+' actual VRM RIGHT HAND visibly above rest',
    {idleY:baseline[side],raisedY:host.posture.arms.R.worldHand[1]});
   check(own.visible&&own.wristTracked&&own.wristGap<.11&&own.size>=1.05,
    view+' '+side+' real painted card follows actual raised wrist',own);
   await page.screenshot({path:resolve(dir,view+'-'+side+'-hero-raise.png')});
   await page.waitForTimeout(940);
   const thrown=await read(),m=thrown.hosts.find(x=>x.side===side);
   check(m.posture.cast>.2||m.posture.follow>.2,
    view+' '+side+' dramatic throwing follow-through',m.posture);
  }
  await page.waitForTimeout(800);
  const ready=await read();
  await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R81_HIT_HOST',side:'ai',damage:3},location.origin));
  await page.waitForTimeout(310);
  const hit=await read();
  check(hit.hosts.find(x=>x.side==='ai').posture.recoil>.25,
   view+' AI reacts to actual hit with body recoil',hit.hosts);
  await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R112_VICTORY',winner:'player'},location.origin));
  await page.waitForTimeout(1450);
  const won=await read();
  check(won.hosts.find(x=>x.side==='player').posture.victory>.1,
   view+' female winner actually celebrates',won.hosts);
  check(won.hosts.find(x=>x.side==='ai').posture.defeat>.1,
   view+' male loser actually despairs',won.hosts);
  check(JSON.stringify(idle.board)===JSON.stringify(won.board),
   view+' stage motion never changes cards/hp/rules');
  check(errors.length===0&&won.draw<1300,
   view+' no runtime/network error and GPU within budget',{errors,draw:won.draw});
  await page.screenshot({path:resolve(dir,view+'-hero-win-loss.png')});
  report.states.push({view,baseline,winner:won.hosts.map(x=>({side:x.side,posture:x.posture})),
   draw:won.draw});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r120-duelist-showdown-report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log('R120_HERO_PERFORMANCE',JSON.stringify({passed:report.passed,checks:report.checks.length,
 errors:report.errors,failed:report.checks.filter(x=>!x.passed)}));
if(!report.passed)process.exitCode=1;
