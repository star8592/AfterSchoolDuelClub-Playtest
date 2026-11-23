import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/r220-character-audition/evidence';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:1600,height:900},serviceWorkers:'block',
recordVideo:{dir,size:{width:1600,height:900}}});
const page=await ctx.newPage(),video=page.video();
const report={ok:false,errors:[],scenes:[]};
page.on('pageerror',e=>report.errors.push('JS: '+e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
try{
 await page.goto('http://10.10.10.138:18720/r45-duel/qa/r220-character-audition/?focus=jay&revision=r226&camera=profile',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r220QA?.ready===true,null,{timeout:65000});
 await page.waitForTimeout(850);
 for(const [kind,seconds] of [['draw',1.7],['attack',2.05],['hit',1.55],['victory',1.85],['idle',1.25]]){
  await page.evaluate(k=>window.__r220QA.setPhase(k),kind);
  await page.waitForTimeout(Math.round(seconds*1000));
  const state=await page.evaluate(()=>window.__r220QA.state);
  assert.equal(state.loaded,5);
  const jay=state.actors.find(a=>a.id==='new_jay');
  assert(jay.bones===24&&jay.clip,'Real Jay missing');
  assert.deepEqual(state.errors,[]);
  report.scenes.push({kind,seconds,clip:jay.clip,
    card:state.card,footL:jay.handDepth.leftFootWorldXYZ,
    footR:jay.handDepth.rightFootWorldXYZ});
  console.log('R224_REAL_SEQUENCE',kind,jay.clip);
 }
 assert.deepEqual(report.errors,[]);
 report.ok=true;
}catch(e){report.failure=String(e);console.error('R224_SEQUENCE_FAILED',e)}
finally{
 await page.close();await ctx.close();
 if(video)await video.saveAs(join(dir,'r226-jay-full-motion-real-chrome.webm'));
 await browser.close();
 writeFileSync(join(dir,'r226-jay-full-motion-real-chrome.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R224_SEQUENCE_QA',JSON.stringify({ok:report.ok,errors:report.errors,scenes:report.scenes.map(s=>s.kind),failure:report.failure}));
}
if(!report.ok)process.exitCode=8;
