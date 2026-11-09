import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'../..'),port=10936;
const out=resolve(import.meta.dirname,'../evidence/browser');mkdirSync(out,{recursive:true});
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await wait(300);
 browser=await chromium.launch({headless:true,
 executablePath:'/home/master/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const outList=[];
 for(const [name,width,height] of [['desktop',1280,820],['mobile',430,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push('JS '+e.message));page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const res=await page.goto('http://127.0.0.1:'+port+'/r36-hybrid-3d/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction('window.__R36_QA?.loaded || window.__R36_QA?.error',null,{timeout:90000});
  const state=await page.evaluate(()=>window.__R36_QA);
  if(state.error||!state.loaded)throw Error('R36_FAILED_TO_LOAD '+JSON.stringify(state));
  await page.screenshot({path:resolve(out,'R36_'+name+'_morph100.jpg'),type:'jpeg',quality:84});
  await page.locator('#morph').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}))});
  const text0=await page.locator('#morph-out').textContent();
  await page.screenshot({path:resolve(out,'R36_'+name+'_morph0.jpg'),type:'jpeg',quality:84});
  await page.locator('#morph').evaluate(el=>{el.value='100';el.dispatchEvent(new Event('input',{bubbles:true}))});
  await page.locator('#shoulder').evaluate(el=>{el.value='15';el.dispatchEvent(new Event('input',{bubbles:true}))});
  const text15=await page.locator('#shoulder-out').textContent();
  await page.waitForTimeout(250);
  await page.screenshot({path:resolve(out,'R36_'+name+'_shoulder15.jpg'),type:'jpeg',quality:84});
  const proof={name,viewport:[width,height],http:res.status(),...state,
    morphSliderResponded:text0==='0%',shoulderSliderResponded:text15==='15°',
    errors,pass:res.status()===200&&state.bones===163&&state.morphNames.some(n=>n.includes('PixalGuide'))&&
     state.shoulderFound&&text0==='0%'&&text15==='15°'&&!errors.length};
  outList.push(proof);console.log('R36_BROWSER',JSON.stringify(proof));await page.close();
 }
 writeFileSync(resolve(out,'browser-proof.json'),JSON.stringify(outList,null,2)+'\n');
 if(outList.some(s=>!s.pass))process.exitCode=3;
}catch(e){console.error('R36_BROWSER_FAILED',String(e));process.exitCode=2}
finally{await browser?.close().catch(()=>{});server.kill('SIGTERM')}
