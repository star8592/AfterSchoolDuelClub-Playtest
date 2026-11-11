import{createRequire}from'node:module';import{writeFileSync, mkdirSync}from'node:fs';import{resolve}from'node:path';
const require=createRequire(import.meta.url);
const{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out=resolve(import.meta.dirname,'evidence/r81');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
const result={ok:false,errors:[],states:[],audio:{}};
try{
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 page.on('pageerror',e=>result.errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))result.errors.push('HTTP '+r.status()+' '+r.url());});
 await page.goto('http://127.0.0.1:11021/r45-duel/qa/r81-visual-audio-lab.html',{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForFunction(()=>window.__R81_LAB_QA?.ready,null,{timeout:95000});
 for(let i=0;i<8;i++){
  await page.evaluate(i=>window.__R81_LAB_QA.click(i),i);
  await page.waitForTimeout(i===3?500:145);
  const s=await page.evaluate(()=>{
   const q=document.querySelector('#arena').contentWindow.__r45SceneQA;
   return {spell:q.spellImpact,hosts:q.hostActions,score:q.liveScoreboard.data};
  });
  result.states.push({button:i,spell:s.spell.activeKinds,played:s.spell.played,score:s.score});
  if(i===3){await page.screenshot({path:resolve(out,'r81-lab-strong-eraser-effect.png')});}
 }
 await page.locator('#voice-player').click();
 await page.waitForTimeout(500);
 result.audio=await page.evaluate(()=>({paused:lastAudio.paused,time:lastAudio.currentTime,
   readyState:lastAudio.readyState,src:lastAudio.src.split('/').pop()}));
 await page.screenshot({path:resolve(out,'r81-lab-stadium-scoreboard-and-seats.png')});
 const s=result.states;
 result.ok=s.length===8&&s[3].spell.includes('eraser')&&
  s[2].spell.includes('sonic')&&s[4].spell.includes('repair')&&
  s[7].spell.includes('pages')&&s[7].score.ai===20&&
  result.audio.readyState>=2&&result.errors.length===0;
}catch(e){result.errors.push(String(e));}
finally{writeFileSync(resolve(out,'r81-lab-browser.json'),JSON.stringify(result,null,2)+'\n');
 console.log('R81_VISUAL_LAB',JSON.stringify(result));await browser.close();if(!result.ok)process.exitCode=6;}
