import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11120';
const out=resolve(import.meta.dirname,'evidence/r116-life');mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[],details:[]};
const check=(ok,label,data)=>{
 report.checks.push({passed:!!ok,label,data});
 if(!ok)throw Error(label+': '+JSON.stringify(data).slice(0,600));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push('JS:'+e.message));
  page.on('response',r=>{
   if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP:'+r.status()+':'+r.url());
  });
  await page.goto(origin+'/r45-duel/?qa=1&seed=116',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:170000});
  const get=()=>page.evaluate(()=>{
   const qa=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {life:qa.arenaLife,units:qa.summonPresence,hosts:qa.livingCast,
    spectator:qa.stadiumAmbience.audience,gameBoard:window.__r45QA.board,
    drawCalls:qa.drawCalls};
  });
  const ready=await get();
  check(ready.life.size===6,view+' 2 duelists and 4 spectators live independently',ready.life.actors);
  check(new Set(ready.life.actors.map(a=>a.personality)).size>=4,
   view+' personalities are truly separate',ready.life.actors);
  check(ready.spectator.loaded===4,view+' real spectators reused',ready.spectator);
  const units={player:[
   {uid:'U300',id:'M02',hp:4,attack:3,shield:0},
   {uid:'U301',id:'E03',hp:4,attack:3,shield:0}],
   ai:[{uid:'U400',id:'G02',hp:4,attack:3,shield:0}]};
  await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage(
    {type:'ASDC_R45_BOARD',units:u,player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id)},location.origin),units);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.arenaLife.size===9,
   null,{timeout:20000});
  const before=await get();
  check(before.life.actors.some(x=>x.id==='M02'&&x.role==='summon')&&
   before.life.actors.some(x=>x.id==='G02'&&x.role==='summon'),
   view+' player-specific summoned character profiles',before.life.actors);
  await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R46_CARD_PLAY',side:'player',id:'M02',kind:'unit',serial:987610},location.origin));
  await page.waitForTimeout(340);
  const card=await get();
  const folks=card.life.actors;
  check(card.life.events.some(x=>x.type==='card'&&x.side==='player'),
   view+' real scene card event changes attention',card.life.events);
  check(folks.filter(x=>x.side==='player').some(x=>x.emotion==='expectant')&&
   folks.filter(x=>x.side==='ai').some(x=>x.emotion==='curious'||x.emotion==='nervous'),
   view+' allies and opponents interpret same card differently',folks);
  check(card.units.r116LifeStates.some(x=>x.id==='M02'&&x.life?.attention==='opponent')&&
   card.units.r116LifeStates.some(x=>x.id==='G02'&&x.life?.emotion!=='expectant'),
   view+' summons have own scene-wide awareness',card.units.r116LifeStates);
  check(JSON.stringify(before.gameBoard)===JSON.stringify(card.gameBoard),
   view+' director never mutates card rules or HP',null);
  await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage(
    {type:'ASDC_R81_HIT_HOST',side:'ai',damage:3},location.origin));
  await page.waitForTimeout(450);
  const hit=await get();
  check(hit.life.actors.some(x=>x.role==='duelist'&&x.side==='ai'&&x.emotion==='hurt'),
   view+' opponent remembers being hit',hit.life.actors);
  check(hit.life.actors.some(x=>x.id==='M02'&&x.emotion!=='hurt'),
   view+' chef responds as ally, not identical clone',hit.life.actors);
  await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage(
    {type:'ASDC_R112_VICTORY',winner:'player'},location.origin));
  await page.waitForTimeout(1400);
  const result=await get();
  check(result.life.result==='player'&&
    result.life.actors.filter(x=>x.side==='player').every(x=>x.emotion==='elated')&&
    result.life.actors.filter(x=>x.side==='ai').every(x=>x.emotion==='disappointed'),
    view+' everyone responds to a common outcome according to team',result.life.actors);
  check(result.spectator.poses.some(x=>x.team==='player'&&x.mode==='cheer')&&
    result.spectator.poses.some(x=>x.team==='ai'&&x.mode==='sympathy'),
    view+' spectators take part in shared victory',result.spectator.poses);
  check(result.drawCalls<1200&&result.units.total===3,
   view+' no extra replacement models / drawcall blowup',result.drawCalls);
  check(errors.length===0,view+' zero scene or asset errors',errors);
  await page.screenshot({path:resolve(out,view+'-life-victory.png')});
  report.details.push({view,actors:result.life.size,lastEvents:result.life.events.slice(-3),
   spectator:result.spectator.poses,drawCalls:result.drawCalls});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r116-living-arena-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R116_LIFE_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,
 errors:report.errors,failed:report.checks.filter(x=>!x.passed)}));
if(!report.passed)process.exitCode=1;
