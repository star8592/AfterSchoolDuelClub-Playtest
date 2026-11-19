/** R199: real player cast through 60-card deterministic engine. */
import assert from 'node:assert/strict';
import{createRequire}from'node:module';
import {BY_ID,createGame}from '../engine.mjs';
import{mkdirSync,writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const deck=process.env.R199_DECK||'kitchen';
const seed=Number(process.env.R199_SEED||2);
const g=createGame(seed,deck);
const wanted=g.hand.player.find(id=>BY_ID[id]?.kind==='spell'&&BY_ID[id].cost<=g.energy.player);
assert(wanted,'test seed must have a legal school spell in initial hand');
const dir='r45-duel/qa/evidence/r199-real-magic';
mkdirSync(dir,{recursive:true});
const report={deck,seed,wanted,pass:false,errors:[]};
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const c=await b.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
const page=await c.newPage();
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
const snap=()=>page.evaluate(()=>{
 const q=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
 return {qRound:q?.round,events:q?.events,
  rulesHp:q?.hp,hand:q?.hand,school:z?.r199RealMagic,
  magicArsenal:z?.magicArsenal,spellImpact:z?.spellImpact,
  originalSources:z?.summonModels?.length,
  autoCamera:z?.r145ActionShot,portrait:z?.heroLens};
});
try{
 const u=new URL('http://127.0.0.1:18689/r45-duel/');
 u.searchParams.set('qa','1');u.searchParams.set('r199PhysicalMagic','on');
 u.searchParams.set('deck',deck);u.searchParams.set('seed',String(seed));
 await page.goto(u.toString(),{waitUntil:'domcontentloaded',timeout:65000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:130000});
 report.before=await snap();
 assert.equal(report.before.school.originalCatalog,46);
 assert.equal(report.before.originalSources,12);
 const card=page.locator(`#hand .card[data-card-id="${wanted}"]`).first();
 assert(await card.count()>=1);
 await card.click();
 assert(await page.locator('#play').isEnabled());
 await page.locator('#play').click();
 await page.waitForFunction(id=>{
  const f=document.getElementById('stadium').contentWindow;
  return f?.__r45SceneQA?.r199RealMagic?.stage?.lastBySide?.player===id;
 },wanted,{timeout:60000});
 report.after=await snap();
 const ev=report.after.events.find(e=>e.type==='card_play'&&
   e.card===wanted&&e.side==='player'&&e.spellOutcome);
 assert(ev,'genuine rule spell event absent');
 assert(report.after.school.loadedIds.includes(wanted));
 assert(report.after.school.stage.played>=1);
 assert.equal(report.after.magicArsenal.played,0,'old light arsenal was triggered');
 assert.equal(report.after.spellImpact.played,0,'old spell-impact effect still played');
 assert.equal(report.after.autoCamera.enabled,false);
 assert.equal(report.after.portrait.visible,false);
 await page.locator('#stadium').screenshot({path:dir+'/real-player-cast-'+wanted+'.png'});
 assert.deepEqual(report.errors,[]);
 report.pass=true;
 console.log('R199_REAL_SPELL_CARD_PLAYER_CAST_PASS',JSON.stringify({
  deck,seed,wanted,realGlb:report.after.school.loadedAssetDetails.find(x=>x.id===wanted),
  ruleDamage:ev.spellOutcome,oldLights:0,errors:[]}));
}finally{
 writeFileSync(dir+'/real-player-cast-'+deck+'-'+wanted+'.json',JSON.stringify(report,null,2)+'\n');
 await c.close();await b.close();
}
