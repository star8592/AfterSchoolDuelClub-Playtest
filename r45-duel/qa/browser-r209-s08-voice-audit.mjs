/** R203: real card from hand, real source GLB impact, authentic Qwen voice. */
import assert from'node:assert/strict';
import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const choices={
 S08:{deck:'science',seed:1},
 P03:{deck:'sports',seed:4}
};
const id=process.env.R203_CARD||'S08',choice=choices[id];
if(!choice)throw Error('Unsupported real-card scenario '+id);
const dir='r45-duel/qa/evidence/r209-voice-director';
mkdirSync(dir,{recursive:true});
const record={id,deck:choice.deck,seed:choice.seed,pass:false,errors:[]};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
const ctx=await browser.newContext({viewport:{width:1440,height:860},serviceWorkers:'block'});
const page=await ctx.newPage();
page.on('pageerror',e=>record.errors.push('JS '+e.message));
page.on('response',r=>{if(r.status()>=400)record.errors.push('HTTP '+r.status()+' '+r.url())});
const snap=()=>page.evaluate(()=>{
 const q=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
 return{
  hp:q?.hp,round:q?.round,
  events:q?.events?.filter(e=>e.type==='card_play'),
  audio:q?.audio?{ready:q.audio.assetsReady,voiceVariants:q.audio.voiceVariantHistory,
   speechHistory:q.audio.speechHistory,playedCount:q.audio.counters?.voice}:null,
  actor:z?.r199RealMagic,body:z?.r202HostImpact,
  contactReceipts:z?.r121ContactReceipts,
  oldLight:z?.magicArsenal?.played,
  oldImpact:z?.spellImpact?.played,
  closeup:z?.r145ActionShot?.enabled,
  inset:z?.renderPerformance?.heroInsetDraws
 }
});
try{
 const url=new URL('http://127.0.0.1:18689/r45-duel/');
 for(const [key,val]of Object.entries({
  qa:'1',seed:String(choice.seed),deck:choice.deck,
  r199PhysicalMagic:'on',r200Pbr:'on',r200Readable:'on',
  r202BodyHit:'on',r203BodyHit:'on',r209VoiceDirector:'on',r208Audio:'on'
 }))url.searchParams.set(key,val);
 await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:70000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true&&window.__r45QA?.audio?.assetsReady===true,
  null,{timeout:135000});
 record.before=await snap();
 assert(record.before.actor?.stage?.r203BodyImpact);
 const card=page.locator('#hand .card[data-card-id="'+id+'"]').first();
 assert(await card.count(),'original source card must be held');
 await card.click();await page.locator('#play').click();
 await page.waitForFunction(id=>{
  const q=window.__r45QA,z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
  return z?.r199RealMagic?.stage?.actualBodyContacts===1&&
   z?.r202HostImpact?.ai?.id===id&&
   q?.events?.some(e=>e.type==='card_play'&&e.card===id&&e.side==='player');
 },id,{timeout:50000});
 // Selection may precede an outstanding original crowd voice: only an
 // actual HTMLAudioElement.play() and audio history count as playback.
 await page.waitForFunction(id=>window.__r45QA?.audio?.speechHistory?.some(
  x=>x.id==='HOST_AI'&&x.kind==='r203_'+id),id,{timeout:23000});
 record.after=await snap();
 // The R209 two-lane proof: the caster phrase must reach its actual end
 // while the actor's short recorded gasp fires at the real hit instant.
 record.voiceDirector=await page.evaluate(()=>window.__r45QA.audio.voiceDirectorQA);
 record.lastImpactGasp=await page.evaluate(()=>window.__r45QA.audio.lastImpactGasp);
 record.voiceStops=await page.evaluate(()=>window.__r45QA.audio.voiceCompletionHistory);
 const fullCast=record.voiceStops.find(x=>x.id==='HOST_PLAYER'&&x.kind==='r208_'+id);
 assert(fullCast&&fullCast.naturallyEnded===true&&
  fullCast.playbackSeconds>=fullCast.expectedSeconds*.90,
  'R209 should finish 2.81s real caster line instead of R208 cut at 1.051s');
 assert(record.voiceDirector.gaspErrors===0,'no missing R209 voice resources');
 assert(record.voiceDirector.deferredHits>=1&&record.voiceDirector.immediateGasps===1,
  'R209 real collision should trigger short separate recorded gasp + later complete retort');
 assert(record.lastImpactGasp?.id==='HOST_AI'&&record.lastImpactGasp?.file===
  'HOST_AI-r209-impact-gasp.ogg');

 record.voiceEvents=await page.evaluate(()=>window.__r45QA.audio.events.filter(x=>['voice','voice-variant','voice-play-error'].includes(x.type)));
 console.log('R209_COMPLETE_CASTER_AUDIO_LIFECYCLE',JSON.stringify(record.voiceStops));

 const canonical=record.after.events.find(e=>e.card===id&&e.side==='player');
 assert(canonical?.spellOutcome,'real authoritative spell result missing');
 assert.equal(record.after.actor.stage.actualBodyContacts,1);
 assert.equal(record.after.contactReceipts,record.before.contactReceipts+1);
 assert.equal(record.after.body.ai.id,id);
 assert(record.after.actor.loadedIds.includes(id));
 assert(record.after.audio.speechHistory.some(v=>v.id==='HOST_AI'&&v.kind==='r203_'+id));
 assert(record.after.audio.speechHistory.some(v=>v.id==='HOST_PLAYER'&&v.kind==='r208_'+id),
  'real recorded host spell call must sound before actual hit voice');
 assert(record.after.audio.speechHistory.some(v=>v.id==='HOST_AI'&&v.kind==='r203_'+id),
  'hit voice must not be suppressed by new spell call');
 assert.equal(record.after.oldLight,0);assert.equal(record.after.oldImpact,0);
 assert.equal(record.after.closeup,false);assert.equal(record.after.inset,0);
 assert.deepEqual(record.errors,[]);
 await page.locator('#stadium').screenshot({
  path:dir+'/r209-director-real-card-'+id+'-original-spell-cast-and-hit.png'});
 record.pass=true;
 console.log('R209_FULL_CASTER_IMMEDIATE_GASP_AND_DEFERRED_RETORT_CAST_THEN_HIT_TWO_CORRECT_VOICES_PASS',
  JSON.stringify({id,rule:canonical.spellOutcome,
   originalGLB:true,actualBodyContacts:1,voice:'HOST_AI-r203_'+id+'.ogg',castVoice:'HOST_PLAYER-r208_'+id+'.ogg',
   closeups:0,oldLights:0,errors:record.errors}));
}finally{
 writeFileSync(dir+'/r209-director-real-card-'+id+'-cast-and-hit-voice.json',JSON.stringify(record,null,2)+'\n');
 await ctx.close();await browser.close();
}
