import{createRequire}from'node:module';import{writeFileSync,mkdirSync}from'node:fs';import{resolve}from'node:path';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out=resolve(import.meta.dirname,'evidence/r84');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
let result={pass:false,errors:[],stats:[]};
try{
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 page.on('pageerror',e=>result.errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))result.errors.push('HTTP '+r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:11024/r45-duel/qa/r84-film-casting-gallery.html',{waitUntil:'domcontentloaded',timeout:47000});
 await page.waitForFunction(()=>window.__R84_ART_QA?.frames>=25,null,{timeout:90000});
 await page.waitForTimeout(4400); // allow any initial WebGL context reset to settle
 const state=await page.evaluate(()=>window.__R84_ART_QA);
 await page.screenshot({path:resolve(out,'r84-film-artist-candidates-front.png')});
 await page.mouse.move(600,400);await page.mouse.down();await page.mouse.move(1070,400,{steps:15});await page.mouse.up();
 await page.waitForTimeout(350);
 await page.screenshot({path:resolve(out,'r84-film-artist-candidates-angle.png')});
 result={pass:state.ready&&state.models.length===3&&state.models.every(x=>x.loadOk&&x.triangles>30000)&&result.errors.length===0,stats:state.models,errors:result.errors};
}catch(e){result.errors.push(String(e))}
finally{writeFileSync(resolve(out,'r84-casting-browser.json'),JSON.stringify(result,null,2)+'\n');
 console.log('R84_FILM_BROWSER',JSON.stringify(result));await browser.close();if(!result.pass)process.exitCode=6}
