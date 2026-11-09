import {spawn} from 'node:child_process';
import {mkdtempSync,existsSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const ROOT=resolve(import.meta.dirname,'../..'),port=9976;
const profile=mkdtempSync(join(tmpdir(),'duel-r23-card-portraits-'));
const srv=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:ROOT,stdio:'ignore'});
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox',
 '--disable-dev-shm-usage','--use-gl=angle','--use-angle=vulkan','--enable-webgl',
 '--disable-software-rasterizer','--no-first-run','--remote-debugging-port=0',
 '--user-data-dir='+profile,'about:blank'],{env:{...process.env,HOME:profile},stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));let ws;
try{
 const file=join(profile,'DevToolsActivePort');
 for(let i=0;i<150&&!existsSync(file);i++)await wait(100);
 if(!existsSync(file))throw Error('Chrome missing');
 const cp=Number(readFileSync(file,'utf8').split('\n')[0]);
 const t=(await(await fetch('http://127.0.0.1:'+cp+'/json/list')).json()).find(x=>x.type==='page');
 ws=new WebSocket(t.webSocketDebuggerUrl);
 await new Promise((ok,no)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',no,{once:true})});
 let id=0;const pending=new Map();
 ws.addEventListener('message',ev=>{
  const r=JSON.parse(ev.data);if(pending.has(r.id)){const [ok,no]=pending.get(r.id);pending.delete(r.id);
   r.error?no(Error(r.error.message)):ok(r.result);}
 });
 const send=(method,params={})=>new Promise((ok,no)=>{const x=++id;pending.set(x,[ok,no]);
  ws.send(JSON.stringify({id:x,method,params}));});
 const evaluate=async expression=>{
  const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
 };
 await send('Page.enable');await send('Runtime.enable');
 await send('Page.navigate',{url:'http://127.0.0.1:'+port+'/r23-card-lab/portrait-workbench.html'});
 let q;
 for(let i=0;i<150;i++){
  q=await evaluate("(()=>({ready:!!window.__r23PortraitQA?.ready,errors:window.__r23PortraitQA?.errors||[],count:window.__r23PortraitQA?.assets?.length||0}))()");
  if(q.ready)break;
  if(q.errors.length)throw Error('portrait render failure '+JSON.stringify(q));
  await wait(200);
 }
 if(!q.ready||q.count!==2)throw Error('portrait QA failed '+JSON.stringify(q));
 for(const id of ['E02','T02']){
  const str=await evaluate("window.__r23PortraitQA.assets.find(x=>x.id==='"+id+"').png");
  if(!str?.startsWith('data:image/png;base64,'))throw Error('missing raw transparency '+id);
  const path=resolve(import.meta.dirname,'../assets/card-model-portraits/'+id+'.png');
  const bytes=Buffer.from(str.slice(22),'base64');
  if(bytes.length<15000)throw Error('visually insufficient PNG '+id+' '+bytes.length);
  writeFileSync(path,bytes);
  console.log('REAL_R23_GLTF_TRANSPARENT_PORTRAIT',id,bytes.length,path);
 }
}finally{try{ws?.close()}catch{}chrome.kill('SIGTERM');srv.kill('SIGTERM');await wait(150);rmSync(profile,{recursive:true,force:true})}
