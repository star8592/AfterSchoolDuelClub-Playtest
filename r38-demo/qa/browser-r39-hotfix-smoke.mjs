import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'../..');
const folder=resolve(import.meta.dirname,'evidence');mkdirSync(folder,{recursive:true});
const port=10955;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
let browser;
try{
 await pause(350);
 browser=await chromium.launch({headless:true,executablePath:'/home/master/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--enable-unsafe-swiftshader']});
 const all=[];
 for(const [name,width,height] of [['desktop',1366,900],['mobile',430,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push('PAGE_ERROR '+e.message));
  page.on('response',res=>{if(res.status()>=400)errors.push('HTTP '+res.status()+' '+res.url())});
  const response=await page.goto('http://127.0.0.1:'+port+'/r38-demo/?mode=duel&qaR25=1&qaR23=1&seed=70',{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForSelector('#home3d-r39-fight',{timeout:18000});
  const launchBefore=await page.evaluate(()=>({
   cardCount:document.querySelectorAll('#hand .card').length,lanes:document.querySelectorAll('#arena-lane-0,#arena-lane-1,#arena-lane-2').length,
   previewButton:document.getElementById('home3d-r39-fight').textContent.trim(),
   liveButton:document.getElementById('stage3d-mode').textContent.trim(),
   performanceInitiallyHidden:document.getElementById('performance-stage').hidden,
   musicButtonExists:!!document.getElementById('home3d-music')
  }));
  await page.locator('#home3d-r39-fight').click();
  await page.waitForFunction("document.querySelector('#performance-3d-slot iframe')!==null",{timeout:10000});
  const source=await page.locator('#performance-3d-slot iframe').getAttribute('src');
  let playing=false;
  try {await page.waitForFunction("document.getElementById('performance-stage').dataset.live3d==='playing'",null,{timeout:22000});playing=true;}catch(e){errors.push('LIVE_3D_NEVER_ACCEPTED '+String(e).slice(0,120))}
  const frame=page.frameLocator('#performance-3d-slot iframe');
  const child=await page.evaluate(()=>{const f=document.querySelector('#performance-3d-slot iframe');const q=f?.contentWindow?.__duelMotionQA;return q?{ready:q.ready,rigs:q.rigs,active:q.activeLive3D,draws:q.renderDrawCalls}:null});
  const onstage=await page.evaluate(()=>{const x=document.getElementById('performance-stage');const r=x.getBoundingClientRect();return{hidden:x.hidden,phase:x.dataset.phase,status:x.dataset.live3d,rect:{x:r.x,y:r.y,width:r.width,height:r.height},aria:x.getAttribute('aria-label')}});
  await page.screenshot({path:resolve(folder,'r39-'+name+'-live3d.png'),fullPage:false});
  const report={device:name,http:response.status(),launchBefore,source,playing,child,onstage,errors,
   passed:response.status()===200&&launchBefore.cardCount===5&&launchBefore.lanes===3&&launchBefore.liveButton.includes('已开启')&&
   !launchBefore.musicButtonExists&&source.includes('/r14-3d/labs/duel-motion-r01/')&&playing&&
   child?.ready&&child.rigs?.length===2&&child.active?.mode==='demo'&&onstage.rect.width>300&&onstage.rect.height>200&&!errors.length};
  console.log('R39_TRUE_3D_COMBAT',JSON.stringify(report));all.push(report);
  if(!report.passed){console.error('R39_FAILED_VIEWPORT',name);break;}
  await page.close();
 }
 writeFileSync(resolve(folder,'hotfix-combat-proof.json'),JSON.stringify(all,null,2)+'\n');
 if(all.some(x=>!x.passed)||all.length!==2)process.exitCode=3;
}catch(e){console.error('R39_COMBAT_QA_EXCEPTION',String(e));process.exitCode=2}
finally{await browser?.close().catch(()=>{});server.kill('SIGTERM')}
