const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'evidence/r85'),base=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11081/';fs.mkdirSync(root,{recursive:true});
const rows=[];
(async()=>{const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
try{for(const [name,w,h] of [['desktop',1440,900],['portrait',430,900]]){
 const p=await b.newPage({viewport:{width:w,height:h}}),errors=[],failed=[];
 p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))failed.push(`${r.status()} ${r.url()}`)});
 await p.goto(base+'r45-duel/?qa=1&seed=12',{waitUntil:'domcontentloaded',timeout:100000});
 await p.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:170000});
 const units={player:[{id:'E01',uid:'U101',hp:5,attack:2,shield:0},{id:'E02',uid:'U102',hp:5,attack:2,shield:0},{id:'T02',uid:'U103',hp:5,attack:2,shield:0},{id:'T01',uid:'U104',hp:5,attack:2,shield:0}],ai:[{id:'G01',uid:'U201',hp:5,attack:2,shield:0},{id:'E02',uid:'U202',hp:5,attack:2,shield:0},{id:'T02',uid:'U203',hp:5,attack:2,shield:0},{id:'T01',uid:'U204',hp:5,attack:2,shield:0}]};
 await p.evaluate(u=>{const frame=document.querySelector('#stadium').contentWindow;frame.postMessage({type:'ASDC_R45_BOARD',player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id),units:u},location.origin)},units);
 await p.waitForTimeout(4000);
 const state=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence||null);const e02=await p.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonModels?.find(x=>x.id==='E02'));
 await p.screenshot({path:path.join(root,`r85-default-local-${name}.png`)});
 const result={name,e02Model:e02,errors,failed,total:state?.total,entries:state?.entries?.map(e=>({id:e.id,side:e.side,kind:e.kind,visible:e.visible,inView:e.inView,ground:e.metrics?.minY,front:e.metrics?.frontDot,height:e.metrics?.height,model:e.source}))||[]};
 rows.push(result);console.log('R85_REMAINDER_AUDIT',JSON.stringify(result));await p.close();
 }}finally{fs.writeFileSync(path.join(root,'r85-default-local-qa.json'),JSON.stringify(rows,null,2));await b.close()}
})().catch(e=>{console.error('ERROR',e);process.exitCode=5});
