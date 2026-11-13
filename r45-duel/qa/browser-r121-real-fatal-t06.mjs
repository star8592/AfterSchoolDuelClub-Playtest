/** R121 rule-authoritative lethal summon contact — no fake stage event. */
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11171';
const out=resolve(import.meta.dirname,'evidence/r121');mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[],events:[]};
function check(ok,msg,data){report.checks.push({passed:!!ok,msg,data});
 if(!ok)throw Error(msg+' '+JSON.stringify(data).slice(0,800))}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=15&deck=classic',
   {waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true&&
   window.__r45QA?.audio?.assetsReady===true,null,{timeout:170000});
  await page.locator('#end').click();
  await page.waitForFunction(()=>window.__r45QA?.round===2&&
   window.__r45QA?.board?.ai?.[0]?.some(u=>u.id==='E02')&&
   window.__r45QA?.hand?.includes('T06'),null,{timeout:18000});
  const before=await page.evaluate(()=>({hp:window.__r45QA.hp,
    ai:window.__r45QA.board.ai[0],energy:window.__r45QA.energy.player,
    hand:window.__r45QA.hand}));
  check(before.ai[0].id==='E02'&&before.ai[0].hp===2&&before.energy===3,
    view+' seed-15 true enemy at two HP',before);
  await page.locator('.card[data-card-id="T06"]:not([disabled])').first().click();
  await page.locator('#play').click();
  await page.waitForFunction(()=>window.__r45QA?.events?.some(e=>
   e.type==='card_play'&&e.card==='T06'&&e.side==='player'),null,{timeout:14000});
  const outcome=await page.evaluate(()=>({
   rule:window.__r45QA.events.findLast(e=>e.type==='card_play'&&e.card==='T06'),
   board:window.__r45QA.board.ai[0],hp:window.__r45QA.hp}));
  check(outcome.rule.spellOutcome.unitDamage===2&&
   outcome.rule.spellOutcome.targetUids.includes('U3')&&
   outcome.rule.spellOutcome.directDamage===0&&outcome.board.length===0,
   view+' real engine removed source E02 and dealt exactly 2 unit damage',outcome);
  report.events.push({view,rule:outcome.rule});
  await page.waitForFunction(()=>{
   const q=document.querySelector('#stadium').contentWindow?.__r45SceneQA;
   return q?.r121ContactReceipts>=1&&q?.spellContactFX?.spawned>=1&&
    q?.spellReactions>=1;
  },null,{timeout:12000});
  const impact=await page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {ret:q.r121Retentions,fx:q.spellContactFX,
    reactions:q.spellReactions,voices:window.__r45QA.audio.voiceVariantHistory};
  });
  check(impact.ret.reservedSpellTargets>=1&&impact.reactions>=1&&
   impact.fx.ruleMutations===0,view+' actual defeated GLB retained, flinched and emitted FX',impact);
  await page.waitForFunction(()=>window.__r45QA.audio.voiceVariantHistory.some(
   x=>x.id==='E02'&&x.kind==='hurt'),null,{timeout:15000});
  const audio=await page.evaluate(()=>window.__r45QA.audio);
  check(audio.voiceVariantHistory.some(x=>x.id==='E02'&&x.kind==='hurt'),
    view+' character-specific Qwen voice triggered by actual contact',audio.voiceVariantHistory);
  await page.waitForFunction(()=>{
   const q=document.querySelector('#stadium').contentWindow?.__r45SceneQA;
   return q?.r121Retentions.active.length===0&&q?.summonPresence.total===0;
  },null,{timeout:9000});
  check(errors.length===0,view+' no JS/asset HTTP error',errors);
  await page.screenshot({path:resolve(out,'r121-'+view+'-actual-fatal-T06.png')});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r121-actual-fatal-qa.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R121_ACTUAL_RULE_FATAL_QA',JSON.stringify({passed:report.passed,
 checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
