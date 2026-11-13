import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11141';
const dir=resolve(import.meta.dirname,'evidence/r121-emotive-cinema');mkdirSync(dir,{recursive:true});
const report={passed:false,checks:[],errors:[],snapshots:[]};
const check=(v,label,d)=>{report.checks.push({pass:!!v,label,d});if(!v)throw Error(label+': '+JSON.stringify(d).slice(0,650))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['phone',430]]
   .filter(([name])=>(process.env.ASDC_R121_VIEWS||'desktop,phone').split(',').includes(name))){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status())});
  await page.goto(origin+'/r45-duel/?qa=1&seed=121',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:170000});
  const get=()=>page.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{hosts:q.duelistHosts,lens:q.heroLens,camera:q.cameraFrame,drawCalls:q.drawCalls,board:window.__r45QA.board};
  });
  const before=await get();
  check(before.hosts.length===2&&before.hosts.every(x=>x.expression.emotionBindings.sorrow>0&&x.expression.emotionBindings.angry>0),
   view+' both premium source VRMs have native sorrow & anger morphs',before.hosts.map(x=>x.expression));
  check(!before.lens.visible,view+' no persistent picture-in-picture when idle',before.lens);
  for(const[side,id,serial]of[['player','E03',1211001],['ai','G03',1211002]]){
   await page.evaluate(({side,id,serial})=>document.querySelector('#stadium').contentWindow.postMessage(
    {type:'ASDC_R46_CARD_PLAY',side,kind:'unit',id,serial},location.origin),{side,id,serial});
   await page.waitForTimeout(850);
   const snap=await get(),actor=snap.hosts.find(x=>x.side===side),other=snap.hosts.find(x=>x.side!==side);
   check(snap.lens.visible&&snap.lens.side===side&&snap.lens.frames>2,
    view+' '+side+' true secondary 3D face/card camera focuses current cast',snap.lens);
   check(snap.lens.faceNdc&&Math.abs(snap.lens.faceNdc[0])<.92&&Math.abs(snap.lens.faceNdc[1])<.92,
    view+' '+side+' real VRM face actually inside cinematic frame',snap.lens);
   check(snap.lens.inset.topMarginPx>150&&snap.lens.inset.bottomMarginPx>150,
    view+' '+side+' shot does not hide score and hand/card controls',snap.lens.inset);
   const framed=await page.evaluate(()=>{const el=document.querySelector('#stadium').contentWindow.document.getElementById('hero-portrait-frame');
    return{visible:!el.hidden,side:el.dataset.side,caption:el.textContent}});
   check(framed.visible&&framed.side===side&&framed.caption.includes('举牌特写'),
    view+' '+side+' premium color-coded lens frame rendered in real scene',framed);
   check(actor.expression.emotion==='surprised'&&actor.expression.actualMood>.24,
    view+' '+side+' authentic facial SURPRISE deforms original mesh',actor.expression);
   check(actor.posture.arms.R.worldHand[1]>other.posture.arms.R.worldHand[1]-.7,
    view+' '+side+' raised source wrist remains animated in cinematic cut',actor.posture);
   check(snap.drawCalls<1300,view+' '+side+' PIP drawcalls fit original GPU guard',snap.drawCalls);
   await page.screenshot({path:resolve(dir,view+'-'+side+'-real-closeup.png')});
   await page.waitForTimeout(1820);
  }
  await page.evaluate(()=>document.querySelector('#stadium').contentWindow.postMessage(
   {type:'ASDC_R112_VICTORY',winner:'player'},location.origin));
  await page.waitForTimeout(1200);
  const won=await get(),winner=won.hosts.find(x=>x.side==='player'),loser=won.hosts.find(x=>x.side==='ai');
  check(winner.expression.emotion==='joy'&&winner.expression.actualMood>.30,
   view+' real female avatar smiles on win',winner.expression);
  check(loser.expression.emotion==='sorrow'&&loser.expression.actualMood>.24,
   view+' real male avatar dejected on loss',loser.expression);
  check(won.lens.visible&&won.lens.side==='player'&&won.lens.phase==='victory_closeup',
   view+' victory reaction gets its own physically rendered closeup',won.lens);
  check(JSON.stringify(before.board)===JSON.stringify(won.board),
   view+' cinematics never change actual battle rules',null);
  check(errors.length===0,view+' no shader errors, HTTP404 or game errors',errors);
  await page.screenshot({path:resolve(dir,view+'-winner-loser-face.png')});
  report.snapshots.push({view,closeup:won.lens,winner:winner.expression,loser:loser.expression,
   drawCalls:won.drawCalls,errors});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r121-emotive-cinema-report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log('R121_EMOTIVE_CINEMA',JSON.stringify({passed:report.passed,checks:report.checks.length,
 errors:report.errors,failed:report.checks.filter(x=>!x.pass)}));
if(!report.passed)process.exitCode=1;
