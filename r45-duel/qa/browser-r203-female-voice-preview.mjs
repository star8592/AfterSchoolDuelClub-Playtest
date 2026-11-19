import assert from'node:assert/strict';
import{createRequire}from'node:module';
import{writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r203-body-impact';
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--autoplay-policy=no-user-gesture-required']});
const c=await b.newContext({viewport:{width:1440,height:860},serviceWorkers:'block'});
const p=await c.newPage(),errors=[],r={pass:false,errors};
p.on('pageerror',e=>errors.push('JS '+e.message));
p.on('response',z=>{if(z.status()>=400)errors.push('HTTP '+z.status()+' '+z.url())});
try{
 await p.goto('http://127.0.0.1:18689/r45-duel/?qa=1&seed=173&r199PhysicalMagic=on&r199Showcase=on&r200Pbr=on&r200Readable=on&r202BodyHit=on&r203BodyHit=on',
  {waitUntil:'domcontentloaded',timeout:70000});
 await p.waitForFunction(()=>window.__r45QA?.sceneReady===true&&window.__r45QA?.audio?.assetsReady===true,
  null,{timeout:135000});
 r.before=await p.evaluate(()=>({hp:window.__r45QA.hp,events:window.__r45QA.events.length}));
 await p.evaluate(()=>{
  document.getElementById('stadium').contentWindow.postMessage({
   type:'ASDC_R199_MAGIC_PREVIEW',id:'S08',side:'ai'},location.origin);
 });
 await p.waitForFunction(()=>{
  const q=window.__r45QA,z=document.getElementById('stadium').contentWindow.__r45SceneQA;
  return z.r202HostImpact.player?.id==='S08'&&
   q.audio.voiceVariantHistory?.some(x=>x.id==='HOST_PLAYER'&&x.kind==='r203_S08');
 },null,{timeout:50000});
 // Selection alone is NOT proof of playback. Wait for actual Audio.play()
 // promise acceptance, logged only by real Qwen Opus playback.
 await p.waitForFunction(()=>window.__r45QA?.audio?.speechHistory?.some(
  x=>x.id==='HOST_PLAYER'&&x.kind==='r203_S08'),null,{timeout:15000});
 r.after=await p.evaluate(()=>{
  const q=window.__r45QA,z=document.getElementById('stadium').contentWindow.__r45SceneQA;
  return {hp:q.hp,events:q.events.length,voice:q.audio.voiceVariantHistory.filter(x=>x.id==='HOST_PLAYER'&&x.kind==='r203_S08'),
   actualPlayed:q.audio.speechHistory.filter(x=>x.id==='HOST_PLAYER'&&x.kind==='r203_S08'),
   realOriginal:z.r199RealMagic.loadedIds.includes('S08'),
   stage:z.r199RealMagic.stage,playerHost:z.r202HostImpact.player,
   oldLights:z.magicArsenal.played,camera:z.r145ActionShot.enabled};
 });
 assert(r.after.realOriginal);assert.equal(r.after.playerHost.id,'S08');assert.equal(r.after.actualPlayed.length,1);
 assert.equal(r.after.oldLights,0);assert.equal(r.after.camera,false);
 assert.deepEqual(r.after.hp,r.before.hp);assert.equal(r.after.events,r.before.events);
 assert.deepEqual(errors,[]);
 await p.locator('#stadium').screenshot({path:dir+'/r203-ai-soda-hits-player-female-voice.png'});
 r.pass=true;
 console.log('R203_FEMALE_HIT_VOICE_FROM_AI_GLB_PASS',JSON.stringify({
  opponentOriginalBlender:true,recordedVoice:'HOST_PLAYER-r203_S08.ogg',
  playerHurt:true,scoreChanged:false,errors:[]}));
}finally{
 writeFileSync(dir+'/r203-female-hit-voice-preview.json',JSON.stringify(r,null,2)+'\n');
 await c.close();await b.close();
}
