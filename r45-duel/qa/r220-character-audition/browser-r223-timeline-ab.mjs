import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/r220-character-audition/evidence/r223-keyframes';mkdirSync(dir,{recursive:true});
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
const report={ok:false,environment:'Z890 Chrome WebGL2 real GLB keyframes, R222 and R223, profile camera',cases:[],errors:[]};
try{
 for(const revision of ['r222','r223']){
  const ctx=await b.newContext({viewport:{width:1600,height:900},serviceWorkers:'block'});
  const page=await ctx.newPage();
  page.on('pageerror',err=>report.errors.push(revision+' JS '+err.message));
  page.on('response',r=>{if(r.status()>=400)report.errors.push(revision+' HTTP '+r.status()+' '+r.url())});
  await page.goto('http://10.10.10.138:18720/r45-duel/qa/r220-character-audition/?focus=jay&revision='+revision+'&camera=profile',
    {waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r220QA?.ready===true,null,{timeout:65000});
  const frames=[];
  for(const t of [0.08,0.38,0.65,0.77,0.92,1.12,1.32]){
    const res=await page.evaluate(t=>window.__r220QA.seekPhase('attack',t),t);
    assert(res,'QA seek returned null');
    const a=res.actors.find(x=>x.id==='new_jay');
    assert(a&&a.bones===24,'Real rig not found');
    assert(a.handDepth.rightHandForwardM>0,'Right hand went behind');
    assert(a.handDepth.leftHandForwardM>0,'Left hand went behind');
    const file=revision+'-cast-'+String(Math.round(t*100)).padStart(3,'0')+'.jpg';
    await page.screenshot({path:join(dir,file),type:'jpeg',quality:85,animations:'allow'});
    frames.push({time:t,rightForwardM:a.handDepth.rightHandForwardM,
      leftForwardM:a.handDepth.leftHandForwardM,
      rightHandHeightM:a.handDepth.rightHandHeightM,
      leftHandHeightM:a.handDepth.leftHandHeightM,
      footL:a.handDepth.leftFootWorldXYZ,footR:a.handDepth.rightFootWorldXYZ,
      card:res.card,file});
  }
  assert.deepEqual(report.errors,[]);
  const f092=frames.find(f=>f.time===0.92);
  const handDiff=f092.rightForwardM-f092.leftForwardM;
  const cardBefore=frames.find(f=>f.time===0.77),cardAfter=frames.find(f=>f.time===1.12);
  assert(cardBefore.card.released && cardAfter.card.released);
  if(revision==='r223'){
    assert(handDiff>0.12,'Off-hand was not guarded closer to torso: '+handDiff);
    assert(cardAfter.card.position[2]>cardBefore.card.position[2]+0.35,
      'Thrown card must travel forward, not sideways/back');
  }
  const delta=(coord)=>Math.max(...frames.map(f=>f[coord][1]))-Math.min(...frames.map(f=>f[coord][1]));
  const footVerticalSpreadM=Math.max(delta('footL'),delta('footR'));
  report.cases.push({revision,handDiffAt092M:+handDiff.toFixed(3),
    footVerticalSpreadM:+footVerticalSpreadM.toFixed(3),
    cardTravelZ:+(cardAfter.card.position[2]-cardBefore.card.position[2]).toFixed(3),frames});
  console.log('R223_TIMELINE',revision,'offhandDifference',handDiff.toFixed(3),
   'foot vertical movement',footVerticalSpreadM.toFixed(3),'card forward travelZ',
   (cardAfter.card.position[2]-cardBefore.card.position[2]).toFixed(3));
  await ctx.close();
 }
 report.ok=true;
}catch(e){report.failure=String(e);console.error('R223_TIMELINE_FAIL',e)}
finally{
 await b.close();writeFileSync(join(dir,'r223-keyframe-reproducible-browser-ab.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R223_REPRO',JSON.stringify({ok:report.ok,failure:report.failure,
  cases:report.cases.map(c=>({rev:c.revision,handDiff:c.handDiffAt092M,footY:c.footVerticalSpreadM,
    cardFwd:c.cardTravelZ})),errors:report.errors}));
}
if(!report.ok)process.exitCode=8;
