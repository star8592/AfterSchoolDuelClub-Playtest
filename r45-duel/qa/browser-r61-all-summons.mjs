import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const UNIT_IDS=['E01','E02','E03','E04','G01','G02','G03','G04','M01','T01','T02','T03','T04'];
const BASE=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10991';
const DEST=resolve(import.meta.dirname,'evidence/r61');
mkdirSync(DEST,{recursive:true});
let browser,failed=false;const results=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
 for(const [name,w,h] of [['wide',1920,1080],['standard',1366,768],['portrait',430,900]]){
  const page=await browser.newPage({viewport:{width:w,height:h}});
  const errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const response=await page.goto(BASE+'/r45-duel/?seed=1&qa=1',{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:75000});
  const pre=await page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return {models:q.summonModels,sceneReady:q.ready,sourceMatchesR22:q.sourceMatchesR22};
  });
  const send=async(p,a)=>{
   const units=(list,side)=>list.map((id,i)=>({id,uid:'U'+(side==='player'?100:200)+i,hp:5,attack:1,shield:0}));
   await page.evaluate(({p,a})=>{
    document.querySelector('#stadium').contentWindow.postMessage({
     type:'ASDC_R45_BOARD',player:p.map(x=>x.id),ai:a.map(x=>x.id),units:{player:p,ai:a}
    },location.origin);
   },{p:units(p,'player'),a:units(a,'ai')});
  };
  const groups=[];
  for(let n=0;n<UNIT_IDS.length;n+=5){
   const batch=UNIT_IDS.slice(n,n+5);
   await send(batch,batch);
   await page.waitForFunction(count=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.total===count,batch.length*2,{timeout:18000});
   await page.waitForTimeout(620);
   const state=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
   const pass=state.total===batch.length*2 && state.models===state.total &&
    state.pendingArt===0 &&
    state.entries.every(x=>x.visible&&x.inView&&x.kind!=='art-pending'&&x.artApproved===false) &&
    batch.every(id=>state.entries.some(x=>x.id===id));
   groups.push({batch,pass,total:state.total,pending:state.pendingArt,models:state.models,
    offscreen:state.entries.filter(x=>!x.inView).map(x=>x.id),kinds:Object.fromEntries(state.entries.map(x=>[x.id,x.kind]))});
   if(!pass)failed=true;
   console.log('R61_SUMMON_ALL_CARD_BATCH',JSON.stringify({name,...groups.at(-1)}));
   await page.screenshot({path:resolve(DEST,name+'-batch-'+n+'.png')});
  }
  await send(['E01','E01','G01','E02','T02'],['G01','G01','T01','T03','T04']);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.total===10,null,{timeout:16000});
  await page.waitForTimeout(620);
  const duplicates=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
  const dupPass=duplicates.total===10&&duplicates.models===10&&duplicates.pendingArt===0&&
   duplicates.entries.every(x=>x.visible&&x.inView);
  if(!dupPass)failed=true;
  await page.screenshot({path:resolve(DEST,name+'-full-arena.png')});
  await send([],[]);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.total===0,null,{timeout:20000});
  const empty=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
  const cleanup=empty.total===0&&empty.models===0;
  const pass=response.status()===200&&pre.models.length===11&&pre.sourceMatchesR22&&
   groups.every(x=>x.pass)&&dupPass&&cleanup&&!errors.length;
  const record={name,pass,modelAssets:pre.models.length,groups,dupPass,cleanup,errors};
  results.push(record);console.log('R61_SUMMON_VIEWPORT_GATE',JSON.stringify(record));
  if(!pass)failed=true;
  await page.close();
 }
}catch(e){console.error('R61_ALL_SUMMONS_FAILED',String(e));failed=true}
finally{
 writeFileSync(resolve(DEST,'results.json'),JSON.stringify(results,null,2)+'\n');
 await browser?.close().catch(()=>{});
}
if(failed)process.exitCode=3;
