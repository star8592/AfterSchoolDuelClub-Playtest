import{createRequire}from'node:module';
import{writeFileSync,mkdirSync}from'node:fs';
import{resolve}from'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r163-magic-gallery';
mkdirSync(root,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const ids=['S04','P01','P04','P07','P08','X03','X07','X08'];
const results=[];
try{
 for(const mode of ['off','on']){
  const page=await browser.newPage({viewport:{width:1460,height:960}});
  const errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url().slice(-100))});
  await page.goto('http://127.0.0.1:18665/r45-duel/qa/r163-magic-gallery.html?qa=1&r163MagicPool='+mode,
   {waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.__r111GalleryQA?.stats?.played>0,null,{timeout:12000});
  const initial=await page.evaluate(async()=>{
   const {CARDS}=await import('/r45-duel/engine.mjs');
   const {CARD_MAGIC_MOTIFS,MAGIC_MOTIF_COUNT}=
      await import('/r45-duel/scene/magic-arsenal.mjs');
   const cards=CARDS.filter(x=>x.kind==='spell');
   return {cards:cards.map(x=>({id:x.id,name:x.name,motif:CARD_MAGIC_MOTIFS[x.id]})),
     motifCount:MAGIC_MOTIF_COUNT};
  });
  if(initial.cards.length!==46||initial.motifCount!==40)
   throw Error('Wrong spell coverage '+JSON.stringify(initial));
  const samples=[];
  for(const id of ids){
   const result=await page.evaluate(cardId=>window.__r111GalleryQA.renderFixed(cardId,.47),id);
   if(!result?.image?.startsWith('data:image/png;base64,'))throw Error('no snapshot '+id);
   const png=Buffer.from(result.image.split(',')[1],'base64');
   writeFileSync(resolve(root,'r163-'+mode+'-'+id+'.png'),png);
   samples.push({id,name:result.name,motif:result.motif,
    drawCalls:result.drawCalls,size:png.length});
  }
  const all=await page.evaluate(cards=>{
   const v=[];
   for(const x of cards){
    const r=window.__r111GalleryQA.renderFixed(x.id,.37);
    v.push({id:x.id,motif:r.motif,drawCalls:r.drawCalls,
      cache:r.stats.cachedGeometries,hits:r.stats.geometryCacheHits,
      misses:r.stats.geometryCacheMisses,
      active:r.stats.active});
   }
   return v;
  },initial.cards);
  const end=await page.evaluate(()=>window.__r111GalleryQA.stats);
  if(end.cachedGeometries<0||all.some(x=>x.drawCalls>110)||errors.length)
   throw Error('Gallery validation '+JSON.stringify({end,errors}));
  results.push({mode,motifCount:initial.motifCount,samples,all,
   pool:{enabled:end.poolEnabled,cache:end.cachedGeometries,hits:end.geometryCacheHits,
    misses:end.geometryCacheMisses},errors});
  console.log('R163_GALLERY_CHECK',JSON.stringify({
   mode,passed:true,motifs:initial.motifCount,cards:initial.cards.length,
   screenshots:ids.length,drawCallRange:[
    Math.min(...all.map(x=>x.drawCalls)),Math.max(...all.map(x=>x.drawCalls))],
   pool:results.at(-1).pool,errors}));
  await page.close();
 }
}finally{
 writeFileSync(resolve(root,'r163-gallery-ab.json'),JSON.stringify({results},null,2));
 await browser.close();
}
if(results.length!==2||results.some(x=>x.errors.length))process.exitCode=2;
