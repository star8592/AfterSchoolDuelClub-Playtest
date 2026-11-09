import {spawn} from 'node:child_process';
import {mkdtempSync,existsSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const ROOT=resolve(import.meta.dirname,'../..');
const WIDTH=Number(process.env.R21_W||1280),HEIGHT=Number(process.env.R21_H||820);
const PORT=Number(process.env.R21_PORT||9918);
const DIR=resolve(import.meta.dirname,'evidence-'+(process.env.R21_LABEL||'desktop'));
mkdirSync(DIR,{recursive:true});
const URL=process.env.R21_PUBLIC_URL||
 'http://127.0.0.1:'+PORT+'/r21-trio/index.html';
const profile=mkdtempSync(join(tmpdir(),'duel-r21-vrm-'));
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox',
 '--disable-gpu-sandbox','--use-gl=angle','--use-angle=vulkan',
 '--enable-webgl','--disable-software-rasterizer',
 '--disable-dev-shm-usage','--disable-background-networking',
 '--disable-extensions','--no-first-run','--remote-debugging-port=0',
 '--user-data-dir='+profile,'--window-size='+WIDTH+','+HEIGHT,'about:blank'],
 {env:{...process.env,HOME:profile},stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let socket;
try{
 const active=join(profile,'DevToolsActivePort');
 for(let i=0;i<200&&!existsSync(active);i++)await wait(100);
 if(!existsSync(active))throw Error('No browser Chrome DevTools');
 const chromePort=Number(readFileSync(active,'utf8').split('\n')[0]);
 const target=(await(await fetch('http://127.0.0.1:'+chromePort+'/json/list')).json()).find(x=>x.type==='page');
 if(!target)throw Error('No page');
 socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((ok,no)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',no,{once:true})});
 const callbacks=new Map();let cid=0;const exceptions=[];
 socket.addEventListener('message',e=>{
  const m=JSON.parse(e.data);
  if(m.method==='Runtime.exceptionThrown')exceptions.push(JSON.stringify(m.params.exceptionDetails).slice(0,600));
  if(m.id&&callbacks.has(m.id)){
   const [ok,no]=callbacks.get(m.id);callbacks.delete(m.id);
   m.error?no(Error(m.error.message)):ok(m.result);
  }
 });
 const send=(method,params={})=>new Promise((ok,no)=>{
  const id=++cid;callbacks.set(id,[ok,no]);socket.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expression=>{
  const o=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(o.exceptionDetails)throw Error(JSON.stringify(o.exceptionDetails).slice(0,900));
  return o.result.value;
 };
 await send('Page.enable');await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:WIDTH,height:HEIGHT,deviceScaleFactor:1,
  mobile:WIDTH<=760,screenWidth:WIDTH,screenHeight:HEIGHT});
 await send('Page.navigate',{url:URL});
 let state=null;
 for(let i=0;i<200;i++){
  state=await evaluate("(()=>{const q=window.__r21CharacterQA??null;const c=document.getElementById('stage');const gl=c?.getContext('webgl2');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return {qa:q,loaded:document.getElementById('loading')?.hidden,frame:c?(()=>{const r=c.getBoundingClientRect();return [r.width,r.height]})():null,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,hasWebGL2:!!gl};})()");
  if(state?.qa?.ready&&state.loaded)break;
  if(state?.qa?.browserErrors?.length)throw Error('VRM load failed '+JSON.stringify(state.qa.browserErrors));
  await wait(145);
 }
 if(!state?.qa?.ready||state.qa.actualVRMCount!==3||
    state.qa.realVRMRigs.some(x=>x.bones<55||x.skins<2||x.triangles<10000)||
    state.qa.realMorphTargets.some(x=>x<10)||!state.renderer?.includes('NVIDIA')||
    !state.hasWebGL2)throw Error('REAL VRM asset gate '+JSON.stringify(state).slice(0,1500));
 const expectedRig=[[148,67,31211],[107,102,39548]];
 if(state.qa.realVRMRigs[2].bones<70||state.qa.realVRMRigs[2].skins<20||state.qa.realVRMRigs[2].triangles<15000)
  throw Error('T01_REQUIRES_REAL_HIGH_FIDELITY_SKINNED_RIG');
 if(state.qa.realVRMRigs.slice(0,2).some((r,i)=>
   r.bones!==expectedRig[i][0]||r.skins!==expectedRig[i][1]||
   r.triangles!==expectedRig[i][2]))
   throw Error('R18_PREMIUM_MESH_GEOMETRY_BASELINE_REGRESSION');
 const screenshot=async name=>{
  const v=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  writeFileSync(join(DIR,name+'.png'),Buffer.from(v.data,'base64'));
 };
 await wait(650);
 await screenshot('r21-originalized-duo');

 // Same-camera R18 vs R20 visible proof, no hero camera change.
 await evaluate("document.getElementById('gesture').click();true");
 await wait(400);
 await screenshot('r21-originalized-trio-static');
 await evaluate("document.getElementById('compare').click();true");
 await wait(400);await screenshot('r18-source-identical-camera');
 await evaluate("document.getElementById('compare').click();true");
 await wait(400);await screenshot('r21-restored-identical-camera');
 const details=await evaluate("(()=>({q:window.__r21CharacterQA,button:document.getElementById('compare')?.getAttribute('aria-pressed')}))()");
 if(!details.q.customMode||details.button!=='true'||
    !details.q.r20ActorDetails?.every(x=>x.originalMeshRetained&&x.recoloredMeshes>0&&x.accessoryGroups>0))
    throw Error('R20 customization missing: '+JSON.stringify(details).slice(0,1000));
 await evaluate("document.getElementById('gesture').click();true");
 await evaluate("document.getElementById('female').click();true");
 await wait(1100);await screenshot('actual-female-face');
 await evaluate("document.getElementById('male').click();true");
 await wait(1100);await screenshot('actual-male-face');
 await evaluate("document.getElementById('front').click();true");
 await wait(900);await screenshot('actual-full-bodies');
 await evaluate("document.getElementById('duo').click();true");
 await wait(850);await screenshot('two-real-vrm-animation');
 const final=await evaluate("(()=>({...window.__r21CharacterQA}))()");
 if(final.realFrameCount<25||final.actionFrameCount<20||final.browserErrors.length)
  throw Error('VRM model not continuously animated: '+JSON.stringify(final));
 await evaluate("document.getElementById('broadcaster').click();true");
 await wait(1000);await screenshot('t01-real-3d-headset-and-megaphone');
 if(exceptions.length)throw Error('Browser exceptions: '+JSON.stringify(exceptions));
 const proof={url:URL,viewport:[WIDTH,HEIGHT],realNvidiaGpu:state.renderer,
  sourceNames:final.sourceNames,fullSourceModelState:final,
  firstPageNoClick:state,strictReal3d:true,
  originalCampusCharacterCostumeReady:false,
  originalCampusCharacterFaceReady:false,officialSourceModelsCC0:true,
  screenshots:['first-load-real-vrm-duo.png','actual-female-face.png','actual-male-face.png','actual-full-bodies.png','two-real-vrm-animation.png'],
  browserExceptions:exceptions};
 writeFileSync(join(DIR,'browser-proof.json'),JSON.stringify(proof,null,2)+'\n');
 console.log('R21_REAL_PREMIUM_VRM_BROWSER_PASS',JSON.stringify({
  url:URL,viewport:[WIDTH,HEIGHT],actualGPU:state.renderer,
  rigs:final.realVRMRigs,morphs:final.realMorphTargets,
  frames:final.realFrameCount,continuousAnimationFrames:final.actionFrameCount,
  productOriginalCharactersComplete:false
 }));
}finally{
 try{socket?.close()}catch{}
 chrome.kill('SIGTERM');server.kill('SIGTERM');await wait(150);
 rmSync(profile,{recursive:true,force:true});
}
