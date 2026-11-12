import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11095';
const output=resolve(import.meta.dirname,'evidence/r95');mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
  '--disable-software-rasterizer','--disable-dev-shm-usage']});
const report={origin,passed:false,checks:[],realSpells:{},errors:[],results:[]};
const ok=(condition,name,data={})=>{
 report.checks.push({name,pass:!!condition,...data});
 if(!condition)throw Error('CHECK FAILED: '+name+' '+JSON.stringify(data).slice(0,350));
};
const spellCards=new Set(['E05','E06','G05','G06','T05','T06']);
async function run(seed,width=1440){
 const page=await browser.newPage({viewport:{width,height:900}});
 page.on('pageerror',e=>report.errors.push('JS: '+e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))
   report.errors.push('HTTP '+r.status()+': '+r.url())});
 await page.goto(origin+'/r45-duel/?qa=1&seed='+seed,{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,{},{timeout:140000});
 const begin=await page.evaluate(()=>{
  const qa=window.__r45QA,sc=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return{score:sc.scoreboard,spells:sc.spellImpact,models:sc.summonModels.length, hp:qa.hp};
 });
 ok(begin.models===12,'scene still contains 12 source GLBs',begin);
 if(seed===2){
  // Front physical LED must not block the rear spectator orbit.
  for(let i=0;i<3;i++)await page.locator('#camera-right').click();
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.scoreboard?.visible===false,
    null,{timeout:9000});
  ok(true,'jumbotron hides safely behind 135-degree spectator camera');
  await page.locator('#camera-reset').click();
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.scoreboard?.visible===true,
    null,{timeout:9000});
  ok(true,'jumbotron returns at front-facing spectator angle');
 }

 ok(begin.score?.physical===true&&begin.score?.data?.player===20&&
    begin.score?.data?.ai===20&&begin.spells?.played===0,
   'real 3D scoreboard initialized from authoritative 20/20 engine',begin);
 const found=new Set();
 let steps=0,eventsProcessed=0;
 while(steps<250&&found.size<6){
  const result=await page.evaluate(()=>{
   const qa=window.__r45QA;
   if(qa.phase==='ended')return{end:true,phase:qa.phase};
   const cards=[...document.querySelectorAll('.card:not([disabled])')];
   // Prefer a spell to exercise impact effect messages while still using
   // the actual game card, the button and authoritative engine rules.
   const spells=cards.filter(el=>['E05','E06','G05','G06','T05','T06'].includes(el.dataset.cardId));
   const el=spells[0]||cards[0];
   if(!el){
    document.querySelector('#end').click();
    return{end:false,kind:'turn',hp:qa.hp};
   }
   const id=el.dataset.cardId;
   el.click();
   const btn=document.querySelector('#play');
   if(btn.disabled)throw Error('Legal card click did not enable Play');
   btn.click();
   const event=qa.events.findLast(e=>e.type==='card_play'&&e.side==='player'&&e.card===id);
   return{end:false,kind:'card',id,serial:event?.serial,spell:event?.spellOutcome,hp:qa.hp,round:qa.round};
  });
  steps++;
  if(result.end)break;
  if(result.kind==='card'&&spellCards.has(result.id)){
   const detail=result;
   await page.waitForFunction(serial=>{
    const sc=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return sc?.spellImpact?.played>0&&sc.spellImpact.activeKinds.length>0||
      (sc?.spellImpact?.played>0&&sc.spellImpact.expired>0);
   },detail.serial,{timeout:10000});
   await page.waitForTimeout(60);
   const actual=await page.evaluate(()=>{
    const sc=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{score:sc.scoreboard,spells:sc.spellImpact,
      reactions:sc.summonPresence?.entries?.length||0,
      realUnitHits:sc.spellReactions,hostHits:sc.actualHostHits,
      gameHp:window.__r45QA.hp};
   });
   ok(actual.score.data.player===actual.gameHp.player &&
      actual.score.data.ai===actual.gameHp.ai,
      '3D arena score equals rule-engine HP after '+result.id,{detail,actual});
   found.add(result.id);
   report.realSpells[result.id]={seed,steps,detail,sc:actual};
   eventsProcessed++;
   if(found.size>=4)break;
  }
 }
 report.results.push({seed,steps,spells:[...found],eventsProcessed});
 await page.screenshot({path:resolve(output,'seed-'+seed+'-end.png')});
 await page.close();
}
try{
 await run(2,1440);
 await run(1,430);
 await run(4,1440);
 ok(spellCards.size===Object.keys(report.realSpells).length,
  'six genuinely played unique spell cards drive 3D animation',
  {ids:Object.keys(report.realSpells)});
 ok(Object.values(report.realSpells).some(x=>x.detail.spell?.directDamage>0),
  'at least one spell delivered actual player/AI HP damage');
 ok(Object.values(report.realSpells).some(x=>x.detail.spell?.targetUids?.length),
  'at least one spell damaged an existing summoned unit');
 ok(Object.values(report.realSpells).some(x=>x.detail.spell?.directDamage===0&&
   x.detail.spell?.unitDamage===0),
  'non-damaging spells never fabricate game HP changes');
 report.passed=report.errors.length===0;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(output,'r95-real-browser-report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,
  errors:report.errors,spells:Object.keys(report.realSpells),results:report.results},null,2));
 await browser.close();
}
if(!report.passed)process.exit(5);
