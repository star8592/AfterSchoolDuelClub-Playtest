import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const base=(process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10975')+'/r45-duel/?seed=1&qa=1';
const out=resolve(import.meta.dirname,'evidence');
let browser;const results=[];
const layout=()=>({
 docHeight:document.documentElement.scrollHeight,viewport:innerHeight,docWidth:document.documentElement.scrollWidth,width:innerWidth,
 hand:document.querySelector('.hand').getBoundingClientRect().toJSON(),
 arena:document.querySelector('.arena').getBoundingClientRect().toJSON(),
 play:document.querySelector('#play').getBoundingClientRect().toJSON(),
 end:document.querySelector('#end').getBoundingClientRect().toJSON(),
 card:document.querySelector('#hand .card')?.getBoundingClientRect().toJSON()
});
try{
browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
for(const [device,width,height] of [['desktop',1366,850],['mobile',430,900],['short',375,667]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
 const res=await page.goto(base,{waitUntil:'domcontentloaded',timeout:35000});
 await page.locator('#hand .card[data-card-id="E01"]').waitFor({timeout:15000});
 await page.waitForFunction("document.getElementById('stadium').contentWindow?.__r45SceneQA?.ready",null,{timeout:60000});
 const initial=await page.evaluate(()=>({game:{
   cardCount:__r45QA.cardCount,energy:__r45QA.energy.player,hand:__r45QA.hand.length,
   board:__r45QA.board,round:__r45QA.round,sceneReady:__r45QA.sceneReady
  },scene:{
   stadium:document.getElementById('stadium').contentWindow.__r45SceneQA.stadium,
   gpu:document.getElementById('stadium').contentWindow.__r45SceneQA.renderer,
   visibility:document.getElementById('stadium').contentWindow.__r45SceneQA.actorVisibility
  }}));
 Object.assign(initial,await page.evaluate(layout));
 await page.screenshot({path:resolve(out,'r45-'+device+'-opening.png'),fullPage:false});
 await page.locator('#hand .card[data-card-id="E01"]').click();
 const selected=await page.evaluate(()=>({hand:__r45QA.hand.length,energy:__r45QA.energy.player,
    selected:__r45QA.selected,button:document.querySelector('#play').textContent}));
 await page.locator('#play').click();
 const summoned=await page.evaluate(()=>({hand:__r45QA.hand.length,energy:__r45QA.energy.player,
    board:__r45QA.board.player[0].map(x=>x.id),status:document.querySelector('#battle-toast').textContent}));
 await page.waitForFunction("document.getElementById('stadium').contentWindow.__r45SceneQA.actorVisibility[0].visible",null,{timeout:8000});
 await page.locator('#end').click();
 await page.waitForFunction('window.__r45QA.round===2',null,{timeout:17000});
 const ai=await page.evaluate(()=>({board:__r45QA.board.ai[0].map(x=>x.id),
    message:document.querySelector('#battle-toast').textContent}));
 await page.locator('#end').click();
 await page.waitForFunction("document.getElementById('stadium').contentWindow.__r45SceneQA.payload?.event?.from==='E01'",null,{timeout:18000});
 await page.waitForFunction("document.getElementById('stadium').contentWindow.__r45SceneQA.actionFrameCount>1",null,{timeout:16000});
 const fight=await page.evaluate(()=>{
  const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
  return{mode:q.mode,active:q.active,event:q.payload?.event,
   actorVisibility:q.actorVisibility,roles:q.roles.map(x=>({id:x.id,bones:x.bones,asset:x.asset})),
   stadium:q.stadium?.label,gpu:q.renderer,actionFrames:q.actionFrameCount,
   parentId:document.querySelector('#stadium').parentElement.className,
   handVisible:document.querySelector('.controls').getBoundingClientRect().bottom<=innerHeight+3,
   };

 });
 fight.layout=await page.evaluate(layout);
 await page.screenshot({path:resolve(out,'r45-'+device+'-real-match.png'),fullPage:false});
 const isDesktopOrNormal=device!=='short';
 const essentialInViewport=isDesktopOrNormal?
    initial.play.top>=0&&initial.play.bottom<=height+4&&
    initial.end.top>=0&&initial.end.bottom<=height+4&&
    initial.arena.height>=135&&fight.handVisible:true;
 const pass=res.status()===200&&initial.game.cardCount===19&&initial.game.sceneReady&&
   initial.scene.stadium?.label==='R45_ONE_ARENA_GYM_3D'&&
   initial.scene.stadium?.seats>=198&&/RTX 5070 Ti/.test(initial.scene.gpu)&&
   !initial.scene.visibility.some(x=>x.visible)&&
   selected.hand===5&&selected.energy===initial.game.energy&&selected.selected!==null&&
   summoned.hand===4&&summoned.energy===1&&summoned.board.includes('E01')&&
   ai.board.includes('G01')&&ai.message.includes('AI 打出')&&
   fight.event?.from==='E01'&&fight.event?.to==='G01'&&fight.event?.damage===2&&
   fight.roles?.[0]?.bones===148&&fight.roles?.[1]?.bones===107&&
   fight.stadium==='R45_ONE_ARENA_GYM_3D'&&fight.actionFrames>1&&essentialInViewport&&
   initial.docWidth<=width+2&&!errors.length;
 const record={device,width,height,initial,selected,summoned,ai,fight,essentialInViewport,errors,passed:pass};
 results.push(record);
 console.log('R45_CLEAN_REBUILD_PLAYABLE_GPU_PROOF',JSON.stringify({
  device,http:res.status(),firstCardX:initial.card?.x,arenaH:initial.arena.height,
  hand:initial.game.hand,stadium:initial.scene.stadium?.label,
  selected, summoned,ai,
  attack:{event:fight.event,roles:fight.roles,frames:fight.actionFrames},
  essentialInViewport,errors,passed:pass
 }));
 if(!pass)process.exitCode=3;
 await page.close();
}
writeFileSync(resolve(out,'r45-gpu-real-game.json'),JSON.stringify(results,null,2)+'\n');
}catch(e){console.error('R45_CLEAN_ACCEPTANCE_FAILED',String(e),JSON.stringify(results).slice(-800));process.exitCode=2}
finally{await browser?.close().catch(()=>{})}
