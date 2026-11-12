import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {CARDS,DECK_PRESETS} from '../engine.mjs';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11108';
const names=['粉笔画地为牢','狂风炸毛超人','排球误入篮筐','蛤蟆布丁警报','全寝室公开播放','神兽返校通知书','披甲巧克力香蕉','黑天鹅冰面慢动作'];
const checks=[],errors=[];
mkdirSync(resolve(import.meta.dirname,'evidence/r108'),{recursive:true});const ok=(pass,label,detail)=>{checks.push({pass:!!pass,label,detail});if(!pass)throw Error(label+' '+JSON.stringify(detail))};
ok(CARDS.length===60,'exactly 60 total cards',CARDS.length);
const hot=CARDS.filter(c=>c.trend);
ok(hot.length===8,'exactly 8 evidence-backed 2026 recent memes');
ok(names.every(n=>hot.some(c=>c.name===n)),'all 8 updated and playable',hot.map(c=>c.name));
ok(hot.every(c=>/^https:\/\//.test(c.trend.source)&&c.trend.date.startsWith('2026-')),'each has its own source/date');
ok(hot.every(c=>Object.values(DECK_PRESETS).some(p=>p.cards.includes(c.id))),'all appear in playable theme decks');
ok(CARDS.some(c=>c.name==='茄子炒香蕉'),'the original eggplant banana card remains');
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--disable-software-rasterizer']});
try{
 for(const [view,width] of [['desktop',1440],['mobile',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  page.on('pageerror',e=>errors.push(view+' JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push(view+' HTTP '+r.status()+' '+r.url());});
  await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:50000});
  await page.locator('#card-gallery .mini-card').first().waitFor({timeout:30000});
  ok(await page.locator('#card-gallery .mini-card').count()===60,view+' full catalog maintained');
  const lead=await page.locator('#card-gallery .mini-card').first().innerText();
  ok(lead.includes('粉笔画地为牢')||lead.includes('狂风炸毛超人'),view+' RECENT memes first on full homepage',lead.slice(0,140));
  await page.locator('[data-filter="trend"]').click();
  ok(await page.locator('#card-gallery .mini-card').count()===8,view+' recent filter 8 cards');
  ok((await page.locator('#card-gallery').innerText()).includes('蛤蟆布丁警报'),view+' frog cake included');
  await page.screenshot({path:resolve(import.meta.dirname,'evidence/r108/'+view+'-recent-memes.png')});
  await page.locator('[data-filter="all"]').click();
  ok(await page.locator('#card-gallery .mini-card').count()===60,view+' reset 60 cards');
  if(view==='desktop'){
   await page.goto(origin+'/r45-duel/?qa=1&seed=8&deck=kitchen',
    {waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:140000});
   await page.locator('#card-library-open').click();
   const recent=page.locator('#library-filters button[data-category="近期热梗"]');
   await recent.click();
   ok(await page.locator('#library-cards .library-tile').count()===8,
     'game library shows all 8 recent memes');
   ok((await page.locator('#library-cards').innerText()).includes('粉笔画地为牢'),
     'game library includes 2026 November school meme');
   await page.screenshot({path:resolve(import.meta.dirname,
    'evidence/r108/desktop-game-library-recent.png')});
   await page.locator('#card-library-close').click();
   ok(await page.locator('#card-library').isHidden(),
     'game library closes and stadium stays playable');
   ok(await page.evaluate(()=>window.__r45QA?.sceneReady===true),
     'real WebGL stadium still ready');
  }
  ok(errors.length===0,view+' no JS/HTTP errors',errors);
  await page.close();
 }
}finally{await browser.close();}
const dir=resolve(import.meta.dirname,'evidence/r108');mkdirSync(dir,{recursive:true});
const report={passed:checks.every(c=>c.pass)&&!errors.length,checks,errors,editedCards:hot.map(c=>({id:c.id,name:c.name,source:c.trend.source,strength:c.trend.strength}))};
writeFileSync(resolve(dir,'r108-recent-meme-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('R108_RECENT_MEME_BROWSER',{passed:report.passed,checks:checks.length,errors});
if(!report.passed)process.exitCode=1;
