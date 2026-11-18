/** R169 local full-R147 GLB battle and school comedy replacement smoke. */
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r169-campus-comedy';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage',
 '--autoplay-policy=no-user-gesture-required']});
const report={created:new Date().toISOString(),cases:[]};
const spells=['E06','K01','K06','Q05','S04','P04','P05','X03','X07'];
async function raf(page,n=75){
 return page.evaluate(async n=>{
  const w=document.querySelector('#stadium').contentWindow,d=[];
  await new Promise(done=>{
   let last=0;const cb=t=>{if(last)d.push(t-last);last=t;
    if(d.length<n)w.requestAnimationFrame(cb);else done()};
   w.requestAnimationFrame(cb);
  });
  d.sort((a,b)=>a-b);
  return{n:d.length,p50:+d[Math.floor(d.length*.5)].toFixed(3),
   p95:+d[Math.floor(d.length*.95)].toFixed(3),max:+d.at(-1).toFixed(3)};
 },n);
}
try{
 for(const [view,mode] of [['desktop','on'],['mobile','on'],['desktop','off']]){
  const mobile=view==='mobile',on=mode==='on';
  const ctx=await browser.newContext({
   viewport:mobile?{width:430,height:900}:{width:1280,height:720},
   deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-95))});
  const query=new URLSearchParams({qa:'1',seed:'169',r169SchoolMagic:mode,r122Crowd:'off'});
  await page.goto('http://127.0.0.1:18670/r45-duel/?'+query,{
   waitUntil:'domcontentloaded',timeout:55000});
  let ready=true;
  try{await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{
   timeout:105000,polling:500})}
  catch(e){ready=false;errors.push('not ready '+String(e).slice(0,130))}
  let initial=null,after=null,idle=null,cast=null;
  if(ready){
   initial=await page.evaluate(async()=>{
    const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
    const {COMIC_BEATS}=await import('/r45-duel/audio-engine.mjs');
    const {SCHOOL_MAGIC_COUNT}=await import('/r45-duel/scene/campus-magic-bible.mjs');
    const units={player:[{uid:'U16901',id:'T01',hp:9,attack:4,shield:0}],
      ai:[{uid:'U16902',id:'E03',hp:8,attack:4,shield:0}]};
    f.postMessage({type:'ASDC_R45_BOARD',units,player:['T01'],ai:['E03']},location.origin);
    return{models:f.__ASDC_LOAD_METRICS.modelsVerified,
     bytes:f.__ASDC_LOAD_METRICS.downloadedBytes,cards:window.__r45QA.cardCount,
     source:q.sourceMatchesR22,cameraSafe:!q.r145ActionShot.enabled,
     stage:q.r169SchoolMagic,legacyImpact:q.spellImpact.played,
     legacyArsenal:q.magicArsenal.played,
     customFoley:Object.keys(COMIC_BEATS).filter(x=>x.startsWith('school_')).length,
     screenplay:SCHOOL_MAGIC_COUNT};
   });
   idle=await raf(page,50);
   const effectMap=await page.evaluate(async cards=>{
    const {BY_ID}=await import('/r45-duel/engine.mjs');
    return Object.fromEntries(cards.map(id=>[id,BY_ID[id].effect]));
   },spells);
   for(const [i,id] of spells.entries()){
    const serial=169010+i;
    await page.evaluate(({id,serial,effect})=>{
     const f=document.querySelector('#stadium').contentWindow;
     f.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',serial,
      card:id,effect,damage:1,directDamage:1,targetUids:['U16902']},location.origin);
    },{id,serial,effect:effectMap[id]});
    await page.waitForFunction(({i,on})=>{
     const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
     return (on?q.r169SchoolMagic.played:q.spellImpact.played)>=i+1;
    },{i,on},{timeout:10000});
    if(i===0)cast=await raf(page,75);
    await page.waitForTimeout(120);
   }
   await page.locator('#stadium').screenshot({path:resolve(out,'r169-'+view+'-'+mode+'-battle.png')});
   after=await page.evaluate(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return {stage:q.r169SchoolMagic,legacyImpact:q.spellImpact.played,
     legacyArsenal:q.magicArsenal.played,contactReceipts:q.r121ContactReceipts,
     cameraSafe:!q.r145ActionShot.enabled};
   });
  }
  const pass=ready&&errors.length===0&&initial?.models===16&&
   initial?.bytes===75569762&&initial?.cards===60&&initial?.source&&
   initial?.cameraSafe&&initial?.customFoley===46&&initial?.screenplay===46&&
   after?.cameraSafe&&(on?
    initial.stage.enabled&&after.stage.played===spells.length&&
    after.stage.uniqueRenderedProps===spells.length&&
    after.legacyImpact===0&&after.legacyArsenal===0&&
    after.stage.shaderPointLights===0:
    !initial.stage.enabled&&after.legacyImpact===spells.length&&
    after.legacyArsenal===spells.length);
  report.cases.push({view,mode,pass,errors,initial,after,idle,cast});
  console.log('R169_REAL_BATTLE_CASE',JSON.stringify({view,mode,pass,errors,
   originals:initial?.models,spells:after?.stage?.played??after?.legacyArsenal,
   legacy:after?.legacyArsenal,uniqueFoley:initial?.customFoley,
   idleFrame:idle,castFrame:cast}));
  await page.close();await ctx.close();
 }
}finally{
 writeFileSync(resolve(out,'r169-battle-qa.json'),JSON.stringify(report,null,2));
 await browser.close();
}
if(report.cases.some(x=>!x.pass))process.exitCode=2;
