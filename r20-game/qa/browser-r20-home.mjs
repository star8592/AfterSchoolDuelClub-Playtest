import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,existsSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const ROOT=resolve(import.meta.dirname,'../..'),port=9933;
const out=resolve(import.meta.dirname,'evidence-home-desktop');mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'asdc-r20-home-'));
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=vulkan','--enable-webgl','--disable-software-rasterizer','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=1280,820','about:blank'],{env:{...process.env,HOME:profile},stdio:'ignore'});
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
 await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/r20-game/?qaR20=1'});
 let state;
 for(let i=0;i<190;i++){
  state=await evaluate("(()=>{const h=window.__r20HomeQA,f=document.getElementById('home3d-r19-iframe'),v=f?.contentWindow?.__r20CharacterQA;return {home:!!h?.actualVRMReady,child:!!v?.ready,rigs:v?.realVRMRigs?.length||0,cardGame:!!document.getElementById('end-turn'),src:f?.getAttribute('src'),errors:v?.browserErrors||[]}})()");
  if(state.home&&state.child)break;
  if(state.errors?.length)throw Error('MODEL_LOAD_ERROR '+JSON.stringify(state));
  await wait(150);
 }
 if(!state.home||!state.child||state.rigs!==2||!state.cardGame||!state.src.includes('r20-original'))
  throw Error('R20_HOMEPAGE_GATE '+JSON.stringify(state));
 await wait(350);await shot('r20-playable-first-view');
 await evaluate("document.getElementById('home3d-compare').click();true");await wait(400);
 const original=await evaluate("document.getElementById('home3d-r19-iframe').contentWindow.__r20CharacterQA.customMode");
 if(original!==false)throw Error('R18_SAME_CAMERA_TOGGLE_FAILED');
 await shot('r18-within-r20-home');
 await evaluate("document.getElementById('home3d-compare').click();document.getElementById('home3d-start').click();true");
 await wait(500);
 const battle=await evaluate("(()=>({playing:document.body.dataset.home3d,hp:document.getElementById('player-hp')?.textContent,cards:document.querySelectorAll('#hand button,#hand [role=button]').length,custom:document.getElementById('home3d-r19-iframe').contentWindow.__r20CharacterQA.customMode}))()");
 if(battle.playing!=='playing'||!battle.custom)throw Error('GAME_ENTRY_FAILED '+JSON.stringify(battle));
 await shot('r20-enter-real-card-game');
 const proof={url:'http://127.0.0.1:'+port+'/r20-game/',state,battle,originalSwitchPassed:true,chromeRuntimeExceptions:exceptions};
 writeFileSync(join(out,'browser-proof.json'),JSON.stringify(proof,null,2)+'\n');
 if(exceptions.length)throw Error('JS_EXCEPTIONS '+JSON.stringify(exceptions));
 console.log('R20_HOME_REAL_GPU_PASS '+JSON.stringify(proof));
}finally{try{ws?.close();}catch{} chrome.kill('SIGTERM');server.kill('SIGTERM');await wait(120);rmSync(profile,{recursive:true,force:true});}
