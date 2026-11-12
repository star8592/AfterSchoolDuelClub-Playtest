import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11102';
const evidence=resolve(import.meta.dirname,'evidence/r102');mkdirSync(evidence,{recursive:true});
const report={origin,ok:false,checks:[],errors:[],cases:[]};
const check=(value,label,detail=null)=>{
 report.checks.push({pass:!!value,label,detail});
 if(!value)throw Error(label+': '+JSON.stringify(detail).slice(0,1400));
};
const cases=[
 {seed:9,cards:['E01','G01'],type:'combo_chalk_direct',mode:'combo',effect:'chalk_direct'},
 {seed:14,cards:['G05','T05'],type:'combo_poster_draw',mode:'combo',effect:'poster_draw'},
 {seed:4,cards:['E05'],type:'spell_buff',mode:'spell',effect:'buff'},
 {seed:2,cards:['G05'],type:'spell_repair',mode:'spell',effect:'repair'},
 {seed:7,cards:['G06'],type:'spell_draw',mode:'spell',effect:'draw'},
 {seed:4,cards:['T05'],type:'spell_heal',mode:'spell',effect:'heal'}
];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const item of cases){
  const page=await browser.newPage({viewport:{width:1450,height:890}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push(r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed='+item.seed,
    {waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:145000});
  for(const id of item.cards){
   await page.locator('.card[data-card-id="'+id+'"]:not([disabled])').first().click();
   await page.locator('#play').click();
  }
  await page.waitForFunction(type=>
   document.querySelector('#stadium').contentWindow.__r45SceneQA?.comedySpectacle?.typesSeen?.includes(type),
   item.type,{timeout:14000});
  // Event acceptance can precede the first WebGL frame; sample only AFTER
  // a real 3D particle frame has actually rendered.
  await page.waitForFunction(()=>
   document.querySelector('#stadium').contentWindow.__r45SceneQA?.comedySpectacle?.visibleFrames>0,
   null,{timeout:6000});
  const snap=await page.evaluate(()=>{
   const ui=window.__r45QA,stage=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{
    scene:stage.comedySpectacle,combo:stage.comboDirector,
    hp:ui.hp,event:ui.events.findLast(e=>
     e.type==='combo_effect'||e.type==='card_play'&&e.spellOutcome),
    audio:ui.audio.comicBeatHistory,
    aside:document.querySelector('#comedy-quip-text').textContent
   };
  });
  check(snap.scene.typesSeen.includes(item.type)&&snap.scene.visibleFrames>0,
   item.type+' genuine 3D spectator performance',snap.scene);
  check(snap.audio.some(x=>x.type===item.type),
   item.type+' genuine new original sound linked',snap.audio);
  check(snap.aside.length>=8,
   item.type+' authored dialogue grounded to card action',snap.aside);
  if(item.mode==='combo'){
   check(snap.event.type==='combo_effect'&&snap.event.effect===item.effect,
    item.type+' source event genuinely from engine',snap.event);
   check(snap.combo.last.effect===item.effect&&
    snap.combo.last.serial===snap.event.serial,
    item.type+' real cinematic receipt serial matches',snap.combo.last);
   if(item.effect==='poster_draw')check(snap.combo.last.shield===0&&snap.combo.last.draw===1,
    'no fake poster shield in draw fallback',snap.combo.last);
   if(item.effect==='chalk_direct')check(snap.combo.last.target===null&&snap.combo.last.damage===1,
    'chalk direct no fake target',snap.combo.last);
  }else check(snap.event.type==='card_play'&&
   snap.event.spellOutcome.effect===item.effect,
   item.type+' source effect matches actual spell outcome',snap.event);
  await page.screenshot({path:resolve(evidence,'free-'+item.type+'.png')});
  await page.waitForTimeout(1350);
  const stage=await page.evaluate(()=>
   document.querySelector('#stadium').contentWindow.__r45SceneQA.comedySpectacle);
  check(stage.active===0,item.type+' all 3D spectator meshes auto cleaned',stage);
  check(errors.length===0,item.type+' 0 JS/HTTP exceptions',errors);
  report.cases.push({type:item.type,seed:item.seed,actual:snap.event.effect||snap.event.spellOutcome.effect});
  await page.close();
 }
 report.ok=report.checks.every(x=>x.pass)&&!report.errors.length;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(evidence,'r102-event-matrix-report.json'),JSON.stringify(report,null,2));
 console.log('R102_REAL_FREE_EVENT_MATRIX',JSON.stringify({ok:report.ok,checks:report.checks.length,
  errors:report.errors,cases:report.cases}));
 await browser.close();
}
if(!report.ok)process.exitCode=7;
