import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'../..'),port=10935;
const out=resolve(import.meta.dirname,'evidence-r35');mkdirSync(out,{recursive:true});
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;const errors=[];const delay=ms=>new Promise(ok=>setTimeout(ok,ms));
try{
 await delay(300);
 browser=await chromium.launch({headless:true,
  executablePath:'/home/master/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',
  args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const p=await browser.newPage({viewport:{width:1280,height:820}});
 p.on('pageerror',e=>errors.push(e.message));
 const resp=await p.goto('http://127.0.0.1:'+port+'/r25-game/?qaR25=1',{waitUntil:'domcontentloaded',timeout:25000});
 await p.waitForFunction("window.__r25HomeQA?.musicReal3DPreviewURL && document.getElementById('home3d-music')",null,{timeout:25000});
 const proof=await p.evaluate(()=>{
 const q=window.__r25HomeQA,button=document.getElementById('home3d-music');
 const original=window.open;let url=null;window.open=u=>{url=u;return null};
 button.click();window.open=original;
 return{button:button.textContent.trim(),target:url,qaURL:q.musicReal3DPreviewURL,
  kind:q.musicReal3DAssetKind,combat:q.musicReal3DReadyForCombat,
  eighteenCardGamePresent:!!document.getElementById('end-turn')}
 });
 const passed=resp.status()===200&&proof.button.includes('真实3D')&&
  proof.target===proof.qaURL&&proof.target.endsWith('/r34-music-3d/')&&
  proof.kind==='TRUE_GLTF2_GLB_STATIC_UNRIGGED'&&proof.combat===false&&proof.eighteenCardGamePresent;
 const evidence={...proof,passed,jsExceptions:errors,artApproved:false};
 writeFileSync(resolve(out,'browser-proof.json'),JSON.stringify(evidence,null,2)+'\n');
 console.log('R35_TRUE3D_MAIN_ENTRY',JSON.stringify(evidence));
 if(!passed)process.exitCode=4;
}catch(e){console.error('R35_ENTRY_QA_FAILED',String(e),errors);process.exitCode=2}
finally{await browser?.close().catch(()=>{});server.kill('SIGTERM')}
