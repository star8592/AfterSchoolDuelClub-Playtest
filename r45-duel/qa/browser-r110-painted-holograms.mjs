import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {CARDS} from '../engine.mjs';
const {chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const ORIGIN=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11110';
const out=resolve(import.meta.dirname,'evidence/r110');mkdirSync(out,{recursive:true});
const report={passed:false,checks:[],errors:[],viewports:[]};
const chk=(pass,label,data)=>{report.checks.push({pass:!!pass,label,data});
 if(!pass)throw Error(label+' '+String(JSON.stringify(data)).slice(0,900))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const [viewport,width] of [['desktop',1440],['phone',430]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[],failed=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(ORIGIN))errors.push('HTTP '+r.status()+' '+r.url())});
  page.on('request',r=>{if(/\.(vrm|glb)(\?|$)/i.test(r.url()))failed.push(r.url())});
  await page.goto(ORIGIN+'/',{waitUntil:'domcontentloaded',timeout:30000});
  const result=await page.evaluate(async(viewport)=>{
   const THREE=await import('./r45-duel/assets/three/build/three.module.js');
   const {createCardHolograms}=await import('./r45-duel/scene/card-holograms.mjs');
   const {CARDS,BY_ID}=await import('./r45-duel/engine.mjs');
   const scene=new THREE.Scene();
   const p=createCardHolograms(THREE,scene);
   const valid=(c,side='player',serial=1)=>({
    id:c.id,name:c.name,kind:c.kind,cost:c.cost,side,serial
   });
   const accepted=CARDS.map((c,i)=>p.show(valid(c,i%2?'ai':'player',i+1),10+i*.001));
   const tampered=[
    p.show({...valid(BY_ID.K07),id:'H99'},12),
    p.show({...valid(BY_ID.K07),kind:'event'},12),
    p.show({...valid(BY_ID.K07),cost:9},12),
    p.show({...valid(BY_ID.K07),serial:0},12),
    p.show({...valid(BY_ID.K07),name:'a different card'},12),
    p.show({...valid(BY_ID.K07),side:'observer'},12)
   ];
   // Separate acceptance scan from rendering: do not let the scan's last 3 queued
   // entries delay the selected flagship-card animation.
   const renderScene=new THREE.Scene();
   const renderProjector=createCardHolograms(THREE,renderScene);
   const rendered=[];
   let now=15;
   for(const [id,side] of [['K07','player'],['Q04','ai'],['Q08','player'],['E01','ai'],['X08','player']]){
    for(let tick=0;tick<4;tick++){renderProjector.update(now+tick*3,false,viewport==='phone')}
    now+=18;
    const card=BY_ID[id];
    const ok=renderProjector.show(valid(card,side,100+now),now);
    renderProjector.update(now+.1,false,viewport==='phone');
    let painted=false;
    for(let tries=0;tries<50;tries++){
     if(renderProjector.stats.lastPainted[side]===id){painted=true;break}
     await new Promise(done=>setTimeout(done,75));
    }
    const group=renderProjector.root.children[side==='player'?0:1];
    const tex=group.userData.plane.material.map;
    const canvas=tex?.image;
    const pixels=canvas?.getContext('2d')?.getImageData(90,260,200,170).data;
    const sample=[];
    if(pixels){
     for(let j=0;j<pixels.length;j+=333){sample.push(pixels[j],pixels[j+1],pixels[j+2])}
    }
    const colorful=sample.length>20&&new Set(sample).size>28;
    rendered.push({id,side,accepted:ok,painted,colorful,textureWidth:canvas?.width,
      textureHeight:canvas?.height,last:renderProjector.stats.last[side]});
    now+=3;
   }
   return{catalog:CARDS.length,allAccepted:accepted.every(Boolean),accepted:accepted.filter(Boolean).length,
    tampered,rendered,stats:renderProjector.stats,sceneObjects:renderScene.children.length};
  },viewport);
  chk(result.catalog===60,viewport+' 60 canonical cards',result.catalog);
  chk(result.allAccepted&&result.accepted===60,viewport+' every one of 60 genuine played cards accepted',result);
  chk(result.tampered.every(v=>v===false),viewport+' reject malformed/fake play receipts',result.tampered);
  chk(result.rendered.every(v=>v.accepted&&v.painted&&v.colorful&&v.textureWidth===384&&v.textureHeight===520),
   viewport+' actual original illustrations in 3D CanvasTexture',result.rendered);
  chk(result.stats.artRequestsCached<=18,viewport+' bounded prefetch');
  chk(result.stats.failedImages.length===0,viewport+' no missing image assets',result.stats.failedImages);
  chk(result.stats.projectionMeshes===6&&result.sceneObjects===1,viewport+' genuinely 3D card meshes');
  chk(failed.length===0,viewport+' standalone card art QA downloads zero VRM/GLB');
  chk(errors.length===0,viewport+' zero JS/network errors',errors);
  report.viewports.push({viewport,result});
  await page.close();
 }
 report.passed=report.checks.every(x=>x.pass);
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(out,'r110-painted-holograms-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log('R110_PAINTED_HOLOGRAMS',JSON.stringify({passed:report.passed,checks:report.checks.length,errors:report.errors,
    views:report.viewports.map(v=>({view:v.viewport,accepted:v.result.accepted,painted:v.result.rendered}))}));
 await browser.close();
}
if(!report.passed)process.exitCode=4;
