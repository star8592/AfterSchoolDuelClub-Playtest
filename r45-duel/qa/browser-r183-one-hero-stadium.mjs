/** R183 all new signature props: actual 3D stadium, live real GLB, unique action. */
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const ID=process.env.R183_ID||'P03';
const known=['P03','S08','X03','Q06','K02','K08','S03','Q01'];
if(!known.includes(ID))throw Error('Unknown real hero ID '+ID);
const OUT=resolve(import.meta.dirname,'evidence/r183-sculpted-props',ID);
mkdirSync(OUT,{recursive:true});
const errors=[];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
let report={id:ID,errors,pass:false,actual3DImage:ID+'-in-stadium.png'};
try{
 const page=await browser.newPage({viewport:{width:1400,height:850},
  deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-140))});
 page.on('requestfailed',r=>errors.push('NETWORK '+r.url().slice(-140)+' '+r.failure()?.errorText));
 const qp=new URLSearchParams({qa:'1',seed:'173',r169SchoolMagic:'on',
  r180StadiumBatch:'on',r181HairBatch:'on',r183Hero:ID,
  r172BatchStatic:'on',r174Crowd:'physical'});
 await page.goto('http://127.0.0.1:18683/r45-duel/?'+qp,
  {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,
  {timeout:115000,polling:250});
 report.before=await page.evaluate(async(id)=>{
  const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
  const {BY_ID}=await import('/r45-duel/engine.mjs');
  const x=BY_ID[id];
  if(!x||x.kind!=='spell')throw Error('No canonical school magic id '+id);
  const src={loaded:f.__ASDC_LOAD_METRICS.modelsVerified,
   bytes:f.__ASDC_LOAD_METRICS.downloadedBytes,
   authored:q.r169SchoolMagic.authoredHighDetailAssets,
   r183:q.r183HeroLoad,drawCalls:q.drawCalls,
   cards:window.__r45QA.cardCount,
   stadium:q.r180StadiumBatch,hair:q.r181HairBatch};
  f.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',serial:182001,
   card:id,effect:x.effect,damage:1,directDamage:1,targetUids:['U18202']},
   location.origin);
  return src;
 },ID);
 await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow
  .__r45SceneQA.r183ActorMotions.length>=1,null,{timeout:10000});
 const first=await page.evaluate(()=>document.querySelector('#stadium')
  .contentWindow.__r45SceneQA.r183ActorMotions[0]);
 await page.waitForTimeout(250);
 const second=await page.evaluate(()=>document.querySelector('#stadium')
  .contentWindow.__r45SceneQA.r183ActorMotions[0]);
 await page.locator('#stadium').screenshot({path:resolve(OUT,report.actual3DImage)});
 report.after=await page.evaluate(()=>{
  const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return{played:q.r169SchoolMagic.played,
   heroAssets:q.r169SchoolMagic.authoredHighDetailAssets,
   drawCalls:q.drawCalls,shaderPrograms:q.r173ShaderPrograms,
   physicalProps:q.r169SchoolMagic.uniqueRenderedProps};
 });
 const moved=[];
 for(const g of first.groups){
  const h=second.groups.find(x=>x.name===g.name);
  if(h&&(
   g.pos.some((v,i)=>Math.abs(v-h.pos[i])>.009)||
   g.rot.some((v,i)=>Math.abs(v-h.rot[i])>.009)))
    moved.push(g.name);
 }
 report.actorMotion={first,second,moved};
 const expected={
  P03:['HEAD','LEGS','TAIL'],
  S08:['MACHINE','FACE','FLYING_CAN'],
  X03:['CAR','TICKET'],
  Q06:['SHADE','BUTTONS'],
  K02:['MELON','ERASER'],
  K08:['BANANA','SHIELD','HELMET'],
  S03:['BROOM','DUST'],
  Q01:['ERASER','PENCIL','PAPER']}[ID];
 report.pass=errors.length===0&&report.before.loaded===16&&
  report.before.bytes===75569762&&report.before.cards===60&&
  report.before.r183?.id===ID&&
  report.before.r183.onlyOneNewHeroLoaded&&
  report.before.r183.meshCount>=6&&
  report.before.authored.includes(ID)&&
  report.before.stadium.enabled===true&&report.before.hair.enabled===true&&
  report.after.played>=1&&report.after.heroAssets.includes(ID)&&
  expected.every(name=>first.groups.some(g=>g.name.includes(name)))&&
  moved.length>=1;
 console.log('R183_HERO_STADIUM',
  JSON.stringify({id:ID,pass:report.pass,models:report.before.loaded,
   sourceBytes:report.before.bytes,drawCalls:report.after.drawCalls,
   newMeshCount:report.before.r183?.meshCount,
   originalGLB:report.before.authored,
   movingActors:moved,errors}));
 await page.close();
} catch(e) {
 report.fatal=String(e);errors.push(String(e));
 console.log('R183_HERO_STADIUM_FAIL',ID,String(e));
}finally {
 writeFileSync(resolve(OUT,'R183-3D-in-stadium-qa.json'),
  JSON.stringify(report,null,2));
 await browser.close();
}
if(!report.pass)process.exitCode=2;
