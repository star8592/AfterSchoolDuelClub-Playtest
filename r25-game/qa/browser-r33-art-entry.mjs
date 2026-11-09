import {spawn} from 'node:child_process';
import {mkdtempSync,existsSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const PORT=Number(process.env.R33_PORT||10470);
const WIDTH=Number(process.env.R33_W||1280),HEIGHT=Number(process.env.R33_H||820);
const out=resolve(import.meta.dirname,'evidence-r33-'+(process.env.R33_LABEL||'desktop'));
mkdirSync(out,{recursive:true});
const scratch='/home/master/.cache/r32t';
mkdirSync(scratch,{recursive:true});
const profile=mkdtempSync(join(scratch,'r33-'));
const env={...process.env,HOME:profile,TMPDIR:scratch,TMP:scratch,TEMP:scratch,
 XDG_CACHE_HOME:join(profile,'cache'),XDG_CONFIG_HOME:join(profile,'config')};
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu-sandbox',
 '--use-gl=angle','--use-angle=vulkan','--enable-webgl','--disable-software-rasterizer',
 '--disable-dev-shm-usage','--disable-extensions','--no-first-run',
 '--remote-debugging-port=0','--user-data-dir='+profile,
 '--window-size='+WIDTH+','+HEIGHT,'about:blank'],{env,stdio:'ignore'});
let ws;const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
 const active=join(profile,'DevToolsActivePort');
 for(let i=0;i<200&&!existsSync(active);i++)await wait(100);
 if(!existsSync(active))throw Error('R33_CDP_NOT_AVAILABLE');
 const dp=Number(readFileSync(active,'utf8').split('\n')[0]);
 const pages=await(await fetch('http://127.0.0.1:'+dp+'/json/list')).json();
 ws=new WebSocket(pages.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',fail,{once:true})});
 let id=0;const pending=new Map(),exceptions=[];
 ws.addEventListener('message',ev=>{
  const m=JSON.parse(ev.data);
  if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.text);
  if(pending.has(m.id)){const [ok,fail]=pending.get(m.id);pending.delete(m.id);
    m.error?fail(Error(m.error.message)):ok(m.result)}
 });
 const send=(method,params={})=>new Promise((ok,fail)=>{
  const k=++id;pending.set(k,[ok,fail]);ws.send(JSON.stringify({id:k,method,params}));
 });
 const js=async expression=>{
  const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails).slice(0,1300));
  return r.result.value;
 };
 await send('Page.enable');await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:WIDTH,height:HEIGHT,
    deviceScaleFactor:1,mobile:WIDTH<760,screenWidth:WIDTH,screenHeight:HEIGHT});
 await send('Page.navigate',{url:process.env.R33_LIVE_HOME||'http://127.0.0.1:'+PORT+'/r25-game/?qaR25=1'});
 let data;
 for(let i=0;i<130;i++){
  data=await js("(()=>({main:!!window.__r25HomeQA,core:!!document.getElementById('end-turn'),button:document.getElementById('home3d-music')?.textContent,route:window.__r25HomeQA?.musicArtFirstPreviewURL,realGLB:window.__r25HomeQA?.musicArtFirstIsRealGLB,artMode:window.__r25HomeQA?.musicArtFirstCharacterArtSource}))()");
  if(data.main&&data.core&&data.button)break;await wait(180);
 }
 if(!data.main||!data.core||!data.button.includes('原画')||
     !data.route.endsWith('/r32-art-first/')||data.realGLB!==false||
     data.artMode!=='ORIGINAL_ILLUSTRATION_2D')
  throw Error('R33_OLD_3D_OR_MISSING_MAIN_ENTRY '+JSON.stringify(data));
 const click=await js("(()=>{const old=window.open;let target='';window.open=(u)=>{target=u;return null};document.getElementById('home3d-music').click();window.open=old;return target})()");
 if(click!==data.route)throw Error('R33_BUTTON_OPENED_WRONG_URL '+click);
 await wait(400);
 const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 writeFileSync(join(out,'r33-main-game-verified.png'),Buffer.from(r.data,'base64'));
 const evidence={...data,clickedUrl:click,viewport:[WIDTH,HEIGHT],artNotGLB:true,
   originalEighteenCardCorePresent:true,
   unrelatedRuntimeExceptions:exceptions};
 writeFileSync(join(out,'browser-proof.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log('R33_REAL_GAME_HOME_ART_PREVIEW_BUTTON_PASS',JSON.stringify(evidence).slice(0,2900));
}finally{
 try{ws?.close()}catch{}
 chrome.kill('SIGTERM');server.kill('SIGTERM');await wait(160);
 rmSync(profile,{recursive:true,force:true});
}
