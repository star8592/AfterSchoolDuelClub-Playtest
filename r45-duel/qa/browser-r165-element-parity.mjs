/**
 * Critical invariant: switching from 32 to 40 graphic motifs must never alter
 * the authoritative element, reaction, impact sound, targeting, or card ID.
 * Uses isolated local Chrome documents to avoid cross-module caching.
 */
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r165-magic-combat';
mkdirSync(out,{recursive:true});
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
const report={createdAt:new Date().toISOString(),variants:[]};
try{
 for(const variant of ['off','on']){
  const p=await b.newPage();
  const errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  const url='http://127.0.0.1:18665/r45-duel/qa/r163-magic-gallery.html'+
   '?qa=1&r163MagicVariety='+variant+'&r163MagicPool=off';
  await p.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await p.waitForFunction(()=>window.__r111GalleryQA?.stats?.played>0,null,{timeout:20000});
  const data=await p.evaluate(async()=>{
   const [{CARD_MAGIC_MOTIFS,MAGIC_MOTIF_COUNT},
    {CARD_ELEMENTS,SPELL_SIGNATURES,ELEMENTS}, {CARDS}]=await Promise.all([
    import('/r45-duel/scene/magic-arsenal.mjs'),
    import('/r45-duel/scene/spell-response-contract.mjs'),
    import('/r45-duel/engine.mjs')]);
   return{
    spells:CARDS.filter(c=>c.kind==='spell').length,
    motifs:MAGIC_MOTIF_COUNT,
    signatures:Object.fromEntries(
     Object.entries(SPELL_SIGNATURES).map(([id,x])=>
      [id,{element:x.element,reaction:x.reaction,sound:x.sound,
       accent:x.accent,cardName:x.cardName,motif:CARD_MAGIC_MOTIFS[id]}])),
    errors:CARDS.filter(c=>c.kind==='spell'&&!ELEMENTS[CARD_ELEMENTS[c.id]]).map(c=>c.id)
   };
  });
  report.variants.push({variant,data,errors});
  console.log('R165_CONTRACT_CASE',JSON.stringify({
    variant,motifs:data.motifs,spells:data.spells,
    covered:Object.keys(data.signatures).length,invalid:data.errors.length,
    errors}));
  await p.close();
 }
}finally{await b.close()}
const a=report.variants[0],v=report.variants[1];
if(a.data.spells!==46||v.data.spells!==46||a.data.motifs!==32||
   v.data.motifs!==40||a.data.errors.length||v.data.errors.length||
   a.errors.length||v.errors.length)process.exitCode=2;
const altered=[];
for(const [id,x] of Object.entries(a.data.signatures)){
 const y=v.data.signatures[id];
 if(!y||x.element!==y.element||x.sound!==y.sound||
   x.reaction!==y.reaction||x.accent!==y.accent||x.cardName!==y.cardName)
   altered.push(id);
}
report.alteredGameplaySemantics=altered;
report.passed=altered.length===0&&!process.exitCode;
writeFileSync(resolve(out,'r165-element-contract-parity.json'),JSON.stringify(report,null,2));
console.log('R165_46_CARD_ELEMENT_PARITY',JSON.stringify({
  passed:report.passed,altered,motifDifference:v.data.motifs-a.data.motifs}));
if(!report.passed)process.exitCode=2;
