/** Independent XPS Intel UHD630 PC magic test using Chrome remote debugging. */
import{writeFileSync}from'node:fs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const targets=await fetch('http://127.0.0.1:19225/json/list').then(r=>r.json());
const tab=targets.find(t=>t.type==='page');if(!tab)throw Error('XPS no Chrome tab');
const ws=new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((ok,no)=>{ws.onopen=ok;ws.onerror=no});
let seq=0;const pending=new Map(),errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);
 if(m.id&&pending.has(m.id)){const {ok,no}=pending.get(m.id);pending.delete(m.id);
  m.error?no(Error(JSON.stringify(m.error))):ok(m.result)}
 if(m.method==='Runtime.exceptionThrown')errors.push('JS '+m.params.exceptionDetails.text);
 if(m.method==='Network.responseReceived'&&m.params.response.status>=400)
  errors.push('HTTP '+m.params.response.status+' '+m.params.response.url);
};
const cmd=(method,params={})=>new Promise((ok,no)=>{
 const id=++seq;pending.set(id,{ok,no});ws.send(JSON.stringify({id,method,params}));
});
const js=async expression=>{
 const v=await cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(v.exceptionDetails)throw Error(v.exceptionDetails.text);
 return v.result?.value;
};
const url='http://10.10.10.138:18689/r45-duel/?qa=1&seed=2&deck=kitchen&r199PhysicalMagic=on';
const report={source:'independent XPS 15 Intel UHD630 Linux Chrome 155',
 url,pass:false,errors,tests:[]};
try{
 await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Network.enable');
 const started=Date.now();
 await cmd('Page.navigate',{url});
 let ready=false;
 for(let i=0;i<105;i++){
  await sleep(1000);
  const state=await js(`(()=>{const f=document.getElementById('stadium')?.contentWindow;
   return {ready:window.__r45QA?.sceneReady===true,models:f?.__ASDC_LOAD_METRICS?.modelsVerified??0,
    magic:f?.__r45SceneQA?.r199RealMagic?.enabled??false,
    turn:window.__r45QA?.round};})()`);
  if(state?.ready&&state.models>=16&&state.magic){ready=true;report.initial=state;break;}
 }
 report.readyMs=Date.now()-started;
 if(!ready)throw Error('XPS stage did not reach 16 real VRM/GLB sources');
 report.tests.push('16 genuine source models and physical spell stage ready');
 const cast=await js(`(()=>{const c=document.querySelector('#hand .card[data-card-id="K05"]');
  if(!c||c.disabled)return {ok:false,reason:c?.title||'K05 not in hand'};
  c.click();const p=document.getElementById('play');if(p.disabled)return {ok:false,reason:'play disabled'};
  p.click();return {ok:true};})()`);
 if(!cast.ok)throw Error(JSON.stringify(cast));
 let played=false;
 for(let i=0;i<60;i++){
  await sleep(450);
  const data=await js(`(()=>{const q=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
   return {spell:z?.r199RealMagic,legacy:z?.magicArsenal?.played,
    oldImpact:z?.spellImpact?.played,events:q?.events?.filter(x=>x.type==='card_play').map(x=>x.card),
    camera:z?.r145ActionShot?.enabled,heroInset:z?.renderPerformance?.heroInsetDraws,
    gpu:z?.renderInfo};
  })()`);
  if(data?.spell?.stage?.lastBySide?.player==='K05'){
   played=true;report.after=data;break;
  }
 }
 if(!played)throw Error('Real K05 card did not generate physical school magic');
 if(!report.after.spell.loadedIds.includes('K05'))throw Error('K05 genuine GLB not loaded');
 if(report.after.spell.stage.shaderPointLights!==0||report.after.legacy!==0||
   report.after.oldImpact!==0)throw Error('Old generic light effects were triggered');
 if(report.after.camera!==false||report.after.heroInset!==0)
   throw Error('User-prohibited closeup triggered');
 const img=await cmd('Page.captureScreenshot',{format:'jpeg',quality:82,captureBeyondViewport:false});
 writeFileSync('/tmp/r201-xps-intel-k05-real-magic.jpg',Buffer.from(img.data,'base64'));
 report.tests.push('Real hand K05 spell authored GLB with physical staging; no old lights/closeup');
 report.pass=true;
 console.log('R201_INDEPENDENT_XPS_REAL_K05_PASS',JSON.stringify({
  readyMs:report.readyMs,card:'K05',loadedIds:report.after.spell.loadedIds,
  mesh:report.after.spell.loadedAssetDetails.find(x=>x.id==='K05')?.meshes,
  oldLights:report.after.legacy,errors}));
}catch(e){report.failure=String(e);console.error('R199_XPS_FAILURE',report.failure)}
finally{
 writeFileSync('/tmp/r201-xps-real-magic.json',JSON.stringify(report,null,2)+'\n');
 ws.close();
 if(!report.pass)process.exitCode=1;
}
