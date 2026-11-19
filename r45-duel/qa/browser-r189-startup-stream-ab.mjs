/**
 * R173 full original Web duel integration. 46 spells twice, CPU longtask and
 * first-cast shader count. Every test instance is isolated to a fresh Chrome
 * context. No production change, no graphic detail reduction.
 */
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const primeMode=process.env.R178_PRIME||'off';
const pair={playerId:process.env.R178_PLAYER||'T01',aiId:process.env.R178_AI||'E03'};
const r186Id=process.env.R186_ID||'P01';
const firstCard=r186Id;
const selectPrime=process.env.R186_PRIME==='on';
const interleave=process.env.R187_INTERLEAVE||'off';
const owlTex=process.env.R187_OWL_TEX||'off';
const owlAlt=process.env.R188_OWL||'off';
const r188Run=process.env.R188_RUN||'0';
const r189Stream=process.env.R189_STREAM==='on';
const r189BgConcurrency=process.env.R189_BG_CONCURRENCY||'1';
const r189BgDelay=process.env.R189_BG_DELAY||'1100';
const stadiumBatch=true;
const hairBatch=process.env.R181_HAIR==='on';
const primeHero=process.env.R179_PRIME_HERO==='on';
const OUT='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r189-startup-stream/'+pair.playerId+'-'+pair.aiId+'-'+(hairBatch?'hairON':'hairOFF')+'-'+primeMode+'-'+firstCard+'-selected'+(selectPrime?'warm':'cold')+'-interleave'+(interleave==='off'?'off':interleave)+'-owl'+owlTex+'-alt'+owlAlt+'-r189'+(r189Stream?'on':'off')+'-bg'+r189BgConcurrency+'-delay'+r189BgDelay+'-run'+r188Run+'-hero'+(primeHero?'on':'off')+'-'+(process.env.R173_VIEW||'desktop');
mkdirSync(OUT,{recursive:true});
const view=process.env.R173_VIEW||'desktop';
const mode=process.env.R173_MODE||'batched';
const cpu=Number(process.env.R173_CPU||2);
const on=mode==='batched',mobile=view==='mobile';
const id=view+'-'+mode+'-cpu'+cpu;
const report={id,start:new Date().toISOString(),view,mode,cpu,r188Run,errors:[],
 hardware:'Z890 RTX5070Ti Chrome Vulkan (mobile viewport emulation is not Android GPU)'};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
try{
 const ctx=await browser.newContext({
  viewport:mobile?{width:430,height:900}:{width:1280,height:720},
  deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
 const page=await ctx.newPage();
 page.on('pageerror',e=>report.errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url().slice(-75))});
 page.on('requestfailed',r=>report.errors.push('NET '+r.url().slice(-75)+' '+r.failure()?.errorText));
 const cdp=await ctx.newCDPSession(page);
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
 const qp=new URLSearchParams({qa:'1',seed:'173',r169SchoolMagic:'on',
  r172BatchStatic:on?'on':'off',r122Crowd:'off',r174Crowd:'physical',
  r176PrimeBoard:primeMode==='pair'?'on':'off',r178PrimeAll:primeMode==='all'?'on':'off',
  r178PrimeHand:primeMode==='hand'?'on':'off',
  r179PrimeTwo:primeMode==='two'?'on':'off',
  r179PairP:pair.playerId,r179PairA:pair.aiId,
  r179PrimeFrog:primeHero?'on':'off',r180StadiumBatch:'on',r181HairBatch:hairBatch?'on':'off',
  r175HeroE06:'on',r178HeroK01:'on',r179HeroK07:'on',r186Hero:r186Id,
  r186PrimeSelected:selectPrime?'on':'off',
  r187Interleave:interleave,r187OwlTex:owlTex,r188Owl:owlAlt,
  r189Stream:r189Stream?'on':'off',
  r189BgConcurrency,r189BgDelay});
 await page.goto('http://127.0.0.1:18686/r45-duel/?'+qp,
  {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{
  timeout:110000,polling:400});
 report.initial=await page.evaluate(async({pair,r186Id})=>{
  const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
  const {COMIC_BEATS}=await import('/r45-duel/audio-engine.mjs');
  const {CARDS}=await import('/r45-duel/engine.mjs');
  const {SCHOOL_GESTURE_FAMILIES}=await import('/r45-duel/scene/campus-spell-gesture.mjs');
  const cards=CARDS.filter(x=>x.kind==='spell');
  const units={player:[{uid:'U17301',id:pair.playerId,hp:9,attack:4,shield:0}],
   ai:[{uid:'U17302',id:pair.aiId,hp:8,attack:4,shield:0}]};
  f.postMessage({type:'ASDC_R45_BOARD',units,player:[pair.playerId],ai:[pair.aiId]},location.origin);
  f.__r173LongTasks=[];
  const obs=new f.PerformanceObserver(list=>{
   for(const e of list.getEntries())f.__r173LongTasks.push({
    duration:+e.duration.toFixed(3),start:+e.startTime.toFixed(3)});
  });
  obs.observe({entryTypes:['longtask']});f.__r173Observer=obs;
  const patterns=Object.entries(COMIC_BEATS).filter(([k])=>k.startsWith('school_'));
  return {models:f.__ASDC_LOAD_METRICS.modelsVerified,
   bytes:f.__ASDC_LOAD_METRICS.downloadedBytes,
   cards:window.__r45QA.cardCount,source:q.sourceMatchesR22,
   beforePrograms:q.r173ShaderPrograms,prime:q.r176PrimeBoardReceipt,
   primeAll:q.r178AllPrimeReceipt,primeHand:q.r178HandPrimeReceipt,
   primeTwo:q.r179TwoPrimeReceipt,
   primeHero:q.r179FrogGpuReceipt,
   stadiumBatch:q.r180StadiumBatch,hairBatch:q.r181HairBatch,rig:q.r180SkinAudit,
   authoredHighDetailAssets:q.r169SchoolMagic.authoredHighDetailAssets,
   selectedNewHero:q.r186HeroLoad,
   r186SelectedPrewarm:q.r186SelectedPrewarm,
   r187InterleaveReceipt:q.r187InterleaveReceipt,
   r189StreamReceipt:q.r189StreamReceipt,
   r189Player:window.__r45QA.r189Stream,
   owlRuntimeSource:q.summonModels.find(x=>x.id==='T01')?.file,
   owlActualMeshCount:q.summonModels.find(x=>x.id==='T01')?.meshes,
   owlActualSourceClips:q.summonModels.find(x=>x.id==='T01')?.clips,
   startupMs:f.__ASDC_LOAD_METRICS.firstFrameReadyMs,noFloatingPortrait:q.r173NoFloatingPortrait,
   gestureFamilies:SCHOOL_GESTURE_FAMILIES.length,
   spells:cards.map(x=>({id:x.id,effect:x.effect})),
   soundPatterns:patterns.length,originalFoleyUpgrades:
   patterns.filter(([,p])=>p.some(x=>x[0].startsWith('r171_'))).length,
   r184OriginalSoundPatterns:patterns.filter(([,p])=>
     p.some(x=>x[0].startsWith('r184_'))).length,
   r185PriorSoundPatterns:patterns.filter(([,p])=>
     p.some(x=>x[0].startsWith('r185_'))).length,
   r186NewOriginalSoundPatterns:patterns.filter(([,p])=>
     p.some(x=>x[0].startsWith('r186_'))).length,
   r186SelectedSoundClip:(COMIC_BEATS['school_'+r186Id]||[])
     .map(x=>x[0]).find(x=>x==='r186_'+r186Id.toLowerCase())||null,
   cameraSafe:!q.r145ActionShot.enabled};
 },{pair,r186Id});
 const init=report.initial;
 if((r189Stream?!(init.models>=4&&init.models<16):init.models!==16)||
  (!r189Stream&&(owlAlt!=='off'?
   !(init.bytes>60000000&&init.bytes<75569762):
   owlTex==='off'?init.bytes!==75569762:
   !(init.bytes>60000000&&init.bytes<75569762)))||
  (r189Stream&&(!init.r189StreamReceipt?.enabled||
   !init.r189StreamReceipt?.hasNoProxy||
   !init.r189StreamReceipt?.initialRealGLBs?.every(id=>
    init.r189StreamReceipt.loadedNow.includes(id))||
   !init.r189Player?.enabled||
   init.r189Player?.allReady))||
  init.cards!==60||
  !init.source||!init.noFloatingPortrait||init.soundPatterns!==46||
  init.r184OriginalSoundPatterns!==10||
  init.r185PriorSoundPatterns!==10||
  init.r186NewOriginalSoundPatterns!==9||
  init.r186SelectedSoundClip!=='r186_'+r186Id.toLowerCase()||
  init.spells.length!==46||
  init.gestureFamilies<10||!init.cameraSafe||
  (!r189Stream&&(owlAlt!=='off'?
   init.owlRuntimeSource!==(owlAlt==='radio'?'T01-BroadcastOwl-PolyforkRadio-R73.glb':
      'T01-BroadcastOwl-BarnOwl.glb'):
   owlTex==='off'?
    init.owlRuntimeSource!=='T01-Owl-Innerscene-R84.glb':
    init.owlRuntimeSource!=='T01-Owl-Innerscene-R187-'+owlTex+'.glb')))
  throw Error('R173 source mismatch '+JSON.stringify(init));
 // The substitute must really PLAY its own authored skeletal animation;
 // a GLB with four dead clip names does not count as a working character.
 report.realOwlSkeleton=await page.evaluate(async()=>{
  const f=document.querySelector('#stadium').contentWindow;
  for(let n=0;n<20;n++){
   const o=f.__r45SceneQA?.summonPresence?.entries?.find(e=>e.id==='T01');
   if(o)return{loaded:true,visible:o.visible,
    actualMeshes:o.meshes,actualClips:o.clips,
    playingClips:o.playingClips,
    position:o.position,screen:o.screen,
    realSourceFeatherRig:o.r127OwlMotion||null};
   await new Promise(done=>f.requestAnimationFrame(done));
  }
  return{loaded:false};
 });
 if(owlAlt!=='off'&&!r189Stream&&(pair.playerId==='T01'||pair.aiId==='T01')&&
  (!report.realOwlSkeleton.loaded||
  !report.realOwlSkeleton.playingClips?.length||
  report.realOwlSkeleton.actualClips!==4||
  report.realOwlSkeleton.actualMeshes!==(owlAlt==='radio'?16:1)))
   throw Error('R188 alternative owl must visibly play native authored skeletal clips '+JSON.stringify(report.realOwlSkeleton));
 const warm=Number(process.env.R174_BOARD_WARM||0);
 if(warm){
  report.boardWarm=await page.evaluate(async n=>{
   const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
   const before=q.r173ShaderPrograms,deltas=[];
   await new Promise(resolve=>{
    let last=0,count=0;
    const tick=t=>{
     if(last)deltas.push(t-last);last=t;
     if(++count<n)f.requestAnimationFrame(tick);else resolve();
    };f.requestAnimationFrame(tick);
   });
   const sorted=deltas.toSorted((a,b)=>a-b);
   return{max:sorted.at(-1),p99:sorted[Math.floor(sorted.length*.99)],
    shaderDelta:q.r173ShaderPrograms-before,frames:deltas.length,
    hostHits:q.actualHostHits};
  },warm);
 }
 console.log('R174_BOARD_PHASE',JSON.stringify({
  warm,board:report.boardWarm||null,models:init.models,programsBefore:init.beforePrograms
 }));
 const first=init.spells.find(x=>x.id===firstCard);
 report.cold=await page.evaluate(async first=>{
  const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
  const shaderStart=q.r173ShaderPrograms;
  const before=f.__r173LongTasks.length,frames=[];
  const samples=new Promise(done=>{
   let prev=0, n=0;
   const tick=now=>{
    if(prev)frames.push(now-prev);
    prev=now;
    if(++n===1){
     // Schedule casting ON the sampled frame boundary so the next rAF
     // interval captures initial board and spell shader stalls.
     f.postMessage({type:'ASDC_R46_CARD_PLAY',side:'player',
      serial:173001,id:first.id,kind:'spell'},location.origin);
     f.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',serial:173001,
      card:first.id,effect:first.effect,directDamage:1,damage:1,targetUids:['U17302']},location.origin);
    }
    if(n<130)f.requestAnimationFrame(tick);
    else done();
   };f.requestAnimationFrame(tick);
  });
  await samples;
  const sorted=frames.toSorted((a,b)=>a-b),pick=p=>
   +sorted[Math.min(sorted.length-1,Math.floor(sorted.length*p))].toFixed(3);
  const tasks=f.__r173LongTasks.slice(before);
  return {frameCount:frames.length,p50:pick(.5),p95:pick(.95),
   p99:pick(.99),max:pick(1),longTaskMax:Math.max(0,...tasks.map(x=>x.duration)),
   longTasks:tasks,programsStart:shaderStart,programsEnd:q.r173ShaderPrograms,
   shaderDelta:q.r173ShaderPrograms-shaderStart,
   played:q.r169SchoolMagic.played,duelists:q.duelistHosts.map(x=>({
    side:x.side,posture:x.posture})),
   portraitInsetDraws:q.renderPerformance.heroInsetDraws};
 },first);
 if(r189Stream){
  const phaseStart=Date.now();
  await page.waitForFunction(()=>window.__r45QA?.r189Stream?.allReady===true,
    null,{timeout:110000,polling:100});
  report.background=await page.evaluate(()=>{
    const f=document.querySelector('#stadium').contentWindow;
    const longTasks=Array.isArray(f.__r173LongTasks)?f.__r173LongTasks:[];
    return {tailLongTasks:longTasks,
     tailMaxLongTaskMs:Math.max(0,...longTasks.map(x=>x.duration)),
     player:window.__r45QA.r189Stream,
     scene:f.__r45SceneQA.r189StreamReceipt,
     metrics:{...f.__ASDC_LOAD_METRICS}};
  });
  /* R189 measures the actual background complete timeframe, not the
     duration of this wait after other checks have consumed time. */


  report.tailWaitMs=Date.now()-phaseStart;
  if(report.background.scene.loadedNow.length!==12||
    report.background.metrics.modelsVerified!==16||
    !report.background.player.allReady||
    report.background.player.backgroundError)
   throw Error('R189 original GLB background completion failed '+JSON.stringify(report.background));
 }
 async function runSpells(cards,baseSerial,sendCard){
  return page.evaluate(async({cards,baseSerial,sendCard})=>{
   const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
   for(let i=0;i<cards.length;i++){
    const item=cards[i],serial=baseSerial+i;
    const before=q.r169SchoolMagic.played;
    if(sendCard)f.postMessage({type:'ASDC_R46_CARD_PLAY',side:'player',
     serial,id:item.id,kind:'spell'},location.origin);
    f.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',serial,
     card:item.id,effect:item.effect,directDamage:1,damage:1,targetUids:['U17302']},location.origin);
    await new Promise((resolve,reject)=>{
     let frames=0;const tick=()=>{
      if(q.r169SchoolMagic.played>before)return resolve();
      if(++frames>120)return reject(Error('Missing spell '+item.id));
      f.requestAnimationFrame(tick);
     };f.requestAnimationFrame(tick);
    });
   }
   return {stage:q.r169SchoolMagic,shaderPrograms:q.r173ShaderPrograms,
    legacyImpact:q.spellImpact.played,legacyArsenal:q.magicArsenal.played,
    cameraSafe:!q.r145ActionShot.enabled,
    portraitInsetDraws:q.renderPerformance.heroInsetDraws,
    noFloatingPortrait:q.r173NoFloatingPortrait,
    currentGestures:q.duelistHosts.map(x=>x.posture?.schoolSignature)};
  },{cards,baseSerial,sendCard});
 }
 report.passOne=await runSpells(init.spells,173050,true);
 report.passTwo=await runSpells(init.spells,173200,true);
 await page.locator('#stadium').screenshot({path:resolve(OUT,'r173-'+id+'-arena.png')});
 const primeProven=primeMode==='two'?
  report.initial.primeTwo?.models===2&&
  report.initial.primeTwo.allIds.join(',')===Object.values(pair).join(','):
  primeMode==='all'?
  report.initial.primeAll?.models===14&&report.initial.primeHand==null:
  primeMode==='hand'?report.initial.primeHand?.models>0&&
   report.initial.primeAll==null:
  report.initial.primeHand==null&&report.initial.primeAll==null;
 report.pass=primeProven&&report.errors.length===0&&
  report.initial.authoredHighDetailAssets?.includes('E06')&&
  report.initial.authoredHighDetailAssets?.includes('K01')&&
  report.initial.authoredHighDetailAssets?.includes('K07')&&
  report.initial.authoredHighDetailAssets?.includes(r186Id)&&
  report.initial.selectedNewHero?.id===r186Id&&
  (interleave!=='off'?
   (interleave==='compile'?report.initial.r187InterleaveReceipt?.compileOnly:
    report.initial.r187InterleaveReceipt?.firstGpuDraws===3):
   !report.initial.r187InterleaveReceipt?.enabled)&&
  (selectPrime?report.initial.r186SelectedPrewarm?.id===r186Id:!report.initial.r186SelectedPrewarm)&&
  report.initial.stadiumBatch?.enabled===stadiumBatch&&
  report.initial.hairBatch?.enabled===hairBatch&&
  report.initial.rig?.reduce((n,r)=>n+r.morphTargets,0)===20&&
  (primeHero?report.initial.primeHero?.id==='K07':!report.initial.primeHero)&&
  report.cold.played===1&&
  report.passOne.stage.uniqueRenderedProps===46&&
  report.passTwo.stage.played===93&&report.passTwo.stage.uniqueRenderedProps===46&&
  report.passOne.stage.staticBatch.cacheEntries===report.passTwo.stage.staticBatch.cacheEntries&&
  report.passTwo.legacyImpact===0&&report.passTwo.legacyArsenal===0&&
  report.passTwo.noFloatingPortrait&&report.passTwo.cameraSafe&&
  report.passTwo.portraitInsetDraws===0&&
  report.passTwo.stage.shaderPointLights===0&&
  (on?report.passTwo.stage.staticBatch.enabled:!report.passTwo.stage.staticBatch.enabled);
 console.log('R189_STAGED_STARTUP_93_CASTS_PASS',JSON.stringify({
  id,pass:report.pass,r186Id,selectPrime,interleave,owlTex,owlAlt,r189Stream,
  background:report.background,tailWaitMs:report.tailWaitMs,realOwlSkeleton:report.realOwlSkeleton,owlRuntimeSource:report.initial.owlRuntimeSource,sourceBytes:report.initial.bytes,pair,primeMode,firstCard,stadiumBatch,primeAll:report.initial.primeAll,
  primeHand:report.initial.primeHand,
  primeTwo:report.initial.primeTwo,
  primeHero:report.initial.primeHero,
  readyMs:report.initial.startupMs,r187:report.initial.r187InterleaveReceipt,errors:report.errors.slice(0,8),
  cold:{p95:report.cold.p95,p99:report.cold.p99,max:report.cold.max,
   longTaskMax:report.cold.longTaskMax,shaderDelta:report.cold.shaderDelta},
  spellsPlayed:report.passTwo.stage.played,
  unique:report.passTwo.stage.uniqueRenderedProps,
  cached:report.passTwo.stage.staticBatch.cacheEntries,
  saved:report.passTwo.stage.staticBatch.drawsSaved,
  legacy:report.passTwo.legacyArsenal,
  screenOcclusionInset:report.passTwo.portraitInsetDraws}));
 await page.close();await ctx.close();
}finally{
 writeFileSync(resolve(OUT,'r173-'+id+'.json'),JSON.stringify(report,null,2));
 await browser.close();
}
if(!report.pass)process.exitCode=2;
