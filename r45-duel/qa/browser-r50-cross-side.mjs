import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
let b;
try{
 b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
 for(const [name,width,height] of [['desktop',1920,1080],['portrait',430,900]]){
  const p=await b.newPage({viewport:{width,height}});
  const errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const http=await p.goto((process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10978')+'/r45-duel/?seed=28&qa=1',{waitUntil:'domcontentloaded',timeout:35000});
  await p.waitForFunction('window.__r45QA?.sceneReady',null,{timeout:70000});
  await p.locator('#hand .card[data-card-id="G01"]').click();
  await p.locator('#play').click();
  await p.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.entries.some(x=>x.side==='player'&&x.id==='G01'),null,{timeout:17000});
  await p.locator('#end').click();
  await p.waitForFunction(()=>window.__r45QA.round===2,null,{timeout:20000});
  await p.waitForTimeout(350);
  const summary=await p.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{player:__r45QA.board.player[0].map(x=>x.id),ai:__r45QA.board.ai[0].map(x=>x.id),
   presence:q.summonPresence,actorVisibility:q.actorVisibility,drawCalls:q.drawCalls};
  });
  await p.screenshot({path:resolve(import.meta.dirname,'evidence/r50/'+name+'-real-crossside.png')});
  const real=summary.presence.entries.filter(x=>x.kind==='vrm-instance');
  const pass=http.status()===200&&summary.player.includes('G01')&&summary.ai.includes('E01')&&
   real.some(x=>x.id==='G01'&&x.side==='player'&&x.skins>50)&&
   real.some(x=>x.id==='E01'&&x.side==='ai'&&x.skins>50)&&
   summary.presence.entries.every(x=>x.visible&&x.inView)&&!errors.length;
  console.log('R50_REAL_CROSS_SIDE_GAME',JSON.stringify({name,pass,...summary,errors}));
  if(!pass)process.exitCode=3;
  await p.close();
 }
}catch(error){console.error('R50_REAL_CROSS_SIDE_FAILED',String(error));process.exitCode=2}
finally{await b?.close().catch(()=>{})}
