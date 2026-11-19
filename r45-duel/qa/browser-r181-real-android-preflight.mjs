import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out=resolve(import.meta.dirname,'evidence/r181-real-android');
mkdirSync(out,{recursive:true});
const browser=await chromium.connectOverCDP('http://127.0.0.1:19222',{timeout:20000});
try{
 const tab=browser.contexts().flatMap(c=>c.pages()).find(
  p=>p.url().startsWith('http://127.0.0.1:18681/r45-duel/qa/r181-android-gpu-preflight.html'));
 if(!tab)throw Error('No dedicated Android QA page');
 await tab.goto('http://127.0.0.1:18681/r45-duel/qa/r181-android-gpu-preflight.html',
  {waitUntil:'domcontentloaded',timeout:30000});
 await tab.waitForFunction(()=>window.__R181_GPU?.time||window.__R181_GPU?.pass===false,
  null,{timeout:35000,polling:300});
 const d=await tab.evaluate(()=>window.__R181_GPU);
 writeFileSync(resolve(out,'s21-real-gpu-preflight.json'),JSON.stringify(d,null,2));
 await tab.screenshot({path:resolve(out,'s21-real-gpu-preflight.png')});
 console.log('R181_ANDROID_GPU_PREFLIGHT',JSON.stringify(d));
 if(!d.pass)process.exitCode=2;
}finally{await browser.close()}
