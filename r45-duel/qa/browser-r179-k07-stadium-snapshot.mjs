import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out=resolve(import.meta.dirname,'evidence/r179-sculpted-props');
mkdirSync(out,{recursive:true});
const errors=[];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1400,height:850},deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-90))});
 await page.goto('http://127.0.0.1:18679/r45-duel/?qa=1&seed=178&r169SchoolMagic=on&r172BatchStatic=on&r176PrimeBoard=on&r175HeroE06=on&r178HeroK01=on&r179HeroK07=on&r122Crowd=off',
 {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:110000});
 const prior=await page.evaluate(async()=>{
  const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
  const {BY_ID}=await import('/r45-duel/engine.mjs');
  const x=BY_ID.K07;
  f.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',serial:178001,
   card:'K07',effect:x.effect,damage:1,directDamage:1,targetUids:['U17802']},
   location.origin);
  return {models:f.__ASDC_LOAD_METRICS.modelsVerified,
   authored:q.r169SchoolMagic.authoredHighDetailAssets};
 });
 await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.r169SchoolMagic.played>=1);
 const firstMotion=await page.evaluate(()=>
  document.querySelector('#stadium').contentWindow.__r45SceneQA.r179K07ActorMotion);
 await page.waitForTimeout(230);
 const secondMotion=await page.evaluate(()=>
  document.querySelector('#stadium').contentWindow.__r45SceneQA.r179K07ActorMotion);
 const moved=firstMotion.active&&secondMotion.active&&
  firstMotion.groups.length===3&&secondMotion.groups.length===3&&
  firstMotion.groups.every(f=>{
   const t=secondMotion.groups.find(x=>x.name===f.name);
   return t&&(Math.abs(f.y-t.y)>.01||Math.abs(f.rz-t.rz)>.01);
  });
 await page.locator('#stadium').screenshot({path:resolve(out,'K07-real-stadium-focal.png')});
 const after=await page.evaluate(()=>{
  const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return{stage:q.r169SchoolMagic,drawCalls:q.drawCalls,programs:q.r173ShaderPrograms};
 });
 const result={prior,after,errors,actorMotion:{firstMotion,secondMotion,moved},
  pass:moved&&!errors.length&&prior.models===16&&
  prior.authored.includes('E06')&&prior.authored.includes('K01')&&prior.authored.includes('K07')&&after.stage.played>=1};
 writeFileSync(resolve(out,'K07-in-stadium.json'),JSON.stringify(result,null,2));
 console.log('R179_K07_STADIUM',JSON.stringify({pass:result.pass,
  authors:prior.authored,drawCalls:after.drawCalls,programs:after.programs,
  active:after.stage.activeIds,independentActors:result.actorMotion.moved,errors}));
 await page.close();
}finally{await browser.close()}
