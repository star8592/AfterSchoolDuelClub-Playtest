import assert from 'node:assert/strict';
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const dir='r45-duel/qa/evidence/r202-body-impact';mkdirSync(dir,{recursive:true});
const report={pass:false,errors:[],stage:'real human Q05 player cast with recorded male victim voice'};
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const c=await b.newContext({viewport:{width:1440,height:860},serviceWorkers:'block'});
const page=await c.newPage();
page.on('pageerror',e=>report.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)report.errors.push('HTTP '+r.status()+' '+r.url())});
const snap=()=>page.evaluate(()=>{
 const q=window.__r45QA;
 const z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
 return {rules:q?.events?.filter(e=>e.type==='card_play'),
  hp:q?.hp,round:q?.round,
  audio:q?.audio?{assetsReady:q.audio.assetsReady,enabled:q.audio.enabled,
   voicePlaying:q.audio.voicePlaying,voiceVariants:q.audio.voiceVariantHistory,
   speechHistory:q.audio.speechHistory,voiceCount:q.audio.counters?.voice,
   sfxCount:q.audio.counters?.cue}:null,
  school:z?.r199RealMagic?.stage,opponent:z?.r202HostImpact?.ai,
  canonicalHits:z?.r121ContactReceipts,
  oldLights:z?.magicArsenal?.played,
  oldImpact:z?.spellImpact?.played,
  zoom:z?.r145ActionShot?.enabled};
});
try{
 const url='http://127.0.0.1:18689/r45-duel/?qa=1&seed=2&deck=classroom&r199PhysicalMagic=on&r200Pbr=on&r200Readable=on&r202BodyHit=on';
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:70000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:135000});
 await page.waitForFunction(()=>window.__r45QA?.audio?.assetsReady===true,null,{timeout:25000});
 report.before=await snap();
 const card=page.locator('#hand .card[data-card-id="Q05"]').first();
 assert(await card.count());
 await card.click();await page.locator('#play').click();
 await page.waitForFunction(()=>{
  const q=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
  return z?.r199RealMagic?.stage?.actualBodyContacts>=1 &&
   q?.audio?.voiceVariantHistory?.some(v=>v.id==='HOST_AI'&&v.kind==='r202_Q05');
 },null,{timeout:45000});
 await page.waitForTimeout(350);
 report.after=await snap();
 const real=report.after.rules.find(e=>e.card==='Q05'&&e.side==='player');
 assert.equal(real.spellOutcome.directDamage,2);
 assert.equal(report.after.opponent.id,'Q05');
 assert.equal(report.after.school.actualBodyContacts,1);
 assert.equal(report.after.canonicalHits,1);
 assert(report.after.audio.voiceVariants.some(v=>v.id==='HOST_AI'&&v.kind==='r202_Q05'));
 assert.equal(report.after.oldLights,0);
 assert.equal(report.after.oldImpact,0);
 assert.equal(report.after.zoom,false);
 assert.deepEqual(report.errors,[]);
 await page.locator('#stadium').screenshot({path:dir+'/r202-real-rule-Q05-voice-and-hit.png'});
 report.pass=true;
 console.log('R202_REAL_GAMEPLAY_QWEN_CHARACTER_HIT_VOICE_PASS',
  JSON.stringify({card:'Q05',ruleDamage:2,originalImpact:1,
   certifiedVoice:'HOST_AI-r202_Q05.ogg',cueCount:report.after.audio.sfxCount,
   hostReactions:report.after.canonicalHits,closeups:0,errors:report.errors}));
}finally{
 writeFileSync(dir+'/r202-real-rule-Q05-character-voice.json',JSON.stringify(report,null,2)+'\n');
 await c.close();await b.close();
}
