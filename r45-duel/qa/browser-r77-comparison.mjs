import {createRequire} from 'node:module';import{mkdirSync,writeFileSync}from'node:fs';import{resolve}from'node:path';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const base=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11008',dir=resolve(import.meta.dirname,'evidence/r77');mkdirSync(dir,{recursive:true});
const cases=[['E03','idle',0,'studio','wide'],['E03','cheer',45,'gym','wide'],['E03','cheer',0,'studio','portrait'],
 ['G02','idle',0,'studio','wide'],['G02','talk',90,'gym','wide'],['G02','wave',45,'studio','portrait'],
 ['T03','idle',0,'studio','wide'],['T03','wave',45,'gym','wide'],['T03','cheer',180,'studio','wide'],['T03','talk',45,'gym','portrait']];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});const rows=[];
try{for(const[role,motion,angle,venue,vp]of cases){const p=await browser.newPage({viewport:vp==='wide'?{width:1600,height:900}:{width:430,height:900}}),errors=[];
 p.on('pageerror',e=>errors.push('JS '+String(e)));p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});p.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE '+m.text().slice(0,240))});
 await p.goto(`${base}/r45-duel/qa/r77-cast-comparison.html?role=${role}&motion=${motion}&angle=${angle}&venue=${venue}`,{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(()=>window.__R77_CAST_QA?.ready,null,{timeout:70000});await p.waitForTimeout(2100);
 const q=await p.evaluate(()=>window.__R77_CAST_QA);const png=Buffer.from(await p.evaluate(()=>document.querySelector('#canvas').toDataURL('image/png').split(',')[1]),'base64');
 const filename=`${role}-${motion}-${angle}-${venue}-${vp}.png`;writeFileSync(resolve(dir,filename),png);
 const proposed=q.data.filter(x=>!x.legacy).flatMap(x=>x.models),original=q.data.find(x=>x.legacy);
 const rigged=proposed.length===(role==='T03'?4:2)&&proposed.every(m=>m.bones>=78&&m.skins>=1&&m.tris>=6000&&m.matched/m.totalTracks>=.70&&m.motion>.02&&m.height>1.2);
 const pass=original?.models.length===1&&rigged&&errors.length===0&&q.errors.length===0&&png.length>(vp==='wide'?34000:15000);
 const row={role,motion,angle,venue,vp,pass,pngBytes:png.length,data:q.data,errors:[...errors,...q.errors]};rows.push(row);
 console.log('R77_CAST_REAL_WEBGL',JSON.stringify({role,motion,angle,venue,vp,pass,pngBytes:png.length,proposed:proposed.map(m=>({id:m.id,tris:m.tris,bones:m.bones,tracks:m.matched,motion:m.motion})),errors:row.errors}));await p.close();
}}finally{writeFileSync(resolve(dir,'R77_CAST_COMPARISON_RESULTS.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
if(rows.length!==cases.length||rows.some(x=>!x.pass))process.exitCode=5;
