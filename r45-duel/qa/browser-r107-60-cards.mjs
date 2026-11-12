import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11107';
const out=resolve(import.meta.dirname,'evidence/r107');mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[],views:[]};
const check=(ok,label,detail)=>{
 report.checks.push({pass:!!ok,label,detail:detail===undefined?null:detail});
 if(!ok)throw Error(label+' '+JSON.stringify(detail).slice(0,800));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[],heavy=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status()+' '+r.url());});
  page.on('request',r=>{if(/\.(?:vrm|glb)(?:\?|$)/i.test(r.url()))heavy.push(r.url())});
  await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:50000});
  await page.locator('#card-gallery .mini-card').first().waitFor({timeout:30000});
  check(await page.locator('#card-gallery .mini-card').count()===60,view+' homepage real 60-card gallery');
  check(heavy.length===0,view+' homepage keeps zero 3D download');
  await page.locator('[data-filter="spell"]').click();
  check(await page.locator('#card-gallery .mini-card').count()===46,view+' homepage 46 actual event cards');
  check(await page.getByText('茄子炒香蕉').count()>0,view+' kitchen original card appears in list');
  await page.locator('[data-filter="unit"]').click();
  check(await page.locator('#card-gallery .mini-card').count()===14,view+' 14 3D summon cards unchanged');
  await page.locator('[data-filter="all"]').click();
  await page.screenshot({path:resolve(out,view+'-60-gallery.png'),fullPage:true});
  check(errors.length===0,view+' landing zero runtime/network errors',errors);
  const target=origin+'/r45-duel/?qa=1&seed=8&deck=kitchen';
  await page.goto(target,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:165000});
  const ready=await page.evaluate(()=>({
    count:window.__r45QA.cardCount,preset:window.__r45QA.deckPreset,
    cards:window.__r45QA.deckTotal,hand:window.__r45QA.hand,
    scene:window.__r45QA.sceneReady,energy:window.__r45QA.energy.player
  }));
  check(ready.count===60&&ready.preset==='kitchen'&&ready.cards===40,view+' real 40-card kitchen match',ready);
  check(ready.hand.includes('K01')&&ready.energy===2,view+' K01 eggplant-banana playable',ready);
  check(await page.locator('#deck-select').inputValue()==='kitchen',view+' deck picker correctly initialized');
  await page.locator('#card-library-open').click();
  check(await page.locator('#library-cards .library-tile').count()===60,view+' full 60-card library modal');
  await page.locator('#library-filters button[data-category="黑暗食堂"]').click();
  check(await page.locator('#library-cards .library-tile').count()===8,view+' 8 actual kitchen cards filter');
  check((await page.locator('#library-cards').innerText()).includes('茄子炒香蕉'),view+' actual K01 details read');
  await page.screenshot({path:resolve(out,view+'-8-kitchen-library.png')});
  await page.locator('#card-library-close').click();
  check(await page.locator('#card-library').isHidden(),view+' modal closes and battlefield resumes');
  await page.locator('.card[data-card-id="K01"]:not([disabled])').first().click();
  await page.locator('#play').click();
  await page.waitForFunction(()=>window.__r45QA?.hp?.ai===19,null,{timeout:10000});
  const played=await page.evaluate(()=>({
    hp:window.__r45QA.hp,events:window.__r45QA.events.slice(-5),
    spell:document.querySelector('#stadium').contentWindow.__r45SceneQA?.spellImpact,
  }));
  check(played.hp.ai===19,view+' K01 actual enemy HP reduction to 19',played);
  check(played.events.some(e=>e.type==='card_play'&&e.card==='K01'&&e.spellOutcome?.effect==='stew'),view+' K01 canonical game receipt');
  check(played.spell?.played>=1,view+' actual 3D spell effect for new kitchen card',played.spell);
  await page.screenshot({path:resolve(out,view+'-k01-live-match.png')});
  await page.locator('#deck-select').selectOption('sports');
  await page.waitForFunction(()=>window.__r45QA?.deckPreset==='sports');
  const switched=await page.evaluate(()=>({
    deck:window.__r45QA.deckPreset,hp:window.__r45QA.hp,cards:window.__r45QA.deckTotal,
    sceneReady:window.__r45QA.sceneReady,url:location.href
  }));
  check(switched.deck==='sports'&&switched.cards===40&&switched.sceneReady&&switched.hp.ai===20,
     view+' switch to sports no 3D reload and game reset',switched);
  check(new URL(switched.url).searchParams.get('deck')==='sports',view+' shareable deck identity URL');
  check(errors.length===0,view+' duel zero JS and HTTP errors',errors);
  report.views.push({view,passed:true,heavyDownloads:heavy.length,switch:switched,spell:played.spell});
  await page.close();
 }
 report.passed=report.checks.every(x=>x.pass)&&report.errors.length===0;
}catch(error){report.errors.push(String(error))}
finally{
 writeFileSync(resolve(out,'r107-60-cards-browser.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R107_60_CARDS_BROWSER',JSON.stringify({passed:report.passed,
   checks:report.checks.length,errors:report.errors,views:report.views}));
 await browser.close();
}
if(!report.passed)process.exitCode=7;
