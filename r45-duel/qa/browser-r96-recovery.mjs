import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir=resolve(import.meta.dirname,'evidence/r96-recovery');mkdirSync(dir,{recursive:true});
const base=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11097';
const report={origin:base,ok:false,checks:[],errors:[],blocked:null,recovered:null};
const verify=(valid,name,data={})=>{
 report.checks.push({name,pass:!!valid,...data});
 if(!valid)throw Error('FAILED '+name+' '+JSON.stringify(data).slice(0,320));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [label,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let failCount=0;
  const interceptor='**/*G03*glb';
  await page.route(interceptor,route=>{failCount++;return route.abort('failed')});
  await page.goto(base+'/r45-duel/?qa=1&seed=2',{waitUntil:'domcontentloaded',timeout:80000});
  await page.waitForFunction(()=>window.__r45QA?.sceneError,{},{timeout:120000});
  const before=await page.evaluate(()=>{
   const f=document.querySelector('#stadium');
   return{ready:window.__r45QA?.sceneReady,error:window.__r45QA?.sceneError,
    endDisabled:document.querySelector('#end').disabled,
    playableCards:document.querySelectorAll('.card:not([disabled])').length,
    retry:f?.contentDocument?.querySelector('#retry-scene')?.textContent,
    errorText:f?.contentDocument?.querySelector('#loading')?.textContent?.slice(0,150)};
  });
  verify(failCount>0,label+' actual GLB download was deliberately interrupted',{failCount});
  verify(before.ready===false&&before.error===true&&before.endDisabled&&before.playableCards===0,
   label+' no fake scene ready or phantom playable cards after failed 3D load',before);
  verify((before.retry||'').includes('重新加载三维场景'),
   label+' visible accessible one-click genuine reload action',before);
  await page.screenshot({path:resolve(dir,label+'-failed-glb-retry-visible.png')});
  await page.unroute(interceptor);
  await page.frameLocator('#stadium').locator('#retry-scene').click();
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:120000});
  const after=await page.evaluate(()=>{
   const f=document.querySelector('#stadium'),sc=f?.contentWindow?.__r45SceneQA;
   return{ready:window.__r45QA?.sceneReady,error:window.__r45QA?.sceneError,
    endEnabled:!document.querySelector('#end').disabled,
    legalCards:document.querySelectorAll('.card:not([disabled])').length,
    modelCount:sc?.summonModels?.length,duelists:sc?.duelistHosts?.map(x=>x.id),
    physicalScore:sc?.scoreboard?.physical,
    playerHp:window.__r45QA.hp.player,aiHp:window.__r45QA.hp.ai};
  });
  verify(after.ready===true&&after.error===false&&after.endEnabled&&after.legalCards>0,
   label+' successful retry resumes playable game buttons',after);
  verify(after.modelCount===12&&after.duelists?.join(',')==='E01,G01'&&
   after.physicalScore&&after.playerHp===20&&after.aiHp===20,
   label+' retry loads real VRM and all GLBs without changing game scores',after);
  await page.locator('.card:not([disabled])').first().click();
  await page.locator('#play').click();
  const playing=await page.evaluate(()=>({
    phase:window.__r45QA.phase,events:window.__r45QA.events.filter(x=>x.type==='card_play').length,
    stage:document.querySelector('#stadium').contentWindow.__r45SceneQA?.ready
  }));
  verify(playing.phase==='playing'&&playing.events>=1&&playing.stage,
   label+' gameplay actually resumes after retry',playing);
  verify(errors.length===0,label+' no unhandled JS exceptions',{errors});
  await page.screenshot({path:resolve(dir,label+'-after-recovery.png')});
  report.blocked??=before;report.recovered=after;report.errors.push(...errors);
  await page.close();
 }
 report.ok=report.checks.every(x=>x.pass)&&report.errors.length===0;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(dir,'r96-retry-report.json'),JSON.stringify(report,null,2));
 console.log('R96_RECOVERY',JSON.stringify({ok:report.ok,checks:report.checks.length,
   errors:report.errors,blocked:report.blocked,recovered:report.recovered}));
 await browser.close();
}
if(!report.ok)process.exitCode=5;
