/** Inspect source GLB versus real skeleton IK, actual Chromium GPU screenshots. */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10999';
const dir=resolve(import.meta.dirname,'evidence/r69');mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer']});
const records=[];
try{
 for(const [view,width,height] of [['wide',1440,850],['portrait',430,850]])for(const mode of ['idle','conduct'])for(const angle of [0,45,90,180]){
  const p=await browser.newPage({viewport:{width,height}}),errors=[];
  p.on('pageerror',err=>errors.push(String(err)));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await p.goto(`${origin}/r45-duel/qa/r69-music-teacher-studio.html?angle=${angle}&mode=${mode}`,{waitUntil:'domcontentloaded',timeout:45000});
  await p.waitForFunction(()=>window.__R69_MUSIC_TEACHER?.ready,null,{timeout:70000});
  await p.waitForTimeout(350);
  const q=await p.evaluate(()=>window.__R69_MUSIC_TEACHER);
  const shot=await p.screenshot({path:resolve(dir,`music-teacher-${view}-${mode}-${angle}.png`)});
  const maxError=Math.max(...Object.values(q.pose).map(x=>x.error));
  const elbows=Object.values(q.pose).map(x=>x.bend);
  const pass=q.models===2&&q.clipNames.includes('Idle')&&Object.keys(q.pose).length===2&&maxError<.09&&
   elbows.every(x=>x>.10&&x<3)&&!errors.length&&shot.length>17000;
  const row={view,mode,angle,pass,maxError,elbows,pose:q.pose,bytes:shot.length,errors};
  records.push(row);console.log('R69_M01_TEACHER',JSON.stringify({view,mode,angle,pass,maxError,elbows,errors}));
  await p.close();
 }
}finally{writeFileSync(resolve(dir,'music-teacher-results.json'),JSON.stringify(records,null,2)+'\n');await browser.close()}
if(records.length!==16||records.some(x=>!x.pass))process.exitCode=3;
