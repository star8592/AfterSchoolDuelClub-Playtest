/** Compare plain Chrome headless RAF scheduling with actual 3D stage. */
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const backend=process.env.R197_GPU||'vulkan';
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--disable-software-rasterizer',
  '--disable-dev-shm-usage',...(backend==='gl'?['--use-angle=gl']:
   ['--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan'])]});
const c=await b.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
const p=await c.newPage(), errors=[],result={backend,checks:[]};
p.on('pageerror',e=>errors.push(String(e)));
const sample=async(label)=>p.evaluate(async label=>{
 const tasks=performance.getEntriesByType('longtask');
 const initTaskCount=tasks.length;
 const raf=()=>new Promise(resolve=>{
  let last=0,t0=performance.now();const values=[],gaps=[];
  const step=t=>{
   if(last){const delta=t-last;values.push(delta);if(delta>=100)gaps.push({t:+(t-t0).toFixed(1),ms:+delta.toFixed(1)})}
   last=t;if(t-t0<4500){requestAnimationFrame(step);return}
   values.sort((a,b)=>a-b);const at=x=>values[Math.floor((values.length-1)*x)];
   resolve({count:values.length,p50:at(.5),p95:at(.95),p99:at(.99),max:values.at(-1),gaps});
  };requestAnimationFrame(step)
 });
 const d=await raf();
 return {label,visibility:document.visibilityState,
  raf:d,jsLongTasks:performance.getEntriesByType('longtask').slice(initTaskCount)
   .filter(x=>x.duration>=50).map(x=>({start:+x.startTime.toFixed(1),ms:+x.duration.toFixed(1)})).slice(-25)};
},label);
try{
 await p.goto('about:blank');
 await p.setContent('<html><body><h1>R197 neutral frame timing control</h1></body></html>');
 result.checks.push(await sample('empty_html'));
 await p.goto('http://127.0.0.1:18687/r45-duel/?seed=173',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>document.getElementById('stadium')?.contentWindow?.__ASDC_LOAD_METRICS?.firstFrameReadyMs>0&&
  document.getElementById('end')?.disabled===false,null,{timeout:120000});
 result.checks.push(await sample('game_after_load_idle'));
 const cards=p.locator('#hand .card:not([disabled])');
 await cards.first().click();await p.locator('#play').click();
 await p.locator('#end').click();await p.waitForTimeout(1000);
 result.checks.push(await sample('game_after_play_and_ai'));
 result.errors=errors;
 console.log('R197_FRAME_HITCH_DIAG',JSON.stringify(result));
}finally{
 mkdirSync('r45-duel/qa/evidence/r197-desktop-first',{recursive:true});
 writeFileSync('r45-duel/qa/evidence/r197-desktop-first/desktop-hitch-'+backend+'.json',
  JSON.stringify(result,null,2)+'\n');
 await c.close();await b.close();
}
