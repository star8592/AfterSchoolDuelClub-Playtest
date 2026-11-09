import {spawn} from 'node:child_process';
import {mkdtempSync,existsSync,readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const ROOT=resolve(import.meta.dirname,'../..'),PORT=Number(process.env.R22_CARD_PORT||9956);
const WIDTH=Number(process.env.R22_CARD_W||1280),HEIGHT=Number(process.env.R22_CARD_H||820);
const out=resolve(import.meta.dirname,'evidence-'+(process.env.R22_CARD_LABEL||'desktop'));
mkdirSync(out,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'duel-r22-3d-cards-'));
const server=spawn('python3',['-m','http.server',String(PORT),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu-sandbox',
 '--use-gl=angle','--use-angle=vulkan','--enable-webgl','--disable-software-rasterizer',
 '--disable-dev-shm-usage','--disable-background-networking','--disable-extensions','--no-first-run',
 '--remote-debugging-port=0','--user-data-dir='+profile,'--window-size='+WIDTH+','+HEIGHT,'about:blank'],
 {env:{...process.env,HOME:profile},stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try{
 const active=join(profile,'DevToolsActivePort');
 for(let i=0;i<150&&!existsSync(active);i++)await wait(100);
 if(!existsSync(active))throw Error('no Chrome CDP');
 const cp=Number(readFileSync(active,'utf8').split('\n')[0]);
 const t=(await(await fetch('http://127.0.0.1:'+cp+'/json/list')).json()).find(x=>x.type==='page');
 ws=new WebSocket(t.webSocketDebuggerUrl);
 await new Promise((yes,no)=>{ws.addEventListener('open',yes,{once:true});ws.addEventListener('error',no,{once:true})});
 let id=0;const reqs=new Map(),exceptions=[];
 ws.addEventListener('message',ev=>{
  const a=JSON.parse(ev.data);
  if(a.method==='Runtime.exceptionThrown')exceptions.push(a.params.exceptionDetails.text);
  if(reqs.has(a.id)){const [yes,no]=reqs.get(a.id);reqs.delete(a.id);a.error?no(Error(a.error.message)):yes(a.result);}
 });
 const send=(method,params={})=>new Promise((yes,no)=>{const i=++id;reqs.set(i,[yes,no]);ws.send(JSON.stringify({id:i,method,params}));});
 const evalJS=async expression=>{const a=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(a.exceptionDetails)throw Error(JSON.stringify(a.exceptionDetails));return a.result.value;};
 await send('Page.enable');await send('Runtime.enable');
 await send('Emulation.setDeviceMetricsOverride',{width:WIDTH,height:HEIGHT,deviceScaleFactor:1,
  mobile:WIDTH<=760,screenWidth:WIDTH,screenHeight:HEIGHT});
 await send('Page.navigate',{url:'http://127.0.0.1:'+PORT+'/r22-card-lab/index.html'});
 let actual=null;
 for(let i=0;i<160;i++){
  actual=await evalJS("(()=>{const q=window.__r22CardModelQA,c=document.getElementById('stage'),gl=c?.getContext('webgl2');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return {q,realWebGL2:!!gl,renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):null}})()");
  if(actual?.q?.ready)break;
  if(actual?.q?.browserErrors?.length)throw Error('GLB import failure '+JSON.stringify(actual));
  await wait(150);
 }
 if(!actual?.q?.ready||actual.q.modelIds.join(',')!=='E02,T02'||
   actual.q.actualMeshes.some(n=>n<10)||actual.q.triangles.some(n=>n<2000)||
   !actual.realWebGL2||!actual.renderer?.includes('NVIDIA'))
   throw Error('real 3D asset WebGL gate '+JSON.stringify(actual));
 const screenshot=async n=>{const a=await send('Page.captureScreenshot',{format:'png',fromSurface:true});writeFileSync(join(out,n+'.png'),Buffer.from(a.data,'base64'))};
 await wait(450);await screenshot('r22-two-real-card-3d-prototypes');
 await evalJS("document.getElementById('paper').click();true");await wait(650);
 await screenshot('E02-original-folded-plane-3d');
 await evalJS("document.getElementById('menu').click();true");await wait(650);
 await screenshot('T02-original-animated-menu-3d');
 const final=await evalJS("({...window.__r22CardModelQA})");
 if(final.drawFrames<25||exceptions.length)throw Error('R22 proto real render insufficient '+JSON.stringify({frames:final.drawFrames,exceptions}));
 writeFileSync(join(out,'browser-proof.json'),JSON.stringify({url:'http://127.0.0.1:'+PORT,viewport:[WIDTH,HEIGHT],
  actual,final,exceptions,licenses:'SELF_AUTHORED_BLENDER_GEOMETRY',productionArtApproved:false},null,2)+'\n');
 console.log('R22_CARD_MODEL_TRUE_GPU_PASS',JSON.stringify({renderer:actual.renderer,viewport:[WIDTH,HEIGHT],
  ids:final.modelIds,meshes:final.actualMeshes,triangles:final.triangles,frames:final.drawFrames,errors:exceptions}));
}finally{
 try{ws?.close()}catch{}chrome.kill('SIGTERM');server.kill('SIGTERM');await wait(150);rmSync(profile,{recursive:true,force:true});
}
