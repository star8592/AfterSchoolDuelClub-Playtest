import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';import{resolve}from'node:path';
const require=createRequire(import.meta.url);
const{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const ROOT='http://127.0.0.1:11021/r45-duel/',out=resolve(import.meta.dirname,'evidence/r81');
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const report={cases:[],errors:[],screenshots:[],ok:false};
async function open(seed){
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 page.on('pageerror',e=>report.errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))report.errors.push('HTTP '+r.status()+' '+r.url());});
 await page.goto(ROOT+'?seed='+seed+'&qa=1',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:95000});
 return page;
}
async function state(page){
 return page.evaluate(()=>{
 const game=window.__r45QA,scene=document.querySelector('#stadium').contentWindow.__r45SceneQA;
 return {hand:game.hand,hp:game.hp,events:game.events.slice(-3),
    scoreboard:scene.liveScoreboard,seats:scene.stadium,hosts:scene.hostActions,
    hostDamage:scene.hostDamage,spell:scene.spellImpact,vfx:scene.elementalVfx,
    audio:game.audio};
 });
}
try{
 // Seed 1: actual unit card, score before spell, host action.
 let page=await open(1),initial=await state(page);
 await page.locator('.card[data-card-id="E01"]').first().click();
 await page.locator('#play').click();await page.waitForTimeout(390);
 const afterSummon=await state(page);
 await page.screenshot({path:resolve(out,'r81-stadium-real-chairs-and-live-score.png')});report.screenshots.push('r81-stadium-real-chairs-and-live-score.png');
 const part1=initial.seats?.seating?.chairs===396&&initial.scoreboard.data.player===20&&initial.scoreboard.data.ai===20&&
  afterSummon.vfx.played>=1&&afterSummon.hosts.player.started>0&&
  afterSummon.events.some(e=>e.type==='card_play'&&e.card==='E01')&&afterSummon.hand.length===4;
 report.cases.push({name:'canonical board + physical chairs + real summon + duelist gesture',pass:part1,
  frontSeats:initial.seats?.seating?.front,rearSeats:initial.seats?.seating?.reverse,
  totalSeats:initial.seats?.seating?.chairs,scoreboard:initial.scoreboard,
  handAfter:afterSummon.hand.length,hostGesture:afterSummon.hosts.player});
 await page.close();
 // Seed 5: E06 only legal after turn, real damage causes visible victim reaction.
 page=await open(5);
 // R83: audio is on by default; ordinary game actions unlock browser audio.
 await page.waitForFunction(()=>window.__r45QA?.audio?.voiceClipCount>=15,null,{timeout:17000}).catch(()=>{});
 await page.locator('#end').click();
 await page.waitForTimeout(320);
 const before=await state(page);
 const button=page.locator('.card[data-card-id="E06"]:not([disabled])').first();
 await button.click();await page.locator('#play').click();
 await page.waitForTimeout(780);
 const after=await state(page);
 await page.screenshot({path:resolve(out,'r81-real-eraser-hit-rival-reaction.png')});report.screenshots.push('r81-real-eraser-hit-rival-reaction.png');
 const damage=before.hp.ai-after.hp.ai;
 const part2=damage===3&&after.spell.played>0&&after.spell.hits>0&&
  after.spell.activeKinds.includes('eraser')&&after.hostDamage.ai.started>0&&
  after.scoreboard.data.ai===after.hp.ai&&after.scoreboard.data.round===after.scoreboard.data.round;
 report.cases.push({name:'real card E06 blast → 3 HP damage → hit reaction → scoreboard',pass:part2,
  beforeHp:before.hp,afterHp:after.hp,activeSpell:after.spell,hostHit:after.hostDamage.ai,
  scoreboard:after.scoreboard.data,audio:after.audio?.counters,
  voiceClipCount:after.audio?.voiceClipCount});
 await page.close();
 report.ok=report.cases.every(x=>x.pass)&&report.errors.length===0;
}catch(e){report.errors.push(String(e));
}finally{writeFileSync(resolve(out,'r81-real-browser-acceptance.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R81_BROWSER',JSON.stringify(report));await browser.close();if(!report.ok)process.exitCode=7;}
