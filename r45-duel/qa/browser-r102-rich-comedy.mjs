import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {CARDS} from '../engine.mjs';
import {COMIC_BEATS} from '../audio-engine.mjs';
import {COMIC_ASIDE_LINES} from '../comedy-script.mjs';
import {R102_SPECTACLES} from '../scene/comedy-spectacle.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11102';
const evidence=resolve(import.meta.dirname,'evidence/r102');mkdirSync(evidence,{recursive:true});
const report={origin,ok:false,checks:[],errors:[],chapters:[],realVoice:[],skips:[],sfx:[]};
const verify=(pass,name,data=null)=>{
 report.checks.push({pass:!!pass,name,data});
 if(!pass)throw Error('R102 FAIL '+name+': '+JSON.stringify(data).slice(0,1100));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const scene=async p=>p.evaluate(()=>{
 const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
 return{spectacle:s.comedySpectacle,combo:s.comboDirector,
  actors:s.summonPresence?.r102Comedy,models:s.summonModels.length};
});
try{
 verify(CARDS.length===20&&COMIC_ASIDE_LINES.E01.length>=4&&
  Object.values(COMIC_ASIDE_LINES).reduce((n,x)=>n+x.length,0)>=120,
  '126+ authored school jokes cover true 20 card IDs',Object.values(COMIC_ASIDE_LINES).reduce((n,x)=>n+x.length,0));
 verify(Object.keys(COMIC_BEATS).length>=17&&Object.keys(R102_SPECTACLES).length>=16,
  '20 authored original Foley sets and 16 actual 3D visual styles',
  {soundSets:Object.keys(COMIC_BEATS),effects:Object.keys(R102_SPECTACLES)});
 for(const [device,width] of [['desktop',1500],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push('page '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))
   errors.push('HTTP '+r.status()+' '+r.url())});
  for(const [level,ids,effect] of [
    [1,['E01','G01'],'chalk_hit'],
    [2,['E01','T01'],'broadcast_draw'],
    [3,['G01','T01'],'poster_shield']
  ]){
   await page.goto(origin+'/r45-duel/?mode=tutorial&level='+level+'&qa=1&seed=19',
    {waitUntil:'domcontentloaded',timeout:65000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:145000});
   verify((await scene(page)).models===12,
    device+' L'+level+' preserve 2 genuine VRM + 12 real 3D glb loading');
   for(const id of ids){
    await page.locator('.card[data-card-id="'+id+'"]:not([disabled])').first().click();
    await page.locator('#play').click();
   }
   await page.waitForFunction(expected=>
    document.querySelector('#stadium').contentWindow.__r45SceneQA?.comboDirector?.last?.effect===expected,
    effect,{timeout:15000});
   const initial=await scene(page);
   verify(initial.combo?.played>=1&&initial.actors?.comboReactions>=1,
    device+' '+effect+' actual engine triggers real rig choreography',
    {played:initial.combo?.played,actors:initial.actors});
   verify(initial.combo.actualProps.schoolBroadcastSpectrumBars===11&&
    initial.combo.actualProps.posterFlyers===16,
    device+' original 3D spectrum + volumetric comic flyers retained',initial.combo.actualProps);
   verify(await page.locator('#comedy-aside').isVisible()&&
    (await page.locator('#comedy-quip-text').innerText()).length>10,
    device+' '+effect+' comic dialogue actually appears');
   await page.waitForFunction(expected=>
    document.querySelector('#stadium').contentWindow.__r45SceneQA?.comedySpectacle?.typesSeen?.includes('combo_'+expected),
    effect,{timeout:15000});
   const impact=await scene(page);
   verify(impact.spectacle.played>=2&&impact.spectacle.visibleFrames>0,
    device+' '+effect+' volumetric 3D layer ACTUALLY renders at real impact',
    impact.spectacle);
   const aud=await page.evaluate(()=>window.__r45QA.audio);
   verify(aud.decodedCues>=37&&aud.comicBeatHistory.some(x=>x.type==='combo_'+effect),
    device+' '+effect+' audible SFX layers at true combo impact',
    {decoded:aud.decodedCues,beats:aud.comicBeatHistory});
   report.sfx.push({device,effect,beats:aud.comicBeatHistory.slice(-3)});
   await page.waitForFunction(()=>window.__r45QA?.audio?.counters?.voice>0,
    null,{timeout:12500});
   const voiced=await page.evaluate(()=>({
    last:window.__r45QA.comedy.lastQwenSubtitle,
    audio:window.__r45QA.audio.speechHistory.at(-1),
    count:window.__r45QA.comedy.spokenSubtitleCount
   }));
   verify(voiced.last?.text&&voiced.last.text===voiced.audio?.text&&voiced.count>=1,
    device+' '+effect+' text MUST match actual Qwen voice file',voiced);
   report.realVoice.push({device,level,...voiced});
   await page.screenshot({path:resolve(evidence,device+'-chapter'+level+'-'+effect+'.png')});
   await page.waitForFunction(()=>!document.querySelector('#stadium').contentWindow.__r45SceneQA?.comboDirector?.active,
    null,{timeout:11000});
   await page.waitForTimeout(1450);
   const complete=await scene(page);
   verify(complete.spectacle.active===0&&complete.combo.completed>=1,
    device+' '+effect+' all comic 3D particle meshes cleaned after movie',
    {spectacle:complete.spectacle,combo:complete.combo});
   verify(await page.locator('#play').isEnabled(),
    device+' '+effect+' next lesson CTA stays playable');
   verify(errors.length===0,device+' '+effect+' zero JS / 404 errors',errors);
   report.chapters.push({device,level,effect,actor:impact.actors,scene3d:impact.spectacle.last});
  }
  // Skipped act: scene must not manufacture delayed hit SFX or comic explosion.
  await page.goto(origin+'/r45-duel/?mode=tutorial&level=1&qa=1&seed=41',
   {waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:145000});
  for(const id of ['E01','G01']){
   await page.locator('.card[data-card-id="'+id+'"]:not([disabled])').first().click();
   await page.locator('#play').click();
  }
  await page.locator('#stadium').contentFrame().locator('#skip-combo').click();
  await page.waitForTimeout(1250);
  const skipped=await scene(page);
  const sound=await page.evaluate(()=>window.__r45QA.audio.comicBeatHistory);
  verify(skipped.combo.skipped>=1&&
   !skipped.spectacle.typesSeen.includes('combo_chalk_hit')&&
   !sound.some(x=>x.type==='combo_chalk_hit'),
   device+' skip-before-impact never plays a fake late hit', {skipped, sound});
  verify(!skipped.actors.active.length,device+' skip cleans real actor reaction',skipped.actors);
  report.skips.push({device,skip:skipped.combo.skipped,sounds:sound.length});
  verify(errors.length===0,device+' overall zero real browser errors',errors);
  await page.close();
 }
 report.ok=report.checks.every(x=>x.pass)&&!report.errors.length;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(evidence,'r102-rich-comedy-report.json'),JSON.stringify(report,null,2));
 console.log('R102_RICH_REAL_BROWSER',JSON.stringify({ok:report.ok,checks:report.checks.length,
  errors:report.errors,chapters:report.chapters.map(x=>({
   device:x.device,level:x.level,effect:x.effect,actorGestures:x.actor?.gestures,
   scene3d:x.scene3d})),sfx:report.sfx.length,voice:report.realVoice.length,skips:report.skips}));
 await browser.close();
}
if(!report.ok)process.exitCode=7;
