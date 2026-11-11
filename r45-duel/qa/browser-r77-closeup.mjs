import{createRequire}from'node:module';import{mkdirSync,writeFileSync}from'node:fs';import{resolve}from'node:path';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11008',dir=resolve(import.meta.dirname,'evidence/r77/closeup');mkdirSync(dir,{recursive:true});
const checks=[['E03','legacy-E03','idle',0],['E03','female-child-01','cheer',0],['E03','female-child-02','cheer',90],
 ['G02','legacy-G02','idle',0],['G02','male-child-01','talk',0],['G02','male-child-02','talk',90],
 ['T03','legacy-T03','idle',0],['T03','delivery-male-01','wave',0],['T03','female-adult-07','wave',0],['T03','duo','wave',0]];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});const rows=[];
try{for(const[role,focus,motion,angle]of checks){const p=await browser.newPage({viewport:{width:1180,height:800}}),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
await p.goto(`${origin}/r45-duel/qa/r77-cast-comparison.html?role=${role}&focus=${focus}&motion=${motion}&angle=${angle}&venue=studio`,{waitUntil:'domcontentloaded',timeout:40000});await p.waitForFunction(()=>window.__R77_CAST_QA?.ready,null,{timeout:75000});await p.waitForTimeout(1700);
const q=await p.evaluate(()=>window.__R77_CAST_QA);const image=Buffer.from(await p.evaluate(()=>document.querySelector('#canvas').toDataURL('image/png').split(',')[1]),'base64');
writeFileSync(resolve(dir,`${role}-${focus}-${angle}.png`),image);
const m=q.data.flatMap(d=>d.models),pass=q.focus===focus&&m.length===(focus==='duo'?2:1)&&q.errors.length===0&&errors.length===0&&m.every(x=>x.bones>=10&&x.tris>1000)&&image.length>22000;
const row={role,focus,motion,angle,pass,model:m.map(({id,tris,bones,matched,totalTracks,motion})=>({id,tris,bones,matched,totalTracks,motion})),errors};rows.push(row);
console.log('R77_CLOSEUP_REAL_MODEL',JSON.stringify(row));await p.close();}
}finally{writeFileSync(resolve(dir,'closeup-qa.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
if(rows.length!==checks.length||rows.some(x=>!x.pass))process.exitCode=4;
