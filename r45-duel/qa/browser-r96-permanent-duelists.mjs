import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11096';
const dir=resolve(import.meta.dirname,'evidence/r96');mkdirSync(dir,{recursive:true});
const report={origin,ok:false,checks:[],errors:[],scenes:[]};
const check=(ok,name,extra={})=>{
 report.checks.push({pass:!!ok,name,...extra});
 if(!ok)throw Error('FAILED '+name+' '+JSON.stringify(extra).slice(0,450));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage',
 '--autoplay-policy=no-user-gesture-required']});
try{
 for(const [view,width,height] of [['desktop',1600,900],['phone',430,900]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))
   errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?seed=2&qa=1',{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:120000});
  const get=()=>page.evaluate(()=>({
   actors:document.querySelector('#stadium').contentWindow.__r45SceneQA?.duelistHosts,
   game:window.__r45QA?.phase,
   score:document.querySelector('#stadium').contentWindow.__r45SceneQA?.scoreboard,
   spell:document.querySelector('#stadium').contentWindow.__r45SceneQA?.spellImpact
  }));
  await page.waitForTimeout(300);
  const start=await get(),hosts=start.actors;
  check(hosts?.length===2&&hosts[0].id==='E01'&&hosts[1].id==='G01',
   view+' both authentic permanent VRM hosts in separate podiums',{ids:hosts?.map(x=>x.id)});
  check(hosts.every(x=>x.visible&&x.bones>=100&&x.skins>=60),
   view+' original high-bone/skin rigs both visible',{rigs:hosts.map(x=>({id:x.id,bones:x.bones,skins:x.skins,visible:x.visible}))});
  check(hosts.every(x=>Math.abs(x.x)>5&&x.z===0.6),
   view+' permanent podium actors are outside summoning field');
  check(hosts.every(h=>['R','L'].every(side=>{
   const arm=h.posture.arms[side],ik=h.posture.ik[side];
   return arm.drop<-.28&&arm.spread<.57&&Number.isFinite(ik.error)&&ik.error<.25;
  })),view+' authentic shoulder-elbow-wrist IK removes A/T pose',
   {profiles:hosts.map(x=>({id:x.id,arms:x.posture.arms,ik:x.posture.ik}))});
  check(hosts.every(x=>x.expression.faceMeshes>=2&&x.expression.blinkBindings>0&&
   x.expression.expressionBindings>0),view+' original VRM face morphs and blink bindings active');
  check(start.score?.physical&&start.score.data.player===20&&start.score.data.ai===20,
   view+' R95 physical score preserved');
  await page.screenshot({path:resolve(dir,view+'-two-permanent-idle.png')});

  // 100% real card play, no direct scene messages. Observe physical wrist motion.
  await page.locator('.card:not([disabled])').first().click();
  await page.locator('#play').click();
  await page.waitForTimeout(690);
  const early=await get();
  const right=(a,b)=>Math.hypot(...a.posture.arms.R.worldHand.map((n,i)=>n-b.posture.arms.R.worldHand[i]));
  const actualMotion=right(early.actors[0],hosts[0]);
  check(actualMotion>.09&&early.actors[0].posture.phase!=='idle',
   view+' actual player card raises 3D arm and changes IK phase',{rightWristTravel:actualMotion,phase:early.actors[0].posture.phase});
  check(early.actors[0].expression.actualExpression>0.005,
   view+' actual card casting shows source VRM facial expression',{expression:early.actors[0].expression.actualExpression});
  await page.screenshot({path:resolve(dir,view+'-player-reveal.png')});

  await page.waitForTimeout(3000);
  const settled=await get();
  check(['idle','inspect'].includes(settled.actors[0].posture.phase)&&
   settled.actors.every(x=>x.posture.arms.R.drop<-.25),
   view+' player hands and upper body return to relaxed real rig',{phases:settled.actors.map(x=>x.posture.phase)});

  // Enemy plays through core.aiTurn only, same scene event contract.
  await page.locator('#end').click();
  await page.waitForTimeout(650);
  const ai=await get();
  const aiAction=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.duelistAction?.ai);
  check(aiAction?.started>=0||ai.actors[1].posture.phase!=='idle',
   view+' actual AI card event updates persistent rival action',{aiAction,aiPhase:ai.actors[1].posture.phase});

  // Blink is short; sample multiple frames rather than assuming a specific
  // frame falls into the 100ms blink window.
  const blink=await page.evaluate(async()=>{
   const scene=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const peaks={E01:0,G01:0};
   for(let t=0;t<7500;t+=90){
    await new Promise(resolve=>setTimeout(resolve,90));
    for(const h of scene.duelistHosts)
     peaks[h.id]=Math.max(peaks[h.id]||0,h.expression.actualBlink||0);
   }
   return peaks;
  });
  check(blink.E01>.1&&blink.G01>.1,view+' independent natural eye blinks from source VRM',{blink});
  const final=await get();
  check(final.actors.every(h=>h.posture.arms.R.drop<-.24&&h.posture.arms.L.drop<-.24),
    view+' no late A/T pose regression',{arms:final.actors.map(x=>x.posture.arms)});
  check(errors.length===0,view+' zero JS and GLB/asset network errors',{errors});
  report.scenes.push({view,initial:hosts.map(x=>({id:x.id,pose:x.posture,expression:x.expression})),
   motion:actualMotion,aiPhase:ai.actors[1].posture.phase,blink,final:final.actors.map(x=>({id:x.id,pose:x.posture}))});
  report.errors.push(...errors);
  await page.close();
 }
 // Actual E06 eraser spell removes 3 AI HP. Confirm the *persistent*
 // opponent reacts, rather than presenting a fake hit disconnected from rules.
 const impactPage=await browser.newPage({viewport:{width:1600,height:900}});
 impactPage.on('pageerror',e=>report.errors.push('impact JS '+e.message));
 await impactPage.goto(origin+'/r45-duel/?seed=2&qa=1',{waitUntil:'domcontentloaded',timeout:90000});
 await impactPage.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:120000});
 let actualDamage=null;
 for(let i=0;i<125;i++){
  const move=await impactPage.evaluate(()=>{
   const qa=window.__r45QA;
   if(qa.phase==='ended')return{ended:true};
   const all=[...document.querySelectorAll('.card:not([disabled])')];
   const spells=all.filter(el=>['E05','E06','G05','G06','T05','T06'].includes(el.dataset.cardId));
   const card=spells[0]||all[0];
   if(!card){document.querySelector('#end').click();return{turn:true};}
   const id=card.dataset.cardId;
   card.click();document.querySelector('#play').click();
   const last=qa.events.findLast(e=>e.type==='card_play'&&e.side==='player'&&e.card===id);
   return{id,spell:last?.spellOutcome,HP:qa.hp};
  });
  if(move.ended)break;
  if(move.id==='E06'&&move.spell?.directDamage>0){
   actualDamage=move;
   await impactPage.waitForFunction(()=>{
    const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return s.hostHits.ai.damage>0&&s.duelistHosts[1].posture.phase==='hit';
   },null,{timeout:3500});
   const live=await impactPage.evaluate(()=>{
    const sc=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{phase:sc.duelistHosts[1].posture.phase,recoil:sc.duelistHosts[1].posture.recoil,
     hp:window.__r45QA.hp,score:sc.scoreboard.data,spellPlayed:sc.spellImpact.played,
     hitDamage:sc.hostHits.ai.damage,ik:sc.duelistHosts[1].posture.ik};
   });
   check(live.phase==='hit'&&live.recoil>.10&&live.hitDamage===move.spell.directDamage,
    'R96 real eraser direct damage triggers rival VRM recoil',{actualDamage,live});
   check(live.hp.ai===live.score.ai&&live.hp.player===live.score.player,
    'recoil reads canonical score; never applies duplicate damage',{live});
   await impactPage.screenshot({path:resolve(dir,'desktop-real-eraser-ai-recoil.png')});
   await impactPage.waitForTimeout(1100);
   const recovered=await impactPage.evaluate(()=>{
    const sc=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return sc.duelistHosts[1].posture.phase;
   });
   check(['idle','inspect','show','cast','draw'].includes(recovered),
    'defender exits recoil and continues usable natural motion',{recovered});
   break;
  }
  await impactPage.waitForTimeout(12);
 }
 check(!!actualDamage,'R96 real gameplay reached damaging E06 spell');
 await impactPage.close();
 report.ok=report.checks.every(x=>x.pass)&&report.errors.length===0;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(dir,'r96-permanent-duelists-report.json'),JSON.stringify(report,null,2));
 console.log('R96_BROWSER_REPORT',JSON.stringify({ok:report.ok,checks:report.checks.length,
  errors:report.errors,scenes:report.scenes.map(x=>({view:x.view,motion:x.motion,blink:x.blink,aiPhase:x.aiPhase}))}));
 await browser.close();
}
if(!report.ok)process.exit(6);
