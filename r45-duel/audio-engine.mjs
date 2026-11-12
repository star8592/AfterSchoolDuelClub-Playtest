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
export const MUSIC_TRACKS=Object.freeze([
 'school_duel_theme','campus_parade','mischief_shuffle','tactical_pulse',
 'heroic_comeback','duel_tension','final_overtime'
]);
const MUSIC_TRACK_SET=new Set(MUSIC_TRACKS);
const OPENING_MUSIC=Object.freeze(['school_duel_theme','campus_parade','mischief_shuffle']);
const NEUTRAL_MUSIC=Object.freeze(['campus_parade','mischief_shuffle','tactical_pulse','school_duel_theme']);
const PRESSURE_MUSIC=Object.freeze(['heroic_comeback','duel_tension','final_overtime']);
const FINAL_MUSIC=Object.freeze(['final_overtime','duel_tension','heroic_comeback']);

const base='./assets/audio/';
const clamp=n=>Math.min(1,Math.max(0,Number(n)||0));
const defaults={music:.32,sfx:.75,voice:1};
const SOUND_INTENT_KEY='asdc_r83_sound_on';
function savedSoundIntent(){
  try{return localStorage.getItem(SOUND_INTENT_KEY)!=='off'}
  catch{return true}
}

function savedVolume(){
 try{
  const stored=JSON.parse(localStorage.getItem('asdc_r70_audio_mix')||'null');
  // Upgrade only the exact untouched R94 default mix once. If a listener
  // ever adjusted a slider, preserve all of their own settings unchanged.
  if(stored&&stored.music===.44&&stored.sfx===.75&&stored.voice===.86)
   return {...defaults};
  return Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,
   stored&&Number.isFinite(stored[k])?clamp(stored[k]):v]));
 }catch{return {...defaults}}
}

export function createDuelAudio(){
 let requested=savedSoundIntent(),enabled=false,ctx=null,decoded=new Map(),voiceManifest={clips:{}},voiceAudio=null;
 let assetsLoading=null,assetsReady=false,musicAttemptInFlight=false;
 const pendingCues=[],pendingVoices=[];

 let musicAudio=null,musicKind='school_duel_theme',musicDucked=false;
 let fadingMusic=null,fadeRatio=1,musicTransitionToken=0;
 let musicCycle=0,openingSeed=0,lastBattleMusicKey='',lastMusicChangeAt=-Infinity;
 const musicHistory=[],voiceVariantHistory=[],variantBags=new Map(),lastVoiceVariant=new Map(),recentVariants=new Map();

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
 function updateMusicVolume(){
  const current=clamp(volume.music*(musicDucked?.20:1));
  if(musicAudio)musicAudio.volume=clamp(current*fadeRatio);
  if(fadingMusic)fadingMusic.volume=clamp(current*(1-fadeRatio));
 }
 function selectWithoutRepeat(options){
  const available=options.filter(key=>key!==musicKind);
  const pool=available.length?available:options;
  // Seed is fixed per new game, while choices vary across turns and battles.
  const index=Math.abs((openingSeed+musicCycle*7+Math.imul(musicCycle+1,13)))%pool.length;
  musicCycle++;
  return pool[index];
 }

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
  musicAudio?.pause();fadingMusic?.pause();fadingMusic=null;fadeRatio=1;musicTransitionToken++;
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
 function chooseVoiceVariant(id,kind){
  const entries=voiceManifest.clips?.[id]||{};
  const candidates=Object.keys(entries).filter(k=>(k===kind||new RegExp('^'+kind+'_v[2-9]$').test(k))
    &&entries[k]?.ready&&entries[k]?.file);
  if(!candidates.length)return null;
  const key=id+':'+kind,prev=lastVoiceVariant.get(key);
  let bag=variantBags.get(key);
  if(!bag?.length){
    bag=candidates.slice();
    for(let i=bag.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [bag[i],bag[j]]=[bag[j],bag[i]];
    }
  }
  const recent=recentVariants.get(key)||[];
  // If at least 3 lines exist, do not repeat ANY of the two preceding
  // lines, even at a shuffle-bag cycle boundary.
  const avoid=recent.slice(-Math.min(2,candidates.length-1));
  const eligible=bag.filter(k=>!avoid.includes(k));
  const options=eligible.length?eligible:bag.filter(k=>k!==prev);
  const selected=(options.length?options:bag)[0];
  bag.splice(bag.indexOf(selected),1);
  variantBags.set(key,bag);lastVoiceVariant.set(key,selected);
  recent.push(selected);recentVariants.set(key,recent.slice(-2));
  voiceVariantHistory.push({id,kind,variant:selected});
  if(voiceVariantHistory.length>70)voiceVariantHistory.shift();
  return {variant:selected,...entries[selected]};
 }
 function playQueuedVoice(){
  if(!enabled||voiceAudio||voiceQueue.length===0)return;
  const {id,kind,file,variant}=voiceQueue.shift();
  const a=new Audio(base+'voices/'+file+'?mix=r99');
  voiceAudio=a;currentVoiceKey=id+':'+kind;
  a.volume=volume.voice;a.preload='auto';
  log('voice-variant',id+':'+kind+'='+variant);
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
  const clip=chooseVoiceVariant(id,kind);
  if(!clip?.file){counters.voiceMissing++;return false}
  // Only locally generated Qwen3-TTS Opus file names, never remote URLs.
  if(!/^[a-zA-Z0-9_-]+\.ogg$/.test(clip.file)){counters.errors++;return false}
  const key=id+':'+kind,now=performance.now();
  if(now-(recentVoiceKeys.get(key)??-Infinity)<700)return false;
  recentVoiceKeys.set(key,now);
  if(recentVoiceKeys.size>45)recentVoiceKeys.clear();
  const item={id,kind,file:clip.file,variant:clip.variant};
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
 function setOpeningMusic(seed=0){
  if(!Number.isFinite(Number(seed)))seed=0;
  openingSeed=(Number(seed)|0)+(Date.now()%100003);
  // Don't play the identical track every new battle.
  const choices=OPENING_MUSIC;
  const target=choices[Math.abs(openingSeed)%choices.length];
  if(!enabled&&!musicAudio){musicKind=target;return target}
  switchMusic(target);
  return target;
 }
 function musicForBattle(state){
  if(!state||!Number.isInteger(state.round))return false;
  const min=Math.min(state.playerHp??20,state.aiHp??20);
  const phase=state.round>=7||min<=4?'final':
              min<=10?'pressure':
              state.round>=4?'mid':'neutral';
  const slot=Math.floor(Math.max(0,state.round-1)/2);
  const key=phase+':'+slot;
  if(key===lastBattleMusicKey)return false;
  lastBattleMusicKey=key;
  const options=phase==='final'?FINAL_MUSIC:
                phase==='pressure'||phase==='mid'?PRESSURE_MUSIC:NEUTRAL_MUSIC;
  if(state.round<=1)return false;
  const target=selectWithoutRepeat(options);
  switchMusic(target);
  return target;
 }
 function switchMusic(to){
  if(!MUSIC_TRACK_SET.has(to)||musicKind===to)return false;
  musicKind=to;
  musicHistory.push(to);if(musicHistory.length>30)musicHistory.shift();
  const old=musicAudio;
  const next=new Audio(base+to+'.ogg');
  next.preload='auto';next.loop=true;
  if(!enabled||!requested){
   old?.pause();fadingMusic?.pause();fadingMusic=null;
   fadeRatio=1;musicAudio=next;musicAttemptInFlight=false;
   updateMusicVolume();return true;
  }
  const token=++musicTransitionToken;
  next.volume=0;
  let started=null;
  try{started=next.play()}catch(e){counters.errors++;log('music-transition-error',String(e));return false}
  Promise.resolve(started).then(()=>{
    if(token!==musicTransitionToken||!requested){next.pause();return}
    fadingMusic?.pause();
    fadingMusic=old;
    musicAudio=next;fadeRatio=0;lastMusicChangeAt=performance.now();
    counters.musicStart++;log('music-transition',to);
    const duration=1400;
    const tick=()=>{
      if(token!==musicTransitionToken||!requested)return;
      fadeRatio=clamp((performance.now()-lastMusicChangeAt)/duration);
      updateMusicVolume();
      if(fadeRatio<1)requestAnimationFrame(tick);
      else{fadingMusic?.pause();fadingMusic=null}
    };
    requestAnimationFrame(tick);
  }).catch(e=>{
    if(token!==musicTransitionToken)return;
    if(e?.name==='NotAllowedError'){
      // The next real game gesture can retry the selected song.
      musicAudio=next;old?.pause();fadeRatio=1;
      log('music-transition-deferred',to);
    }else if(e?.name!=='AbortError'){
      counters.errors++;log('music-transition-error',String(e));
    }
  });
  return true;
 }
 function gameFinished(winner){
  voiceQueue=[];voiceAudio?.pause();voiceAudio=null;currentVoiceKey=null;
  musicDucked=false;musicAudio?.pause();fadingMusic?.pause();fadingMusic=null;
  playCue(winner==='draw'?'turn':winner==='player'?'win':'lose');
  if(winner!=='draw')playCue('stadium_cheer');
  log('finished',winner);
 }
 function status(){return {provider:VOICE_MODEL,enabled,requested,
  activationPending:requested&&!enabled,assetsReady,
  audioContextState:ctx?.state||'none',
  pendingCues:pendingCues.length,pendingVoices:pendingVoices.length,
  musicKind,musicDucked,musicTracks:[...MUSIC_TRACKS],
  musicHistory:[...musicHistory],voiceVariantHistory:[...voiceVariantHistory],
  voicePlaying:!!voiceAudio,currentVoiceKey,
  voiceQueue:voiceQueue.map(x=>x.id+':'+x.kind),decodedCues:decoded.size,voiceClipCount:Object.keys(voiceManifest.clips||{}).length,
  volume:{...volume},counters:{...counters},events:[...debugEvents]}}
 return {prepare,unlock,turnOn,stop,setVolume,playCue,playCharacter,switchMusic,setOpeningMusic,musicForBattle,gameFinished,status};
}
