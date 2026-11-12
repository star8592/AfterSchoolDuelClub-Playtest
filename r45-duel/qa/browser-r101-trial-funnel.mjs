import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11101';
const out=resolve(import.meta.dirname,'evidence/r101');mkdirSync(out,{recursive:true});
const report={origin,ok:false,checks:[],errors:[],views:[],game:null};
const ok=(valid,name,detail=null)=>{
 report.checks.push({pass:!!valid,name,detail});
 if(!valid)throw Error('R101 '+name+': '+JSON.stringify(detail).slice(0,700));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [name,width] of [['desktop',1440],['mobile',430]]){
  const context=await browser.newContext({viewport:{width,height:900},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();
  const requests=[],errors=[];
  page.on('request',r=>requests.push({url:r.url(),type:r.resourceType()}));
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))
   errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/',{waitUntil:'networkidle',timeout:50000});
  ok(new URL(page.url()).pathname.endsWith('/')&&!page.url().includes('/r45-duel/'),
   name+' keeps ultra-light landing visible instead of immediate 3D redirect',page.url());
  const index=await page.evaluate(()=>{
   const el=document.querySelector('meta[name="robots"]');
   return {robots:el?.content,title:document.title,
    desc:document.querySelector('meta[name="description"]')?.content,
    og:document.querySelector('meta[property="og:image"]')?.content,
    canonical:document.querySelector('link[rel="canonical"]')?.href,
    cards:document.querySelectorAll('#card-gallery .mini-card').length,
    images:[...document.images].map(x=>({ok:x.complete&&x.naturalWidth>0,src:x.getAttribute('src')})),
    scroll:document.documentElement.scrollWidth,body:document.documentElement.clientWidth,
    seed:document.querySelector('#daily-seed').textContent};
  });
  ok(index.robots.startsWith('index')&&index.og.includes('/share/duel-og.jpg')&&
   index.desc.includes('免费网页试玩')&&index.canonical.includes('AfterSchoolDuelClub-Playtest'),
   name+' SEO and share metadata crawlable',index);
  ok(index.cards===60,name+' uses real 60-card engine catalog without loading game assets',index.cards);
  ok(!requests.some(x=>/\.(?:glb|vrm|ogg|mp3)(\?|$)/i.test(x.url))&&
     !requests.some(x=>x.url.includes('/r45-duel/scene/')),
   name+' 0 heavy GLB/VRM/music requests before intentional play',{requests:requests.map(x=>x.url).slice(0,22)});
  ok(index.images.every(x=>x.ok),name+' all compact game-capture preview images really decode',index.images);
  ok(index.scroll<=index.body+2,name+' no mobile/desktop horizontal overflow',index);
  const expectedUTC=new Date();const today=expectedUTC.getUTCFullYear()*10000+(expectedUTC.getUTCMonth()+1)*100+expectedUTC.getUTCDate();
  const challenge=await page.locator('#daily-play').getAttribute('href');
  ok(Number(index.seed)===today&&Number(new URL(challenge).searchParams.get('seed'))===today,
   name+' reproducible UTC daily challenge, not fake leaderboard',{today,challenge});
  await page.locator('[data-filter="spell"]').click();
  ok(await page.locator('.mini-card').count()===46,name+' exactly 46 spell cards');
  await page.locator('[data-filter="unit"]').click();
  ok(await page.locator('.mini-card').count()===14,name+' exactly 14 actual units');
  await page.locator('[data-filter="all"]').click();
  ok(await page.locator('.mini-card').count()===60,name+' filter restores all cards');
  await page.locator('#daily-share').click();
  const copy=await page.evaluate(()=>navigator.clipboard.readText());
  ok(copy.includes('seed='+today)&&copy.includes('来看看你能不能赢过 AI'),
   name+' share copies a real same-seed playable link',copy.slice(0,150));
  await page.locator('#feedback-note').fill('第三关最有趣，声音比以前清晰，首次载入仍慢。');
  await page.locator('#feedback-copy').click();
  const fb=await page.evaluate(()=>navigator.clipboard.readText());
  ok(fb.includes('第三关最有趣')&&fb.includes('R101'),
   name+' real copyable feedback, no invented backend',fb.slice(0,170));
  const license=await page.request.get(origin+'/docs/r101-commercial-asset-audit.json');
  const doc=await license.json();
  ok(license.status()===200&&doc.character_assets.length===14&&
   doc.character_assets.filter(x=>x.status==='UPSTREAM_LICENSE_VERIFIED').length===8&&
   doc.commercial_final_signoff===false,
   name+' 14 actual art provenance records, no false commercial approval');
  const robots=await page.request.get(origin+'/robots.txt');
  ok(robots.ok()&&(await robots.text()).includes('Allow: /')&&
   !(await robots.text()).includes('Disallow: /\n'),
   name+' robots no longer block entire site');
  const sitemap=await page.request.get(origin+'/sitemap.xml');
  ok(sitemap.ok()&&(await sitemap.text()).includes('credits.html'),
   name+' sitemap includes rights disclosure');
  const source=await page.request.get(origin+'/credits.html');
  ok(source.ok()&&(await source.text()).includes('上游许可核对'),
   name+' public credits page actually exists');
  const issueHref=await page.evaluate(()=>{
   let path=null;window.open=u=>{path=u;return null};
   document.querySelector('#feedback-submit').click();
   return path;
  });
  ok(issueHref.startsWith('https://github.com/star8592/AfterSchoolDuelClub-Playtest/issues/new?')&&
   new URL(issueHref).searchParams.get('body').includes('第三关最有趣'),
   name+' feedback link targets repository with actual tester text',{issueHref:issueHref.slice(0,150)});
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:resolve(out,name+'-landing-hero.png')});
  ok(errors.length===0,name+' zero public landing page JS/HTTP errors',errors);
  report.views.push({name,width,seed:today,networkRequests:requests.length,
   prePlayHeavyDownloads:requests.filter(x=>/\.(?:glb|vrm|ogg)(?:\?|$)/i.test(x.url)).length});
  report.errors.push(...errors);
  await context.close();
 }
 // Real in-game first-play browser test, load success is only true AFTER
 // both original VRM actors + 12 legitimate GLBs, not progress-by-timer.
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const network=[],errors=[];
 page.on('requestfinished',async request=>{
  if(!/\.(glb|vrm)(?:\?|$)/i.test(request.url()))return;
  try{const size=await request.sizes();network.push({
   file:request.url().split('/').pop(),bodyBytes:size.responseBodySize||0});
  }catch(e){network.push({file:request.url().split('/').pop(),error:String(e)})}
 });
 page.on('pageerror',e=>errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status()+' '+r.url())});
 const started=Date.now();
 await page.goto(origin+'/r45-duel/?qa=1',{waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:150000});
 const ms=Date.now()-started;
 const loaded=await page.evaluate(()=>{
  const f=document.querySelector('#stadium').contentWindow;
  return {url:location.href,loaded:Number(f.document.querySelector('#load-progress').value),
   max:Number(f.document.querySelector('#load-progress').max),
   count:f.document.querySelector('#load-count').textContent,
   three:f.__r45SceneQA.summonModels.length,vrm:f.__r45SceneQA.duelistHosts.length,
   firstDraw:f.__r45SceneQA.frameCount,
   canPlay:!document.querySelector('#end').disabled,seed:window.__r45QA.seed};
 });
 ok(loaded.loaded===16&&loaded.max===16&&loaded.three===12&&loaded.vrm===2&&loaded.canPlay,
  '16/16 VERIFIED actual models before first legal move, never fake ready',loaded);
 ok(network.length===16&&network.every(x=>x.bodyBytes>10000),
  'measured all 16 VRM/GLB HTTP network bodies, not guessed file size',network);
 ok(/seed=[0-9]+/.test(loaded.url),'seed reflected in game URL for reproducible share',loaded.url);
 ok(errors.length===0,'game remains playable after actual 16 source load',{errors});
 await page.screenshot({path:resolve(out,'desktop-game-after-verified-load.png')});
 report.game={ms,models:network.length,modelBodyBytes:network.reduce((n,x)=>n+x.bodyBytes,0),
  loading:loaded,errors};
 await page.close();
 report.ok=report.errors.length===0&&report.checks.every(x=>x.pass);
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r101-trial-funnel-report.json'),JSON.stringify(report,null,2));
 console.log('R101_REAL_BROWSER',JSON.stringify({ok:report.ok,checks:report.checks.length,
  errors:report.errors,views:report.views,game:report.game&&{
   initialLoadMs:report.game.ms,models:report.game.models,
   measuredModelNetworkMiB:Number((report.game.modelBodyBytes/1048576).toFixed(2)),
   verified16:report.game.loading.loaded}}));
 await browser.close();
}
if(!report.ok)process.exitCode=6;
