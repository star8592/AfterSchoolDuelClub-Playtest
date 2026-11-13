import{createRequire}from'node:module';
import{writeFileSync,mkdirSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11152';
const dir=resolve(import.meta.dirname,'evidence/r122-qwen-mouth');mkdirSync(dir,{recursive:true});
const report={passed:false,origin,checks:[],errors:[],voices:[]};
const check=(ok,label,d)=>{report.checks.push({pass:!!ok,label,d});if(!ok)throw Error(label+': '+JSON.stringify(d).slice(0,1000))};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--autoplay-policy=no-user-gesture-required',
 '--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const[view,width]of[['desktop',1440],['phone',430]]
   .filter(([view])=>(process.env.ASDC_R122_VIEWS||'desktop,phone').split(',').includes(view))){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(origin))errors.push('HTTP '+r.status()+' '+r.url().slice(-100))});
  await page.goto(origin+'/r45-duel/?qa=1&seed=8&deck=kitchen',{waitUntil:'domcontentloaded',timeout:65000});
  await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:155000});
  await page.waitForFunction(()=>window.__r45QA.audio.assetsReady===true,null,{timeout:20000});
  const read=()=>page.evaluate(()=>{
   const stage=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{speech:stage.realVoiceActing,lens:stage.heroLens,
    hosts:stage.duelistHosts.map(x=>({
    side:x.side,face:x.expression,posture:x.posture})),audio:window.__r45QA.audio,
    board:window.__r45QA.board};
  });
  let snap=await read(),board=JSON.stringify(snap.board);
  check(snap.hosts.length===2&&snap.hosts.every(x=>Object.values(x.face.mouthBindings).every(v=>v>0)),
   view+' BOTH source VRMs retain all five A/I/U/E/O real mouth morphs',
   snap.hosts.map(x=>x.face.mouthBindings));
  check(snap.speech.speakers.player===null&&snap.speech.speakers.ai===null&&
   snap.hosts.every(x=>x.face.actualViseme===0),
   view+' neither child pretends to talk before a confirmed Qwen sample',snap);
  // The game already played its own authentic stadium PA. A host cast
  // interrupts that ambient PA. Use the same production audio path, not a
  // fabricated postMessage to inject a fake actor line.
  const play=await page.evaluate(()=>window.__r45QA.audioVoiceSample('HOST_PLAYER','cast'));
  check(play===true,view+' playing genuine recorded host female Qwen cast',play);
  await page.waitForFunction(()=>window.__r45QA.audio.speechHistory.some(x=>x.id==='HOST_PLAYER'&&x.kind==='cast'),
   null,{timeout:16000});
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.realVoiceActing.speakers.player!==null,
   null,{timeout:9000});
  const playerSamples=[];
  for(let i=0;i<19;i++){
   await page.waitForTimeout(65);
   const s=await read();playerSamples.push(s);
  }
  const playerMax=Math.max(...playerSamples.map(s=>s.hosts.find(h=>h.side==='player').face.actualViseme));
  const unique=new Set(playerSamples.filter(s=>s.hosts[0].face.visemeAmount>.05).map(s=>s.hosts[0].face.viseme));
  check(playerMax>.12&&unique.size>=2,
   view+' female source face really moves distinct real mouth blendshapes in sync with the recording',
   {max:playerMax,shapes:[...unique]});
  check(playerSamples.some(s=>s.hosts.find(h=>h.side==='player').posture.speaking)&&
   playerSamples.every(s=>!s.hosts.find(h=>h.side==='ai').posture.speaking),
   view+' female voice moves ONLY corresponding host, no cross-talk',playerSamples.at(-1).speech);
  check(playerSamples.some(s=>s.lens.visible&&s.lens.side==='player'&&
   s.lens.phase==='actual_qwen_voice_closeup'),
   view+' authentic female speaker owns temporary face camera during live sound',
   playerSamples.at(-1).lens);
  await page.screenshot({path:resolve(dir,view+'-real-qwen-female-mouth.png')});
  // Muting is an audio stop, not a caption. The face must stop immediately.
  await page.locator('#audio-toggle').click();
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.realVoiceActing.speakers.player===null,
   null,{timeout:3500});
  await page.waitForTimeout(170);
  snap=await read();
  check(!snap.audio.requested&&snap.hosts.every(x=>x.face.actualViseme===0)&&
   snap.speech.speakers.player===null,
   view+' mute stops actual mouth morphology; no fake silent lip movement',snap);
  await page.locator('#audio-toggle').click();
  await page.waitForFunction(()=>window.__r45QA.audio.enabled===true,null,{timeout:9000});
  const aiPlayed=await page.evaluate(()=>window.__r45QA.audioVoiceSample('HOST_AI','cast'));
  check(aiPlayed===true,view+' playing genuine recorded male Qwen cast',aiPlayed);
  await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.realVoiceActing.speakers.ai!==null,
   null,{timeout:14000});
  const male=[];
  for(let i=0;i<17;i++){await page.waitForTimeout(60);male.push(await read())}
  const maleMax=Math.max(...male.map(s=>s.hosts.find(h=>h.side==='ai').face.actualViseme));
  const maleShapes=new Set(male.filter(s=>s.hosts[1].face.visemeAmount>.05).map(s=>s.hosts[1].face.viseme));
  check(maleMax>.12&&maleShapes.size>=2,
   view+' male original face physically opens/closes with own Qwen voice',
   {max:maleMax,shapes:[...maleShapes]});
  check(male.every(s=>!s.hosts.find(h=>h.side==='player').posture.speaking)&&
   male.some(s=>s.hosts.find(h=>h.side==='ai').posture.speaking),
   view+' no leftover female talking when male speaks');
  check(male.some(s=>s.lens.visible&&s.lens.side==='ai'&&
   s.lens.phase==='actual_qwen_voice_closeup'),
   view+' authentic male speaker owns camera only while talking',male.at(-1).lens);
  await page.screenshot({path:resolve(dir,view+'-real-qwen-male-mouth.png')});
  await page.locator('#audio-toggle').click();
  await page.waitForTimeout(150);
  const end=await read();
  check(end.speech.speakers.ai===null&&end.hosts.every(x=>x.face.actualViseme===0),
   view+' audio stop returns both original source mouths to closed',end);
  check(JSON.stringify(end.board)===board,
   view+' expression and live voice never mutate authoritative cards/HP');
  check(errors.length===0,view+' no webgl/JS/HTTP exceptions',{errors});
  report.voices.push({view,player:{max:playerMax,shapes:[...unique]},
   ai:{max:maleMax,shapes:[...maleShapes]},lastSpeech:end.speech,errors});
  await page.close();
 }
 report.passed=true;
}catch(e){report.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r122-real-qwen-mouth-report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log('R122_REAL_QWEN_LIPS',JSON.stringify({passed:report.passed,checks:report.checks.length,
 errors:report.errors,failed:report.checks.filter(x=>!x.pass)}));
if(!report.passed)process.exitCode=1;
