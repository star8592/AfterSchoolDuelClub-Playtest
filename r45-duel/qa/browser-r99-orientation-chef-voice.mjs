import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11099';
const dir=resolve(import.meta.dirname,'evidence/r99');mkdirSync(dir,{recursive:true});
const report={origin,passed:false,checks:[],scenes:[],errors:[]};
function ok(valid,name,detail={}){
 report.checks.push({name,pass:!!valid,detail});
 if(!valid)throw Error('R99 CHECK '+name+' '+JSON.stringify(detail).slice(0,450));
}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
async function start(path,width=1440){
 const p=await browser.newPage({viewport:{width,height:900}});
 p.on('pageerror',e=>report.errors.push('JS '+e.message));
 p.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))
  report.errors.push('HTTP '+r.status()+' '+r.url())});
 await p.goto(origin+path,{waitUntil:'domcontentloaded',timeout:80000});
 await p.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:130000});
 return p;
}
try{
 for(const [name,width] of [['desktop',1550],['phone',430]]){
  const p=await start('/r45-duel/?qa=1&seed=6',width);
  const models=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonModels);
  const m02=models.find(x=>x.id==='M02');
  ok(m02?.file==='M02-CafeteriaAunt-ChefHat-Spatula-R99.glb'&&m02.meshes>=12&&m02.clips===10,
   name+' actual skinned cafeteria aunt with chef accessories and 10 real animations',{m02});
  const v=await p.evaluate(()=>{
   const frame=document.querySelector('#stadium').contentWindow;
   frame.postMessage({type:'ASDC_R45_BOARD',player:['M02'],ai:['M02'],
    units:{player:[{uid:'U771',id:'M02',attack:2,hp:4,shield:0}],
      ai:[{uid:'U772',id:'M02',attack:2,hp:4,shield:0}]}},location.origin);
   return window.__r45QA.audio;
  });
  await p.waitForFunction(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence;
   return q?.entries?.filter(x=>x.id==='M02').length===2;
  },null,{timeout:16000});
  await p.waitForTimeout(230);
  const both=await p.evaluate(()=>{
   const f=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return f.summonPresence.entries.filter(x=>x.id==='M02');
  });
  ok(both.length===2&&both.every(x=>x.visible&&x.metrics.frontDot>.60),
   name+' M02 genuinely oriented toward opponent on BOTH teams',{entries:both.map(x=>({side:x.side,front:x.metrics.frontDot,position:x.position}))});
  ok(both.every(x=>x.metrics.height>=1.85&&x.metrics.height<=2.65&&x.meshes>=12),
   name+' chef gear keeps real-scale visible GLB dimensions',{entries:both.map(x=>({side:x.side,height:x.metrics.height,meshes:x.meshes}))});
  ok(v.requested&&v.volume.voice===1&&v.volume.music===.32,
   name+' default voice prioritized above BGM',v.volume);
  await p.screenshot({path:resolve(dir,name+'-chef-hat-spatula-both-sides.png')});
  report.scenes.push({name,width,model:m02.file,actors:both.map(x=>({side:x.side,front:x.metrics.frontDot,height:x.metrics.height})),mix:v.volume});
  await p.close();
 }
 const p=await start('/r45-duel/?qa=1&seed=6',1440);
 await p.locator('#end').click();
 await p.locator('.card[data-card-id="M02"]:not([disabled])').first().click();
 await p.locator('#play').click();
 await p.waitForFunction(()=>{
  const qa=window.__r45QA;
  return qa.board.player[0].some(x=>x.id==='M02')&&
    document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.entries?.some(x=>x.id==='M02'&&x.side==='player');
 },null,{timeout:12000});
 await p.waitForTimeout(1200);
 const audio=await p.evaluate(()=>window.__r45QA.audio);
 ok(audio.voiceClipCount===16&&audio.musicTracks.length===7&&audio.assetsReady,
  'real sound engine and 16 roles / 7 varied BGM tracks available');
 ok(audio.counters.voice>0&&audio.counters.errors===0,
  'actual card gesture produces playable normalized Qwen3 speech without load errors',audio.counters);
 await p.screenshot({path:resolve(dir,'actual-m02-legal-card-play.png')});
 await p.close();
 const legacy=await start('/r45-duel/?qa=1&seed=6&r99Chef=old');
 const prior=await legacy.evaluate(()=>{
  const a=document.querySelector('#stadium').contentWindow.__r45SceneQA.summonModels;
  return a.find(x=>x.id==='M02');
 });
 ok(prior?.file==='M02-CafeteriaAunt-CartoonR76.glb'&&prior.meshes===1,
  'legacy original source GLB remains selectable for rollback',{prior});
 await legacy.close();
 report.passed=report.checks.every(x=>x.pass)&&report.errors.length===0;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(dir,'r99-facing-chef-voice-report.json'),JSON.stringify(report,null,2));
 console.log('R99_FACING_CHEF_VOICE',JSON.stringify({passed:report.passed,checks:report.checks.length,
  errors:report.errors,scenes:report.scenes}));
 await browser.close();
}
if(!report.passed)process.exitCode=6;
