const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const fs=require('fs'),path=require('path');
const base=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11092';
const report={base,ok:false,errors:[],checks:[],scene:null};
const browserOptions={headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']};
(async()=>{
 const browser=await chromium.launch(browserOptions);
 try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>report.errors.push('JS '+e.message));
 page.on('response',res=>{if(res.status()>=400&&res.url().includes('/r45-duel/assets/summons/'))report.errors.push('GLB HTTP '+res.status()+' '+res.url())});
 await page.goto(base+'/r45-duel/?qa=1&seed=5',{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:120000});
 report.scene=await page.evaluate(()=>{
 const scene=document.querySelector('#stadium').contentWindow.__r45SceneQA;
 return{ready:window.__r45QA?.sceneReady===true,
   models:scene?.summonModels?.map(m=>({id:m.id,file:m.file,meshes:m.meshes}))??[],
   error:document.querySelector('#stadium').contentDocument?.querySelector('#loading')?.textContent||null};
 });
 if(!report.scene.ready||report.scene.models.length!==10||report.scene.models.some(x=>x.meshes<=0))throw Error('3D models not ready or not actual meshes');
 const legacyFiles=[
  'E03-CheerCaptain-Phil-R85-Acting.glb','E04-CanteenRelay-Gabby-R85-Acting.glb',
  'G02-BlackboardExpert-Lunte-R85-Acting.glb','G03-Jay-BlenderStudio-R85-Acting.glb',
  'G04-ClubDirector-Victoria-R85-Acting.glb','M01-MusicTeacher-PolyforkSchoolTeacher.glb',
  'M02-CafeteriaAunt-CartoonR76.glb','T01-BroadcastOwl-PolyforkRadio-R73.glb',
  'T03-MailPair-Ellie-R85-Acting.glb','T04-Rex-BlenderStudio-R85-Acting.glb'
 ];
 report.checks=await page.evaluate(async(files)=>{
 const results=[];
 for(const name of files){
  const res=await fetch('assets/summons/'+name,{method:'GET'});
  const buf=await res.arrayBuffer();
  const dv=new DataView(buf);
  const actual=String.fromCharCode(...new Uint8Array(buf.slice(0,4)));
  results.push({name,status:res.status,bytes:buf.byteLength,glb:actual==='glTF'&&dv.getUint32(4,true)===2&&dv.getUint32(8,true)===buf.byteLength});
 }
 return results;
 },legacyFiles);
 report.ok=report.errors.length===0&&report.checks.length===10&&report.checks.every(x=>x.status===200&&x.glb);
 console.log('R92_BROWSER_ASSET_GATE',JSON.stringify(report));
 await page.close();
 }catch(e){report.errors.push(String(e));console.log('R92_BROWSER_ASSET_GATE',JSON.stringify(report));}
 finally{await browser.close()}
 if(!report.ok)process.exitCode=5;
})();
