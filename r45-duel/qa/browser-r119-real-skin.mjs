import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11125';
const ids=(process.env.ASDC_R119_IDS||'E03,E04,G02,G03,G04,T03,T04').split(',').filter(Boolean);
const out=resolve(import.meta.dirname,'evidence/r119-live-skin');
mkdirSync(out,{recursive:true});
const report={passed:false,requested:ids,origin,checks:[],errors:[],views:[]};
const check=(ok,label,details)=>{report.checks.push({pass:!!ok,label,details});if(!ok)throw Error(label+': '+JSON.stringify(details).slice(0,800))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 const views=(process.env.ASDC_R119_VIEWS||'desktop,portrait').split(',');
 for(const[view,width]of[['desktop',1440],['portrait',430]].filter(([v])=>views.includes(v))){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];
  page.on('console',m=>{
   if(m.type()==='error'&&/Uncaught|Error:|404|Failed to|WebGL context lost/i.test(m.text()))
    errors.push('CONSOLE '+m.text().slice(0,400));
  });
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=119&r119Rig='+ids.join(','),
    {waitUntil:'domcontentloaded',timeout:70000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:180000});
  const prefix=()=>page.evaluate(()=>{
   const scene=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{models:scene.summonModels,drawCalls:scene.drawCalls};
  });
  const models=await prefix();
  for(const id of ids){
   const file=models.models.find(x=>x.id===id)?.file;
   check(file?.endsWith('-Skinned-R119.glb'),view+' actual original source skin selected '+id,file);
  }
  const units={player:ids.slice(0,4).map((id,i)=>({uid:'U'+(11910+i),id,hp:5,attack:3,shield:0})),
   ai:ids.slice(4).map((id,i)=>({uid:'U'+(11920+i),id,hp:5,attack:3,shield:0}))};
  await page.evaluate(u=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R45_BOARD',units:u,player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id)},location.origin),units);
  try{await page.waitForFunction(n=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===n,
   ids.length,{timeout:23000});}catch(err){
    const detail=await page.evaluate(()=>{
      const sc=document.querySelector('#stadium').contentWindow.__r45SceneQA;
      return{total:sc?.summonPresence?.total,entries:sc?.summonPresence?.entries,
       shown:sc?.shownCards,ready:sc?.ready,
       models:sc?.summonModels?.filter(x=>['E03','E04','G03','G04','T04'].includes(x.id))};
    }).catch(e=>({inspectError:String(e)}));
    report.errors.push('BOARD_DIAGNOSTIC '+JSON.stringify({detail,errors}).slice(0,6000));
    throw err;
   }
  const read=()=>page.evaluate(()=>{
   const sc=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   const p=sc.summonPresence;
   return{actors:p.entries,rigs:p.r117CharacterMotion,
    skinProbes:p.r119TrueSkinVertices,life:p.r116LifeStates,
    drawCalls:sc.drawCalls,events:sc.arenaLife.events};
  });
  await page.waitForTimeout(550);
  const first=await read();
  check(first.rigs.length===ids.length&&first.rigs.every(x=>x.enabled&&x.mode==='skinned-joints'),
   view+' every live character is truly bound with an active source skin',first.rigs);
  check(first.skinProbes.length===ids.length&&first.skinProbes.every(x=>x.valid&&x.skinnedMeshes>=6&&x.skinWeight>.28),
   view+' actual original weighted source vertices belong to visible meshes',first.skinProbes);
  check(first.actors.every(a=>a.metrics.frontDot>.94),
   view+' every character continues to face the correct opponent',first.actors.map(a=>({id:a.id,dot:a.metrics.frontDot})));
  check(first.actors.every(a=>a.playingClips.includes('R119_Skeletal_Idle')),
   view+' all actual source-joint idle clips playing',first.actors.map(a=>({id:a.id,clips:a.playingClips})));
  await page.waitForTimeout(1100);
  const second=await read();
  check(second.rigs.every(x=>x.frames>15&&x.boneFrameWrites>10&&x.maxAngle>.006),
   view+' real bones keep moving throughout the match',second.rigs.map(x=>({id:x.id,frames:x.frames,bones:x.boneFrameWrites,maxAngle:x.maxAngle})));
  check(second.skinProbes.every(x=>x.valid&&x.sampledFrames>=2),
   view+' actual skinned vertex deformation continuously sampled',second.skinProbes);
  const moved=second.skinProbes.map(x=>({id:x.id,travel:x.maxTravel,frameDelta:x.maxFrameDelta}));
  check(moved.every(x=>x.travel>.0001),
   view+' no source actor is only moving phantom unused bones',moved);
  check(new Set(second.skinProbes.map(x=>x.weightedBoneUUID)).size===ids.length,
   view+' independent actor instances each have their own bones',second.skinProbes);
  check(second.drawCalls<1450,view+' no GPU drawcall explosion',second.drawCalls);
  await page.screenshot({path:resolve(out,view+'-r119-all-live-skinned.png')});
  await page.evaluate(firstId=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R46_CARD_PLAY',side:'player',kind:'unit',id:firstId,serial:1199001},location.origin),ids[0]);
  await page.waitForTimeout(450);
  const after=await read();
  check(after.events.some(x=>x.type==='card'&&x.side==='player'),
   view+' real card play reaches each unique actor life',after.events);
  check(errors.length===0,view+' no JavaScript or missing art assets',errors);
  report.views.push({view,moved,modelBytes:models.models.filter(x=>ids.includes(x.id)).map(x=>({id:x.id,file:x.file})),
   drawCalls:second.drawCalls,realBodies:first.skinProbes,err:errors});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r119-real-skin-report.json'),JSON.stringify(report,null,2));
 await browser.close();
}
console.log('R119_LIVE_SKIN_BROWSER',JSON.stringify({passed:report.passed,checks:report.checks.length,
 errors:report.errors,failed:report.checks.filter(x=>!x.pass)}));
if(!report.passed)process.exitCode=1;
