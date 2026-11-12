import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {PAINTED_CARD_IDS} from '../card-art.mjs';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const ORIGIN=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11109';
const out=resolve(import.meta.dirname,'evidence/r109');mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[],views:[]};
const check=(condition,label,evidence)=>{report.checks.push({pass:!!condition,label,evidence});
 if(!condition)throw Error(label+' '+String(JSON.stringify(evidence)).slice(0,800));};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--disable-software-rasterizer']});
try{
 check(PAINTED_CARD_IDS.length===60,'60/60 ID to physical art registry');
 for(const [view,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[],loaded={};
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{
   if(r.status()>=400&&r.url().startsWith(ORIGIN))errors.push('HTTP '+r.status()+' '+r.url());
   if(r.url().includes('/assets/cards/r109/')&&r.status()===200)loaded[r.url()]=true;
  });
  await page.goto(ORIGIN+'/',{waitUntil:'domcontentloaded',timeout:50000});
  await page.locator('#card-gallery .mini-card').first().waitFor();
  check(await page.locator('#card-gallery .mini-card').count()===60,view+' 60 catalog cards');
  check(await page.locator('#card-gallery .mini-card-image').count()===60,view+' all catalog cards have genuine images');
  check(await page.locator('#card-gallery .mini-art-pending').count()===0,view+' no emoji / missing-illustration fallbacks');
  const dimensions=await page.locator('.mini-card-image').evaluateAll(async images=>{
   for(const img of images)img.loading='eager';
   await Promise.all(images.map(n=>n.decode()));
   return images.map(n=>({id:n.closest('.mini-card')?.querySelector('.mini-top')?.innerText,
      width:n.naturalWidth,height:n.naturalHeight,src:n.getAttribute('src')}));
  });
  check(dimensions.length===60&&dimensions.every(x=>x.width===620&&x.height===780),
   view+' 60/60 actual images decoded at 620x780',dimensions.filter(x=>x.width!==620).slice(0,3));
  check(Object.keys(loaded).length===60,view+' exactly 60 unique WebP responses',Object.keys(loaded).length);
  const recent=page.locator('.mini-card[data-trend="2026"]');
  check(await recent.count()===8,view+' 2026 fresh meme tags remain');
  await recent.first().click();
  const art=page.locator('.card-art-detail img');
  check(await art.count()===1,view+' full-size card art dialog');
  check(await art.evaluate(n=>n.naturalWidth===620&&n.naturalHeight===780),
    view+' image detail 620x780');
  await page.screenshot({path:resolve(out,view+'-r109-60-card-detail.png')});
  await page.locator('.card-art-detail .close-art').click();
  check(await page.locator('.card-art-detail').isHidden(),view+' picture zoom closes');
  await page.locator('[data-filter="spell"]').click();
  check(await page.locator('#card-gallery .mini-card-image').count()===46,view+' 46 spell cards illustrated');
  await page.screenshot({path:resolve(out,view+'-r109-spell-library.png'),fullPage:view==='desktop'});
  check(errors.length===0,view+' landing zero JS or resource errors',errors);

  // UI-only game coverage. A stubbed 3D iframe avoids repeating the known
  // independent 153 MiB VRM download; this makes NO claim on 3D readiness.
  await page.route('**/r45-duel/scene/**',async route=>{
   if(route.request().resourceType()==='document')
    await route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>R109 asset UI QA only</title>'});
   else await route.continue();
  });
  await page.goto(ORIGIN+'/r45-duel/?qa=1&seed=8&deck=kitchen',{waitUntil:'domcontentloaded',timeout:50000});
  await page.locator('#card-library-open').waitFor();
  await page.waitForFunction(()=>document.querySelectorAll('#library-filters button').length===8,null,{timeout:30000});
  await page.waitForTimeout(200);
  check(await page.locator('#card-library-open').count()===1,view+' artwork library entry exists');
  await page.locator('#card-library-open').click();
  check(await page.locator('.library-tile-image').count()===60,view+' game gallery 60 images');
  check(await page.locator('.library-art-pending').count()===0,view+' game gallery no missing art');
  await page.locator('#library-filters button[data-category="近期热梗"]').click();
  check(await page.locator('.library-tile-image').count()===8,view+' eight pictured recent campus memes');
  await page.locator('.library-tile[data-art="illustrated"]').first().click();
  check(await page.locator('.card-zoom-image').count()===1,view+' enlarged game illustration');
  await page.screenshot({path:resolve(out,view+'-r109-in-game-card-detail.png')});
  await page.locator('.card-zoom-close').click();
  await page.locator('#card-library-close').click();
  check(await page.locator('#card-library').isHidden(),view+' back to duel hand');
  check(errors.length===0,view+' game UI zero runtime/resource errors',errors);
  report.views.push({view,illustrations:60,gameGallery:60,scope:'artwork UI only; game 3D acceptance is separate'});
  await page.close();
 }
 report.passed=report.checks.every(x=>x.pass)&&report.errors.length===0;
}catch(error){report.errors.push(String(error))}
finally{
 writeFileSync(resolve(out,'r109-60-card-art-browser.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R109_ART_UI_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors,views:report.views}));
 await browser.close();
}
if(!report.passed)process.exitCode=5;
