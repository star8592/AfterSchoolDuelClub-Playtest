import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10992';
const outfile=resolve(import.meta.dirname,'evidence/r62');
mkdirSync(outfile,{recursive:true});
const batches=[
 ['E01','E02','E03','E04','G01'],
 ['G02','G03','G04','T01','T02'],
 ['T03','T04','E02','T01','G03']
];
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=gl','--disable-software-rasterizer','--disable-dev-shm-usage']});
const out=[];let fail=false;
try {
 for(const [viewport,width,height] of [['wide',1920,1080],['portrait',430,900]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:70000});
  const send=async(batch,angle=0)=>{
   await page.evaluate(({batch,angle})=>{
    const f=document.querySelector('#stadium').contentWindow;
    const units=(side)=>batch.map((id,i)=>({id,uid:'U'+(side==='player'?'10':'20')+i,hp:5,attack:2,shield:0}));
    f.postMessage({type:'ASDC_R45_BOARD',player:batch,ai:batch,units:{player:units('player'),ai:units('ai')}},location.origin);
    f.postMessage({type:'ASDC_R48_CAMERA_SET',degrees:angle},location.origin);
   },{batch,angle});
   await page.waitForFunction(n=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence?.total===n,batch.length*2,{timeout:14000});
   await page.waitForTimeout(850);
   return page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
  };
  for(let k=0;k<batches.length;k++){
   const batch=batches[k];
   for(const angle of (k===0?[0,45,90,180]:[0])){
    const state=await send(batch,angle);
    const row={viewport,batch,angle,entries:state.entries.map(e=>({
      id:e.id,side:e.side,kind:e.kind,visible:e.visible,
      metrics:e.metrics,screen:e.screen
    })),errors:[...errors]};
    // Real visual/physics invariants, never assert requested target sizes alone.
    const check=(e)=>{
      const m=e.metrics;
      const opponent=m.frontDot>=.98;
      const ground=e.id==='E02'?m.minY>=.39&&m.minY<=.64:Math.abs(m.minY)<=.075;
      const scale=e.id==='E02'?(m.width<=1.8&&m.depth<=1.8&&m.height>=.23&&m.height<=.44):
        e.id==='T01'?m.height>=1.07&&m.height<=1.24:
        e.id==='T02'?m.height>=1.37&&m.height<=1.58:
        (m.height>=1.86&&m.height<=2.18);
      return opponent&&ground&&scale&&e.visible&&m.withinFrame===true;
    };
    const passed=row.entries.every(check)&&errors.length===0;
    row.pass=passed;row.failures=row.entries.filter(e=>!check(e)).map(e=>({
      id:e.id,side:e.side,height:e.metrics.height,ground:e.metrics.minY,
      frontDot:e.metrics.frontDot,width:e.metrics.width,depth:e.metrics.depth,withinFrame:e.metrics.withinFrame
    }));
    if(!passed)fail=true;
    out.push(row);
    console.log('R62_SCALE_AND_FACING_GATE',JSON.stringify({viewport,angle,pass:passed,
      bad:row.failures,checked:row.entries.length}));
    console.log('R62_BASELINE',JSON.stringify({viewport,angle,
      entries:row.entries.map(x=>({id:x.id,side:x.side,h:x.metrics.height,w:x.metrics.width,minY:x.metrics.minY,screenH:x.metrics.coverageHeight,screenW:x.metrics.coverageWidth,in:x.metrics.withinFrame})),
      errors}));
    await page.screenshot({path:resolve(outfile,viewport+'-batch-'+k+'-'+angle+'.png')});
   }
  }
  await page.close();
 }
}catch(e){console.error('R62_SCALE_AUDIT_FAILED',String(e));fail=true}
finally{writeFileSync(resolve(outfile,'baseline.json'),JSON.stringify(out,null,2)+'\n');await browser.close();}
if(fail)process.exitCode=3;
