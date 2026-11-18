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
const r184Id=process.env.R184_ID||'E05';
const firstCard=r184Id;
const selectPrime=process.env.R184_PRIME==='on';
const stadiumBatch=true;
const hairBatch=process.env.R181_HAIR==='on';
const primeHero=process.env.R179_PRIME_HERO==='on';
const OUT='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r184-ten-full-spell-final/'+pair.playerId+'-'+pair.aiId+'-'+(hairBatch?'hairON':'hairOFF')+'-'+primeMode+'-'+firstCard+'-selected'+(selectPrime?'warm':'cold')+'-hero'+(primeHero?'on':'off')+'-'+(process.env.R173_VIEW||'desktop');
mkdirSync(OUT,{recursive:true});
const view=process.env.R173_VIEW||'desktop';
const mode=process.env.R173_MODE||'batched';
const cpu=Number(process.env.R173_CPU||2);
const on=mode==='batched',mobile=view==='mobile';
const id=view+'-'+mode+'-cpu'+cpu;
const report={id,start:new Date().toISOString(),view,mode,cpu,errors:[],
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
  r175HeroE06:'on',r178HeroK01:'on',r179HeroK07:'on',r184Hero:r184Id,
  r184PrimeSelected:selectPrime?'on':'off'});
 await page.goto('http://127.0.0.1:18684/r45-duel/?'+qp,
  {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{
  timeout:110000,polling:400});
 report.initial=await page.evaluate(async({pair,r184Id})=>{
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
   selectedNewHero:q.r184HeroLoad,
   r184SelectedPrewarm:q.r184SelectedPrewarm,
   startupMs:f.__ASDC_LOAD_METRICS.firstFrameReadyMs,noFloatingPortrait:q.r173NoFloatingPortrait,
   gestureFamilies:SCHOOL_GESTURE_FAMILIES.length,
   spells:cards.map(x=>({id:x.id,effect:x.effect})),
   soundPatterns:patterns.length,originalFoleyUpgrades:
   patterns.filter(([,p])=>p.some(x=>x[0].startsWith('r171_'))).length,
   r184UniqueSoundPatterns:patterns.filter(([,p])=>
     p.some(x=>x[0].startsWith('r184_'))).length,
   r184SelectedSoundClip:(COMIC_BEATS['school_'+r184Id]||[])
     .map(x=>x[0]).find(x=>x==='r184_'+r184Id.toLowerCase())||null,
   cameraSafe:!q.r145ActionShot.enabled};
 },{pair,r184Id});
 const init=report.initial;
 if(init.models!==16||init.bytes!==75569762||init.cards!==60||
  !init.source||!init.noFloatingPortrait||init.soundPatterns!==46||
  init.r184UniqueSoundPatterns!==10||
  init.r184SelectedSoundClip!=='r184_'+r184Id.toLowerCase()||
  init.spells.length!==46||
  init.gestureFamilies<10||!init.cameraSafe)
  throw Error('R173 source mismatch '+JSON.stringify(init));
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
  report.initial.authoredHighDetailAssets?.includes(r184Id)&&
  report.initial.selectedNewHero?.id===r184Id&&
  (selectPrime?report.initial.r184SelectedPrewarm?.id===r184Id:!report.initial.r184SelectedPrewarm)&&
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
 console.log('R184_ONE_HERO_93_SPELLS_PASS',JSON.stringify({
  id,pass:report.pass,r184Id,selectPrime,pair,primeMode,firstCard,stadiumBatch,primeAll:report.initial.primeAll,
  primeHand:report.initial.primeHand,
  primeTwo:report.initial.primeTwo,
  primeHero:report.initial.primeHero,
  readyMs:report.initial.startupMs,errors:report.errors.slice(0,8),
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
