/** GPU browser checks for paper-plane motion + authored GLB clip transitions. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10994';
const out=resolve(import.meta.dirname,'evidence/r64');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer','--disable-dev-shm-usage']});
const reports=[];
try{
 for(const [view,width,height] of [['wide',1600,900],['portrait',430,900]]){
  const page=await browser.newPage({viewport:{width,height}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(/CONTEXT_LOST_WEBGL|WebGLRenderer: Context Lost/.test(m.text()))errors.push('Context lost')});
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:70000});
  const samplesPromise=page.evaluate(async()=>{
   const f=document.querySelector('#stadium').contentWindow;
   const pre={player:[{id:'E02',uid:'U101',hp:5,attack:2,shield:0},{id:'G02',uid:'U102',hp:6,attack:2,shield:0}],
     ai:[{id:'E02',uid:'U201',hp:5,attack:2,shield:0},{id:'G02',uid:'U202',hp:6,attack:2,shield:0}]};
   const post=structuredClone(pre);
   f.postMessage({type:'ASDC_R45_BOARD',player:pre.player.map(x=>x.id),ai:pre.ai.map(x=>x.id),units:pre},location.origin);
   await new Promise(r=>setTimeout(r,180));
   const events=[
    {type:'exchange',side:'player',from:'E02',to:'E02',attacker_uid:'U101',target_uid:'U201',damage:1,serial:9101},
    {type:'exchange',side:'ai',from:'G02',to:'G02',attacker_uid:'U202',target_uid:'U102',damage:1,serial:9102},
    {type:'exchange',side:'player',from:'G02',to:'G02',attacker_uid:'U102',target_uid:'U202',damage:1,serial:9103}];
   f.postMessage({type:'ASDC_R51_COMBAT_EVENTS',events,pre,post},location.origin);
   const samples=[];
   for(let k=0;k<53;k++){
    await new Promise(r=>setTimeout(r,75));
    const s=f.__r45SceneQA?.summonPresence;
    const combat=f.__r45SceneQA?.combatEvents;
    if(!s)continue;
    samples.push({k,active:combat?.active,index:combat?.index,
     units:s.entries.filter(e=>e.id==='E02'||e.id==='G02').map(e=>({
      id:e.id,side:e.side,x:e.position[0],front:e.metrics.frontDot,withinFrame:e.metrics.withinFrame,motion:e.motion
     }))});
   }
   return samples;
  });
  await page.waitForTimeout(540);
  await page.screenshot({path:resolve(out,view+'-strike.png')});
  const samples=await samplesPromise;
  const p0=samples.flatMap(s=>s.units.filter(u=>u.id==='E02'&&u.side==='player'&&s.index===0));
  const a02=samples.flatMap(s=>s.units.filter(u=>u.id==='E02'&&u.side==='ai'&&s.index===0));
  const g=samples.flatMap(s=>s.units.filter(u=>u.id==='G02'));
  const ended=samples.at(-1)?.active===false;
  const arcs=p0.some(x=>x.motion?.pitch<-.07&&x.motion?.lift>.52);
  const recoil=a02.some(x=>x.motion?.pitch>.05);
  const crossfades=g.some(x=>x.motion?.crossfades>=2);
  const sourceClips=g.some(x=>['Attack','Hit'].includes(x.motion?.clip));
  const facing=samples.flatMap(s=>s.units).every(u=>u.front>=.97);
  const frame=samples.flatMap(s=>s.units).every(u=>u.withinFrame===true);
  const idleE02=samples.at(-1)?.units.filter(u=>u.id==='E02').every(u=>Math.abs(u.motion?.pitch)<.06&&Math.abs(u.motion?.bank)<.06);
  const fadedClipsClean=samples.at(-1)?.units.filter(u=>u.id==='G02').every(u=>u.motion?.fadingClips===0);
  const pass=ended&&arcs&&recoil&&crossfades&&sourceClips&&facing&&frame&&idleE02&&fadedClipsClean&&!errors.length;
  reports.push({view,pass,ended,arcs,recoil,crossfades,sourceClips,facing,frame,idleE02,fadedClipsClean,errors,
   sampleCount:samples.length,maxG02Crossfades:Math.max(...g.map(x=>x.motion?.crossfades||0)),
   paperAttackPitchMin:Math.min(...p0.map(x=>x.motion?.pitch||0)),
   paperTargetPitchMax:Math.max(...a02.map(x=>x.motion?.pitch||0))});
  console.log('R64_MOTION_BROWSER',JSON.stringify(reports.at(-1)));
  await page.screenshot({path:resolve(out,view+'-final.png')});
  await page.close();
 }
}finally{writeFileSync(resolve(out,'results.json'),JSON.stringify(reports,null,2)+'\n');await browser.close()}
if(reports.length!==2||reports.some(r=>!r.pass))process.exitCode=2;
