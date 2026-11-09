import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'../../');
const out=resolve(import.meta.dirname,'evidence');mkdirSync(out,{recursive:true});
const port=10934;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let browser;const errors=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/home/master/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',args:[
  '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'
 ]});
 const ctx=await browser.newContext({viewport:{width:1280,height:820},deviceScaleFactor:1});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push('PAGE '+e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
 page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text())});
 await page.goto('http://127.0.0.1:'+port+'/r34-music-3d/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction('window.__M01_QA && (window.__M01_QA.loaded || window.__M01_QA.error)',null,{timeout:90000});
 const qa=await page.evaluate(()=>window.__M01_QA);
 if(!qa.loaded)throw Error('GLB_NOT_LOADED '+JSON.stringify({qa,errors}).slice(0,1900));
 const renderer=await page.evaluate(()=>{const c=document.querySelector('canvas');const gl=c?.getContext('webgl2');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'WebGL2 vendor unavailable'});
 for(const name of ['front','right','back','left','three']){
  await page.locator('[data-view="'+name+'"]').click();await page.waitForTimeout(700);
  await page.screenshot({path:resolve(out,'r34-'+name+'.jpg'),type:'jpeg',quality:80});
 }
 const info={...qa,renderer,browserErrors:errors,source:'R32 569x940 figure art',localModel:'Pixal3D Q8_0 SV candidate',artApproved:false,passed3dBrowser:qa.meshes>=1&&qa.tris>=10000&&!errors.length,rigged:false,viewport:[1280,820]};
 writeFileSync(resolve(out,'browser-proof.json'),JSON.stringify(info,null,2)+'\n');
 console.log('R34_REAL_3D_BROWSER_QA',JSON.stringify(info));
 if(!info.passed3dBrowser)process.exitCode=3;
} catch(err){console.error('R34_BROWSER_QA_FAILED',String(err),errors);process.exitCode=2}
finally{await browser?.close().catch(()=>{});server.kill('SIGTERM')}
