import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,existsSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const ROOT=resolve(import.meta.dirname,'../..'),port=9994;
const out=resolve(import.meta.dirname,'evidence-r25-home-mobile');mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'asdc-r22-home-'));
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=vulkan','--enable-webgl','--disable-software-rasterizer','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=390,844','about:blank'],{env:{...process.env,HOME:profile},stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try{
 const active=join(profile,'DevToolsActivePort');
 for(let i=0;i<170&&!existsSync(active);i++)await wait(100);
 if(!existsSync(active))throw Error('NO_CHROME_CDP');
 const portCDP=Number(readFileSync(active,'utf8').split('\n')[0]);
 const target=(await(await fetch('http://127.0.0.1:'+portCDP+'/json/list')).json()).find(x=>x.type==='page');
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 const requests=new Map();let seq=0,exceptions=[];
 ws.addEventListener('message',ev=>{const r=JSON.parse(ev.data);if(r.method==='Runtime.exceptionThrown')exceptions.push(r.params.exceptionDetails.text);if(requests.has(r.id)){const [yes,no]=requests.get(r.id);requests.delete(r.id);r.error?no(Error(r.error.message)):yes(r.result);}});
 const send=(method,params={})=>new Promise((yes,no)=>{const id=++seq;requests.set(id,[yes,no]);ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails).slice(0,500));return r.result.value;};
 const shot=async name=>{const v=await send('Page.captureScreenshot',{format:'png',fromSurface:true});writeFileSync(join(out,name+'.png'),Buffer.from(v.data,'base64'));};
 await send('Page.enable');await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true,screenWidth:390,screenHeight:844});
 await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/r25-game/?qaR25=1&qaR23=1'});
 let state;
 for(let i=0;i<190;i++){
  state=await evaluate("(()=>{const h=window.__r25HomeQA,f=document.getElementById('home3d-r19-iframe'),v=f?.contentWindow?.__r22CharacterQA;return {home:!!h?.actualVRMReady,child:!!v?.ready,rigs:v?.realVRMRigs?.length||0,cardGame:!!document.getElementById('end-turn'),src:f?.getAttribute('src'),errors:v?.browserErrors||[]}})()");
  if(state.home&&state.child)break;
  if(state.errors?.length)throw Error('MODEL_LOAD_ERROR '+JSON.stringify(state));
  await wait(150);
 }
 if(!state.home||!state.child||state.rigs!==3||!state.cardGame||!state.src.includes('r22-depth'))
  throw Error('R22_HOMEPAGE_GATE '+JSON.stringify(state));
 await wait(350);await shot('r22-playable-first-view');
 const musicLink=await evaluate("(()=>{const old=window.open;let captured='';window.open=(url)=>{captured=url;return null};document.getElementById('home3d-music').click();window.open=old;return captured})()");
 if(!musicLink.endsWith('/r25-music/'))throw Error('M01 research entry missing from REAL PLAYABLE homepage '+musicLink);

 const pbr=await evaluate("document.getElementById('home3d-r19-iframe').contentWindow.__r22CharacterQA.depthMode");
 if(pbr!=='pbr')throw Error('R22 homepage did not load PBR lighting');
 await evaluate("document.getElementById('home3d-depth').click();true");await wait(400);
 const toon=await evaluate("document.getElementById('home3d-r19-iframe').contentWindow.__r22CharacterQA.depthMode");
 if(toon!=='toon')throw Error('R22 homepage materials toggle failed');
 await shot('r22-toon-from-home');
 await evaluate("document.getElementById('home3d-depth').click();true");await wait(400);
 const back=await evaluate("document.getElementById('home3d-r19-iframe').contentWindow.__r22CharacterQA.depthMode");
 if(back!=='pbr')throw Error('R22 homepage PBR restore failed');
 await shot('r22-pbr-from-home');

 await evaluate("document.getElementById('home3d-compare').click();true");await wait(400);
 const original=await evaluate("document.getElementById('home3d-r19-iframe').contentWindow.__r22CharacterQA.customMode");
 if(original!==false)throw Error('R18_SAME_CAMERA_TOGGLE_FAILED');
 await shot('r18-within-r22-home');
 await evaluate("document.getElementById('home3d-compare').click();document.getElementById('home3d-start').click();true");
 await wait(500);
 const battle=await evaluate("(()=>({playing:document.body.dataset.home3d,hp:document.getElementById('player-hp')?.textContent,cards:document.querySelectorAll('#hand button,#hand [role=button]').length,custom:document.getElementById('home3d-r19-iframe').contentWindow.__r22CharacterQA.customMode}))()");
 if(battle.playing!=='playing'||!battle.custom)throw Error('GAME_ENTRY_FAILED '+JSON.stringify(battle));
 await shot('r22-enter-real-card-game');
 await evaluate("document.getElementById('arena-r23-preview').click();true");
 let stage;
 for(let i=0;i<140;i++){
   stage=await evaluate("window.__r23CardStageQA ? ({...window.__r23CardStageQA}) : null");
   if(stage?.loaded&&stage?.modelCount===2)break;
   await wait(170);
 }
 if(!stage?.loaded||stage.modelCount!==2||stage.meshCounts.E02<10||stage.meshCounts.T02<10||
    stage.triangles.E02<12000||stage.triangles.T02<25000||stage.errors.length)
    throw Error('R23_CARD_STAGE_REAL_GLTF_GATE '+JSON.stringify(stage));
 await wait(650);await shot('r23-actual-battle-arena-3d-preview');
 const before=await evaluate("({hp:document.getElementById('player-hp').textContent,energy:document.getElementById('energy').textContent,round:document.getElementById('round-num').textContent})");
 await evaluate("document.getElementById('arena-r23-preview').click();true");
 await wait(200);
 const after=await evaluate("({hp:document.getElementById('player-hp').textContent,energy:document.getElementById('energy').textContent,round:document.getElementById('round-num').textContent})");
 if(JSON.stringify(before)!==JSON.stringify(after))throw Error('R23_PREVIEW_MODIFIED_CARD_RULE_STATE');
 stage=await evaluate("({...window.__r23CardStageQA})");
 if(stage.preview||stage.frames<10||!stage.gpuRenderer?.includes('NVIDIA'))
   throw Error('R23_BATTLE_3D_FALLBACK '+JSON.stringify(stage));
 

 // End-to-end: real card IDs from deterministic ORIGINAL gameplay seed #70.
 // Do NOT use QA mocked visuals; click actual normal cards and actual lane UI.
 const liveProof=[];
 for(const id of ['E02','T02']){
  await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/r25-game/?qaR25=1&qaR23=1&mode=duel&seed=70'});
  await wait(600);
  let handReady=false;
  for(let i=0;i<100;i++){
   handReady=await evaluate("!!document.querySelector('#hand .card[data-card-id=\""+id+"\"]')");
   if(handReady)break;
   await wait(120);
  }
  if(!handReady)throw Error('R23_CARD_NOT_IN_REAL_SHUFFLED_OPENING_HAND '+id);
  let thumbnail;
  for(let i=0;i<65;i++){
   thumbnail=await evaluate("(()=>{const i=document.querySelector('#hand .card[data-card-id=\""+id+"\"] .card-model-portrait');return i?{src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth===512,status:i.dataset.reviewStatus}:null})()");
   if(thumbnail?.loaded)break;await wait(120);
  }
  if(!thumbnail?.loaded||!thumbnail.src.includes(id+'.png')||
     thumbnail.status!=='R23_GLTF_PROTOTYPE_NOT_FINAL_ART')
    throw Error('R23_REAL_CARD_PORTRAIT_NOT_ATTACHED '+id+' '+JSON.stringify(thumbnail));
  const energyBefore=await evaluate("document.getElementById('energy').textContent");
  await evaluate("document.querySelector('#hand .card[data-card-id=\""+id+"\"]').click();true");
  await evaluate("document.getElementById('arena-lane-0').click();true");
  let stateA=null;
  for(let i=0;i<140;i++){
    stateA=await evaluate("(()=>({q:window.__r23CardStageQA,unit:document.querySelector('.player-formation .unit-card[data-card-id=\""+id+"\"]')?.dataset.unitUid,energy:document.getElementById('energy').textContent}))()");
    if(stateA?.q?.loaded&&stateA.q.activeActualCards.some(a=>a.side==='player'&&a.id===id)&&stateA.q.actualCardFrames>15)break;
    if(stateA?.q?.errors?.length)throw Error('R23_3D_REAL_CARD_RENDER_ERROR '+JSON.stringify(stateA.q.errors));
    await wait(170);
  }
  if(!stateA.q?.loaded||!stateA.unit||!stateA.q.activeActualCards.some(a=>a.id===id&&a.uid===stateA.unit)||
     stateA.q.actualCardFrames<15||stateA.q.summonEvents<1||energyBefore===stateA.energy){
    throw Error('R23_FAILED_TO_BIND_TRUE_CORE_CARD '+id+' '+JSON.stringify(stateA));
  }
  await evaluate("document.getElementById('cinematic-arena').scrollIntoView({block:'center',behavior:'instant'});true");
  await wait(250);await shot('r23-real-gameplay-summoned-'+id);
  liveProof.push({id,thumbnail,uid:stateA.unit,energyBefore,energyAfter:stateA.energy,
    frames:stateA.q.actualCardFrames,summonEvents:stateA.q.summonEvents,
    meshes:stateA.q.meshCounts[id],triangles:stateA.q.triangles[id]});
 }
 // Reset clears visual model because no rule-engine unit remains on the board.
 await evaluate("document.getElementById('reset').click();true");
 await wait(300);
 const cleared=await evaluate("window.__r23CardStageQA.activeActualCards.length===0");
 if(!cleared)throw Error('R23_RENDERER_STALE_UNIT_AFTER_RESET');

 const proof={liveProof,stage,previewReadOnly:true,url:'http://127.0.0.1:'+port+'/r25-game/',state,battle,originalSwitchPassed:true,chromeRuntimeExceptions:exceptions};
 writeFileSync(join(out,'browser-proof.json'),JSON.stringify(proof,null,2)+'\n');
 if(exceptions.length)throw Error('JS_EXCEPTIONS '+JSON.stringify(exceptions));
 console.log('R23_HOME_REAL_GPU_PASS '+JSON.stringify(proof));
}finally{try{ws?.close();}catch{} chrome.kill('SIGTERM');server.kill('SIGTERM');await wait(120);rmSync(profile,{recursive:true,force:true});}
