import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const ORIGIN=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11110';
const dir=resolve(import.meta.dirname,'evidence/r110');mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[],views:[]};
const check=(pass,label,evidence)=>{report.checks.push({pass:!!pass,label,evidence});if(!pass)throw Error(label+' '+String(JSON.stringify(evidence)).slice(0,650))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[],models=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(ORIGIN))errors.push('HTTP '+r.status()+' '+r.url());});
  page.on('request',r=>{if(/\.(glb|vrm)(\?|$)/i.test(r.url()))models.push(r.url())});
  await page.goto(ORIGIN+'/r45-duel/?qa=1&seed=8&deck=kitchen',{waitUntil:'domcontentloaded',timeout:70000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:170000});
  const initial=await page.evaluate(()=>({hand:window.__r45QA.hand,
    projected:document.querySelector('#stadium').contentWindow.__r45SceneQA.podiumCards,
    allLoaded:window.__r45QA.sceneReady}));
  check(initial.hand.includes('K01'),view+' actual eggplant-banana card in player hand',initial.hand);
  check(initial.projected?.projectionMeshes===6,view+' real 3D podium card meshes',initial.projected);
  check(initial.projected?.artRequestsCached===0,view+' no illustration prefetch before actual play',initial.projected);
  const modelsBefore=models.length;
  await page.locator('.card[data-card-id="K01"]:not([disabled])').first().click();
  await page.locator('#play').click();
  const reveal=await page.evaluate(()=>({
    visible:!document.querySelector('#played-card-reveal').hidden,
    side:document.querySelector('#played-card-reveal').dataset.side,
    image:document.querySelector('#played-card-image').getAttribute('src'),
    title:document.querySelector('#played-card-name').textContent,
    cost:document.querySelector('#played-card-cost').textContent
  }));
  check(reveal.visible&&reveal.side==='player'&&reveal.image.endsWith('/K01.webp')&&
    reveal.title==='茄子炒香蕉'&&reveal.cost.includes('2 能量'),
    view+' real playable card gains large cinematic art entrance',reveal);
  await page.screenshot({path:resolve(dir,view+'-actual-K01-card-entrance.png')});
  await page.waitForFunction(()=>window.__r45QA?.hp?.ai===19,null,{timeout:12000});
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.podiumCards?.lastPainted?.player==='K01',
    null,{timeout:10000});
  const after=await page.evaluate(()=>({
    podium:document.querySelector('#stadium').contentWindow.__r45SceneQA.podiumCards,
    hp:window.__r45QA.hp,
    played:window.__r45QA.events.filter(e=>e.type==='card_play'&&e.card==='K01').slice(-1)
  }));
  check(after.hp.ai===19,view+' genuine engine damage -1 from K01',after.hp);
  check(after.played[0]?.spellOutcome?.effect==='stew',view+' authoritative spell receipt',after.played);
  check(after.podium?.lastPainted?.player==='K01'&&after.podium.painted.player>=1,
   view+' image visible as Three.CanvasTexture',after.podium);
  check(models.length===modelsBefore,view+' no re-download of 3D assets when painting projection');
  check(after.podium.failedImages.length===0,view+' painted 3D projection asset loaded cleanly',after.podium);
  await page.screenshot({path:resolve(dir,view+'-actual-K01-projected.png')});
  check(errors.length===0,view+' zero page or asset errors',errors);
  report.views.push({view,models:models.length,podium:after.podium});
  await page.close();
 }
 report.passed=report.checks.every(x=>x.pass)&&report.errors.length===0;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(dir,'r110-true-match-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R110_TRUE_MATCH',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors,
  views:report.views.map(v=>({view:v.view,models:v.models,lastPainted:v.podium.lastPainted}))}));
 await browser.close();
}
if(!report.passed)process.exitCode=6;
