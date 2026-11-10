import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const BASE=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10979';
const dir=resolve(import.meta.dirname,'evidence/r51');
mkdirSync(dir,{recursive:true});
const reports=[];
let browser,failed=false;
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
 for(const [name,w,h,seed,card] of [
  ['wide-e02',1920,1080,1,'E02'],
  ['portrait-e02',430,900,1,'E02'],
  ['wide-g02',1920,1080,4,'G02'],
  ['standard-e02',1366,768,4,'E02']]){
  const p=await browser.newPage({viewport:{width:w,height:h}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const res=await p.goto(BASE+'/r45-duel/?seed='+seed+'&qa=1',{waitUntil:'domcontentloaded',timeout:40000});
  await p.waitForFunction('window.__r45QA?.sceneReady',null,{timeout:65000});
  await p.locator('#hand .card[data-card-id="'+card+'"]').click();
  await p.locator('#play').click();
  await p.waitForFunction(id=>window.__r45QA.board.player[0].some(x=>x.id===id),card,{timeout:6000});
  await p.locator('#end').click();
  await p.waitForFunction('window.__r45QA.round===2',null,{timeout:17000});
  await p.locator('#end').click();
  await p.waitForFunction(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return q?.combatEvents?.active&&q.combatEvents.playedEvents>=1;
  },null,{timeout:23000});
  await p.waitForTimeout(400);
  const during=await p.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{combat:q.combatEvents,presence:q.summonPresence,events:__r45QA.events.filter(x=>x.type==='exchange'||x.type==='direct_hit')};
  });
  await p.screenshot({path:resolve(dir,name+'-strike.png')});
  await p.waitForFunction(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return !q.combatEvents.active&&q.combatEvents.finishedSequences>=1;
  },null,{timeout:22000});
  const after=await p.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{combat:q.combatEvents,presence:q.summonPresence,
    ruleUnits:{player:__r45QA.board.player[0].map(x=>x.uid),ai:__r45QA.board.ai[0].map(x=>x.uid)}};
  });
  const actual=[...after.ruleUnits.player,...after.ruleUnits.ai].sort();
  const visual=after.presence.entries.map(x=>x.uid).sort();
  const nonSpecial=during.events.some(x=>(x.from===card)&&['exchange','direct_hit'].includes(x.type));
  const pass=res.status()===200&&nonSpecial&&during.combat.active&&
   during.combat.playedEvents>0&&after.combat.finishedSequences>=1&&
   JSON.stringify(actual)===JSON.stringify(visual)&&!errors.length;
  reports.push({name,pass,during,after,errors});
  console.log('R51_REAL_COMBAT_GATE',JSON.stringify({name,pass,combat:during.combat,after:after.combat,
   events:during.events.slice(-3).map(x=>({from:x.from,to:x.to,type:x.type,attacker_uid:x.attacker_uid,target_uid:x.target_uid,damage:x.damage})),
   actual,visual,errors}));
  if(!pass)failed=true;
  await p.close();
 }
}catch(e){console.error('R51_COMBAT_FAILED',String(e));failed=true}
finally{writeFileSync(resolve(dir,'results.json'),JSON.stringify(reports,null,2)+'\n');await browser?.close().catch(()=>{})}
if(failed)process.exitCode=3;
