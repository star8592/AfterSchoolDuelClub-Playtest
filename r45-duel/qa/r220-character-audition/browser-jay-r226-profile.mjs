import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/r220-character-audition/evidence';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const ctx=await browser.newContext({viewport:{width:1600,height:900},deviceScaleFactor:1,serviceWorkers:'block',
 recordVideo:{dir,size:{width:1600,height:900}}});
const page=await ctx.newPage();
const recording=page.video();
const r={ok:false,url:'http://10.10.10.138:18720/r45-duel/qa/r220-character-audition/?focus=jay&revision=r226&camera=profile',errors:[],frames:[],sourceKind:'real-webgl-gltf-render'};
page.on('pageerror',e=>r.errors.push('JS: '+e.message));
page.on('response',v=>{if(v.status()>=400)r.errors.push('HTTP '+v.status()+' '+v.url())});
try{
 await page.goto(r.url,{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r220QA?.ready===true,null,{timeout:90000});
 await page.waitForFunction(()=>window.__r220QA?.state?.drawCalls>=8,null,{timeout:22000});
 await page.waitForTimeout(1350);
 const initial=await page.evaluate(()=>window.__r220QA.state);
 assert.equal(initial.loaded,5);
 for(const id of ['wealth_chef','wealth_teen','dandao_healer','old_jay','new_jay'])
  assert(initial.actors.some(a=>a.id===id));
 const teen=initial.actors.find(a=>a.id==='wealth_teen');
 const jay=initial.actors.find(a=>a.id==='new_jay');
 assert.equal(teen.bones,24);
 assert.equal(jay.bones,24);
 assert(jay.clips.length>=11);
 assert(jay.clips.includes('Duel_ThrowCard'));
 for(const kind of ['idle','draw','attack','hit','victory']){
  await page.evaluate(s=>window.__r220QA.setPhase(s),kind);
  await page.waitForTimeout(kind==='idle'?650:950);
  const data=await page.evaluate(()=>window.__r220QA.state);
  const old=data.actors.find(a=>a.id==='old_jay'),fresh=data.actors.find(a=>a.id==='new_jay');
  assert.equal(data.loaded,5);
  assert(data.drawCalls>=8,'GPU draw did not complete before screenshot: '+kind+' drawCalls='+data.drawCalls);
  assert.equal(await page.evaluate(()=>window.__r220QA.revision),'r226');
  assert.deepEqual(data.errors,[]);
  if(kind==='draw'||kind==='attack'||kind==='hit'||kind==='victory'){
   assert(fresh.handDepth.rightHandForwardM>0.14,
     'Right wrist must be IN FRONT OF shoulder, not behind: '+kind+' '+JSON.stringify(fresh.handDepth));
   assert(fresh.handDepth.leftHandForwardM>0.14,
     'Left wrist must be IN FRONT OF shoulder: '+kind+' '+JSON.stringify(fresh.handDepth));
   assert(fresh.handDepth.rightElbowForwardM>0.04,
     'Right elbow must be forward: '+kind+' '+JSON.stringify(fresh.handDepth));
   assert(fresh.handDepth.leftElbowForwardM>0.04,
     'Left elbow must be forward: '+kind+' '+JSON.stringify(fresh.handDepth));

   for(const side of ['left','right']){
     assert(fresh.handDepth[side+'WristInsideElbowM']>0.006,
       'Elbow still bending away from torso: '+kind+' '+side+' '+JSON.stringify(fresh.handDepth));
     const deg=fresh.handDepth[side+'ActualElbowBendDeg'];
     assert(deg>23&&deg<125,
       'Elbow anatomy angle out of range: '+kind+' '+side+' '+deg);
   }
   assert(fresh.clip.startsWith('Duel_'));
   assert(fresh.activeBones>=4,'New Jay skeletal pose not active: '+kind+' '+JSON.stringify(fresh));
  }
  const file='r226-jay-profile-'+kind+'-real-chrome.png';
  await page.screenshot({path:join(dir,file),animations:'allow'});
  r.frames.push({kind,oldJay:{clip:old.clip,bones:old.bones,activeBones:old.activeBones},
   newJay:{clip:fresh.clip,bones:fresh.bones,activeBones:fresh.activeBones,maxAngleRad:fresh.maxAngleRad,handDepth:fresh.handDepth},
   drawCalls:data.drawCalls,screenshot:file});
  console.log('R220_POSE_REAL',kind,JSON.stringify(r.frames.at(-1)));
 }
 const e=await page.evaluate(()=>window.__r220QA.state.errors);
 assert.deepEqual(e,[]);
 r.ok=true;
}catch(e){r.failure=String(e);console.error('R220_REAL_GLB_QA_FAILED',String(e))}
finally{
 await page.close();await ctx.close();
 if(recording)await recording.saveAs(join(dir,'r226-jay-profile-real-chrome.webm'));
 await browser.close();
 writeFileSync(join(dir,'r226-jay-profile-real-chrome-motion.json'),JSON.stringify(r,null,2)+'\n');
 console.log('R220_REAL_ACTOR_AUDIT',JSON.stringify(r));
}
if(!r.ok)process.exitCode=8;
