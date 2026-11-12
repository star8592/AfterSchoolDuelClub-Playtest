import{createRequire}from'node:module';import{mkdirSync,writeFileSync}from'node:fs';import{resolve}from'node:path';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const output=resolve(import.meta.dirname,'evidence/r85');mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const report={ok:false,checks:[],errors:[]};
const post=(payload)=>document.querySelector('#stadium').contentWindow.postMessage(payload,location.origin);
try{
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 page.on('pageerror',e=>report.errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))
  report.errors.push('HTTP '+r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:11025/r45-duel/?seed=1&qa=1',
  {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:110000});
 const read=()=>page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
 const u=(id,uid)=>({id,uid});
 const board={type:'ASDC_R45_BOARD',player:['G03'],ai:['T04'],
  units:{player:[u('G03','U8501')],ai:[u('T04','U8502')]}};
 await page.evaluate(post,board);
 await page.waitForFunction(()=>{
  const s=document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence;
  return s?.total===2&&s.entries.every(x=>x.motion?.artistMorph?.meshes>=8);
 },null,{timeout:28000});
 await page.waitForTimeout(850);
 const idle=await read();
 await page.screenshot({path:resolve(output,'r85-jay-rex-live-idle.png')});
 const snapshot=board.units;
 const combat={type:'ASDC_R51_COMBAT_EVENTS',events:[{
  type:'exchange',side:'player',from:'G03',to:'T04',attacker_uid:'U8501',
  target_uid:'U8502',damage:3,blocked:0,serial:85001,
  target_hp_after:8,attacker_hp_after:8
 }],pre:snapshot,post:snapshot};
 await page.evaluate(post,combat);
 await page.waitForTimeout(360);
 const active=await read();
 await page.screenshot({path:resolve(output,'r85-jay-rex-real-artist-morph-hit.png')});
 await page.waitForTimeout(1500);
 const returned=await read();
 const d=active.entries.find(x=>x.id==='G03'),r=active.entries.find(x=>x.id==='T04');
 const pass=idle.entries.length===2&&
  idle.entries.every(x=>x.motion?.artistMorph?.meshes>=8)&&
  d?.motion?.artistMorph?.mode==='attack'&&
  r?.motion?.artistMorph?.mode==='hit'&&
  d?.motion?.artistMorph?.live[1]>.08&&
  r?.motion?.artistMorph?.live[2]>.08&&
  returned.entries.every(x=>x.motion.artistMorph.mode==='idle');
 report.checks.push({name:'real scene artist rig morph for Jay/Rex and game event',pass,
  idle:idle.entries.map(x=>({id:x.id,file:x.motion?.clip,artMorph:x.motion?.artistMorph})),
  active:active.entries.map(x=>({id:x.id,morph:x.motion?.artistMorph})),
  return:returned.entries.map(x=>({id:x.id,morph:x.motion?.artistMorph}))});
 report.ok=pass&&!report.errors.length;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(output,'r85-real-summons-morph.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R85_REAL_SUMMON_MORPH',JSON.stringify(report));await browser.close();if(!report.ok)process.exitCode=9;}
