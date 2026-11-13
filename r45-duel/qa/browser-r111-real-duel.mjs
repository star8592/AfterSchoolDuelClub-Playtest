import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const ORIGIN=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11111';
const out=resolve(import.meta.dirname,'evidence/r111');mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[],views:[]};
const check=(pass,label,evidence)=>{report.checks.push({pass:!!pass,label,evidence});if(!pass)throw Error(label+' '+String(JSON.stringify(evidence)).slice(0,950))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[],heavy=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('console',e=>{if(e.type()==='error')errors.push('CONSOLE '+e.text().slice(0,300))});
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(ORIGIN))errors.push('HTTP '+r.status()+' '+r.url())});
  page.on('request',r=>{if(/\.(vrm|glb)(\?|$)/i.test(r.url()))heavy.push(r.url())});
  await page.goto(ORIGIN+'/r45-duel/?qa=1&deck=kitchen&seed=8',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:175000});
  const init=await page.evaluate(()=>({
   hand:window.__r45QA.hand,
   magic:document.querySelector('#stadium').contentWindow.__r45SceneQA.magicArsenal,
   elemental:document.querySelector('#stadium').contentWindow.__r45SceneQA.elementalVfx,
   calls:document.querySelector('#stadium').contentWindow.__r45SceneQA.drawCalls
  }));
  check(init.magic?.motifCount===32&&init.magic?.playableSpellCoverage===46,
   view+' all 46 spells connected to 32 physical motifs',init.magic);
  check(init.magic.played===0&&init.elemental?.played===0,
   view+' no fake initial cast',init);
  check(init.hand.includes('K01'),view+' authentic K01 drawn',init.hand);
  await page.locator('.card[data-card-id="K01"]:not([disabled])').first().click();
  await page.locator('#play').click();
  await page.waitForFunction(()=>window.__r45QA?.hp?.ai===19,null,{timeout:12000});
  await page.waitForFunction(()=>
   document.querySelector('#stadium').contentWindow.__r45SceneQA.magicArsenal?.lastBySide?.player==='K01',
   null,{timeout:9000});
  const magic=await page.evaluate(()=>({
   hp:window.__r45QA.hp,
   magic:document.querySelector('#stadium').contentWindow.__r45SceneQA.magicArsenal,
   spell:document.querySelector('#stadium').contentWindow.__r45SceneQA.spellImpact,
   drawCalls:document.querySelector('#stadium').contentWindow.__r45SceneQA.drawCalls,
   canonical:window.__r45QA.events.filter(e=>e.type==='card_play'&&e.card==='K01').at(-1),
  }));
  check(magic.hp.ai===19&&magic.canonical?.spellOutcome?.effect==='stew',
   view+' genuine spell effect dealt exactly one damage',magic.hp);
  check(magic.magic.played>=1&&magic.magic.lastBySide.player==='K01',
   view+' real scene rendered distinct 3D banana/eggplant motif',magic.magic);
  check(magic.spell.played>=1,view+' previous R81 impact remains compatible');
  check(magic.magic.ruleMutations===0&&magic.magic.maxActive===4,
   view+' 3D magic never changes HP or battle rules and bounded concurrency',magic.magic);
  await page.screenshot({path:resolve(out,view+'-K01-new-magic.png')});
  const beforeModels=heavy.length;
  await page.locator('#deck-select').selectOption('classic');
  await page.waitForFunction(()=>window.__r45QA?.deckPreset==='classic');
  check(await page.locator('.card[data-card-id="E01"]:not([disabled])').count()>0,
   view+' E01 summon available after switching deck');
  await page.locator('.card[data-card-id="E01"]:not([disabled])').first().click();
  await page.locator('#play').click();
  await page.waitForFunction(()=>
   document.querySelector('#stadium').contentWindow.__r45SceneQA.elementalVfx?.played>=1,
   null,{timeout:9000});
  const summon=await page.evaluate(()=>({
   elemental:document.querySelector('#stadium').contentWindow.__r45SceneQA.elementalVfx,
   magic:document.querySelector('#stadium').contentWindow.__r45SceneQA.magicArsenal,
   board:window.__r45QA.board,
   ready:window.__r45QA.sceneReady,
   drawCalls:document.querySelector('#stadium').contentWindow.__r45SceneQA.drawCalls
  }));
  check(summon.elemental?.played>=1&&
   (summon.elemental.activeTypes.includes('portal')||summon.elemental.expired>=1),
   view+' restored R79 original portal on genuine E01 summon',summon);
  check(summon.ready&&heavy.length===beforeModels,view+' deck switch and portal without re-downloading 16 models',heavy);
  check(summon.magic.played===magic.magic.played,
   view+' portal on unit never forges a spell result');
  await page.screenshot({path:resolve(out,view+'-E01-restored-R79-portal.png')});
  await page.waitForTimeout(2700);
  const cleaned=await page.evaluate(()=>({
   spells:document.querySelector('#stadium').contentWindow.__r45SceneQA.magicArsenal,
   legacy:document.querySelector('#stadium').contentWindow.__r45SceneQA.elementalVfx,
   drawCalls:document.querySelector('#stadium').contentWindow.__r45SceneQA.drawCalls
  }));
  check(cleaned.spells.active===0&&cleaned.legacy.active===0&&
     cleaned.spells.expired>=1&&cleaned.legacy.expired>=1,
     view+' real WebGL effects expire and free meshes',cleaned);
  check(cleaned.drawCalls<=summon.drawCalls,
     view+' no frame draw-call accumulation after effects end',cleaned.drawCalls);
  check(errors.length===0,view+' no browser errors or WebGL compilation issues',errors);
  report.views.push({view,models:heavy.length,magic:magic.magic,portal:summon.elemental,
   drawCallsBaseline:init.calls,drawCallsSpell:magic.drawCalls,drawCallsPortal:summon.drawCalls});
  await page.close();
 }
 report.passed=report.checks.every(x=>x.pass);
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r111-real-duel-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R111_REAL_DUEL',JSON.stringify({passed:report.passed,checks:report.checks.length,
  errors:report.errors,views:report.views.map(x=>({view:x.view,models:x.models,
   magic:x.magic.lastBySide,portal:x.portal.activeTypes,drawCalls:[x.drawCallsBaseline,x.drawCallsSpell,x.drawCallsPortal]}))}));
 await browser.close();
}
if(!report.passed)process.exitCode=6;
