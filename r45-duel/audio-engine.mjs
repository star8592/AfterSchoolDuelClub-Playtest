/** R70 independent sound layer. Music/Foley are original locally authored assets.
 * Character VO is only emitted by pre-rendered Qwen3-TTS files: no browser TTS,
 * IndexTTS, copied movie voices, or runtime synthesis fallback.
 * Completely presentation-only: cannot mutate the rules engine/HP.
 */
import {GUIDED_LINES} from './guided-tutorial.mjs';
const SOUNDS=Object.freeze({
 select:'select.ogg',cast:'cast.ogg',enemy_cast:'enemy_cast.ogg',
 turn:'turn.ogg',attack:'attack.ogg',hit:'hit.ogg',
 heal:'heal.ogg',win:'win.ogg',lose:'lose.ogg',
 card_flip:'card_flip.ogg',spell_charge:'spell_charge.ogg',
 meteor_impact:'meteor_impact.ogg',sonic_wave:'sonic_wave.ogg',
 ice_shatter:'ice_shatter.ogg',stadium_cheer:'stadium_cheer.ogg',
 score_chime:'score_chime.ogg',shield_block:'shield_block.ogg',
 // R121: independent original, synthesized elemental contact Foley.
 r121_metal:'r121_metal.ogg',
 r121_wood:'r121_wood.ogg',
 r121_water:'r121_water.ogg',
 r121_fire:'r121_fire.ogg',
 r121_earth:'r121_earth.ogg',
 r121_electric:'r121_electric.ogg',
 r121_wind:'r121_wind.ogg',
 r121_ice:'r121_ice.ogg',
 r121_light:'r121_light.ogg',
 r121_shadow:'r121_shadow.ogg',
 r121_time:'r121_time.ogg',
 r121_space:'r121_space.ogg',
 r121_mind:'r121_mind.ogg',
 r121_sound:'r121_sound.ogg',
 r121_absurd:'r121_absurd.ogg',

 r102_school_bell:'r102_school_bell.ogg',
 r102_chalk_swoosh:'r102_chalk_swoosh.ogg',
 r102_chalk_snap:'r102_chalk_snap.ogg',
 r102_paper_flap:'r102_paper_flap.ogg',
 r102_poster_unfurl:'r102_poster_unfurl.ogg',
 r102_stamp_pop:'r102_stamp_pop.ogg',
 r102_radio_tune:'r102_radio_tune.ogg',
 r102_radio_glitch:'r102_radio_glitch.ogg',
 r102_spring_boing:'r102_spring_boing.ogg',
 r102_comedy_whistle:'r102_comedy_whistle.ogg',
 r102_magic_tingle:'r102_magic_tingle.ogg',
 r102_confetti_pop:'r102_confetti_pop.ogg',
 r102_school_steps:'r102_school_steps.ogg',
 r102_music_gliss:'r102_music_gliss.ogg',
 r102_erase_scribble:'r102_erase_scribble.ogg',
 r102_hearts_pulse:'r102_hearts_pulse.ogg',
 r102_shield_chime:'r102_shield_chime.ogg',
 r102_crowd_gasp:'r102_crowd_gasp.ogg',
 r102_score_trumpet:'r102_score_trumpet.ogg',
 r102_rubber_squeak:'r102_rubber_squeak.ogg'
});
// R102 original, local, digitally authored school-comedy Foley.
 // Every set follows a genuine engine/card presentation event. Layers are
 // scheduled by the same WebAudio clock, never by a fragile 460ms timeout.
export const COMIC_BEATS=Object.freeze({
 'summon_ember':[['r102_school_steps',0,.95,.50],['r102_spring_boing',.08,1.06,.52]],
 'summon_grove':[['r102_erase_scribble',0,.90,.58],['r102_magic_tingle',.12,1.05,.36]],
 'summon_tide':[['r102_paper_flap',0,1,.54],['r102_music_gliss',.12,.96,.39]],
 'spell_buff':[['r102_comedy_whistle',0,1.08,.56],['r102_confetti_pop',.23,1.15,.32]],
 'spell_blast':[['r102_chalk_swoosh',0,.95,.58],['r102_chalk_snap',.23,.92,.7]],
 'spell_repair':[['r102_erase_scribble',0,.90,.46],['r102_stamp_pop',.19,1.02,.55]],
 'spell_draw':[['r102_paper_flap',0,1.0,.63],['r102_magic_tingle',.18,1.12,.35]],
 'spell_heal':[['r102_hearts_pulse',0,.92,.48],['r102_shield_chime',.15,1.12,.42]],
 'spell_confuse':[['r102_radio_tune',0,1.02,.55],['r102_radio_glitch',.17,.83,.50]],
 'spell_stew':[['r102_music_gliss',0,.81,.58],['r102_hearts_pulse',.12,1.12,.36]],
 'spell_shield':[['r102_poster_unfurl',0,1,.53],['r102_shield_chime',.2,1.04,.49]],
 'spell_splash':[['r102_magic_tingle',0,1.16,.56],['r102_chalk_snap',.18,.8,.47]],
 'spell_chaos':[['r102_radio_glitch',0,.81,.57],['r102_rubber_squeak',.20,1.23,.46]],
 'spell_banquet':[['r102_hearts_pulse',0,.94,.54],['r102_confetti_pop',.22,1.08,.51]],
 'spell_insight':[['r102_paper_flap',0,1.12,.52],['r102_magic_tingle',.12,1.21,.42]],
 'spell_updraft':[['r102_spring_boing',0,1.08,.53],['r102_shield_chime',.14,1.12,.41]],
 'spell_reroute':[['r102_paper_flap',0,.78,.53],['r102_comedy_whistle',.20,1.09,.42]],
 'spell_boomerang':[['r102_rubber_squeak',0,.85,.60],['r102_stamp_pop',.18,1.08,.38]],
 'spell_eclipse':[['r102_radio_tune',0,.8,.47],['r102_chalk_swoosh',.16,.94,.58]],
 'spell_trick':[['r102_comedy_whistle',0,.98,.55],['r102_stamp_pop',.20,1.21,.49]],
 'combo_chalk_hit':[['r102_chalk_swoosh',0,1,.68],['r102_chalk_snap',.065,1.03,.70],['r102_crowd_gasp',.17,.88,.33]],
 'combo_chalk_direct':[['r102_comedy_whistle',0,1.1,.55],['r102_chalk_snap',.1,1.06,.72]],
 'combo_broadcast_draw':[['r102_radio_tune',0,1.02,.70],['r102_radio_glitch',.10,1,.40],['r102_school_bell',.24,1.12,.36]],
 'combo_poster_shield':[['r102_poster_unfurl',0,.98,.60],['r102_stamp_pop',.11,.90,.52],['r102_shield_chime',.20,.92,.47]],
 'combo_poster_draw':[['r102_paper_flap',0,1,.51],['r102_magic_tingle',.14,1.04,.48]],
 'direct_hit':[['r102_score_trumpet',0,.93,.48],['r102_crowd_gasp',.19,1.08,.32]],
 'actual_exchange':[['r102_school_steps',0,1.13,.38],['r102_rubber_squeak',.15,.88,.30]],
 'game_finish':[['r102_score_trumpet',0,1,.54],['r102_confetti_pop',.25,1,.51]]
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

export function createDuelAudio({onVoiceLine,onVoiceStop}={}){
 let requested=savedSoundIntent(),enabled=false,ctx=null,decoded=new Map(),

  voiceManifest={clips:{}},paManifest={clips:{}},tutorialManifest={clips:{}},crowdManifest={clips:{}},propPAManifest={clips:{}},teacherManifest={clips:{}},voiceAudio=null,crowdAudio=null;
 let crowdVoicePlays=0,lastCrowdVoice=null,teacherVoiceQueued=0,lastTeacherOrderAt=-Infinity;
 let pendingBleacherPA=null,pendingCrowdYelp=null,pendingTeacherOrder=null,bleacherEpoch=0;
 let lastPAAt=-Infinity,lastPropPAAt=-Infinity,propPAPlays=0,finaleVoiceGuard=false;

 let assetsLoading=null,assetsReady=false,musicAttemptInFlight=false;
 const pendingCues=[],pendingVoices=[];

 let musicAudio=null,musicKind='school_duel_theme',musicDucked=false;
 let fadingMusic=null,fadeRatio=1,musicTransitionToken=0;
 let musicCycle=0,openingSeed=0,lastBattleMusicKey='',lastMusicChangeAt=-Infinity;
 const musicHistory=[],voiceVariantHistory=[],variantBags=new Map(),lastVoiceVariant=new Map(),recentVariants=new Map();
 const speechHistory=[],comicBeatHistory=[];
 let lastSpoken=null;

 let activeSfx=0,voiceQueue=[],currentVoiceKey=null,voiceSerial=0;
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
 async function loadPAManifest(){
  try{
   const response=await fetch(base+'pa/announcer-manifest.json',{cache:'no-cache'});
   if(!response.ok)throw Error('PA manifest HTTP '+response.status);
   const json=await response.json();
   if(json.provider!=='Qwen3-TTS'||!json.clips||
      Object.values(json.clips).some(c=>!c||!c.ready||
        !/^r113_[a-z_]+\.ogg$/.test(c.file)||typeof c.text!=='string'||
        c.text.length>120||!c.sha256))throw Error('Invalid R113 Qwen PA provenance');
   paManifest=json;
  }catch(e){counters.errors++;log('pa-manifest-error',String(e))}
 }

 async function loadTutorialManifest(){
  try{
   const response=await fetch(base+'tutorial/tutorial-manifest.json',{cache:'no-cache'});
   if(!response.ok)throw Error('Guided tutorial manifest HTTP '+response.status);
   const json=await response.json();
   if(json.provider!=='Qwen3-TTS'||!json.clips||
      Object.keys(GUIDED_LINES).some(key=>{
       const meta=json.clips[key],line=GUIDED_LINES[key];
       return !meta?.ready||meta.text!==line.text||meta.side!==line.side||
        meta.speaker!==(line.side==='player'?'serena':'dylan')||
        !new RegExp('^r120_'+key+'\\.ogg$').test(meta.file)||
        !/^[a-f0-9]{64}$/.test(meta.sha256)||!(meta.duration_seconds>.6);
      }))throw Error('Invalid or mismatched R120 original Qwen tutorial voice evidence');
   tutorialManifest=json;
  }catch(e){counters.errors++;log('tutorial-manifest-error',String(e))}
 }

 async function loadCrowdManifest(){
  try{
   const response=await fetch(base+'crowd/crowd-manifest.json',{cache:'no-cache'});
   if(!response.ok)throw Error('Crowd voice manifest HTTP '+response.status);
   const json=await response.json(),clips=json.clips||{};
   const scenarios=['ricochet','overshoot','shockwave','misfire'];
   if(json.provider!=='Qwen3-TTS'||Object.keys(clips).length!==8||
      scenarios.some(k=>!['a','b'].every(v=>{
       const meta=clips[k+'_'+v];
       return meta&&meta.scenario===k&&meta.ready&&
        meta.file==='r122_'+k+'_'+v+'.ogg'&&
        typeof meta.text==='string'&&meta.text.length<=70&&
        /^[a-f0-9]{64}$/.test(meta.sha256)&&
        meta.duration_seconds>.3&&meta.duration_seconds<10;
      })))throw Error('Invalid R122 original Qwen crowd-voice provenance');
   crowdManifest=json;
  }catch(e){counters.errors++;log('crowd-manifest-error',String(e))}
 }
 async function loadPropPAManifest(){
  try{
   const response=await fetch(base+'crowd/r123-prop-pa-manifest.json',{cache:'no-cache'});
   if(!response.ok)throw Error('R123 prop PA HTTP '+response.status);
   const json=await response.json(),clips=json.clips||{};
   const kinds=['popcorn','juice','homework','backpack'];
   if(json.provider!=='Qwen3-TTS'||Object.keys(clips).length!==4||
     kinds.some(k=>{
       const c=clips[k];return !c?.ready||c.file!=='r123_pa_'+k+'.ogg'||
       c.speaker!=='ryan'||typeof c.text!=='string'||c.text.length>120||
       !/^[a-f0-9]{64}$/.test(c.sha256)||!(c.duration_seconds>.6&&c.duration_seconds<14);
     }))throw Error('Invalid R123 original announcer recordings');
   propPAManifest=json;
  }catch(e){counters.errors++;log('prop-pa-manifest-error',String(e))}

 }
 async function loadTeacherManifest(){
  try{
   const response=await fetch(base+'crowd/r125-teacher-manifest.json',{cache:'no-cache'});
   if(!response.ok)throw Error('R125 teacher voice HTTP '+response.status);
   const json=await response.json();
   if(json.provider!=='Qwen3-TTS'||json.actor!=='M01'||
    Object.keys(json.clips||{}).sort().join(',')!=='order,paper'||
    ['order','paper'].some(kind=>{
     const c=json.clips[kind];
     return !c?.ready||c.file!=='r125_teacher_'+kind+'.ogg'||
      c.speaker!=='serena'||!c.text||c.text.length>120||
      !/^[a-f0-9]{64}$/.test(c.sha256)||
      !(c.duration_seconds>.6&&c.duration_seconds<14);
    }))throw Error('Invalid local M01 Qwen teacher provenance');
   teacherManifest=json;
  }catch(e){counters.errors++;log('teacher-manifest-error',String(e))}
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

  assetsLoading=Promise.all([loadManifest(),loadPAManifest(),loadTutorialManifest(),loadCrowdManifest(),loadPropPAManifest(),loadTeacherManifest(),preloadCues()]).then(()=>{

    assetsReady=true;flushPending();
    log('prepared','sound files ready; playback follows browser policy');
    return true;
  });
  return assetsLoading;
 }
 function flushPending(){
  if(!requested||!enabled)return;
  for(const item of pendingCues.splice(0,8))
    playCue(item.key,item.side,item.options);
  if(voiceManifest.clips){
    for(const item of pendingVoices.splice(0,3))
      playCharacter(item.id,item.kind);
  }
  // First player interaction can precede downloaded Qwen manifests on public
  // GitHub Pages. Deliver the incident only if the SAME match is still live.
  if(assetsReady){
   const yell=pendingCrowdYelp;pendingCrowdYelp=null;
   if(yell?.epoch===bleacherEpoch&&performance.now()-yell.at<9000)
    playCrowdYelp(yell.scenario,yell.index,yell.serial);
   // Replay a pending teacher BEFORE the PA once real assets are ready.
   const teacher=pendingTeacherOrder;pendingTeacherOrder=null;
   if(teacher?.epoch===bleacherEpoch&&performance.now()-teacher.at<16000)
    playTeacherOrder(teacher.kind);
   const pa=pendingBleacherPA;pendingBleacherPA=null;
   if(pa?.epoch===bleacherEpoch&&performance.now()-pa.at<16000)
    playPropPA(pa.kind);
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
  pendingBleacherPA=null;pendingCrowdYelp=null;pendingTeacherOrder=null;bleacherEpoch++;
  requested=false;
  try{localStorage.setItem(SOUND_INTENT_KEY,'off')}catch{}
  enabled=false;
  pendingCues.length=0;pendingVoices.length=0;
  musicAudio?.pause();fadingMusic?.pause();fadingMusic=null;fadeRatio=1;musicTransitionToken++;
  voiceQueue=[];voiceAudio?.pause();voiceAudio=null;currentVoiceKey=null;
  crowdAudio?.pause();crowdAudio=null;
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
  if(channel==='voice'&&crowdAudio)crowdAudio.volume=volume.voice*.76;
  log('volume',channel+':'+volume[channel]);
 }
 function playCue(key,side='center',{rate=1,delay=0,gainScale=1}={}){
  if(!requested||!SOUNDS[key]||volume.sfx===0)return false;
  if(!enabled||!ctx||!decoded.has(key)){
    if(pendingCues.length<8)pendingCues.push({key,side,options:{rate,delay,gainScale}});
    return true;
  }
  try{
   const source=ctx.createBufferSource(),gain=ctx.createGain();
   source.buffer=decoded.get(key);
   const simultaneous=activeSfx>=5;
   const level=volume.sfx*(simultaneous?.25:.57)*
    Math.max(0,Math.min(1.1,Number(gainScale)||0));
   gain.gain.value=level;
   source.playbackRate.value=Math.max(.65,Math.min(1.55,Number(rate)||1));
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
   source.start(ctx.currentTime+Math.max(0,Math.min(.48,Number(delay)||0)));
   counters.cue++;log('cue',key+':'+side);return true;
  }catch(e){counters.errors++;log('cue-play-error',String(e));return false}
 }
 // Musical layers share the audio-clock: repeated cards vary pitch gently,
 // with an authored limit of three sound instances, preserving mix headroom.
 function playComicBeat(type,side='center',serial=1){
  const pattern=COMIC_BEATS[type];
  if(!pattern||!requested||volume.sfx<=0)return false;
  const n=Number.isInteger(serial)&&serial>0?serial:1;
  const pitch=1+((n%7)-3)*.016;
  let count=0;
  for(const [key,delay,rate,gainScale] of pattern){
   if(playCue(key,side,{rate:rate*pitch,delay,gainScale}))count++;
  }
  if(count){
   comicBeatHistory.push({type,side,serial:n,layers:count});
   if(comicBeatHistory.length>60)comicBeatHistory.shift();
  }
  return count>0;
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
  // No auditorium PA over a real student's scream. Voice playback resumes
  // from the actual crowd audio 'ended' event, not a fragile timer.
  if(voiceQueue[0]?.source==='bleacher'&&crowdAudio&&!crowdAudio.ended)return;
  const {id,kind,file,variant,text,duration_seconds,source='actor'}=voiceQueue.shift();

  const a=new Audio(base+(source==='pa'?'pa/':source==='tutorial'?'tutorial/':source==='bleacher'?'crowd/':'voices/')+file+'?mix=r124');

  voiceAudio=a;currentVoiceKey=id+':'+kind;
  const serial=++voiceSerial;
  let speechActuallyStarted=false,speechStopNotified=false;
  const signalStop=reason=>{
   if(!speechActuallyStarted||speechStopNotified)return;
   speechStopNotified=true;
   if(typeof onVoiceStop==='function')try{
    onVoiceStop({id,kind,serial,reason});
   }catch(e){log('voice-stop-callback-error',String(e))}
  };
  a.volume=volume.voice;a.preload='auto';
  log('voice-variant',id+':'+kind+'='+variant);
  a.addEventListener('pause',()=>signalStop('pause'));
  a.addEventListener('ended',()=>signalStop('ended'));
  a.addEventListener('error',()=>signalStop('error'));
  musicDucked=true;updateMusicVolume();
  const done=()=>{
   signalStop('finished');
   if(voiceAudio!==a)return;
   voiceAudio=null;currentVoiceKey=null;
   if(enabled&&voiceQueue.length)playQueuedVoice();
   else{musicDucked=false;updateMusicVolume()}
  };
  a.addEventListener('ended',done,{once:true});
  a.addEventListener('error',()=>{counters.errors++;done()},{once:true});
  try{
   a.play().then(()=>{
    if(voiceAudio===a){
     speechActuallyStarted=true;
     counters.voice++;log('voice',id+':'+kind);
     lastSpoken={id,kind,variant,text,duration_seconds,serial};
     speechHistory.push(lastSpoken);
     if(speechHistory.length>60)speechHistory.shift();
     if(typeof onVoiceLine==='function'&&typeof text==='string')
      try{onVoiceLine({...lastSpoken})}catch(e){log('subtitle-error',String(e))}
    }
   }).catch(e=>{
    // Expected AbortError when an attack intentionally preempts an entrance.
    if(voiceAudio!==a)return;
    counters.errors++;log('voice-play-error',String(e));done();
   });
  }catch(e){counters.errors++;log('voice-init-error',String(e));done()}
 }
 function playCharacter(id,kind='enter'){
  // Delayed impact callbacks from the last strike must never steal the
  // microphone from the real winner announcement.
  if(finaleVoiceGuard||!requested||volume.voice===0)return false;
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
  const item={id,kind,file:clip.file,variant:clip.variant,text:clip.text,duration_seconds:clip.duration_seconds};
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
 // Stadium PA is a real offline Qwen3 Opus recording; never browser TTS.
 // A named exact text mapping is essential for truthful subtitles and
 // avoiding a speaker's voice coming from the wrong character.
 function playPA(key){
  const meta=paManifest.clips?.[key],now=performance.now();
  if(!requested||!enabled||!assetsReady||volume.voice===0||
     !meta?.ready||meta.kind!=='stadium')return false;
  if(now-lastPAAt<4500&&!key.startsWith('win_')&&key!=='draw')return false;
  if(voiceAudio&&!key.startsWith('win_')&&key!=='draw')return false;
  lastPAAt=now;
  if(voiceAudio){voiceAudio.pause();voiceAudio=null;currentVoiceKey=null;counters.voiceInterrupted++}
  voiceQueue=voiceQueue.filter(x=>x.source!=='pa');
  voiceQueue.unshift({id:'STADIUM_PA',kind:key,source:'pa',
   file:meta.file,variant:key,text:meta.text,duration_seconds:meta.duration_seconds});
  playQueuedVoice();
  return true;
 }
 function playTeacherOrder(kind='order'){
  const key=kind==='paper'?'paper':'order';
  const meta=teacherManifest.clips?.[key],now=performance.now();
  if(!requested||finaleVoiceGuard||volume.voice===0)return false;
  if(!enabled||!assetsReady){
   pendingTeacherOrder={kind:key,at:now,epoch:bleacherEpoch};
   void prepare().catch(e=>log('teacher-prepare-error',String(e)));
   return true;
  }
  if(!meta?.ready||now-lastTeacherOrderAt<6500||voiceQueue.length>=6)return false;
  lastTeacherOrderAt=now;
  voiceQueue.push({id:'M01',kind:'teacher_'+key,source:'bleacher',
   file:meta.file,variant:key,text:meta.text,duration_seconds:meta.duration_seconds});
  if(!voiceAudio)playQueuedVoice();
  teacherVoiceQueued++;
  return true;
 }
 function playPropPA(kind){
  const now=performance.now();
  if(!['popcorn','juice','homework','backpack'].includes(kind)||
   !requested||finaleVoiceGuard||volume.voice===0)return false;
  if(!enabled||!assetsReady){
   pendingBleacherPA={kind,at:now,epoch:bleacherEpoch};
   void prepare().catch(e=>log('prop-pa-prepare-error',String(e)));
   return true;
  }
  const meta=propPAManifest.clips?.[kind];
  if(!meta?.ready||now-lastPropPAAt<7000||voiceQueue.length>=6)return false;
  // Unlike a match-winning PA, the comic announcement never interrupts
  // the duelist's spoken line. It joins the ordinary VO queue.
  lastPropPAAt=now;
  voiceQueue.push({id:'STADIUM_PA',kind:'prop_'+kind,source:'bleacher',
   file:meta.file,variant:kind,text:meta.text,
   duration_seconds:meta.duration_seconds});
  if(!voiceAudio)playQueuedVoice();
  propPAPlays++;
  return true;
 }
 function playCrowdYelp(scenario,index=0,serial=1){
  if(!requested||finaleVoiceGuard||volume.voice===0||
    !['ricochet','overshoot','shockwave','misfire'].includes(scenario)||
    !Number.isInteger(index)||index<0||index>=4)return false;
  if(!enabled||!assetsReady){
   pendingCrowdYelp={scenario,index,serial,at:performance.now(),epoch:bleacherEpoch};
   void prepare().catch(e=>log('crowd-prepare-error',String(e)));
   return true;
  }
  // Independent original Qwen voice lane. A spectator yelp must not cut off
  // the combatant's recorded speech or masquerade as spoken audience text.
  const variant=(serial+index)%2===0?'a':'b';
  const key=scenario+'_'+variant,meta=crowdManifest.clips?.[key];
  if(!meta?.ready)return false;
  if(crowdAudio){crowdAudio.pause();crowdAudio=null}
  const clip=new Audio(base+'crowd/'+meta.file);
  crowdAudio=clip;clip.preload='auto';clip.volume=volume.voice*.76;
  const done=()=>{if(crowdAudio===clip){crowdAudio=null;playQueuedVoice()}};
  clip.addEventListener('ended',done,{once:true});
  clip.addEventListener('error',()=>{counters.errors++;log('crowd-voice-file-error',key);done()},{once:true});
  try{
   clip.play().then(()=>{
    if(crowdAudio!==clip)return;
    crowdVoicePlays++;
    lastCrowdVoice={id:'SPECTATOR_'+index,kind:'accident',
     variant:key,text:meta.text,duration_seconds:meta.duration_seconds};
    speechHistory.push(lastCrowdVoice);
    if(speechHistory.length>60)speechHistory.shift();
    log('crowd-voice',key);
    if(typeof onVoiceLine==='function')
     try{onVoiceLine({...lastCrowdVoice})}catch(e){log('crowd-subtitle-error',String(e))}
   }).catch(e=>{
    if(crowdAudio!==clip)return;
    counters.errors++;log('crowd-voice-play-error',String(e));done();
   });
  }catch(e){counters.errors++;log('crowd-voice-init-error',String(e));done();return false}
  return true;
 }
 function playSocialLine(side,text){
  if(finaleVoiceGuard||!['player','ai'].includes(side)||!requested||!enabled||!assetsReady||
     !text||voiceAudio||voiceQueue.length||volume.voice===0)return false;
  const pair=Object.entries(paManifest.clips||{}).find(([key,c])=>
   c.kind==='social'&&key.endsWith('_'+side)&&c.text===text&&c.ready);
  if(!pair)return false;
  const [key,c]=pair;
  voiceQueue.push({id:side==='player'?'HOST_PLAYER':'HOST_AI',kind:'social',
    source:'pa',file:c.file,variant:key,text:c.text,duration_seconds:c.duration_seconds});
  playQueuedVoice();
  return true;
 }
 // The guided battle speaks *recorded Qwen3 female/male lines* with exact
 // transcript parity. It preempts unrelated battle barks to stay intelligible.
 // No browser voice emulation or remote runtime TTS fallback is used.
 function playTutorialLine(key){
  const clip=tutorialManifest.clips?.[key];
  if(!requested||!enabled||!assetsReady||volume.voice===0||
     !clip?.ready||!GUIDED_LINES[key]||clip.text!==GUIDED_LINES[key].text)return 0;
  if(!/^r120_[a-z0-9_]+\.ogg$/.test(clip.file))return 0;
  if(voiceAudio){voiceAudio.pause();voiceAudio=null;currentVoiceKey=null;counters.voiceInterrupted++;}
  voiceQueue=[];
  voiceQueue.push({id:clip.side==='player'?'HOST_PLAYER':'HOST_AI',kind:key,
   source:'tutorial',file:clip.file,variant:key,text:clip.text,
   duration_seconds:clip.duration_seconds});
  playQueuedVoice();
  return clip.duration_seconds;
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
 let finaleTimer=null;
 function resetMatch(){
  pendingBleacherPA=null;pendingCrowdYelp=null;pendingTeacherOrder=null;bleacherEpoch++;
  finaleVoiceGuard=false;lastPAAt=-Infinity;lastPropPAAt=-Infinity;lastTeacherOrderAt=-Infinity;
  if(finaleTimer!==null){clearTimeout(finaleTimer);finaleTimer=null;}
  voiceQueue=[];voiceAudio?.pause();voiceAudio=null;currentVoiceKey=null;
  crowdAudio?.pause();crowdAudio=null;
  musicDucked=false;updateMusicVolume();
 }
 function gameFinished(winner){
  pendingBleacherPA=null;pendingCrowdYelp=null;pendingTeacherOrder=null;bleacherEpoch++;
  finaleVoiceGuard=true;
  crowdAudio?.pause();crowdAudio=null;
  voiceQueue=[];voiceAudio?.pause();voiceAudio=null;currentVoiceKey=null;
  musicDucked=false;
  // Do not kill the auditorium soundtrack when the winning cast starts dancing.
  // Existing project-authored parade music is played for one short finale,
  // subject to the player's persistent mute and browser autoplay policy.
  const song=winner==='draw'?'mischief_shuffle':'campus_parade';
  if(requested&&enabled)switchMusic(song);
  if(finaleTimer!==null)clearTimeout(finaleTimer);
  finaleTimer=setTimeout(()=>{
   if(musicAudio){musicAudio.pause();musicAudio.currentTime=0;}
   fadingMusic?.pause();fadingMusic=null;
   log('finale-music-finished',song);
  },7200);
  playCue(winner==='draw'?'turn':winner==='player'?'win':'lose');
  if(winner!=='draw')playCue('stadium_cheer','center',{gainScale:.9});
  playCue('r102_score_trumpet','center',{gainScale:.45,delay:.22});
  log('finished',winner);
 }
 function status(){return {provider:VOICE_MODEL,enabled,requested,
  activationPending:requested&&!enabled,assetsReady,
  audioContextState:ctx?.state||'none',
  pendingCues:pendingCues.length,pendingVoices:pendingVoices.length,
  musicKind,musicDucked,musicTracks:[...MUSIC_TRACKS],
  paClipCount:Object.keys(paManifest.clips||{}).length,

  tutorialClipCount:Object.keys(tutorialManifest.clips||{}).length,

  propPAVoiceClips:Object.keys(propPAManifest.clips||{}).length,
  propPAPlays,teacherClipCount:Object.keys(teacherManifest.clips||{}).length,
  teacherVoiceQueued,bleacherDeferred:!!pendingBleacherPA||!!pendingCrowdYelp||!!pendingTeacherOrder,
  crowdVoiceClipCount:Object.keys(crowdManifest.clips||{}).length,
  crowdVoicePlays,lastCrowdVoice:lastCrowdVoice?{...lastCrowdVoice}:null,

  finaleVoiceGuard,
  musicHistory:[...musicHistory],voiceVariantHistory:[...voiceVariantHistory],
  lastSpoken:lastSpoken?{...lastSpoken}:null,speechHistory:[...speechHistory],comicBeatHistory:[...comicBeatHistory],
  voicePlaying:!!voiceAudio,currentVoiceKey,
  voiceQueue:voiceQueue.map(x=>x.id+':'+x.kind),decodedCues:decoded.size,voiceClipCount:Object.keys(voiceManifest.clips||{}).length,
  volume:{...volume},counters:{...counters},events:[...debugEvents]}}
 return {prepare,unlock,turnOn,stop,setVolume,playCue,playComicBeat,

  playCharacter,playPA,playSocialLine,playTutorialLine,playCrowdYelp,playPropPA,playTeacherOrder,switchMusic,setOpeningMusic,musicForBattle,resetMatch,gameFinished,status};

}
