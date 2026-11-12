const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const fs=require('fs'),path=require('path');
const root='/mnt/data/game-assets/after-school-duel/r80-mainport-qa';
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11081';
const target={E03:'E03-Ellie-Knee-R96.glb',E04:'E04-Phil-Knee-R96.glb',G02:'G02-Snow-Knee-R96.glb',G03:'G03-Jay-Knee-R96.glb',G04:'G04-Victoria-Knee-R96.glb',T03:'T03-Rain-Knee-R96.glb',T04:'T04-Rex-Knee-R96.glb'};
const old={E03:'E03-Ellie-Footwork-R93.glb',E04:'E04-Phil-Footwork-R93.glb',G02:'G02-Snow-Footwork-R93.glb',G03:'G03-Jay-Footwork-R93.glb',G04:'G04-Victoria-Footwork-R93.glb',T03:'T03-Rain-Footwork-R93.glb',T04:'T04-Rex-Footwork-R93.glb'};
const browserOpt={headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']};
const rows=[];
(async()=>{const browser=await chromium.launch(browserOpt);
try{for(const [view,width,height] of [['desktop',1440,900],['portrait',430,900]]){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];
 page.on('pageerror',e=>errors.push('JS '+String(e).slice(0,280)));
 page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))errors.push('HTTP '+r.status()+' '+r.url().slice(0,180))});
 page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text().slice(0,260))});
 const resp=await page.goto(origin+'/r45-duel/?qa=1&seed=8',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:165000});
 const registered=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonModels);
 const models=registered.filter(x=>Object.hasOwn(target,x.id));
 const modelOK=resp.status()===200&&models.length===7&&models.every(x=>x.file===target[x.id]&&x.clips===3&&x.meshes>=18);
 console.log('R96_REGISTRY',view,JSON.stringify({modelOK,models:models.map(m=>({id:m.id,file:m.file,clips:m.clips,mesh:m.meshes,height:m.measured?.scaledHeight}))}));
 const batches=[['E03','E04','G04','T03'],['T04','G03','G02','E03']];const scenarios=[];
 for(let bi=0;bi<batches.length;bi++){
  const ids=batches[bi],units={player:ids.map((id,i)=>({id,uid:'U'+(101+i),hp:7,attack:2,shield:0})),ai:ids.map((id,i)=>({id,uid:'U'+(201+i),hp:7,attack:2,shield:0}))};
  await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage({type:'ASDC_R45_BOARD',player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id),units:u},location.origin),units);
  await page.waitForFunction(ids=>{let p=document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence;return p?.total===8&&ids.every(id=>p.entries.filter(x=>x.id===id).length===2)},ids,{timeout:35000});
  await page.waitForTimeout(750);
  let presence=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
  const shown=presence.entries.filter(x=>ids.includes(x.id));
  const visible=shown.length===8&&shown.every(x=>x.visible&&x.inView&&x.metrics?.frontDot>.95&&x.metrics?.minY>-.12&&x.metrics?.minY<.13);
  await page.screenshot({path:path.join(root,`r96-${view}-batch${bi+1}.png`)});
  const actions=[];
  for(let j=0;j<ids.length;j++){
   const id=ids[j];if(!Object.hasOwn(target,id))continue;
   const post=structuredClone(units);post.ai[j].hp=5;
   await page.evaluate(({pre,post,j,id,serial})=>{document.querySelector('#stadium').contentWindow.postMessage({type:'ASDC_R51_COMBAT_EVENTS',pre,post,events:[{type:'exchange',side:'player',from:id,to:id,attacker_uid:'U'+(101+j),target_uid:'U'+(201+j),serial,damage:2,attacker_hp_after:7,target_hp_after:5}]},location.origin)}, {pre:units,post,j,id,serial:8800+bi*20+j});
   await page.waitForTimeout(430);
   const clips=await page.evaluate(id=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.entries.filter(x=>x.id===id).map(x=>({side:x.side,playing:x.playingClips||[]})),id);
   const ok=clips.some(x=>x.side==='player'&&x.playing.includes('Attack'))&&clips.some(x=>x.side==='ai'&&x.playing.includes('Hit'));
   actions.push({id,ok,clips});
   await page.waitForTimeout(1150);
  }
  scenarios.push({batch:bi+1,visible,shown:shown.map(x=>({id:x.id,side:x.side,height:x.metrics.height,inView:x.inView,frontDot:x.metrics.frontDot})),actions});
 }
 const pass=modelOK&&!errors.length&&scenarios.every(x=>x.visible&&x.actions.every(z=>z.ok))&&scenarios.flatMap(x=>x.actions).length>=7;
 rows.push({view,mode:'new',pass,modelOK,errors,scenarios});
 console.log('R96_FULL_GATE',view,JSON.stringify({pass,modelOK,errors,scenarios:scenarios.map(x=>({batch:x.batch,visible:x.visible,actions:x.actions}))}));
 await page.close();
 const rollbackPage=await browser.newPage({viewport:{width,height}}),re=[];
 rollbackPage.on('pageerror',e=>re.push(String(e).slice(0,200)));
 rollbackPage.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))re.push('HTTP '+r.status())});
 const res2=await rollbackPage.goto(origin+'/r45-duel/?qa=1&seed=8&r96Knee=old',{waitUntil:'domcontentloaded',timeout:95000});
 await rollbackPage.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:170000});
 const oldModels=await rollbackPage.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonModels.filter(x=>['E03','E04','G02','G03','G04','T03','T04'].includes(x.id)));
 const oldOK=res2.status()===200&&!re.length&&oldModels.length===7&&oldModels.every(x=>x.file===old[x.id]&&x.clips===3);
 rows.push({view,mode:'old',pass:oldOK,errors:re,models:oldModels.map(x=>({id:x.id,file:x.file,clips:x.clips}))});
 console.log('R96_ROLLBACK_GATE',view,JSON.stringify({pass:oldOK,errors:re,models:oldModels.map(x=>({id:x.id,file:x.file,clips:x.clips}))}));
 await rollbackPage.close();
}}finally{fs.writeFileSync(path.join(root,'r96-seven-qa.json'),JSON.stringify(rows,null,2));await browser.close()}
if(rows.length!==4||rows.some(r=>!r.pass))process.exitCode=5;
})().catch(e=>{console.error('R96_TEST_EXCEPTION',e);process.exitCode=9});
