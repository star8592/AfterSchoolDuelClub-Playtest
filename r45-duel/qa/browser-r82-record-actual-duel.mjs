import{createRequire}from'node:module';import{mkdirSync,copyFileSync,statSync,writeFileSync}from'node:fs';import{resolve}from'node:path';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out=resolve(import.meta.dirname,'evidence/r81');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
let result={ok:false,error:null};
try{
 const ctx=await browser.newContext({viewport:{width:1280,height:720},
   recordVideo:{dir:out,size:{width:1280,height:720}}});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:11021/r45-duel/?seed=5&qa=1',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:95000});
 await page.waitForTimeout(300);
 await page.locator('#end').click();await page.waitForTimeout(550);
 await page.locator('.card[data-card-id="E06"]:not([disabled])').first().click();await page.waitForTimeout(300);
 await page.locator('#play').click();await page.waitForTimeout(2100);
 const state=await page.evaluate(()=>({
  hp:window.__r45QA.hp,
  hits:document.querySelector('#stadium').contentWindow.__r45SceneQA.spellImpact,
  scoreboard:document.querySelector('#stadium').contentWindow.__r45SceneQA.liveScoreboard.data
 }));
 const v=page.video();
 await page.close();const path=await v.path();const dest=resolve(out,'r82-actual-eraser-versus-rival-silent.webm');
 copyFileSync(path,dest);await ctx.close();
 result={ok:state.hp.ai===17&&state.hits.played>=1&&errors.length===0,
  state,videoFile:dest,sizeBytes:statSync(dest).size,errors,note:'Actual Chrome WebGL recording; video does not capture game audio. Open live game to hear Qwen3 voices and Foley.'};
}catch(e){result.error=String(e)}
finally{await browser.close();writeFileSync(resolve(out,'r82-live-recording-audit.json'),JSON.stringify(result,null,2)+'\n');
 console.log('R82_VIDEO',JSON.stringify(result));if(!result.ok)process.exitCode=5;}
