import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11173';
const out=resolve(import.meta.dirname,'evidence/r123');
mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[],performance:[]};
function check(pass,name,detail){
 report.checks.push({pass:!!pass,name,detail});
 if(!pass)throw Error(name+' '+JSON.stringify(detail).slice(0,850));
}
const browser=await chromium.launch({headless:true,
 executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']
});
try{
 for(const [name,width] of [['desktop',1440],['portrait',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))
   errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=8&deck=kitchen&r122Crowd=force',
   {waitUntil:'domcontentloaded',timeout:70000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
  const initial=await page.evaluate(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {props:s.bleacherProps,crowd:s.stadiumAmbience?.audience,
    audio:window.__r45QA.audio,drawCalls:s.drawCalls};
  });
  check(initial.props?.mounted===4&&
   JSON.stringify(initial.props.types)===JSON.stringify(['popcorn','juice','homework','backpack']),
   name+' four props visible at real seated students before any accident',initial.props);
  check(initial.crowd.animationMixers===4&&
   initial.crowd.boneDrivenActors+initial.crowd.authoredPoseFallbackActors===4,
   name+' real audience GLB skeletal/morph rig truth instead of invented FK joints',initial.crowd);
  check(initial.props.accidents===0&&initial.props.ruleMutations===0,
   name+' no conjured mishap on opening',initial.props);
  check(initial.audio.propPAVoiceClips===4,name+' four original announcer voices preloaded',initial.audio.propPAVoiceClips);
  await page.locator('.card[data-card-id="K01"]:not([disabled])').first().click();
  await page.locator('#play').click();
  await page.waitForFunction(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return s.bleacherProps?.accidents>=1&&s.bleacherProps?.scatterFrames>=2&&
    s.r122AccidentReceipts>=1;
  },null,{timeout:17000});
  await page.waitForFunction(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return s.r123Camera?.weight>.91;
  },null,{timeout:7000});
  const action=await page.evaluate(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {props:s.bleacherProps,crowd:s.stadiumAmbience?.audience,
    drawCalls:s.drawCalls,hp:window.__r45QA.hp,camera:s.r123Camera};
  });
  check(action.props.accidents===1&&action.props.scatterFrames>=2,
   name+' persistent student prop actually spills into animated instanced 3D scatter',action.props);
  check(action.props.active===1&&action.props.scatterInstances.some(n=>n>0),
   name+' 3D scatter visible while real crowd performs staged reaction',action.props);
  check(action.camera?.cuts===1&&action.camera?.weight>.91&&action.camera?.extraRenderPasses===0,
   name+' cinematic closeup shows real spectator instead of tiny invisible stand, no second pass',action.camera);
  check(action.crowd.poses.some(p=>p.mode==='accident_target'&&p.weight>.05),
   name+' observed actual targeted full-body acting rather than static puppet',action.crowd.poses);
  check(action.crowd.active?.type==='accident'&&action.crowd.accidentEvents===1,
   name+' audience reacts in three physically timed seating waves',action.crowd.active);
  await page.screenshot({path:resolve(out,name+'-R123-punchline-props.png')});
  await page.waitForFunction(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return s.bleacherProps?.returns>=1;
  },null,{timeout:13000});
  await page.waitForFunction(()=>{
   const a=window.__r45QA.audio;
   return a.propPAPlays>=1&&a.speechHistory.some(x=>x.id==='STADIUM_PA'&&
    x.kind.startsWith('prop_')&&typeof x.text==='string');
  },null,{timeout:25000});
  const after=await page.evaluate(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {props:s.bleacherProps,audio:window.__r45QA.audio,
    hp:window.__r45QA.hp,drawCalls:s.drawCalls,camera:s.r123Camera,
    spell:window.__r45QA.events.filter(e=>e.type==='card_play'&&e.card==='K01').at(-1)};
  });
  check(after.hp.ai===19&&after.spell?.spellOutcome.directDamage===1,
   name+' original card applies exactly one HP, no bystander damage',after.hp);
  check(after.camera?.weight===0&&after.camera?.cuts===1,
   name+' natural two-duelist camera restored after spectator reaction shot',after.camera);
  check(after.props.active===0&&after.props.returns===1&&
    after.props.scatterInstances.every(n=>n===0),
   name+' prop and particles recover cleanly instead of staying in wrong pose',after.props);
  check(after.audio.speechHistory.some(x=>x.id==='STADIUM_PA'&&x.kind.startsWith('prop_')),
   name+' real queued Qwen stadium punchline successfully spoken',after.audio.speechHistory.slice(-4));
  check(errors.length===0,name+' no JS or HTTP asset failures',errors);
  report.performance.push({viewport:name,drawCallsInitial:initial.drawCalls,
   drawCallsDuring:action.drawCalls,drawCallsAfter:after.drawCalls});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r123-real-prop-and-pa-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R123_REAL_BLEACHER_BROWSER',JSON.stringify({
 passed:report.passed,checks:report.checks.length,
 performance:report.performance,errors:report.errors}));
if(!report.passed)process.exitCode=1;
