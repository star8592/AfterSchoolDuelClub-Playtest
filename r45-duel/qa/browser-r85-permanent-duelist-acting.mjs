import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'evidence/r85');mkdirSync(root,{recursive:true});
const report={passes:[],errors:[],ok:false};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
try{
 for(const [name,width,height] of [['desktop',1600,900],['phone',430,900]]){
  const page=await browser.newPage({viewport:{width,height}});
  page.on('pageerror',e=>report.errors.push(name+':JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))report.errors.push(name+':HTTP '+r.status()+' '+r.url())});
  await page.goto('http://127.0.0.1:11025/r45-duel/?seed=1&qa=1',{waitUntil:'domcontentloaded',timeout:55000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:115000});
  const get=()=>page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.duelistHosts);
  const idle=await get();
  await page.screenshot({path:resolve(root,name+'-permanent-duelist-idle.png')});
  const card=page.locator('.card[data-card-id="E01"]').first();
  await card.click();await page.locator('#play').click();await page.waitForTimeout(650);
  const mid=await get();
  await page.screenshot({path:resolve(root,name+'-permanent-duelist-cast.png')});
  await page.waitForTimeout(2700);
  const recovery=await get();
  const [a,b]=idle;
  const drops=idle.flatMap(h=>Object.values(h.posture.arms).map(v=>v?.drop??0));
  const move=idle.map((h,i)=>{const x=h.posture.arms.R.worldHand,y=mid[i].posture.arms.R.worldHand;
    return Math.hypot(...x.map((v,j)=>y[j]-v));});
  const finite=idle.concat(mid,recovery).flatMap(h=>Object.values(h.posture.ik))
    .every(v=>Number.isFinite(v.error)&&v.error<.24);
  const pass=idle.length===2&&idle.every(h=>h.visible&&h.posture.face)&&
    drops.every(v=>v<-.28)&&move[0]>.10&&mid[0].posture.phase!=='idle'&&
    recovery.every(h=>h.posture.phase==='idle'||h.posture.phase==='inspect')&&finite;
  report.passes.push({name,pass,drops,move,phases:[idle.map(h=>h.posture.phase),
    mid.map(h=>h.posture.phase),recovery.map(h=>h.posture.phase)],
    joints:idle.map(h=>({id:h.id,arm:h.posture.arms,ik:h.posture.ik})),
    errors:report.errors});
  await page.close();
 }
 report.ok=report.passes.every(x=>x.pass)&&!report.errors.length;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(root,'r85-permanent-duelists-browser.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R85_DUELIST_REAL_BROWSER',JSON.stringify(report));
 await browser.close();if(!report.ok)process.exitCode=8;
}
