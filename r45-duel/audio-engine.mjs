/** R70 independent sound layer. Music/Foley are original locally authored assets.
 * Character VO is only emitted by pre-rendered Qwen3-TTS files: no browser TTS,
 * IndexTTS, copied movie voices, or runtime synthesis fallback.
 * Completely presentation-only: cannot mutate the rules engine/HP.
 */
const SOUNDS=Object.freeze({
 select:'select.ogg',cast:'cast.ogg',enemy_cast:'enemy_cast.ogg',
 turn:'turn.ogg',attack:'attack.ogg',hit:'hit.ogg',
 heal:'heal.ogg',win:'win.ogg',lose:'lose.ogg',
 card_flip:'card_flip.ogg',spell_charge:'spell_charge.ogg',
 meteor_impact:'meteor_impact.ogg',sonic_wave:'sonic_wave.ogg',
 ice_shatter:'ice_shatter.ogg',stadium_cheer:'stadium_cheer.ogg',
 score_chime:'score_chime.ogg',shield_block:'shield_block.ogg'
});
const VOICE_MODEL='Qwen3-TTS';
const base='./assets/audio/';
const clamp=n=>Math.min(1,Math.max(0,Number(n)||0));
const defaults={music:.44,sfx:.75,voice:.86};
const SOUND_INTENT_KEY='asdc_r83_sound_on';
function savedSoundIntent(){
  try{return localStorage.getItem(SOUND_INTENT_KEY)!=='off'}
  catch{return true}
}

function savedVolume(){
 try{
  const stored=JSON.parse(localStorage.getItem('asdc_r70_audio_mix')||'null');
  return Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,
   stored&&Number.isFinite(stored[k])?clamp(stored[k]):v]));
 }catch{return {...defaults}}
}

export function createDuelAudio(){
 let requested=savedSoundIntent(),enabled=false,ctx=null,decoded=new Map(),voiceManifest={clips:{}},voiceAudio=null;
 let assetsLoading=null,assetsReady=false,musicAttemptInFlight=false;
 const pendingCues=[],pendingVoices=[];

 let musicAudio=null,musicKind='school_duel_theme',musicDucked=false;
 let activeSfx=0,voiceQueue=[],currentVoiceKey=null;
 const recentVoiceKeys=new Map();
 const volume=savedVolume();
 const counters={cue:0,voice:0,voiceMissing:0,voiceDropped:0,voiceInterrupted:0,unlock:0,musicStart:0,errors:0};
 const debugEvents=[];
 const log=(type,detail)=>{
  debugEvents.push({type,detail,at:Math.round(performance.now())});
  if(debugEvents.length>65)debugEvents.shift();
 };
 const soundPath=name=>base+SOUNDS[name];
 function updateMusicVolume(){if(musicAudio)musicAudio.volume=Math.min(1,volume.music*(musicDucked?.29:1))}
 function store(){try{localStorage.setItem('asdc_r70_audio_mix',JSON.stringify(volume))}catch{}}
 async function loadManifest(){
  try{
   const response=await fetch(base+'voice-manifest.json',{cache:'no-cache'});
   if(!response.ok)throw Error('voice manifest HTTP '+response.status);
   const json=await response.json();
   if(json.provider!=='Qwen3-TTS'||typeof json.clips!=='object')
    throw Error('Non-Qwen3 or invalid manifest prohibited');
   voiceManifest=json;
  }catch(e){counters.errors++;log('manifest-error',String(e))}
 }
 async function preloadCues(){
  if(!ctx)return;
  await Promise.all(Object.entries(SOUNDS).map(async([key,file])=>{
   try{
    const res=await fetch(base+file);
    if(!res.ok)throw Error(`HTTP ${res.status}`);
    decoded.set(key,await ctx.decodeAudioData(await res.arrayBuffer()));
   }catch(e){counters.errors++;log('cue-error',key+':'+String(e))}
  }));
 }
 function beginMusic(){
  if(!requested||!musicAudio||musicAttemptInFlight||!musicAudio.paused)return;
  musicAudio.loop=true;
  updateMusicVolume();
  musicAttemptInFlight=true;
  const play=musicAudio.play();
  play?.then(()=>{
    musicAttemptInFlight=false;
    if(!requested){musicAudio.pause();return}
    counters.musicStart++;log('music',musicKind);
  }).catch(e=>{
    musicAttemptInFlight=false;
    // Autoplay is routinely blocked on a fresh browser tab: this is not an
    // asset failure or a reason to force an extra sound-enable button.
    if(e?.name==='NotAllowedError')log('autoplay-deferred','first game interaction unlocks audio');
    else if(e?.name!=='AbortError'){counters.errors++;log('music-error',String(e))}
  });
 }
 async function prepare(){
  if(assetsLoading)return assetsLoading;
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx)return Promise.reject(Error('Browser does not support Web Audio'));
  ctx??=new Ctx();
  musicAudio??=new Audio(base+musicKind+'.ogg');
  musicAudio.preload='auto';
  musicAudio.loop=true;
  musicAudio.addEventListener('error',()=>{
    counters.errors++;log('music-error','file failed');
  });
  // Decode while suspended. First card selection must not wait for network.
  assetsLoading=Promise.all([loadManifest(),preloadCues()]).then(()=>{
    assetsReady=true;flushPending();
    log('prepared','sound files ready; playback follows browser policy');
    return true;
  });
  return assetsLoading;
 }
 function flushPending(){
  if(!requested||!enabled)return;
  for(const item of pendingCues.splice(0,8))
    playCue(item.key,item.side);
  if(voiceManifest.clips){
    for(const item of pendingVoices.splice(0,3))
      playCharacter(item.id,item.kind);
  }
 }
 // Called optimistically on page entry, then immediately on the first real
 // card/keyboard/tap gesture if the browser disallowed autoplay.
 async function unlock(){
  if(!requested)return false;
  if(enabled&&ctx?.state==='running'){
    // Some browsers allow AudioContext.resume() during page load but refuse
    // HTMLAudioElement.play(). A real card gesture must retry the music too.
    if(musicAudio?.paused&&!musicAttemptInFlight)beginMusic();
    return true;
  }
  void prepare().catch(e=>{counters.errors++;log('prepare-error',String(e))});
  if(!ctx)throw Error('Browser does not support Web Audio');
  // Attempt HTML media PLAY synchronously inside the user gesture; awaiting
  // resume() first can lose transient activation in Chromium/Safari.
  beginMusic();
  await ctx.resume();
  if(!requested)return false; // explicit mute won a racing async resume
  if(ctx.state!=='running')return false;
  if(!enabled){enabled=true;counters.unlock++;log('unlocked','auto on load / first game action');}
  // A user gesture may arrive while an autoplay rejection is still settling.
  if(musicAudio?.paused&&!musicAttemptInFlight)beginMusic();
  flushPending();
  return true;
 }
 function stop(){
  requested=false;
  try{localStorage.setItem(SOUND_INTENT_KEY,'off')}catch{}
  enabled=false;
  pendingCues.length=0;pendingVoices.length=0;
  musicAudio?.pause();
  voiceQueue=[];voiceAudio?.pause();voiceAudio=null;currentVoiceKey=null;
  musicDucked=false;
  void ctx?.suspend().catch(()=>{});
  log('muted','explicit user preference');
 }
 async function turnOn(){
  requested=true;
  try{localStorage.setItem(SOUND_INTENT_KEY,'on')}catch{}
  return unlock();
 }
 function setVolume(channel,value){
  if(!Object.hasOwn(volume,channel))return;
  volume[channel]=clamp(value);store();
  if(channel==='music')updateMusicVolume();
  if(channel==='voice'&&voiceAudio)voiceAudio.volume=volume.voice;
  log('volume',channel+':'+volume[channel]);
 }
 function playCue(key,side='center'){
  if(!requested||!SOUNDS[key]||volume.sfx===0)return false;
  if(!enabled||!ctx||!decoded.has(key)){
    if(pendingCues.length<8)pendingCues.push({key,side});
    return true;
  }
  try{
   const source=ctx.createBufferSource(),gain=ctx.createGain();
   source.buffer=decoded.get(key);
   const simultaneous=activeSfx>=5;
   gain.gain.value=volume.sfx*(simultaneous?.25:.57);
   source.connect(gain);
   let panner=null;
   if(ctx.createStereoPanner){
    panner=ctx.createStereoPanner();
    panner.pan.value=side==='player'?-.42:side==='ai'?.42:0;
    gain.connect(panner);panner.connect(ctx.destination);
   }else gain.connect(ctx.destination);
   activeSfx++;source.onended=()=>{
    activeSfx=Math.max(0,activeSfx-1);
    source.disconnect();gain.disconnect();panner?.disconnect();
   };
   source.start();counters.cue++;log('cue',key+':'+side);return true;
  }catch(e){counters.errors++;log('cue-play-error',String(e));return false}
 }
 // Never overlap character speech: a brief queue keeps AI multi-summons
 // intelligible. Real attacks interrupt the weaker entrance line immediately.
 function playQueuedVoice(){
  if(!enabled||voiceAudio||voiceQueue.length===0)return;
  const {id,kind,file}=voiceQueue.shift();
  const a=new Audio(base+'voices/'+file);
  voiceAudio=a;currentVoiceKey=id+':'+kind;
  a.volume=volume.voice;a.preload='auto';
  musicDucked=true;updateMusicVolume();
  const done=()=>{
   if(voiceAudio!==a)return;
   voiceAudio=null;currentVoiceKey=null;
   if(enabled&&voiceQueue.length)playQueuedVoice();
   else{musicDucked=false;updateMusicVolume()}
  };
  a.addEventListener('ended',done,{once:true});
  a.addEventListener('error',()=>{counters.errors++;done()},{once:true});
  try{
   a.play().then(()=>{
    if(voiceAudio===a){counters.voice++;log('voice',id+':'+kind)}
   }).catch(e=>{
    // Expected AbortError when an attack intentionally preempts an entrance.
    if(voiceAudio!==a)return;
    counters.errors++;log('voice-play-error',String(e));done();
   });
  }catch(e){counters.errors++;log('voice-init-error',String(e));done()}
 }
 function playCharacter(id,kind='enter'){
  if(!requested||volume.voice===0)return false;
  if(!enabled||!assetsReady){
    if(pendingVoices.length<3)pendingVoices.push({id,kind});
    return true;
  }
  const clip=voiceManifest.clips?.[id]?.[kind];
  if(!clip?.file||clip.ready!==true){counters.voiceMissing++;return false}
  // Only locally generated Qwen3-TTS Opus file names, never remote URLs.
  if(!/^[a-zA-Z0-9_-]+\.ogg$/.test(clip.file)){counters.errors++;return false}
  const key=id+':'+kind,now=performance.now();
  if(now-(recentVoiceKeys.get(key)??-Infinity)<700)return false;
  recentVoiceKeys.set(key,now);
  if(recentVoiceKeys.size>45)recentVoiceKeys.clear();
  const item={id,kind,file:clip.file};
  if(kind==='attack'||kind==='hurt'||kind==='cast'){
   // Attack VO must accompany the actual animation; cancel the old line,
   // leaving pending entrances behind this higher priority combat call.
   if(voiceAudio){voiceAudio.pause();voiceAudio=null;currentVoiceKey=null;counters.voiceInterrupted++;}
   voiceQueue.unshift(item);
  }else{
   if(voiceQueue.length>=2){counters.voiceDropped++;log('voice-dropped',key);return false}
   voiceQueue.push(item);
  }
  if(!voiceAudio)playQueuedVoice();
  return true;
 }
 function switchMusic(to){
  if(!['school_duel_theme','duel_tension'].includes(to))return;
  if(musicKind===to)return;
  musicKind=to;
  if(!enabled)return;
  musicAudio?.pause();
  musicAttemptInFlight=false;
  musicAudio=new Audio(base+to+'.ogg');
  musicAudio.preload='auto';
  beginMusic();
 }
 function gameFinished(winner){
  voiceQueue=[];voiceAudio?.pause();voiceAudio=null;currentVoiceKey=null;
  musicDucked=false;musicAudio?.pause();
  playCue(winner==='draw'?'turn':winner==='player'?'win':'lose');
  if(winner!=='draw')playCue('stadium_cheer');
  log('finished',winner);
 }
 function status(){return {provider:VOICE_MODEL,enabled,requested,
  activationPending:requested&&!enabled,assetsReady,
  audioContextState:ctx?.state||'none',
  pendingCues:pendingCues.length,pendingVoices:pendingVoices.length,
  musicKind,musicDucked,voicePlaying:!!voiceAudio,currentVoiceKey,
  voiceQueue:voiceQueue.map(x=>x.id+':'+x.kind),decodedCues:decoded.size,voiceClipCount:Object.keys(voiceManifest.clips||{}).length,
  volume:{...volume},counters:{...counters},events:[...debugEvents]}}
 return {prepare,unlock,turnOn,stop,setVolume,playCue,playCharacter,switchMusic,gameFinished,status};
}
