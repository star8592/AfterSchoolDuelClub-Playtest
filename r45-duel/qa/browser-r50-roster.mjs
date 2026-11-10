import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const UNIT_IDS=['E01','E02','E03','E04','G01','G02','G03','G04','T01','T02','T03','T04'];
const out=resolve(import.meta.dirname,'evidence/r50');
mkdirSync(out,{recursive:true});
let b;const records=[];let failed=false;
try{
 b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
 for(const [device,width,height] of [['wide',1920,1080],['portrait',430,900]]){
  const p=await b.newPage({viewport:{width,height}});
  const errors=[];
  p.on('pageerror',e=>errors.push('JS '+e.message));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await p.goto((process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10978')+'/r45-duel/?seed=1&qa=1',{waitUntil:'domcontentloaded',timeout:35000});
  await p.waitForFunction('window.__r45QA?.sceneReady',null,{timeout:65000});
  const send=async(player,ai)=>{
   const units=list=>list.map((id,i)=>({id,uid:'U'+(i+100)}));
   return p.evaluate(({player,ai})=>{
    const iframe=document.querySelector('#stadium');
    iframe.contentWindow.postMessage({type:'ASDC_R45_BOARD',
      player:player.map(x=>x.id),ai:ai.map(x=>x.id),units:{player,ai}},location.origin);
   },{player:units(player),ai:units(ai)});
  };
  for(let offset=0;offset<UNIT_IDS.length;offset+=5){
   const batch=UNIT_IDS.slice(offset,offset+5);
   await send(batch,batch);
   await p.waitForFunction(expected=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.total===expected,batch.length*2,{timeout:18000});
   await p.waitForTimeout(450);
   const q=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
   const pass=q.total===batch.length*2&&q.entries.every(x=>x.visible&&x.inView)&&
    q.entries.filter(x=>['E01','G01'].includes(x.id)).every(x=>x.kind!=='art-pending')&&
    q.entries.filter(x=>!['E01','G01'].includes(x.id)).every(x=>x.kind==='art-pending');
   if(offset===0)await p.screenshot({path:resolve(out,device+'-summon-roster.png')});
   records.push({device,batch,total:q.total,pending:q.pendingArt,entries:q.entries,pass});
   console.log('R50_UNIT_BATCH',JSON.stringify({device,batch,pass,total:q.total,pending:q.pendingArt,visible:q.entries.filter(x=>x.visible&&x.inView).length,errors}));
   if(!pass)failed=true;
  }
  // Duplicate E01/G01 on both sides must be distinct skinned meshes.
  await send(['E01','E01','G01','G01','E02'],['G01','G01','E01','E01','T02']);
  await p.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.total===10,null,{timeout:18000});
  await p.waitForTimeout(600);
  let q=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
  const pass=q.total===10&&q.models===8&&q.pendingArt===2&&
   q.entries.every(x=>x.visible&&x.inView)&&
   q.entries.filter(x=>['E01','G01'].includes(x.id)).every(x=>x.kind!=='art-pending');
  await p.screenshot({path:resolve(out,device+'-duplicates.png')});
  records.push({device,test:'duplicates and sides',pass,q});
  console.log('R50_UNIT_DUPLICATE_GATE',JSON.stringify({device,pass,models:q.models,pending:q.pendingArt,entries:q.entries.length,errors}));
  if(!pass)failed=true;
  await send([],[]);
  await p.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.total===0,null,{timeout:15000});
  q=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
  const clean=q.total===0&&q.pendingArt===0&&
   (await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.actorVisibility.every(x=>!x.visible)));
  records.push({device,test:'despawn cleanup',pass:clean,errors});
  console.log('R50_DESPAWN_GATE',JSON.stringify({device,pass:clean,errors}));
  if(!clean||errors.length)failed=true;
  await p.close();
 }
}catch(e){console.error('R50_ROSTER_FAILED',String(e));failed=true}
finally{writeFileSync(resolve(out,'results.json'),JSON.stringify(records,null,2)+'\n');await b?.close().catch(()=>{});}
if(failed)process.exitCode=3;
