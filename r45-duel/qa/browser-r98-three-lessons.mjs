import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {LESSONS} from '../tutorial.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11098';
const out=resolve(import.meta.dirname,'evidence/r98');mkdirSync(out,{recursive:true});
const report={origin,pass:false,checks:[],errors:[],views:[]};
function check(ok,name,detail=null){
 report.checks.push({pass:!!ok,name,detail});
 if(!ok)throw Error('FAILED '+name+' '+JSON.stringify(detail).slice(0,650));
}
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [name,width] of [['desktop',1550],['mobile',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))
    errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=7',{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:140000});
  check(await page.locator('#tutorial-start').isVisible(),name+' tutorial is accessible from current production game');
  check(await page.locator('#end').isEnabled(),name+' regular duel is playable by default');
  await page.locator('#tutorial-start').click();
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true&&window.__r45QA?.tutorial?.level===1,
   null,{timeout:150000});
  check((new URL(page.url())).searchParams.get('mode')==='tutorial',
   name+' one-step tutorial launch uses existing 3D game route');
  const intro=await page.evaluate(()=>{
   window.__r98Iframe=document.querySelector('#stadium').contentWindow;
   const sc=window.__r98Iframe.__r45SceneQA;
   return{models:sc?.summonModels?.length,duelists:sc?.duelistHosts?.length,
    score:sc?.scoreboard?.data,sound:window.__r45QA.audio.requested};
  });
  check(intro.models===12&&intro.duelists===2&&intro.sound&&intro.score.player===20,
   name+' retains 12 GLBs, original VRM duelists and default-on Qwen sound',intro);
  const lessons=[];
  for(let i=0;i<LESSONS.length;i++){
   const lesson=LESSONS[i];
   let current=await page.evaluate(()=>({t:window.__r45QA.tutorial,stage:
    document.querySelector('#stadium').contentWindow.__r45SceneQA.ready}));
   check(current.t?.level===i+1&&current.t.id===lesson.id&&current.t.step===0&&current.stage,
    name+' stage '+(i+1)+' starts with real prepared duel',{lesson,current});
   check(await page.locator('#end').isDisabled(),name+' tutorial never ends before two real cards');
   check(await page.locator('.card:not([disabled])').count()===1,
    name+' only current legal objective is shown');
   for(let step=0;step<2;step++){
    const card=lesson.cards[step];
    await page.locator('.card[data-card-id="'+card+'"]:not([disabled])').first().click();
    await page.locator('#play').click();
    const state=await page.evaluate(()=>({
     tutorial:window.__r45QA.tutorial,
     combo:window.__r45QA.events.findLast(e=>e.type==='combo_effect'),
     hp:window.__r45QA.hp,
     board:window.__r45QA.board,
     phase:window.__r45QA.phase,
     round:window.__r45QA.round,
     sceneReady:window.__r45QA.sceneReady
    }));
    check(state.sceneReady&&state.tutorial.step===step+1&&state.round===1&&state.phase==='playing',
     name+' chapter '+(i+1)+' real card '+card+' advances tutorial',{state});
    if(step===0)
     check(!state.combo&&state.tutorial.completed===false,
      name+' no phantom combo after the first card');
    else{
     check(state.tutorial.completed&&state.combo?.effect===lesson.effect&&
      state.combo?.serial===state.tutorial.result.serial,
      name+' '+lesson.effect+' is an actual engine combo event',{effect:state.combo});
     if(i===0)check(state.combo.damage===2&&state.combo.defeated&&
       state.board.ai[0].length===0,name+' real chalk impact kills staged opponent');
     if(i===1)check(state.combo.draw===1&&state.board.ai[0].length===1,
       name+' broadcast really draws, no fictional lane switch');
     if(i===2)check(state.combo.shield===2&&state.board.player[0][0].shield===2,
       name+' poster adds actual two-point unit shield');
     lessons.push({level:i+1,id:lesson.id,combo:state.combo.effect,
       damage:state.combo.damage||0,shield:state.combo.shield||0,draw:state.combo.draw||0});
     check(await page.locator('#play').isVisible()&&await page.locator('#play').isEnabled()&&
      (await page.locator('#play').innerText()).includes(i===2?'自由对战':'进入下一关'),
      name+' bottom gold action directly advances completed lesson');
     check(await page.locator('.card:not([disabled])').count()===0,name+' completed chapter stops extra card plays');
     const nameFile=name+'-lesson-'+(i+1)+'-finished.png';
     if(i===0||i===2)await page.screenshot({path:resolve(out,nameFile)});
    }
   }
   if(i<LESSONS.length-1){
    await page.locator('#play').click();
    check(await page.evaluate(()=>window.__r98Iframe===document.querySelector('#stadium').contentWindow),
     name+' advance without redownloading large 3D stadium');
    const next=await page.evaluate(()=>({
     level:window.__r45QA.tutorial.level,scene:window.__r45QA.sceneReady,
     score:document.querySelector('#stadium').contentWindow.__r45SceneQA?.scoreboard?.data
    }));
    check(next.level===i+2&&next.scene&&next.score.player===20&&next.score.ai===20,
     name+' next story scene resets core score but preserves 3D iframe',next);
   }else{
    await page.locator('#play').click();
    await page.waitForFunction(()=>window.__r45QA?.sceneReady===true&&!window.__r45QA?.tutorial,
     null,{timeout:150000});
    check(await page.locator('#end').isEnabled()&&await page.locator('#tutorial-start').isVisible(),
     name+' graduation opens real free duel without trapping player');
   }
  }
  check(errors.length===0,name+' zero JS/GLB network errors',{errors});
  report.errors.push(...errors);report.views.push({name,width,lessons});
  await page.close();
 }
 report.pass=report.checks.every(c=>c.pass)&&report.errors.length===0;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r98-three-lessons-report.json'),JSON.stringify(report,null,2));
 console.log('R98_REAL_BROWSER',JSON.stringify({pass:report.pass,assertions:report.checks.length,
  errors:report.errors,views:report.views}));
 await browser.close();
}
if(!report.pass)process.exitCode=6;
