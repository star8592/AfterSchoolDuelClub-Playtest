import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11187';
const out=resolve(import.meta.dirname,'evidence/r125');
mkdirSync(out,{recursive:true});
const results={passed:false,checks:[],errors:[]};
const check=(ok,label,value)=>{
 results.checks.push({passed:!!ok,label,value});
 if(!ok)throw Error(label+': '+String(JSON.stringify(value)).slice(0,1000));
};
const browser=await chromium.launch({headless:true,
 executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [name,width] of [['desktop',1440],['portrait',430]]){
  const p=await browser.newPage({viewport:{width,height:900}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))
   errors.push('HTTP '+r.status()+' '+r.url())});
  await p.goto(origin+'/r45-duel/?qa=1&seed=8&deck=kitchen&r122Crowd=force',
   {waitUntil:'domcontentloaded',timeout:80000});
  await p.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
  const before=await p.evaluate(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {crowd:s.stadiumAmbience?.audience,props:s.bleacherProps,
    audio:window.__r45QA.audio,hp:window.__r45QA.hp,performance:s.renderPerformance};
  });
  check(before.crowd?.loaded===8&&before.crowd.animationMixers===8&&
   before.crowd.supervisorLoaded===true,
   name+' exactly eight existing high-detail 3D actor source rigs and original M01 teacher',before.crowd);
  check(new Set(before.crowd.realModelIds).size===8&&
   before.crowd.realModelIds.includes('M01'),
   name+' unique 8 real GLB sources, not repeated low-poly impostors',before.crowd.realModelIds);
  check(before.props?.mounted===4&&before.audio.teacherClipCount===2&&
   before.audio.propPAVoiceClips===4,
   name+' four persistent objects plus two authentic teacher and four PA voice files',before.audio);
  await p.locator('.card[data-card-id="K01"]:not([disabled])').first().click();
  await p.locator('#play').click();
  await p.waitForFunction(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return s.r122AccidentReceipts>=1&&s.stadiumAmbience?.audience?.supervisorActs===true;
  },null,{timeout:20000});
  const action=await p.evaluate(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {crowd:s.stadiumAmbience?.audience,camera:s.r123Camera,
    hp:window.__r45QA.hp,performance:s.renderPerformance};
  });
  check(action.crowd.supervisorActs&&action.crowd.poses.find(x=>x.id==='M01')?.mode==='supervisor_intervene',
   name+' real 3D music teacher actually steps forward in staged accident',action.crowd);
  check(action.crowd.disciplineSignVisible===true&&action.crowd.disciplineSignFrames>0,
   name+' real 3D safety sign appears beside teacher only on actual accident',action.crowd);
  check(action.crowd.accidentEvents===1&&action.hp.ai===19,
   name+' one authentic game spell hit is distinct from nondamaging teacher and audience',action.hp);
  check((action.performance?.totalDrawCalls||0)<1200,
   name+' 8 cast renderer stays below fixed drawcall warning threshold',action.performance);
  await p.screenshot({path:resolve(out,name+'-eight-actors-music-teacher.png')});
  await p.waitForFunction(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return s.r123Camera?.teacherIntervention===true&&s.r123Camera?.weight>.85;
  },null,{timeout:6000});
  const teacherShot=await p.evaluate(()=>
   document.querySelector('#stadium').contentWindow.__r45SceneQA.r123Camera);
  check(teacherShot.teacherIntervention&&teacherShot.extraRenderPasses===0,
   name+' second actual 3D cutaway frames music teacher without new render pass',teacherShot);
  await p.screenshot({path:resolve(out,name+'-real-M01-teacher-scolds.png')});
  await p.waitForFunction(()=>window.__r45QA.audio.speechHistory.some(x=>
   x.id==='M01'&&x.kind.startsWith('teacher_')&&x.text.length>15),
   null,{timeout:22000});
  const voice=await p.evaluate(()=>window.__r45QA.audio);
  check(voice.teacherVoiceQueued>=1&&voice.speechHistory.some(x=>x.id==='M01'&&
   x.kind==='teacher_order'),
   name+' actual teacher Qwen voice played, with real utterance provenance',voice.speechHistory.slice(-6));
  await p.waitForFunction(()=>window.__r45QA.audio.speechHistory.some(x=>
   x.id==='STADIUM_PA'&&x.kind.startsWith('prop_')),
   null,{timeout:27000});
  const end=await p.evaluate(()=>{
   const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {audio:window.__r45QA.audio,hp:window.__r45QA.hp,
    props:s.bleacherProps,camera:s.r123Camera};
  });
  check(end.props?.active===0&&end.camera?.weight===0,
   name+' no permanent prop scatter, camera and teacher recovery complete',end);
  check(end.audio.speechHistory.some(x=>x.id==='STADIUM_PA'&&x.kind.startsWith('prop_')),
   name+' PA punchline follows teacher instead of cutting off character speech',end.audio.speechHistory.slice(-8));
  check(end.hp.ai===19,name+' legitimate K01 HP remains exactly 19',end.hp);
  check(errors.length===0,name+' zero JS exceptions and missing HTTP assets',errors);
  await p.close();
 }
 results.passed=true;
}catch(e){results.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r125-live-teacher-report.json'),JSON.stringify(results,null,2));
 await browser.close();
}
console.log('R125_REAL_TEACHER_BROWSER',JSON.stringify({
 passed:results.passed,checks:results.checks.length,errors:results.errors
}));
if(!results.passed)process.exitCode=1;
