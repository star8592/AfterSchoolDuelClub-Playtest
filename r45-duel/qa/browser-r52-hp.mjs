import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const BASE=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10980';
const dest=resolve(import.meta.dirname,'evidence/r52');
mkdirSync(dest,{recursive:true});
const results=[];let browser,failed=false;
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
 for(const [name,width,height] of [['wide',1920,1080],['mobile',430,900]]){
  const p=await browser.newPage({viewport:{width,height}});
  const errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const status=await p.goto(BASE+'/r45-duel/?seed=1&qa=1',{waitUntil:'domcontentloaded',timeout:35000});
  await p.waitForFunction('window.__r45QA?.sceneReady',null,{timeout:65000});
  const player=[
   {id:'E02',uid:'U101',hp:1,attack:2,shield:0},
   {id:'G03',uid:'U102',hp:5,attack:4,shield:1},
   {id:'E01',uid:'U103',hp:2,attack:1,shield:0},
   {id:'E01',uid:'U104',hp:1,attack:1,shield:0},
   {id:'T04',uid:'U105',hp:6,attack:4,shield:0}
  ],ai=[
   {id:'G01',uid:'U201',hp:3,attack:1,shield:0},
   {id:'G01',uid:'U202',hp:1,attack:1,shield:0},
   {id:'T01',uid:'U203',hp:2,attack:1,shield:0},
   {id:'E04',uid:'U204',hp:4,attack:5,shield:0},
   {id:'G04',uid:'U205',hp:5,attack:4,shield:0}
  ];
  const send=async(a,b)=>p.evaluate(({a,b})=>{
   document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',player:a.map(x=>x.id),ai:b.map(x=>x.id),
    units:{player:a,ai:b}},location.origin);
  },{a,b});
  await send(player,ai);
  await p.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.total===10,null,{timeout:15000});
  await p.waitForTimeout(850);
  const opened=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
  await p.screenshot({path:resolve(dest,name+'-unit-hp.png')});
  const originals=opened.entries.filter(x=>x.kind==='original-vrm');
  const playerE01=opened.entries.find(x=>x.uid==='U103');
  const afterHp=[...player];afterHp[0]={...afterHp[0],hp:4,shield:1};
  await send(afterHp,ai);
  await p.waitForTimeout(320);
  const adjusted=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
  await send([],[]);
  await p.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===0,null,{timeout:12000});
  const empty=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
  const ok=status.status()===200&&opened.total===10&&
   opened.entries.every(x=>x.hpTag&&x.hpTagPosition&&x.hpTagPosition[1]>2.2&&x.visible&&x.inView)&&
   playerE01?.position?.[0]<-1.9&&
   adjusted.entries.find(x=>x.uid==='U101')?.hp===4&&
   adjusted.entries.find(x=>x.uid==='U101')?.shield===1&&
   empty.total===0&&!errors.length;
  console.log('R52_HUD_GATE',JSON.stringify({name,ok,labels:opened.entries.filter(x=>x.hpTag).length,
   playerE01,adjusted:adjusted.entries.find(x=>x.uid==='U101'),empty:empty.total,errors}));
  results.push({name,ok,opened,adjusted,empty,errors});if(!ok)failed=true;
  await p.close();
 }
}catch(e){console.error('R52_HUD_ERROR',String(e));failed=true}
finally{writeFileSync(resolve(dest,'results.json'),JSON.stringify(results,null,2)+'\n');await browser?.close().catch(()=>{})}
if(failed)process.exitCode=3;
