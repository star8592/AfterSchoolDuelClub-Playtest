import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'../..'),port=10956;
const srv=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
let b;const errors=[];const sleep=ms=>new Promise(res=>setTimeout(res,ms));
try{
 await sleep(350);
 b=await chromium.launch({headless:true,executablePath:'/home/master/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell',
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const p=await b.newPage({viewport:{width:1366,height:850}});
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
 await p.goto('http://127.0.0.1:'+port+'/r39-demo/?mode=duel&seed=70',{waitUntil:'domcontentloaded',timeout:30000});
 const state=async()=>p.evaluate(()=>({hp:document.getElementById('player-hp').textContent,
  aiHp:document.getElementById('ai-hp').textContent,
  round:document.getElementById('round-num').textContent,
  active:document.getElementById('performance-stage').dataset.live3d,
  hidden:document.getElementById('performance-stage').hidden}));
 const before=await state();
 await p.locator('#home3d-r39-fight').click();
 await p.waitForFunction("document.getElementById('performance-stage').dataset.live3d==='playing'",null,{timeout:22000});
 const first=await state();
 await p.locator('#performance-skip').click();
 await p.waitForFunction("document.getElementById('performance-stage').hidden===true",null,{timeout:5000});
 const afterSkip=await state();
 await p.locator('#home3d-r39-fight').click();
 await p.waitForFunction("document.getElementById('performance-stage').dataset.live3d==='playing'",null,{timeout:22000});
 const replay=await state();
 const unchanged=[before,first,afterSkip,replay].every(x=>x.hp===before.hp&&x.aiHp===before.aiHp&&x.round===before.round);
 const report={before,first,afterSkip,replay,unchanged,errors,
  passed:before.hidden&&first.active==='playing'&&afterSkip.hidden&&replay.active==='playing'&&unchanged&&!errors.length};
 writeFileSync(resolve(import.meta.dirname,'evidence/replay-skip-proof.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R39_SKIP_REPLAY',JSON.stringify(report));
 if(!report.passed)process.exitCode=3;
}catch(e){console.error('R39_REPLAY_FAILED',String(e),errors);process.exitCode=2}
finally{await b?.close().catch(()=>{});srv.kill('SIGTERM')}
