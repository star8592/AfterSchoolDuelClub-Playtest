import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {writeFileSync,mkdirSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.ASDC_QA_ORIGIN||process.env.R67_ORIGIN||'http://127.0.0.1:11085';
const dir=resolve(import.meta.dirname,'evidence/r67');mkdirSync(dir,{recursive:true});
let browser,failed=false;const rows=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
 for(const [device,width,height] of [['desktop',1440,900],['portrait',430,900]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const resp=await page.goto(origin+'/r45-duel/?seed=1&qa=1&t02Study=duo',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:90000});
  const units={player:[{id:'T02',uid:'U100',hp:5,attack:1,shield:0}],
    ai:[{id:'T02',uid:'U200',hp:5,attack:1,shield:0}]};
  await page.evaluate(units=>{
   document.querySelector('#stadium').contentWindow.postMessage(
    {type:'ASDC_R45_BOARD',player:['T02'],ai:['T02'],units},location.origin);
  },units);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.total===2,null,{timeout:17000});
  await page.evaluate(units=>{
   document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R51_COMBAT_EVENTS',pre:units,
    post:{player:[{...units.player[0],hp:4}],ai:[{...units.ai[0],hp:4}]},
    events:[{serial:123,type:'exchange',side:'player',from:'T02',to:'T02',
      attacker_uid:'U100',target_uid:'U200',damage:1,target_hp_after:4,attacker_hp_after:4}]
   },location.origin);
  },units);
  // R90/R145: an attack starts immediately, but the original defender
  // reacts only at the AUTHENTIC hit moment, not 190ms into the windup.
  // A guard here prevents the old R67 false failure without weakening
  // animation, damage or human-facing source-model validation.
  await page.waitForFunction(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return q.combatEvents?.impactStarted===true&&
     q.combatEvents?.r90ImpactTriggers>=1;
  },null,{timeout:4000,polling:'raf'});
  const state=await page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {entries:q.summonPresence.entries.map(x=>({side:x.side,clips:x.playingClips})),combat:q.combatEvents};
  });
  await page.screenshot({path:resolve(dir,'combat-'+device+'.png')});
  const attacking=state.entries.find(x=>x.side==='player')?.clips||[];
  const defending=state.entries.find(x=>x.side==='ai')?.clips||[];
  const passed=resp.status()===200&&state.combat.active&&
   state.combat.playedEvents>=1&&state.combat.impactStarted===true&&
   state.combat.r90ImpactTriggers>=1&&
   attacking.includes('Serve_Menu')&&attacking.includes('Attack_Flip_Menu')&&
   defending.includes('Hit_Recoil')&&defending.includes('Hit_Retreat')&&errors.length===0;
  rows.push({device,passed,attacking,defending,combat:state.combat,errors});
  console.log('R67_DUO_GAME_COMBAT_CLIPS',JSON.stringify(rows.at(-1)));
  if(!passed)failed=true;await page.close();
 }
}catch(e){failed=true;console.error('R67_DUO_COMBAT_ERROR',String(e));}
finally{writeFileSync(resolve(dir,'combat-results.json'),JSON.stringify(rows,null,2)+'\n');await browser?.close().catch(()=>{});}
if(failed)process.exitCode=3;
