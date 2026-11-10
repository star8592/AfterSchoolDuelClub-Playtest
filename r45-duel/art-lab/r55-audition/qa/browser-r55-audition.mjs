import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const BASE=process.env.ASDC_AUDITION_ORIGIN||'http://127.0.0.1:10983';
const root=resolve(import.meta.dirname,'evidence');
const records=[];let browser,failed=false;
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
  '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
  '--disable-software-rasterizer','--disable-dev-shm-usage']});
 for(const [device,w,h] of [['desktop',1440,900],['mobile',430,900]]){
  const page=await browser.newPage({viewport:{width:w,height:h}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const response=await page.goto(BASE+'/r45-duel/art-lab/r55-audition/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>window.__R55_AUDITION_QA?.roster===18,null,{timeout:45000});
  for(const id of ['E01','E02','E03','E04','G01','G02','G03','G04','T01','T02','T03','T04','E05','E06','G05','G06','T05','T06']){
   await page.evaluate(id=>window.__R55_AUDITION_QA.selectById(id),id);
   await page.waitForFunction(id=>{
    const q=window.__R55_AUDITION_QA;
    return q.current===id&&(q.diagnostics.loaded||q.diagnostics.error);
   },id,{timeout:28000});
   const q=await page.evaluate(()=>{
    const q=window.__R55_AUDITION_QA;
    return{id:q.current,...q.diagnostics};
   });
   const pass=q.loaded&&q.meshes>0&&!q.error;
   if(!pass)failed=true;
   records.push({device,...q,pass});
   console.log('R55_MODEL_LOAD',JSON.stringify({device,...q,pass}));
   if(['E02','G03','T01','E05'].includes(id)&&device==='desktop'){
    await page.screenshot({path:resolve(root,'r55-'+id+'.png')});
   }
  }
  await page.screenshot({path:resolve(root,'r55-'+device+'-full.png')});
  if(errors.length){console.log('R55_BROWSER_ERRORS',errors);failed=true}
  await page.close();
 }
}catch(e){console.error('R55_AUDITION_ERROR',String(e));failed=true}
finally{writeFileSync(resolve(root,'results.json'),JSON.stringify(records,null,2)+'\n');await browser?.close().catch(()=>{})}
if(failed)process.exitCode=3;
