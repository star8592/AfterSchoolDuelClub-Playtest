import{createRequire}from'node:module';import{mkdirSync,writeFileSync}from'node:fs';import{resolve}from'node:path';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const base=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11009';const out=resolve(import.meta.dirname,'evidence/r78');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
const tasks=[['desktop',1600,900,'female-high-fidelity-cast'],['desktop',1600,900,'schoolboy-high-fidelity'],['desktop',1600,900,'adult-high-fidelity-man'],['portrait',430,900,'female-high-fidelity-cast']];const rows=[];
try{for(const[viewport,w,h,model]of tasks){const page=await browser.newPage({viewport:{width:w,height:h}}),errors=[],embedResponses=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.url().includes('sketchfab.com/models/')&&r.url().includes('/embed'))embedResponses.push({status:r.status(),url:r.url()});if(r.status()>=400&&r.url().includes('/r45-duel/'))errors.push('HTTP '+r.status()+' '+r.url())});
await page.goto(`${base}/r45-duel/qa/r78-high-fidelity-casting.html?model=${model}`,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForFunction(()=>window.__R78_GALLERY_QA?.ready&&window.__R78_GALLERY_QA?.selected===new URLSearchParams(location.search).get('model'),null,{timeout:40000});
await page.waitForTimeout(5000);
const q=await page.evaluate(()=>window.__R78_GALLERY_QA);const thumb=await page.locator('#fallback').evaluate(e=>({complete:e.complete,naturalWidth:e.naturalWidth,naturalHeight:e.naturalHeight}));
const iframe=page.locator('#viewer');const iframeInfo={src:await iframe.getAttribute('src'),defaultInactive:await iframe.evaluate(e=>!e.classList.contains('active')),upstreamHttp200:false,responses:embedResponses};
  if(model==='schoolboy-high-fidelity'){
   await page.locator('#view3d').click();await page.waitForFunction(()=>document.querySelector('#viewer').classList.contains('active'),null,{timeout:6000});
   await page.waitForTimeout(3400);
   iframeInfo.upstreamHttp200=embedResponses.some(x=>x.status===200);
   await page.locator('#view3d').click();await page.waitForFunction(()=>!document.querySelector('#viewer').classList.contains('active'),null,{timeout:6000});
  }
const shot=resolve(out,`${viewport}-${model}.png`);await page.screenshot({path:shot,fullPage:true});
const pass=q.modelCount===3&&q.selected===model&&q.sourceData.length===4&&q.sourceData.every(x=>x.license==='by'&&!x.downloaded)&&thumb.naturalWidth>200&&iframeInfo.defaultInactive&&(model!=='schoolboy-high-fidelity'||iframeInfo.upstreamHttp200)&&errors.filter(x=>!x.includes('uReflection')).length===0;
const row={viewport,model,pass,thumb,iframeInfo,errors};rows.push(row);console.log('R78_HIFI_MODEL_SHOWROOM',JSON.stringify(row));await page.close();
}}finally{writeFileSync(resolve(out,'R78_WEB_MODEL_QA.json'),JSON.stringify(rows,null,2)+'\n');await browser.close()}
if(rows.length!==tasks.length||rows.some(x=>!x.pass))process.exitCode=5;
