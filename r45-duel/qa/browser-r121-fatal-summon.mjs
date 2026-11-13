/** R121 integration: staged, rule-shaped fatal unit spell / voice playback.
 * The stage message is QA-synthetic, not a claim of actual game damage.
 * The separate real K01 test validates genuine engine authority.
 */
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11171';
const out=resolve(import.meta.dirname,'evidence/r121');
mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[]};
function check(ok,msg,detail){
 report.checks.push({passed:!!ok,msg,detail});
 if(!ok)throw Error(msg+' '+JSON.stringify(detail).slice(0,900));
}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width]of[['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)
   errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=1216',{
   waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady&&
   window.__r45QA?.audio?.assetsReady,null,{timeout:165000});
  const stage=()=>page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{summons:q.summonPresence,retentions:q.r121Retentions,
    spellReactions:q.spellReactions,fx:q.spellContactFX,
    receipts:q.r121ContactReceipts,voices:window.__r45QA.audio.voiceVariantHistory};
  });
  await page.evaluate(()=>{
   const win=document.querySelector('#stadium').contentWindow;
   const ai=[{id:'E02',uid:'U9001',hp:2,attack:3,shield:0}];
   win.postMessage({type:'ASDC_R45_BOARD',player:[],ai:['E02'],
    units:{player:[],ai}},location.origin);
  });
  await page.waitForFunction(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return q.summonPresence.total===1&&q.summonPresence.entries[0]?.id==='E02';
  },null,{timeout:30000});
  const before=await stage();
  check(before.summons.entries[0].kind!=='art-pending',
   view+' real authored summon model present',before.summons.entries[0]);
  await page.evaluate(()=>{
   const win=document.querySelector('#stadium').contentWindow;
   // T06 confuse is a real engine effect dealing 2 to each enemy unit.
   win.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',
    card:'T06',serial:1216001,effect:'confuse',
    damage:2,directDamage:0,targetUids:['U9001']},location.origin);
   win.postMessage({type:'ASDC_R45_BOARD',player:[],ai:[],
    units:{player:[],ai:[]}},location.origin);
  });
  await page.waitForFunction(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return q.r121Retentions.active.includes('ai:U9001');
  },null,{timeout:3000});
  const retained=await stage();
  check(retained.summons.entries.some(x=>x.uid==='U9001'),
   view+' defeated source GLB retained for physical recoil',
   {ret:retained.retentions,entries:retained.summons.entries.map(x=>x.id+':'+x.uid)});
  await page.waitForFunction(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return q.r121ContactReceipts===1&&q.spellReactions>=1&&q.spellContactFX.spawned>=1;
  },null,{timeout:10000});
  const impact=await stage();
  check(impact.spellReactions>=1&&impact.fx.spawned===1,
   view+' real 3D summon flinched with unique elemental contact',
   {reactions:impact.spellReactions,fx:impact.fx});
  const voiceSample=await page.evaluate(()=>window.__r45QA.audioVoiceSample('E02','hurt'));
  check(voiceSample,view+' E02 original Qwen hurt recording accepted',voiceSample);
  await page.waitForFunction(()=>window.__r45QA.audio.voiceVariantHistory.some(
   x=>x.id==='E02'&&x.kind==='hurt'),null,{timeout:6500});
  await page.waitForFunction(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return q.r121Retentions.active.length===0&&q.summonPresence.total===0;
  },null,{timeout:9500});
  const after=await stage();
  check(after.retentions.expiredSpellTargets>=1&&after.fx.ruleMutations===0,
   view+' dead GLB returned cleanly with zero rule mutation',after);
  check(errors.length===0,view+' no JS or missing HTTP assets',errors);
  await page.screenshot({path:resolve(out,'r121-'+view+'-fatal-cleanup.png')});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r121-fatal-summon-qa.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R121_FATAL_SUMMON_QA',JSON.stringify({passed:report.passed,
 checks:report.checks.length,errors:report.errors}));
if(!report.passed)process.exitCode=1;
