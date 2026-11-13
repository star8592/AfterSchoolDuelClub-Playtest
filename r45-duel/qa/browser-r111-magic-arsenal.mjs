import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const ORIGIN=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11111';
const out=resolve(import.meta.dirname,'evidence/r111');mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[],views:[]};
const check=(pass,label,detail)=>{report.checks.push({pass:!!pass,label,detail});if(!pass)throw Error(label+' '+String(JSON.stringify(detail)).slice(0,800))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:860}});
  const errors=[],heavy=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',msg=>{if(msg.type()==='error')errors.push('CONSOLE '+msg.text())});
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(ORIGIN))errors.push('HTTP '+r.status()+' '+r.url())});
  page.on('request',r=>{if(/\.(vrm|glb)(\?|$)/i.test(r.url()))heavy.push(r.url())});
  await page.goto(ORIGIN+'/',{waitUntil:'domcontentloaded',timeout:50000});
  const v=await page.evaluate(async view=>{
   const THREE=await import('./r45-duel/assets/three/build/three.module.js');
   const {CARDS,BY_ID}=await import('./r45-duel/engine.mjs');
   const {MAGIC_MOTIF_COUNT,CARD_MAGIC_MOTIFS,createMagicArsenal}=
     await import('./r45-duel/scene/magic-arsenal.mjs');
   const {createElementalVfx,presetForCard}=
     await import('./r45-duel/scene/elemental-vfx.mjs');
   const canvas=document.createElement('canvas');
   canvas.width=900;canvas.height=620;
   canvas.style.cssText='display:block;width:min(96vw,900px);height:auto;margin:0 auto';
   document.body.innerHTML='';
   document.body.style='background:#101c2b;color:#f2e4c8;margin:0';
   const title=document.createElement('h2');
   title.textContent='R111 · 校园魔法武器库 32 种编排';
   title.style='text-align:center;font:700 24px system-ui';
   document.body.append(title,canvas);
   const scene=new THREE.Scene();scene.background=new THREE.Color('#182638');
   scene.add(new THREE.HemisphereLight('#ffffff','#38405a',1.6));
   const cam=new THREE.PerspectiveCamera(47,900/620,.1,80);
   cam.position.set(0,7,12);cam.lookAt(0,1,0);
   const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
   renderer.setSize(900,620,false);
   const platform=new THREE.Mesh(
    new THREE.CylinderGeometry(5.3,5.6,.18,60),
    new THREE.MeshStandardMaterial({color:'#3a5360',metalness:.2,roughness:.64}));
   platform.position.y=-.14;scene.add(platform);
   const arena=createMagicArsenal(THREE,scene);
   const spellCards=CARDS.filter(c=>c.kind==='spell');
   const all=[],fingerprints=new Set();
   for(let i=0;i<spellCards.length;i++){
    const c=spellCards[i];
    const ok=arena.play({type:'ASDC_R81_SPELL_RESULT',side:i%2?'ai':'player',
      serial:i+1,card:c.id,effect:c.effect,damage:0,directDamage:0},100+i*.01);
    const g=arena.root.children.at(-1);
    const sig=g.children.filter(n=>n.isMesh||n.isLine)
      .map(n=>n.geometry?.type).sort().join(',')+'|'+g.children.length;
    fingerprints.add(sig);
    all.push({id:c.id,ok,motif:CARD_MAGIC_MOTIFS[c.id],nodes:g.children.length,
      firstShape:g.children.find(n=>n.isMesh)?.geometry?.type});
   }
   const fake=[
     arena.play({type:'ASDC_R81_SPELL_RESULT',side:'player',serial:999,card:'BAD'},120),
     arena.play({type:'ASDC_R81_SPELL_RESULT',side:'player',serial:0,card:'K01'},120),
     arena.play({type:'ASDC_R81_SPELL_RESULT',side:'player',serial:50,card:'K01',effect:'fake'},120),
     arena.play({type:'ASDC_R81_SPELL_RESULT',side:'spectator',serial:51,card:'K01'},120),
   ];
   let life=arena.stats;
   arena.update(100.7);
   const before=arena.root.children[0]?.children.find(x=>x.userData.role)?.position.clone();
   arena.update(100.7);
   const after=arena.root.children[0]?.children.find(x=>x.userData.role)?.position.clone();
   const noDrift=before?.distanceTo(after)<1e-9;
   // A compact production-stage rendering of four recognizably different spells.
   arena.update(1200);
   const candidates=['K07','Q08','P05','X08'];
   candidates.forEach((id,i)=>{
    const c=BY_ID[id];
    arena.play({type:'ASDC_R81_SPELL_RESULT',side:i%2?'ai':'player',
       serial:1100+i,card:id,effect:c.effect,directDamage:0,damage:0},1202+i*.01);
   });
   arena.root.children.forEach((g,i)=>g.position.x=-3.8+i*2.5);
   arena.update(1202.34);
   renderer.render(scene,cam);
   const screenshot=canvas.toDataURL('image/png');
   const calls=renderer.info.render.calls;
   const preview=arena.stats;
   const r79scene=new THREE.Scene();
   const legacy=createElementalVfx(THREE,r79scene);
   const historical=['E01','G01','E05','E06','G05','G06','T05','T06'];
   const legacyResults=historical.map((id,i)=>legacy.playCard(
     {id,kind:BY_ID[id].kind,side:i%2?'ai':'player'},1300+i*.01));
   legacy.update(1301);
   const r79=legacy.stats;
   legacy.dispose();
   arena.update(1208);
   const disposed=arena.stats;
   const compact=await Promise.resolve({
    catalog:CARDS.length,coverage:all.length,motifs:MAGIC_MOTIF_COUNT,
    allAccepted:all.every(x=>x.ok),fake,
    geometryFingerprints:fingerprints.size,
    minNodes:Math.min(...all.map(x=>x.nodes)),
    maxNodes:Math.max(...all.map(x=>x.nodes)),
    inFlight:life.active,peakMeshes:life.peakMeshes,
    noDrift,calls,preview,disposed,r79,legacyResults,
    isWebGL2:renderer.capabilities.isWebGL2,
    screenshot,
   });
   renderer.dispose();arena.dispose();
   return compact;
  },view);
  const picture=v.screenshot;delete v.screenshot;
  check(v.isWebGL2,view+' genuine WebGL2',v);
  check(v.catalog===60&&v.coverage===46,view+' all 46 existing spell events',v.coverage);
  check(v.motifs>=30&&v.allAccepted,view+' 32 campus spell motifs actually built',v.motifs);
  check(v.geometryFingerprints>=18,view+' physically distinct geometry not color swaps',v.geometryFingerprints);
  check(v.fake.every(x=>x===false),view+' reject invalid effects',v.fake);
  check(v.inFlight===4&&v.peakMeshes<120,view+' cap concurrent GPU draw objects',v);
  check(v.noDrift,view+' elapsed-time animations deterministic');
  check(v.preview.active===4&&v.calls<140,view+' actual geometry rendered within bounded draw calls',v.calls);
  check(v.disposed.active===0&&v.disposed.ruleMutations===0,view+' expired meshes reclaimed and no game state edits');
  check(v.legacyResults.every(Boolean)&&v.r79.played===8,view+' recovered all 8 R79 elemental presets',v.r79);
  check(heavy.length===0,view+' visual arsenal does not download 3D character models');
  check(errors.length===0,view+' no WebGL2 or HTTP errors',errors);
  report.views.push({view,...v});
  const bytes=Buffer.from(picture.split(',')[1],'base64');
  writeFileSync(resolve(out,view+'-magic-comparison.png'),bytes);
  await page.close();
 }
 report.passed=report.checks.every(x=>x.pass);
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r111-magic-coverage.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R111_MAGIC_ARSENAL',JSON.stringify({passed:report.passed,
  checks:report.checks.length,errors:report.errors,views:report.views.map(x=>({
   view:x.view,cover:x.coverage,motifs:x.motifs,geometryFingerprints:x.geometryFingerprints,
   drawCalls:x.calls,legacy:x.r79.played}))}));
 await browser.close();
}
if(!report.passed)process.exitCode=6;
