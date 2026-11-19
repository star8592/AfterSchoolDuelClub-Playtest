import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out=resolve(import.meta.dirname,'evidence/r178-sculpted-props');
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
 await page.goto('http://127.0.0.1:18678/r45-duel/?qa=1&seed=178&r169SchoolMagic=on&r172BatchStatic=on&r176PrimeBoard=on&r175HeroE06=on&r178HeroK01=on&r122Crowd=off',
 {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:110000});
 const prior=await page.evaluate(async()=>{
  const f=document.querySelector('#stadium').contentWindow,q=f.__r45SceneQA;
  const {BY_ID}=await import('/r45-duel/engine.mjs');
  const x=BY_ID.K01;
  f.postMessage({type:'ASDC_R81_SPELL_RESULT',side:'player',serial:178001,
   card:'K01',effect:x.effect,damage:1,directDamage:1,targetUids:['U17802']},
   location.origin);
  return {models:f.__ASDC_LOAD_METRICS.modelsVerified,
   authored:q.r169SchoolMagic.authoredHighDetailAssets};
 });
 await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.r169SchoolMagic.played>=1);
 await page.waitForTimeout(330);
 await page.locator('#stadium').screenshot({path:resolve(out,'K01-real-stadium-focal.png')});
 const after=await page.evaluate(()=>{
  const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return{stage:q.r169SchoolMagic,drawCalls:q.drawCalls,programs:q.r173ShaderPrograms};
 });
 const result={prior,after,errors,pass:!errors.length&&prior.models===16&&
  prior.authored.includes('E06')&&prior.authored.includes('K01')&&after.stage.played>=1};
 writeFileSync(resolve(out,'K01-in-stadium.json'),JSON.stringify(result,null,2));
 console.log('R178_K01_STADIUM',JSON.stringify({pass:result.pass,
  authors:prior.authored,drawCalls:after.drawCalls,programs:after.programs,
  active:after.stage.activeIds,errors}));
 await page.close();
}finally{await browser.close()}
