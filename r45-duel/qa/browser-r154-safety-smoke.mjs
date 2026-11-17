import{createRequire}from'node:module';
import{readFileSync,writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const source=readFileSync(new URL('../scene/scene.mjs',import.meta.url));
const url='https://star8592.github.io/AfterSchoolDuelClub-Playtest/r45-duel/?qa=1&seed=154&r154Perf=on';
const report={url,checks:[],errors:[],pass:false};
const check=(cond,msg)=>{report.checks.push({pass:!!cond,msg});if(!cond)throw Error(msg)};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:430,height:900},deviceScaleFactor:2});
 page.on('pageerror',e=>report.errors.push('JS '+e.message.slice(0,200)));
 page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url().slice(-80))});
 await page.route('**/r45-duel/scene/scene.mjs*',route=>route.fulfill({status:200,body:source,contentType:'text/javascript'}));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:90000});
 const a=await page.evaluate(()=>{
  const frame=document.querySelector('#stadium'),q=frame.contentWindow.__r45SceneQA;
  return{parentReady:window.__r45QA.sceneReady,cardCount:window.__r45QA.cardCount,
   profile:q.renderPerformance,models:q.summonModels,shot:q.r145ActionShot,iframe:frame.src}
 });
 check(a.parentReady===true,'parent game scene ready');
 check(a.cardCount===60,'canonical 60 card rules');
 check(a.models.length===12,'all 12 GLB verified');
 check(a.profile.profile==='r154-perf-lab'&&a.profile.pixelRatio===1,'R154 opt-in mobile DPR');
 check(a.shot.enabled===false,'R147 close-up remains off');
 check(new URL(a.iframe).searchParams.get('r146Cast')==='off','R146 unsafe cast remains off');
 const oldIds=['E03','E04','G02','G03','G04','T03','T04'];
 check(a.models.filter(x=>oldIds.includes(x.id)).every(x=>x.file?.endsWith('-Landing-R97.glb')),'seven safe R97 character meshes');
 const units={player:[{uid:'U15401',id:'E03',hp:8,attack:4,shield:0}],
  ai:[{uid:'U15402',id:'T04',hp:8,attack:4,shield:0}]};
 await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage(
  {type:'ASDC_R45_BOARD',units:u,player:['E03'],ai:['T04']},location.origin),units);
 await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence?.total===2,null,{timeout:20000});
 check(true,'two original 3D units present');
 await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage(
  {type:'ASDC_R51_COMBAT_EVENTS',pre:u,post:u,events:[{type:'exchange',serial:15401,side:'player',
    from:'E03',to:'T04',attacker_uid:'U15401',target_uid:'U15402',damage:1,
    target_hp_after:7,attacker_hp_after:8}]},location.origin),units);
 await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.combatEvents.active===true,null,{timeout:10000});
 check(true,'canonical combat animation triggers');
 check(report.errors.length===0,'no page JS/HTTP error');
 report.pass=true;report.summary={profile:a.profile,modelCount:a.models.length};
 await page.screenshot({path:'/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r154-qa-combat.png'});
 await page.close();
}catch(e){report.errors.push('FAIL '+String(e))}
finally{
 writeFileSync('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r154-qa-safety.json',JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R154_SAFETY_RESULT',JSON.stringify(report));
if(!report.pass)process.exitCode=2;
