import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r170-hero-props';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
const report={runAt:new Date().toISOString(),view:'1280x760 real Chrome Vulkan',
 cards:[],errors:[],snapshots:[]};
try{
 const page=await browser.newPage({viewport:{width:1280,height:760},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url().slice(-85))});
 await page.goto('http://127.0.0.1:'+Number(process.env.R170_PORT||18671)+'/r45-duel/qa/r169-school-magic-gallery.html?qa=1&r169Snapshot=on',
  {waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r169SchoolMagicQA?.cardCount===46,
  null,{timeout:20000});
 const inventory=await page.evaluate(async()=>{
  const {CARDS}=await import('/r45-duel/engine.mjs');
  const {SCHOOL_MAGIC_IDENTITIES,SCHOOL_MAGIC_COUNT,SCHOOL_MAGIC_FAMILIES}=
   await import('/r45-duel/scene/campus-magic-bible.mjs');
  const {COMIC_BEATS}=await import('/r45-duel/audio-engine.mjs');
  return{cards:CARDS.filter(c=>c.kind==='spell').map(x=>x.id),
   identCount:SCHOOL_MAGIC_COUNT,
   families:SCHOOL_MAGIC_FAMILIES.length,
   foleyCount:Object.keys(COMIC_BEATS).filter(x=>x.startsWith('school_')).length,
   foleyInvalid:Object.values(SCHOOL_MAGIC_IDENTITIES).filter(x=>
    x.foley.some(s=>!/^r102_/.test(s))).map(x=>x.id)};
 });
 report.inventory=inventory;
 const select=new Set(['E06','K01','K02','K06','K07','Q02','Q05','Q07','S04','P04','P05','P07','X03','X05','X07','X08']);
 for(const id of inventory.cards){
  const result=await page.evaluate(id=>window.__r169SchoolMagicQA.renderFixed(id,.40),id);
  if(!result||result.id!==id)throw Error('Render failed '+id);
  if(result.meshCount<3||result.meshCount>80)throw Error('Bad physical prop count '+id+':'+result.meshCount);
  if(result.stats.shaderPointLights!==0)throw Error('Unexpected magic PointLight '+id);
  report.cards.push({id,name:result.name,prop:result.identity.prop,
   family:result.identity.family,meshCount:result.meshCount,
   drawCalls:result.drawCalls,types:result.signature,voiceScript:result.identity.lines.cast});
  if(select.has(id)){
   writeFileSync(resolve(out,'r169-'+id+'.png'),Buffer.from(result.image.split(',')[1],'base64'));
   report.snapshots.push(id);
  }
 }
 const end=await page.evaluate(()=>window.__r169SchoolMagicQA.stats);
 report.end=end;
 report.passed=report.errors.length===0&&report.cards.length===46&&
  report.snapshots.length===16&&new Set(report.cards.map(x=>x.prop)).size===46&&
  inventory.identCount===46&&inventory.foleyCount===46&&
  !inventory.foleyInvalid.length&&end.uniqueRenderedProps===46&&
  end.shaderPointLights===0;
 console.log('R169_GALLERY_RESULT',JSON.stringify({passed:report.passed,
  spells:report.cards.length,uniqueProps:end.uniqueRenderedProps,
  families:inventory.families,sfxPatterns:inventory.foleyCount,
  screenshots:report.snapshots.length,peakObjects:end.peakObjects,
  maxDrawCalls:Math.max(...report.cards.map(x=>x.drawCalls)),
  errors:report.errors.slice(0,12)}));
 await page.close();
}finally{
 writeFileSync(resolve(out,'r169-46-gallery.json'),JSON.stringify(report,null,2));
 await browser.close();
}
if(!report.passed)process.exitCode=2;
