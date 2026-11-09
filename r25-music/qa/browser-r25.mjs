import {spawn} from 'node:child_process';
import {mkdtempSync,existsSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const ROOT=resolve(import.meta.dirname,'../..');
const WIDTH=Number(process.env.R25_W||1280),HEIGHT=Number(process.env.R25_H||820);
const PORT=Number(process.env.R25_PORT||9918);
const DIR=resolve(import.meta.dirname,'evidence-'+(process.env.R25_LABEL||'desktop'));
mkdirSync(DIR,{recursive:true});
const URL=process.env.R25_PUBLIC_URL||
 'http://127.0.0.1:'+PORT+'/r25-music/index.html';
const profile=mkdtempSync(join(tmpdir(),'duel-r25-vrm-'));
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
  state=await evaluate("(()=>{const q=window.__r25MusicTeacherQA??null;const c=document.getElementById('stage');const gl=c?.getContext('webgl2');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return {qa:q,loaded:document.getElementById('loading')?.hidden,frame:c?(()=>{const r=c.getBoundingClientRect();return [r.width,r.height]})():null,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null,hasWebGL2:!!gl};})()");
  if(state?.qa?.ready&&state.loaded)break;
  if(state?.qa?.browserErrors?.length)throw Error('VRM load failed '+JSON.stringify(state.qa.browserErrors));
  await wait(145);
 }
 if(state?.qa?.ready&&!state.qa.hdrEnvironmentLoaded)throw Error('R25_HDRI_PBR_NOT_LOADED '+JSON.stringify(state.qa.hdrError||'missing'));
 if(!state?.qa?.ready||state.qa.actualVRMCount!==1||
    state.qa.realVRMRigs.some(x=>x.bones<55||x.skins<2||x.triangles<10000)||
    state.qa.realMorphTargets.some(x=>x<10)||!state.renderer?.includes('NVIDIA')||
    !state.hasWebGL2)throw Error('REAL VRM asset gate '+JSON.stringify(state).slice(0,1500));
 const rig=state.qa.realVRMRigs[0];
 if(rig.bones!==107||rig.skins!==102||rig.triangles!==39548||
    state.qa.musicSourceBoneCount!==107||state.qa.musicSourceSkinnedMeshes!==102||
    state.qa.musicAccessories<10||state.qa.modelOriginality!=='SOURCE_VRM_DERIVED_NOT_FINAL')
  throw Error('MUSIC_TEACHER_HIGH_FIDELITY_BASE_OR_CUSTOM_PROPS_FAILED '+JSON.stringify(state.qa).slice(0,2200));
 const screenshot=async name=>{
  const v=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  writeFileSync(join(DIR,name+'.png'),Buffer.from(v.data,'base64'));
 };
 await wait(700);
 await screenshot('r25-music-teacher-fullbody');
 await evaluate("document.getElementById('gesture').click();true");
 await wait(350);await screenshot('r25-music-teacher-idle');
 await evaluate("document.getElementById('gesture').click();true");
 await wait(1700);await screenshot('r25-music-teacher-conducting-performance');
 const phase=await evaluate("window.__r25MusicTeacherQA.musicPhase");
 if(!['orchestra_attack','conducting','idle'].includes(phase))throw Error('R25_MUSIC_ANIMATION_MISSING '+phase);
 await evaluate("document.getElementById('female').click();true");
 await wait(900);await screenshot('r25-music-teacher-face');
 await evaluate("document.getElementById('male').click();true");
 await wait(900);await screenshot('r25-music-teacher-side');
 await evaluate("document.getElementById('front').click();true");
 await wait(700);await screenshot('r25-music-teacher-wide');
 await evaluate("document.getElementById('duo').click();true");
 await wait(700);
 await screenshot('r25-pbr-same-camera');
 await evaluate("document.getElementById('depth').click();true");
 await wait(500);await screenshot('r25-toon-same-camera');
 if(await evaluate("window.__r25MusicTeacherQA.depthMode")!=='toon')
  throw Error('R25_TOON_REFERENCE_FAILED');
 await evaluate("document.getElementById('depth').click();true");
 await evaluate("document.getElementById('compare').click();true");
 await wait(500);await screenshot('r25-source-vrm-same-camera');
 if(await evaluate("window.__r25MusicTeacherQA.customMode")!==false)
  throw Error('R25_SOURCE_VRM_COMPARISON_FAILED');
 await evaluate("document.getElementById('compare').click();true");
 await wait(500);await screenshot('r25-custom-restored-same-camera');
 const final=await evaluate("({...window.__r25MusicTeacherQA})");
 if(!final.customMode||final.musicPerformanceFrames<80||
    final.realFrameCount<100||final.actionFrameCount<70||final.browserErrors.length)
  throw Error('R25_MUSIC_TEACHER_ANIMATION_OR_RESTORATION '+JSON.stringify(final).slice(0,2200));
 if(exceptions.length)throw Error('Browser exceptions: '+JSON.stringify(exceptions));
 const proof={url:URL,viewport:[WIDTH,HEIGHT],realNvidiaGpu:state.renderer,
  character:'M01 音乐老师',cardExpansionStatus:'PROPOSED_NOT_PLAYABLE',
  originalFaceSculptComplete:false,professionalAnimationApproved:false,
  trueVRM:final.realVRMRigs,sourceModelsCC0:true,
  musicAnimationFrames:final.musicPerformanceFrames,
  screenshotEvidence:'same_camera_source_custom_and_pbr_toon',
  browserExceptions:exceptions};
 writeFileSync(join(DIR,'browser-proof.json'),JSON.stringify(proof,null,2)+'\n');
 console.log('R25_MUSIC_TEACHER_REAL_GPU_PASS',JSON.stringify(proof));
}finally{
 try{socket?.close()}catch{}
 chrome.kill('SIGTERM');server.kill('SIGTERM');await wait(150);
 rmSync(profile,{recursive:true,force:true});
}
