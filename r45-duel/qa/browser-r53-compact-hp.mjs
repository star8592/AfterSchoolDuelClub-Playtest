import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const BASE=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10981';
const dir=resolve(import.meta.dirname,'evidence/r53');
mkdirSync(dir,{recursive:true});
let browser,failed=false;
const results=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
  '--no-sandbox','--enable-webgl','--use-angle=vulkan',
  '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
 for(const [name,width,height] of [['ultrawide',2560,1080],['wide',1920,1080],['four-three',1024,768],['mobile',430,900]]){
  const p=await browser.newPage({viewport:{width,height}});
  const errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const response=await p.goto(BASE+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:36000});
  await p.waitForFunction('window.__r45QA?.sceneReady',null,{timeout:62000});
  const left=['E01','E02','E03','G01','T01'];
  const right=['G01','G02','G03','T02','T04'];
  await p.evaluate(({left,right})=>{
   const units=(cards,side)=>cards.map((id,i)=>({uid:'U'+(side==='player'?100+i:200+i),id,hp:3,attack:2,shield:0}));
   document.querySelector('#stadium').contentWindow.postMessage({type:'ASDC_R45_BOARD',
    player:left,ai:right,units:{player:units(left,'player'),ai:units(right,'ai')}},location.origin);
  },{left,right});
  await p.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.total===10,null,{timeout:17000});
  await p.waitForTimeout(750);
  const read=()=>p.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const r=document.querySelector('.camera-tools').getBoundingClientRect();
   const b=document.querySelector('#hp-label-mode').getBoundingClientRect();
   return{view:q.summonPresence,angle:q.framing.yaw,control:{x:r.x,w:r.width,right:r.right},
    toggle:{left:b.left,right:b.right,label:document.querySelector('#hp-label-mode').textContent.trim()},
    scrollWidth:document.documentElement.scrollWidth};
  });
  const auto=await read();
  await p.screenshot({path:resolve(dir,name+'-auto-ten.png')});
  const stages=[['full','full',10],['compact','compact',10],['hidden','hidden',0],['auto','compact',10]];
  const checks=[];
  for(const [label,effective,visible] of stages){
   await p.locator('#hp-label-mode').click();
   await p.waitForTimeout(240);
   const now=await read();
   const ok=now.view.hpDisplayMode===label&&now.view.activeHpStyle===effective&&
    now.view.visibleHpTags===visible&&now.scrollWidth<=width+2&&
    now.toggle.right<=width+2&&now.toggle.left>=-1&&
    !errors.length;
   if(label==='compact')await p.screenshot({path:resolve(dir,name+'-compact-ten.png')});
   checks.push({label,ok,effective:now.view.activeHpStyle,visible:now.view.visibleHpTags});
  }
  await p.keyboard.press('h');
  await p.waitForTimeout(180);
  const keyboard=await read();
  await p.locator('#camera-right').click();
  await p.waitForTimeout(850);
  const rotated=await read();
  const pass=response.status()===200&&auto.view.activeHpStyle==='compact'&&
   auto.view.visibleHpTags===10&&checks.every(x=>x.ok)&&
   keyboard.view.hpDisplayMode==='full'&&Math.abs(rotated.angle-45)<1&&
   !errors.length;
  const record={name,pass,auto:{mode:auto.view.activeHpStyle,hpTags:auto.view.visibleHpTags},
   checks,keyboard:keyboard.view.hpDisplayMode,rotated:rotated.angle,errors};
  results.push(record);
  console.log('R53_COMPACT_HP_GATE',JSON.stringify(record));
  if(!pass)failed=true;
  await p.close();
 }
}catch(e){console.error('R53_HUD_TEST_FAILED',String(e));failed=true}
finally{writeFileSync(resolve(dir,'results.json'),JSON.stringify(results,null,2)+'\n');await browser?.close().catch(()=>{});}
if(failed)process.exitCode=3;
