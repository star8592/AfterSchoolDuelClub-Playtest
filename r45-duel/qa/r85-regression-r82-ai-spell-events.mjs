import{createRequire}from'node:module';
import{resolve}from'node:path';import{writeFileSync,mkdirSync}from'node:fs';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const base='http://127.0.0.1:11025/r45-duel/',out=resolve(import.meta.dirname,'evidence/r85');
mkdirSync(out,{recursive:true});const result={ok:false,errors:[],cases:[]};
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
const p=await b.newPage({viewport:{width:1500,height:900}});p.on('pageerror',e=>result.errors.push(String(e)));
p.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))result.errors.push('HTTP '+r.status()+' '+r.url())});
await p.goto(base+'?seed=8&qa=1',{waitUntil:'domcontentloaded',timeout:42000});
await p.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:100000});
const before=await p.evaluate(()=>{
 const q=document.querySelector('#stadium').contentWindow.__r45SceneQA,g=window.__r45QA;
 return{hp:g.hp,spell:q.spellImpact,hostDamage:q.hostDamage};
});
await p.locator('#end').click();await p.waitForTimeout(550);
const after=await p.evaluate(()=>{
 const q=document.querySelector('#stadium').contentWindow.__r45SceneQA,g=window.__r45QA;
 return{hp:g.hp,spell:q.spellImpact,hostDamage:q.hostDamage,events:g.events,
  score:q.liveScoreboard.data,hostAction:q.hostActions};
});
const evt=after.events.find(e=>e.type==='card_play'&&e.side==='ai'&&e.card==='G05');
const pass=evt?.spellOutcome?.directDamage===0&&evt.spellOutcome.unitDamage===0&&
 after.spell.played>=1&&after.spell.noHit>=1&&after.spell.activeKinds.includes('repair')&&
 after.hp.player===before.hp.player&&
 after.hostDamage.player.started<0&&result.errors.length===0;
result.cases.push({name:'AI event G05, real zero-damage visual, no fake hit',pass,
 outcome:evt?.spellOutcome,spell:after.spell,hp:after.hp,hostDamage:after.hostDamage,
 score:after.score,hostAction:after.hostAction.ai});
await p.screenshot({path:resolve(out,'r82-ai-spell-no-fake-hit.png')});
await p.close();
result.ok=result.cases.every(x=>x.pass)&&result.errors.length===0;
}catch(e){result.errors.push(String(e))}
finally{writeFileSync(resolve(out,'r82-ai-spell-qacheck.json'),JSON.stringify(result,null,2)+'\n');
console.log('R82_AI_EVENT',JSON.stringify(result));await b.close();if(!result.ok)process.exitCode=4;}
