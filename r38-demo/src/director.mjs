/**
 * Original animation director: visible, skippable, deterministic acting CUES.
 *
 * Rules are already resolved by core.mjs. No fake damage/summons, no video
 * downloads, and no third-party images. Production art is only loaded from
 * the approved asset registry. Optional browser speech is a temporary
 * accessibility preview, NOT expressive studio/Qwen audio.
 */
import {VOICE_PROFILES,describeReaction} from './performance.mjs';
import {appendApprovedArtwork} from './art-runtime.mjs';
import {compileLive3DExchange,compile3DDemoR14} from './live-3d-bridge-r14.mjs';

export function createPerformanceDirector({documentRef=document,win=globalThis,onEvent=()=>{}}={}){
  const el=id=>documentRef.getElementById(id);
  const stage=el('performance-stage');
  const controls={skip:el('performance-skip'),voice:el('performance-voice'),speed:el('performance-speed')};
  let queue=[],scene=null,beatIndex=-1,timer=null,voiceEnabled=false,fast=false,epoch=0;
  let live3DEnabled=true,liveFrame=null,liveListener=null;
  let stagePortalHome=null,stagePortalNext=null;
  const speech=()=>win.speechSynthesis;
  function stopVoice(){
    const synth=speech();
    try{synth?.cancel?.();}catch{} // OS/browser voices may be unavailable
  }
  function cancelTime(){if(timer!==null){win.clearTimeout(timer);timer=null;}}
  function restore3DPortal(){
    if(stagePortalHome){
      if(stagePortalNext?.parentNode===stagePortalHome)
        stagePortalHome.insertBefore(stage,stagePortalNext);
      else stagePortalHome.append(stage);
      stagePortalHome=null;stagePortalNext=null;
    }
  }
  function stop3D(){
    if(liveListener&&win.removeEventListener)win.removeEventListener('message',liveListener);
    liveListener=null;
    if(liveFrame?.remove)liveFrame.remove();
    liveFrame=null;
    const slot=el('performance-3d-slot');
    if(slot){slot.hidden=true;if(slot.replaceChildren)slot.replaceChildren();}
    stage.dataset.live3d='off';
    restore3DPortal();
  }
  function start3D(payload){
    const slot=el('performance-3d-slot');
    if(!slot||!win.location?.origin||!win.addEventListener)return false;
    stopVoice();stop3D();
    // Only during 3D performance: detach from the transformed arena
    // containing block so CSS fixed positioning truly fills the viewport.
    if(documentRef.body?.append&&stage.parentNode){
      stagePortalHome=stage.parentNode;
      stagePortalNext=stage.nextSibling;
      documentRef.body.append(stage);
    }
    stage.hidden=false;
    stage.dataset.phase='live-3d';
    stage.dataset.live3d='loading';
    stage.dataset.reaction=payload.mode==='demo'?'demonstration':'live-exchange';
    el('performance-heading').textContent=payload.mode==='demo'?
      'E01 × G01 · 原创3D骨骼示范':'实时战斗 · 原创3D角色交锋';
    el('performance-count').textContent='3D / 真实GLB';
    el('performance-speaker').textContent='动作导演';
    el('performance-dialogue').textContent=payload.mode==='demo'?
      '独立规则引擎生成的示范，不属于当前对局。':
      '本回合伤害 '+payload.event.damage+' · 格挡 '+payload.event.blocked+
        ' · 反击 '+payload.event.retaliation+'（来自真实对局）';
    el('performance-lane').textContent=payload.mode==='demo'?'研发演示':
      ['教室','走廊','操场'][payload.event.lane];
    el('performance-prototype').hidden=false;
    el('performance-prototype').textContent='实际GLB · 美术未验收 · 不会自动播放配音';
    const frame=documentRef.createElement('iframe');
    frame.setAttribute('title','E01与G01原创3D骨骼战斗预览（未通过美术验收）');
    frame.setAttribute('aria-label','游戏规则事件驱动的原创3D战斗');
    frame.setAttribute('loading','eager');
    frame.setAttribute('referrerpolicy','no-referrer');
    frame.src=new URL('../r14-3d/labs/duel-motion-r01/index.html?embedLiveR14=on&soleR13=on&fightFXR14=on&cameraR09=on&cameraSafetyR13=on&campusGymR07=on&lookR10=on&lightR11=on',win.location.href).href;
    slot.hidden=false;slot.append(frame);liveFrame=frame;
    const thisEpoch=epoch;
    liveListener=event=>{
      if(event.source!==frame.contentWindow||event.origin!==win.location.origin||
         thisEpoch!==epoch)return;
      if(event.data?.type==='ASDC_R14_3D_READY'){
        frame.contentWindow?.postMessage(payload,win.location.origin);
      }else if(event.data?.type==='ASDC_R14_3D_ACCEPTED'&&
         event.data.mode===payload.mode&&event.data.artApproved===false){
        cancelTime();
        stage.dataset.live3d='playing';
        onEvent('real_glb_stage_started',{mode:payload.mode,
          serial:payload.event?.serial??null,approvedArt:false});
        timer=win.setTimeout(()=>{
          if(epoch!==thisEpoch)return;
          closeScene();startNext();
        },7800);
      }
    };
    win.addEventListener('message',liveListener);
    // Fail closed. An unsupported GPU never becomes a false successful film.
    timer=win.setTimeout(()=>{
      if(epoch!==thisEpoch||stage.dataset.live3d==='playing')return;
      onEvent('real_glb_stage_unavailable',{mode:payload.mode});
      closeScene();startNext();
    },12000);
    return true;
  }

  function closeScene(){
    cancelTime();stopVoice();stop3D();scene=null;beatIndex=-1;stage.hidden=true;
    stage.dataset.phase='off';stage.dataset.motion='none';stage.dataset.reaction='none';
  }
  function reset(){epoch++;queue=[];closeScene();}
  function say(beat){
    if(!voiceEnabled||typeof win.SpeechSynthesisUtterance!=='function')return;
    const synth=speech();
    if(!synth?.speak)return;
    try{
      stopVoice();
      const phrase=new win.SpeechSynthesisUtterance(beat.line);
      const voice=VOICE_PROFILES[beat.voice]||VOICE_PROFILES.narrator;
      phrase.lang='zh-CN';phrase.rate=voice.rate;phrase.pitch=voice.pitch;
      phrase.volume=.8;
      // Explicit opt-in: no generated or cloned sound and no network request.
      synth.speak(phrase);
    }catch{ /* keep visual/subtitle version even if platform speech fails */ }
  }
  function prepareOpponentReaction(){
    const reaction=describeReaction(scene);
    const target=el('performance-target');
    stage.dataset.reaction=reaction.kind;
    target.dataset.reaction=reaction.kind;
    const styles={ember:'✦',grove:'◆',tide:'◈'};
    el('performance-opponent-glyph').textContent=styles[scene.target_style]||(scene.effect==='direct_hit'?'♥':'◉');
    el('performance-hit-value').textContent=reaction.primary;
    el('performance-shield').textContent=reaction.secondary;
    el('performance-target').setAttribute('aria-label',
      (reaction.target||'战线')+' · '+reaction.primary+' '+reaction.secondary);
    el('performance-projectile').textContent=scene.effect?.startsWith('chalk')?'▰':
      scene.effect?.startsWith('broadcast')?'≋':scene.effect?.startsWith('poster')?'▱':
      ['exchange','direct_hit'].includes(scene.effect)?'✦':'';
  }
  function writeBeat(beat){
    stage.hidden=false;
    stage.dataset.phase=beat.phase;
    stage.dataset.motion=beat.motion;
    stage.dataset.effect=scene.effect||'none';
    stage.dataset.targetDefeated=String(scene.target_defeated===true);
    stage.dataset.hasTarget=String(!!scene.target_card_id);
    if(beat.phase==='counter'){
      stage.dataset.reaction='counter';
      el('performance-hit-value').textContent='↶ −'+scene.retaliation;
      el('performance-shield').textContent=scene.retaliation_blocked?'格挡 '+scene.retaliation_blocked:'真实反击';
    }
    stage.dataset.side=scene.side;
    el('performance-heading').textContent=beat.caption;
    el('performance-speaker').textContent=beat.speaker;
    el('performance-dialogue').textContent=beat.line;
    el('performance-count').textContent=(beatIndex+1)+' / '+scene.beats.length;
    el('performance-role').textContent=scene.actor_name;
    el('performance-lane').textContent=['教室','走廊','操场'][scene.lane];
    const art=el('performance-art');
    art.replaceChildren();
    if(!appendApprovedArtwork(art,'portrait:campus:'+scene.actor_id,'','performance-art-image')){
      const glyph=documentRef.createElement('span');
      glyph.className='performance-art-placeholder';
      glyph.textContent=scene.actor_id.slice(0,1)==='E'?'✦':scene.actor_id.slice(0,1)==='G'?'◆':'◈';
      art.append(glyph);
      el('performance-prototype').hidden=false;
    }else el('performance-prototype').hidden=true;
    say(beat);
  }
  function step(){
    if(!scene)return;
    cancelTime();
    beatIndex++;
    if(beatIndex>=scene.beats.length){
      closeScene();
      startNext();
      return;
    }
    const beat=scene.beats[beatIndex];
    writeBeat(beat);
    const reduce=win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
    const duration=reduce?150:Math.round(beat.duration_ms*(fast?.47:1));
    const runEpoch=epoch;
    timer=win.setTimeout(()=>{
      if(runEpoch!==epoch)return;
      step();
    },duration);
  }
  function startNext(){
    if(scene||queue.length===0)return;
    scene=queue.shift();
    beatIndex=-1;
    if(!scene._r14Demo)prepareOpponentReaction();
    onEvent('performance_started',{actor:scene.actor_id,effect:scene.effect});
    const payload=scene._r14Demo?compile3DDemoR14():
      live3DEnabled?compileLive3DExchange(scene):null;
    if(payload&&start3D(payload))return;
    step();
  }
  function enqueue(scenes){
    if(!Array.isArray(scenes))return;
    const fresh=scenes.filter(item=>item&&Array.isArray(item.beats));
    // Full-performance for each player play; one brief AI highlight at a
    // time avoids swamping the player with six back-to-back opponent clips.
    const forPlayer=fresh.filter(item=>item.side==='player');
    const aiHighlight=fresh.find(item=>item.side==='ai'&&(item.tier==='major'||item.kind==='exchange'||item.kind==='direct'));
    queue.push(...forPlayer,...(aiHighlight?[aiHighlight]:[]));
    if(queue.length>5)queue=queue.slice(-5);
    startNext();
  }
  function skip(){
    if(!scene)return;
    onEvent('performance_skipped',{actor:scene.actor_id,effect:scene.effect});
    epoch++;queue=[];closeScene();
  }
  function show3DDemoR14(){
    if(scene)return false;
    reset();
    live3DEnabled=true;
    enqueue([{
      _r14Demo:true,actor_id:'E01',actor_name:'铃声追不上',
      target_card_id:'G01',kind:'demo',effect:'none',
      side:'player',lane:1,
      beats:[{phase:'entrance',motion:'demo',speaker:'动作导演',
        caption:'独立研发GLB演示',line:'非当前对局',duration_ms:7800}]
    }]);
    return true;
  }
  const browserSpeechSupported=typeof win.SpeechSynthesisUtterance==='function'&&typeof speech()?.speak==='function';
  if(!browserSpeechSupported){
    controls.voice.disabled=true;
    controls.voice.textContent='试音：此设备不支持';
  }
  function toggleVoice(){
    if(!browserSpeechSupported)return;
    voiceEnabled=!voiceEnabled;
    controls.voice.textContent=voiceEnabled?'试音：已开':'试音：关闭';
    controls.voice.setAttribute('aria-pressed',String(voiceEnabled));
    if(!voiceEnabled)stopVoice();
    onEvent('performance_voice_toggled',{enabled:voiceEnabled});
  }
  function toggleSpeed(){
    fast=!fast;
    controls.speed.textContent=fast?'演出：快速':'演出：完整';
    controls.speed.setAttribute('aria-pressed',String(fast));
    onEvent('performance_speed_toggled',{fast});
  }
  controls.skip.addEventListener('click',skip);
  controls.voice.addEventListener('click',toggleVoice);
  controls.speed.addEventListener('click',toggleSpeed);
  stage.hidden=true;
  return {
    enqueue,reset,skip,
    get busy(){return scene!==null;},
    get voiceEnabled(){return voiceEnabled;},
    get fast(){return fast;},
    get queued(){return queue.length;},
    setLive3DEnabled(on){live3DEnabled=on===true;return live3DEnabled;},
    show3DDemoR14,
    get live3DEnabled(){return live3DEnabled;},
    get live3DStatus(){return stage.dataset.live3d??'off';}
  };
}
