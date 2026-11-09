import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'../..'),port=10939;
const srv=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let b;const errors=[];const delay=ms=>new Promise(ok=>setTimeout(ok,ms));
try{
 await delay(300);
 b=await chromium.launch({headless:true,executablePath:'/home/master/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--enable-unsafe-swiftshader']});
 const page=await b.newPage({viewport:{width:1280,height:820}});
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
 const out={modelProof:[]};
 for(const id of ['E02','T02']){
  await page.goto('http://127.0.0.1:'+port+'/r38-demo/?mode=duel&seed=70&qaR25=1&qaR23=1',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForSelector('#hand .card[data-card-id="'+id+'"]',{timeout:20000});
  await page.locator('#hand .card[data-card-id="'+id+'"]').click();
  await page.locator('#arena-lane-0').click();
  try{
   await page.waitForFunction('window.__r23CardStageQA?.loaded && window.__r23CardStageQA.activeActualCards.some(x=>x.side==="player"&&x.id==='+JSON.stringify(id)+')',null,{timeout:45000});
  }catch(e){console.log('R38_STAGE_STATE',JSON.stringify(await page.evaluate(()=>window.__r23CardStageQA??null)).slice(0,1500));throw e}
  const proof=await page.evaluate(id=>{const q=window.__r23CardStageQA;return {id,loaded:q.loaded,meshes:q.meshCounts?.[id],triangles:q.triangles?.[id],
   active:q.activeActualCards.filter(x=>x.id===id&&x.side==='player'),frames:q.actualCardFrames,summonEvents:q.summonEvents,errors:q.errors||[]}},id);
  out.modelProof.push(proof);
 }
 out.errors=errors;out.passed=out.modelProof.length===2&&out.modelProof.every(p=>p.loaded&&p.meshes>3&&p.triangles>5000&&p.active.length&&p.summonEvents>0&&!p.errors.length)&&!errors.length;
 writeFileSync(resolve(import.meta.dirname,'evidence/actual-3d-proof.json'),JSON.stringify(out,null,2)+'\n');
 console.log('R38_ACTUAL_CARD_3D',JSON.stringify(out));
 if(!out.passed)process.exitCode=3;
}catch(e){console.error('R38_3D_TEST_FAILED',String(e),errors);process.exitCode=2}
finally{await b?.close().catch(()=>{});srv.kill('SIGTERM')}
