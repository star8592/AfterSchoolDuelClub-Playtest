import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const BASE=process.env.ASDC_AUDITION_ORIGIN||'http://127.0.0.1:10986';
const dir=resolve(import.meta.dirname,'evidence');
mkdirSync(dir,{recursive:true});
const results=[];let browser,failed=false;
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
  '--no-sandbox','--enable-webgl','--use-angle=vulkan',
  '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
 for(const [device,w,h] of [['desktop',1440,900],['portrait',430,900]]){
  const p=await browser.newPage({viewport:{width:w,height:h}});
  const errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  p.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  const resp=await p.goto(BASE+'/r45-duel/art-lab/r55-audition/?study=T02-R58',{waitUntil:'domcontentloaded',timeout:36000});
  await p.waitForFunction(()=>window.__R55_AUDITION_QA?.current==='T02' &&
   window.__R55_AUDITION_QA.diagnostics.loaded,null,{timeout:55000});
  await p.waitForTimeout(1700);
  const model=await p.evaluate(()=>({variant:window.__R55_AUDITION_QA.t02StudyVariant,
   ...window.__R55_AUDITION_QA.diagnostics}));
  const before=await p.evaluate(()=>({page:window.__R55_AUDITION_QA.activePageState,rig:window.__R55_AUDITION_QA.menuRigState}));
  await p.locator('#attack').click();
  await p.waitForTimeout(530);
  const during=await p.evaluate(()=>({page:window.__R55_AUDITION_QA.activePageState,rig:window.__R55_AUDITION_QA.menuRigState}));
  const attackLabel=await p.locator('#info').textContent();
  const pageMovement=Math.abs(during.page.rotation[1]-before.page.rotation[1]);
  const jointMovement=Object.fromEntries(['chefHat','leftArm','rightArm'].map(key=>
   [key,Math.abs(during.rig[key][2]-before.rig[key][2])]));

  await p.locator('.stage').screenshot({path:resolve(dir,device+'-page-attack.png')});
  const snapshots=[];
  await p.locator('#idle').click();
  await p.waitForTimeout(350);
  for(const angle of [0,45,90,180]){
   await p.evaluate(angle=>window.__R55_AUDITION_QA.setOrbit(angle*Math.PI/180),angle);
   await p.waitForTimeout(400);
   await p.locator('.stage').screenshot({path:resolve(dir,device+'-R58-'+angle+'.png')});
   snapshots.push(angle);
  }
  await p.locator('#t02-variant').click();
  await p.waitForFunction(()=>window.__R55_AUDITION_QA?.current==='T02' &&
   !window.__R55_AUDITION_QA.t02StudyVariant &&
   window.__R55_AUDITION_QA.diagnostics.loaded,null,{timeout:32000});
  const original=await p.evaluate(()=>({...window.__R55_AUDITION_QA.diagnostics,
   variant:window.__R55_AUDITION_QA.t02StudyVariant}));
  await p.waitForTimeout(750);
  await p.evaluate(()=>window.__R55_AUDITION_QA.setOrbit(0));
  await p.locator('.stage').screenshot({path:resolve(dir,device+'-original.png')});
  const pass=resp.status()===200&&model.loaded&&model.variant&&model.meshes===41 &&
    model.animations===5 &&before&&during&&pageMovement>.25&&
    original.meshes===41&&original.animations===0&&!original.variant&&errors.length===0&&
    Object.values(jointMovement).every(x=>x>.015);
  const result={device,pass,model,original,pageMovement,jointMovement,attackLabel,snapshots,errors};
  console.log('R58_T02_MENU_GATE',JSON.stringify(result));
  results.push(result);
  if(!pass)failed=true;
  await p.close();
 }
}catch(e){console.error('R58_MENU_QA_FAILED',String(e));failed=true;}
finally{
 writeFileSync(resolve(dir,'results.json'),JSON.stringify(results,null,2)+'\n');
 await browser?.close().catch(()=>{});
}
if(failed)process.exitCode=3;
