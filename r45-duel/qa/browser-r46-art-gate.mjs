import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const base='http://127.0.0.1:10976/r45-duel/?seed=1&qa=1';
const output=resolve(import.meta.dirname,'evidence');
let b;const reports=[];
try{
 b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
 for(const [device,width,height] of [['desktop',1366,850],['mobile',430,900],['small',375,667]]){
  const p=await b.newPage({viewport:{width,height}}),errors=[],requests=[];
  p.on('pageerror',e=>errors.push('JS '+e.message));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  p.on('request',r=>requests.push(r.url()));
  const res=await p.goto(base,{waitUntil:'domcontentloaded',timeout:33000});
  await p.waitForFunction('window.__r45QA?.sceneReady',null,{timeout:65000});
  const opening=await p.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const face=document.querySelector('#hand .card[data-card-id="E01"] img');
   const cards=[...document.querySelectorAll('#hand .card')];
   const arena=document.querySelector('.arena').getBoundingClientRect();
   const hand=document.querySelector('.controls').getBoundingClientRect();
   return{qReady:q.ready,
    stadium:q.stadium.label,polish:q.stadium.polish,
    particleSystem:q.effects.layer,drawCalls:q.drawCalls,
    gameCards:__r45QA.cardCount,handCards:cards.length,
    truePortrait:!!face&&face.naturalWidth===304&&face.naturalHeight===423,
    faceSrc:face?.getAttribute('src'),customArtCards:cards.filter(x=>x.dataset.art==='actual-vrm').length,
    arenaHeight:arena.height,handBottom:hand.bottom,
    viewportHeight:innerHeight,documentWidth:document.documentElement.scrollWidth,
    gpu:q.renderer};
  });
  await p.screenshot({path:resolve(output,'r46-'+device+'-opening.png')});
  await p.locator('#hand .card[data-card-id="E01"]').click();
  const selected=await p.evaluate(()=>({energy:__r45QA.energy.player,hand:__r45QA.hand.length,selection:__r45QA.selected}));
  await p.locator('#play').click();
  const afterPlay=await p.evaluate(()=>({energy:__r45QA.energy.player,
   hand:__r45QA.hand.length,board:__r45QA.board.player[0].map(u=>u.id)}));
  await p.locator('#end').click();
  await p.waitForFunction('window.__r45QA.round===2',null,{timeout:16000});
  const afterAI=await p.evaluate(()=>({board:__r45QA.board.ai[0].map(u=>u.id),
   text:document.querySelector('#battle-toast').textContent}));
  await p.locator('#end').click();
  await p.waitForFunction("document.querySelector('#stadium').contentWindow.__r45SceneQA?.seconds>2.85",null,{timeout:21000});
  await p.screenshot({path:resolve(output,'r46-'+device+'-impact.png')});
  await p.waitForFunction("document.querySelector('#stadium').contentWindow.__r45SceneQA.effects.impactRendered>8",null,{timeout:10000});
  const combat=await p.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{event:q.payload.event,roles:q.roles.map(x=>({id:x.id,bones:x.bones,asset:x.asset})),
    renderer:q.renderer,effects:q.effects,polish:q.stadium.polish,studio:q.stadium.label,
    handVisible:document.querySelector('.controls').getBoundingClientRect().bottom<=innerHeight+4,
    drawCalls:q.drawCalls,choreography:q.choreography};
  });
  const noOldRuntime=requests.every(u=>!/\/(?:r14-|r18-|r19-|r20-|r21-|r22-|r23-|r25-|r32-|r34-|r36-|r38-|r39-|r40-|r41-|r42-|r43-|r44-)/.test(u));
  const passed=res.status()===200&&opening.qReady&&
   opening.stadium==='R45_ONE_ARENA_GYM_3D'&&opening.polish?.licensedTextures===3&&
   opening.polish?.physicalTrim>=80&&opening.polish?.liveSigns===3&&
   opening.particleSystem==='R46_TRUE_3D_SUMMON_AND_IMPACT'&&
   opening.gameCards===18&&opening.handCards===5&&opening.truePortrait&&
   selected.hand===5&&selected.energy===2&&afterPlay.hand===4&&afterPlay.energy===1&&
   afterPlay.board.includes('E01')&&afterAI.board.includes('G01')&&
   afterAI.text.includes('AI 打出')&&combat.event?.from==='E01'&&combat.event?.to==='G01'&&
   combat.event.damage===2&&combat.event.retaliation===1&&
   combat.roles[0].bones===148&&combat.roles[1].bones===107&&
   combat.effects.impactRendered>8&&combat.choreography?.maxStride>.08&&
   combat.choreography?.maxOrbit>.02&&/RTX 5070 Ti/.test(combat.renderer)&&
   (device==='small'||combat.handVisible)&&opening.documentWidth<=width+2&&
   noOldRuntime&&!errors.length;
  const record={device,width,height,http:res.status(),opening,selected,afterPlay,afterAI,combat,
   noOldRuntime,requestsCount:requests.length,errors,passed};
  reports.push(record);
  console.log('R46_REAL_ART_HARD_GATE',JSON.stringify({
   device,http:res.status(),gymPBR:opening.polish?.licensedTextures,
   originalPortrait:opening.truePortrait,stageSigns:opening.polish?.liveSigns,
   rigBones:combat.roles.map(r=>r.bones),damage:combat.event.damage,
   retaliation:combat.event.retaliation,impactFrames:combat.effects.impactRendered,
   drawCalls:combat.drawCalls,maxStride:combat.choreography?.maxStride,
   maxOrbit:combat.choreography?.maxOrbit,noOldRuntime,passed,errors
  }));
  if(!passed)process.exitCode=3;
  await p.close();
 }
 writeFileSync(resolve(output,'r46-stadium-art-qa.json'),JSON.stringify(reports,null,2)+'\n');
}catch(e){console.error('R46_ART_GATE_FAILED',String(e),JSON.stringify(reports).slice(-600));process.exitCode=2}
finally{await b?.close().catch(()=>{})}
