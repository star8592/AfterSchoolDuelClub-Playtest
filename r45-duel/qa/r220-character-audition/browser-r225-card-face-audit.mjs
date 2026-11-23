import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/r220-character-audition/evidence/r225-card-face';
mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
const report={ok:false,cases:[],errors:[],source:'REAL Chrome WebGL position and screenshot'};
try{
 for(const revision of ['r224','r225']){
  const ctx=await browser.newContext({viewport:{width:1600,height:900},serviceWorkers:'block'});
  const page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push(revision+' JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)report.errors.push(revision+' HTTP '+r.status()+' '+r.url())});
  const url='http://10.10.10.138:18720/r45-duel/qa/r220-character-audition/?focus=jay&revision='+revision+'&camera=front';
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:55000});
  await page.waitForFunction(()=>window.__r220QA?.ready===true,null,{timeout:80000});
  await page.waitForTimeout(1450);
  const rows=[];
  for(const t of [.79,.90,1.03,1.17]){
   const r=await page.evaluate(t=>window.__r220QA.seekPhase('attack',t),t);
   assert(r?.card?.screen);
   assert(r.card.released);
   const dist=r.card.screen.centerDistancePx;
   const file=revision+'-front-cast-'+String(Math.round(t*100)).padStart(3,'0')+'.jpg';
   await page.waitForTimeout(120);
   await page.screenshot({path:join(dir,file),type:'jpeg',quality:84});
   rows.push({time:t,centerDistancePx:dist,position:r.card.position,screen:r.card.screen,frame:file});
  }
  report.cases.push({revision,rows});
  console.log('R225_FACE_OCCLUSION',revision,JSON.stringify(rows.map(r=>[r.time,r.centerDistancePx,r.screen.headPx,r.screen.cardPx])));
  await ctx.close();
 }
 assert.equal(report.errors.length,0,JSON.stringify(report.errors));
 const old=report.cases[0].rows,newer=report.cases[1].rows;
 assert(newer[1].centerDistancePx>old[1].centerDistancePx+20,
 'Card head separation did not improve at release');
 assert(newer[2].centerDistancePx>old[2].centerDistancePx+20,
 'Card covers head in follow-through');
 report.ok=true;
}catch(e){report.failure=String(e);console.log('R225_FACE_OCCLUSION_QA_FAILURE',String(e))}
finally{
 await browser.close();
 writeFileSync(join(dir,'r225-card-face-occlusion-real-chrome-ab.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R225_CARD_FACE_REAL_BROWSER',JSON.stringify({ok:report.ok,failure:report.failure,errors:report.errors}));
}
if(!report.ok)process.exitCode=8;
