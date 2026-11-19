/** Chrome WebGL main-thread sync and first-cast phase timing (QA only).
 * Original 16 3D models, 60 cards, original DPR/lighting/materials unchanged.
 */
import {createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const OUT='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r174-firstcast';
mkdirSync(OUT,{recursive:true});
const variant=process.env.R174_VARIANT||'batched';
const cpu=Number(process.env.R174_CPU||2);
const prepared=variant==='prepared';
const crowd=process.env.R174_CROWD||'off';
const loops=Math.max(1,Math.min(4,Number(process.env.R174_LOOPS||2)));
const output={date:new Date().toISOString(),variant,crowd,cpu,loops,chromeCases:[],errors:[]};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
try{
 for(let run=1;run<=loops;run++){
  const context=await browser.newContext({viewport:{width:1280,height:720},
   deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await page.addInitScript(()=>{
   const proto=window.WebGL2RenderingContext?.prototype;
   if(!proto)return;
   const watched=['getProgramInfoLog','getShaderInfoLog','getProgramParameter',
    'compileShader','linkProgram','createProgram','getShaderParameter',
    'drawElements','drawArrays','texImage2D','texSubImage2D','bufferData',
    'bufferSubData','readPixels','checkFramebufferStatus','finish',
    'clientWaitSync','createShader','shaderSource','getError','useProgram'];
   const trace={enabled:false,calls:{},events:[],sumMs:0,
    reset(){this.calls={};this.events=[];this.sumMs=0;this.enabled=true},
    stop(){this.enabled=false}};
   window.__r174WebGLTrace=trace;
   for(const name of watched){
    const original=proto[name];if(typeof original!=='function')continue;
    Object.defineProperty(proto,name,{configurable:true,writable:true,value:function(...args){
     if(!trace.enabled)return original.apply(this,args);
     const start=performance.now();
     try{return original.apply(this,args)}finally{
      const took=performance.now()-start;
      let c=trace.calls[name];if(!c)c=trace.calls[name]={count:0,sum:0,max:0};
      c.count++;c.sum+=took;c.max=Math.max(c.max,took);
      trace.sumMs+=took;
      if(took>=3&&trace.events.length<160)
       trace.events.push({fn:name,ms:+took.toFixed(3),at:+start.toFixed(3)});
     }
    }});
   }
  });
  const cdp=await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
  await page.goto('http://127.0.0.1:18675/r45-duel/?qa=1&r169SchoolMagic=on&r172BatchStatic='+
    ((variant==='batched'||variant==='prepared')?'on':'off')+
    '&r174Prepare='+(prepared?'async':'off')+'&r122Crowd='+
    (crowd==='off'?'off':'on')+'&r174Crowd='+crowd+'&seed=174',
    {waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{
    timeout:110000,polling:400});
  // 30 normal warm frames before measuring, but without casting any spell.
  await page.evaluate(()=>new Promise(resolve=>{
   const f=document.querySelector('#stadium').contentWindow;
   let n=0;const tick=()=>{if(++n>=30)return resolve();f.requestAnimationFrame(tick)};
   f.requestAnimationFrame(tick);
  }));
  const loadInfo=await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow;
    return{readyPrep:f.__r45SceneQA.r174ReadyPreparation,
      shaderPrograms:f.__r45SceneQA.r174RendererProgramCount,
      loader:f.__ASDC_LOAD_METRICS.firstFrameReadyMs};
  });
  const one=await page.evaluate(async mode=>{
   const f=document.querySelector('#stadium').contentWindow,
    q=f.__r45SceneQA, gl=f.__r174WebGLTrace;
   if(!gl||typeof gl.reset!=='function')throw Error('WebGL monkeypatch not installed in stadium iframe');
   const startProg=q.r174RendererProgramCount;
   const startPlayed=q.r169SchoolMagic.played;
   const rAF=[],traceEvents=[];
   let prev=null,mark=null;
   gl.reset();
   const promise=new Promise(done=>{
    let count=0;
    const next=t=>{
     if(prev!==null)rAF.push(+(t-prev).toFixed(3));
     prev=t;
     if(++count<125)f.requestAnimationFrame(next);else done();
    };
    f.requestAnimationFrame(next);
   });
   if(mode!=='idle'&&mode!=='spellOnly'){
   f.postMessage({type:'ASDC_R46_CARD_PLAY',kind:'spell',id:'E06',
    side:'player',serial:174001},location.origin);
   }
   if(mode!=='idle'&&mode!=='cardOnly'){
   f.postMessage({type:'ASDC_R81_SPELL_RESULT',card:'E06',
    effect:'blast',damage:1,directDamage:1,side:'player',
    serial:174001,targetUids:['U17402']},location.origin);
   }
   await promise;
   gl.stop();
   const sorted=rAF.toSorted((a,b)=>a-b),percent=p=>
    sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))];
   const stats={};
   for(const [key,v] of Object.entries(gl.calls)){
    stats[key]={count:v.count,sumMs:+v.sum.toFixed(3),maxMs:+v.max.toFixed(3)};
   }
   const phases=q.r174SpellCpuPhases;
   return{
    rAF:{p50:percent(.5),p95:percent(.95),p99:percent(.99),max:percent(1),
     over50:rAF.filter(x=>x>50).length,over100:rAF.filter(x=>x>100).length,
     over200:rAF.filter(x=>x>200).length},
    programsBefore:startProg,programsAfter:q.r174RendererProgramCount,
    programDelta:q.r174RendererProgramCount-startProg,
    spellPlayed:q.r169SchoolMagic.played-startPlayed,
    buildPhase:phases[0]||null,
    glStats:stats,glSlowEvents:gl.events,
    tracedSyncMs:+gl.sumMs.toFixed(3),
    originalModels:f.__ASDC_LOAD_METRICS.modelsVerified,
    originalBytes:f.__ASDC_LOAD_METRICS.downloadedBytes,
    oldOverlays:q.magicArsenal.played,
    newPhysicalSpectatorProps:q.r169SchoolMagic.collateralLaunched,
    spectatorReactions:q.r122AccidentReceipts,
    legacySpectatorProjectiles:q.spectatorChaosFX?.launched??null,
    liveCrowdCloseupWeight:q.r123Camera?.weight??null,
    labelIsCanvas:q.r169SchoolMagic.decalTextures>0
   };
  },variant);
  const result={run,variant,crowd,cpu,loadInfo,...one,errors};
  output.chromeCases.push(result);
  console.log('R174_CPU_CASE',JSON.stringify({
    run,variant,crowd,cpu,prep:loadInfo.readyPrep,loading:loadInfo.loader,build:one.buildPhase,
    rAF:one.rAF,shaderDelta:one.programDelta,
    glTop:Object.entries(one.glStats).sort((a,b)=>b[1].sumMs-a[1].sumMs).slice(0,7),
    slowGl:one.glSlowEvents.slice(0,10),modelCount:one.originalModels,
    played:one.spellPlayed,errors
  }));
  await page.close();await context.close();
 }
}finally{
 writeFileSync(resolve(OUT,'r174-webgl-'+variant+'-'+crowd+'-'+cpu+'.json'),JSON.stringify(output,null,2));
 await browser.close();
}
if(output.chromeCases.some(c=>c.errors.length||c.spellPlayed!==(['idle','cardOnly'].includes(variant)?0:1)||
  c.originalModels!==16||c.originalBytes!==75569762))process.exitCode=2;
