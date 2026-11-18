/* Actual 16-source-model actor IK hit / cast evidence, QA only. */
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const OUT='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r173-integrated';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const report={start:new Date().toISOString(),spells:[],errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status())});
 await page.goto('http://127.0.0.1:18674/r45-duel/?qa=1&r169SchoolMagic=on&r172BatchStatic=on&seed=1731',
  {waitUntil:'domcontentloaded',timeout:55000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{
  timeout:90000,polling:300});
 for(const [i,id]of ['E06','K01','P04','X05'].entries()){
  const serial=173400+i;
  const before=await page.evaluate(()=>document.querySelector('#stadium')
   .contentWindow.__r45SceneQA.actualHostHits);
  const effect=await page.evaluate(async id=>(await import('/r45-duel/engine.mjs')).BY_ID[id].effect,id);
  await page.evaluate(({id,serial,effect})=>{
   const f=document.querySelector('#stadium').contentWindow;
   f.postMessage({type:'ASDC_R46_CARD_PLAY',side:'player',id,
    serial,kind:'spell'},location.origin);
   f.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',card:id,
    serial,effect,damage:1,directDamage:1,targetUids:['U17302']},location.origin);
  },{id,serial,effect});
  await page.waitForTimeout(340);
  const cast=await page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{host:q.duelistHosts.find(x=>x.side==='player'),
    school:q.r169SchoolMagic};
  });
  let contact=false;
  try{
   await page.waitForFunction(b=>document.querySelector('#stadium')
    .contentWindow.__r45SceneQA.actualHostHits>b,before,{timeout:3400});
   contact=true;
  }catch(e){report.errors.push('No real host contact '+id)}
  await page.waitForTimeout(120);
  const hit=await page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {host:q.duelistHosts.find(x=>x.side==='ai'),
    hitCount:q.actualHostHits,hostHits:q.hostHits};
  });
  if(i<2)await page.locator('#stadium').screenshot({
   path:resolve(OUT,'r173-real-actors-'+id+'.png')});
  const item={id,castSignature:cast.host?.posture?.schoolSignature,
   castStrength:cast.host?.posture?.schoolStrength,
   castPhase:cast.host?.posture?.phase,
   hitSignature:hit.host?.posture?.schoolHitSignature,
   victimRecoil:hit.host?.posture?.recoil,
   originalHostSkeletons:cast.host?.skins,
   noFloatingPortrait:cast.school.enabled&&cast.host?.sourceRig!==null,
   contact,hitCount:hit.hitCount};
  report.spells.push(item);
  console.log('R173_ACTOR_MOTIF',JSON.stringify(item));
  await page.waitForTimeout(750);
 }
 report.pass=report.errors.length===0&&report.spells.length===4&&
  report.spells.every(s=>s.castSignature&&s.hitSignature&&s.contact&&
   s.originalHostSkeletons>0)&&
  new Set(report.spells.map(s=>s.castSignature)).size===4&&
  new Set(report.spells.map(s=>s.hitSignature)).size===4;
 console.log('R173_ACTOR_MOTIF_QA',report.pass,report.errors);
 await page.close();
}finally{
 writeFileSync(resolve(OUT,'r173-actor-motifs.json'),JSON.stringify(report,null,2));
 await browser.close();
}
if(!report.pass)process.exitCode=2;
