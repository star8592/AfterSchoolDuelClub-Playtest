import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11004';
const dest=resolve(import.meta.dirname,'evidence/r74');mkdirSync(dest,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const out=[];
try{
 for(const [viewport,width,height] of [['desktop',1600,900],['portrait',430,900]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:50000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:75000});
  const f=()=>page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.framing);
  const standers=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.duelistHosts);
  console.log('R74_INITIAL_DUELISTS',JSON.stringify(standers));
  if(standers.length!==2||standers.some(x=>!x.visible||x.bones<100||x.skins<60||Math.abs(x.x)<5))throw Error('Both real human duelists must be visible at match start');
  for(const angle of [0,-45,45,90,180]){
   await page.evaluate(angle=>document.querySelector('#stadium').contentWindow.postMessage({type:'ASDC_R48_CAMERA_SET',degrees:angle},location.origin),angle);
   await page.waitForTimeout(850);
   let frame=await f();
   const compass=Math.abs(frame.yaw-angle)<1.4;
   const low=frame.composition.cameraY<=2.45&&frame.composition.cameraY>=1.2;
   const level=Math.abs(frame.composition.pitchDegrees)<=7.55;
   const nearFloor=frame.composition.ring[1]>-1.1&&frame.composition.ring[1]<1.1;
   const noDrone=frame.composition.viewMode==='sideline-eye-level'&&!frame.composition.roofTrussOcclusionRisk;
   const podiums=Object.values(frame.podiums);
   const duelistsFramed=podiums.every(p=>p.front&&Math.abs(p.x)<.94&&Math.abs(p.y)<.88);
   const pass=compass&&low&&level&&nearFloor&&noDrone&&duelistsFramed&&!errors.length;
   await page.screenshot({path:resolve(dest,`${viewport}-angle-${angle}.png`)});
   const row={viewport,angle,pass,frame,errors};out.push(row);
   console.log('R74_SIDELINE_CAMERA',JSON.stringify({viewport,angle,pass,
     cameraY:frame.composition.cameraY,pitchDegrees:frame.composition.pitchDegrees,
     ring:frame.composition.ring,lookAt:frame.composition.lookAt,
     stageFloor:frame.composition.stageFloor,errors}));
  }
  // Distinguish permanent duelists from the E01/G01 copies summoned as cards.
  await page.evaluate(()=>{
   const f=document.querySelector('#stadium').contentWindow;
   f.postMessage({type:'ASDC_R45_BOARD',player:['E01'],ai:['G01'],units:{
    player:[{id:'E01',uid:'U7401',hp:3,attack:2,shield:0}],
    ai:[{id:'G01',uid:'U7402',hp:3,attack:2,shield:0}] }},location.origin);
  });
  await page.waitForFunction(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return q.summonPresence?.total===2;
  },null,{timeout:16000});
  const hostsAndSummons=await page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{hosts:q.duelistHosts,summons:q.summonPresence.entries.filter(x=>['E01','G01'].includes(x.id))};
  });
  const independent=hostsAndSummons.hosts.length===2&&hostsAndSummons.hosts.every(x=>x.visible)&&
   hostsAndSummons.summons.length===2&&hostsAndSummons.summons.every(x=>x.visible);
  console.log('R74_PERMANENT_DUELISTS_UNAFFECTED_BY_SUMMON',JSON.stringify({viewport,pass:independent,
   hosts:hostsAndSummons.hosts,summons:hostsAndSummons.summons.map(x=>({id:x.id,side:x.side,visible:x.visible}))}));
  if(!independent)throw Error('Duelist platform and summon identities must be independent');
  await page.close();
 }
}finally{writeFileSync(resolve(dest,'sideline-camera.json'),JSON.stringify(out,null,2)+'\n');await browser.close()}
if(out.length!==10||out.some(x=>!x.pass))process.exitCode=3;
