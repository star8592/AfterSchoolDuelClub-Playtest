'use strict';
const fs = require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||
  '/mnt/disk1/H3_Studio/game-toolchain/node_modules/playwright-core');
const BASE=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:18784';
const OUTPUT=process.env.ASDC_QA_DEFAULT_GUARD_REPORT||
  '/mnt/disk1/H3_Studio/game-toolchain/evidence/ara-m01-music-wardrobe-r153-20261115/default-guard.json';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  headless:true,args:['--no-sandbox','--enable-webgl','--disable-dev-shm-usage']});
 const results=[];let failed=null;
 try{
  for(const [mode,suffix] of [
   ['explicit_off','?qa=1&m01Wardrobe=off'],
   ['missing_qa','?m01Wardrobe=on']
  ]){
   const page=await browser.newPage({viewport:{width:900,height:650}});
   const errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   const url=BASE+'/r45-duel/scene/'+suffix;
   const resp=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
   await page.waitForFunction(()=>window.__r45SceneQA?.ready===true,null,{timeout:150000});
   await page.evaluate(()=>window.postMessage({
    type:'ASDC_R45_BOARD',units:{
     player:[{uid:'U101',id:'M01',hp:10,attack:2,shield:0}],
     ai:[{uid:'U201',id:'M02',hp:10,attack:2,shield:0}]
    },player:['M01'],ai:['M02']
   },location.origin));
   await page.waitForFunction(()=>window.__r45SceneQA?.summonPresence?.total===2,null,{timeout:18000});
   const data=await page.evaluate(()=>{
    const q=window.__r45SceneQA;
    return {M01:q.summonModels.find(x=>x.id==='M01'),
     summoned:q.summonPresence.entries.find(e=>e.id==='M01')};
   });
   const actual=data.M01?.file||data.M01?.selectedFile;
   const pass=resp?.status()===200&&
    actual==='M01-MusicTeacher-PolyforkSchoolTeacher.glb'&&
    data.summoned?.id==='M01'&&errors.length===0;
   results.push({mode,http:resp?.status(),actual,
    expected:'M01-MusicTeacher-PolyforkSchoolTeacher.glb',pass,errors});
   await page.close();
   if(!pass)throw Error('R153_DEFAULT_GUARD_FAILED '+mode+' '+JSON.stringify(data).slice(0,1300));
  }
 }catch(e){failed=String(e)}
 await browser.close();
 fs.writeFileSync(OUTPUT,JSON.stringify({status:failed?'FAILED':'PASS',results,failure:failed},null,2)+'\n');
 console.log('R153_DEFAULT_GUARD',JSON.stringify({status:failed?'FAILED':'PASS',results,failure:failed}));
 if(failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=2});
