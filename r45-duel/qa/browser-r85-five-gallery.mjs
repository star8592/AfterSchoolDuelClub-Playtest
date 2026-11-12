import{createRequire}from'node:module';import{writeFileSync,mkdirSync}from'node:fs';import{resolve}from'node:path';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out=resolve(import.meta.dirname,'evidence/r85');mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
const result={ok:false,errors:[],state:null};
try{
 const p=await b.newPage({viewport:{width:1650,height:900}});
 p.on('pageerror',e=>result.errors.push('JS '+e.message));
 p.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))result.errors.push('HTTP '+r.status()+' '+r.url())});
 await p.goto('http://127.0.0.1:11025/r45-duel/qa/r85-five-native-motion-gallery.html',{waitUntil:'domcontentloaded',timeout:60000});
 await p.waitForFunction(()=>window.__R85_FILM_QA?.ready,null,{timeout:100000});
 await p.waitForTimeout(4200);
 await p.screenshot({path:resolve(out,'r85-five-real-character-artist-idle.png')});
 await p.locator('button[data-action="attack"]').click();
 await p.waitForTimeout(550);
 await p.screenshot({path:resolve(out,'r85-five-real-character-artist-attack.png')});
 const qa=await p.evaluate(()=>({list:window.__R85_FILM_QA.report,
  action:window.__R85_FILM_QA.action,frames:window.__R85_FILM_QA.frames}));
 result.state=qa;
 result.ok=qa.list.length===5&&qa.list.every(x=>x.loadOk&&x.triangles>=6000&&x.morphMeshes>=5)
  &&qa.action==='attack'&&qa.frames>10&&!result.errors.length;
}catch(e){result.errors.push(String(e))}
finally{writeFileSync(resolve(out,'r85-five-native-art-gallery.json'),JSON.stringify(result,null,2)+'\n');console.log('R85_FIVE_NATIVE_ART_BROWSER',JSON.stringify(result));await b.close();if(!result.ok)process.exitCode=7;}
