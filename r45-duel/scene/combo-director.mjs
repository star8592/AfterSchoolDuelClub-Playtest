/**
 * R100 — 3D campus-comedy combo director, strictly presentational.
 *
 * The event is validated by combo-contract.mjs against the ACTUAL canonical
 * combo_effect emitted by engine.mjs. This module cannot mutate a card, HP,
 * energy, deck, winner or 3D actor. Its 3D props live in the existing stadium.
 * Three phases: tangible preparation -> movement -> rule-backed payoff.
 */
import {normalizeRealCombo,comboReceiptText} from './combo-contract.mjs';

export function createComboDirector(THREE,scene,{caption,skipButton}={}){
 const world=new THREE.Group();
 world.name='R100_REAL_COMBO_CINEMATICS';
 world.visible=false;
 scene.add(world);
 const gold='#ffe1a2',cyan='#95dbff',ink='#f3fbff',paper='#fcefc8';
 const matte=(color,opacity=1)=>new THREE.MeshStandardMaterial({
  color,roughness:.65,metalness:0,transparent:opacity<1,opacity,depthWrite:opacity>=1,
  side:THREE.DoubleSide});
 const shine=(color,opacity)=>new THREE.MeshBasicMaterial({
  color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,
  blending:THREE.AdditiveBlending});
 const put=(group,geo,mat,name,pos,rotation)=>{
  const mesh=new THREE.Mesh(geo,mat);
  mesh.name=name;
  if(pos)mesh.position.set(...pos);
  if(rotation)mesh.rotation.set(...rotation);
  group.add(mesh);
  return mesh;
 };
 const chalkGroup=new THREE.Group();chalkGroup.name='R100_CHALK_THROW_ACTUAL_3D';world.add(chalkGroup);
 const chalk=[];
 for(let i=0;i<3;i++){
  const stick=new THREE.Group();stick.name='R100_ChalkStick_'+i;
  const body=put(stick,new THREE.CylinderGeometry(.085,.092,.59,18),matte(ink),
   'white_school_chalk_rod',[0,0,0],[0,0,Math.PI/2]);
  const tip=put(stick,new THREE.CylinderGeometry(.09,.09,.036,18),matte(i===0?gold:i===1?cyan:'#f7b6c5'),
   'colored_chalk_tip',[.302,0,0],[0,0,Math.PI/2]);
  stick.userData={body,tip};
  chalkGroup.add(stick);chalk.push(stick);
 }
 const chalkImpact=new THREE.Group();
 chalkImpact.name='R100_REAL_CHALK_IMPACT';
 chalkGroup.add(chalkImpact);
 const chalkRings=[];
 for(let i=0;i<3;i++){
  const ring=put(chalkImpact,new THREE.TorusGeometry(.3+i*.16,.027,8,72),
   shine(i===1?cyan:gold,.6),'chalk_3d_impact_ring',[0,0,0]);
  chalkRings.push(ring);
 }
 const chalkDust=new THREE.Group();chalkImpact.add(chalkDust);
 for(let i=0;i<18;i++){
  const theta=i*2.39996323;
  const dot=put(chalkDust,new THREE.IcosahedronGeometry(.035+(i%4)*.008,0),
   matte(i%3===0?cyan:paper),'authored_chalk_fragment');
  dot.userData.theta=theta;dot.userData.radius=.2+(i%6)*.09;
 }
 const broadcast=new THREE.Group();broadcast.name='R100_REAL_BROADCAST_SPEAKERS';world.add(broadcast);
 const broadcastWaves=[];
 function addSpeaker(x){
  const box=new THREE.Group();box.position.set(x,1.15,.7);
  box.name='R100_3D_school_speaker';
  put(box,new THREE.BoxGeometry(.3,.46,.24),matte('#29374d'),'speaker_cabinet');
  const disk=put(box,new THREE.CylinderGeometry(.105,.105,.017,32),matte('#e8c27b'),
   'speaker_cone',[0,-.08,.127],[Math.PI/2,0,0]);
  put(box,new THREE.CylinderGeometry(.056,.056,.02,32),matte('#4a6d81'),
   'speaker_woofer_center',[0,-.08,.14],[Math.PI/2,0,0]);
  box.scale.setScalar(1.38);broadcast.add(box);return box;
 }
 const speakers=[addSpeaker(-.53),addSpeaker(.53)];
 for(let i=0;i<4;i++){
  const ring=put(broadcast,new THREE.TorusGeometry(.43,.018,8,90),
   shine(i%2===0?cyan:gold,.55),'true_broadcast_wave_'+i,
   [0,1.15,.93]);
  broadcastWaves.push(ring);
 }
 const dial=put(broadcast,new THREE.CylinderGeometry(.19,.19,.17,32),
  matte('#e5be79'),'broadcast_microphone',[0,1.58,.75],[Math.PI/2,0,0]);
 const stand=put(broadcast,new THREE.CylinderGeometry(.02,.025,.72,18),
  matte('#394658'),'broadcast_microphone_stand',[0,1.17,.75]);
 const poster=new THREE.Group();poster.name='R100_REAL_CLUB_RECRUITMENT_POSTER';world.add(poster);
 const posterFrame=put(poster,new THREE.BoxGeometry(1.50,.94,.045),matte('#b47c4e'),
  'three_dimensional_wooden_poster_frame');
 const posterPaper=put(poster,new THREE.PlaneGeometry(1.41,.85),matte('#f1e9c8'),
  'poster_paper_surface',[0,0,.027]);
 // Text is printed ON the real 3D paper surface, never an actor standee.
 const cvs=document.createElement('canvas');cvs.width=512;cvs.height=320;
 const ctx=cvs.getContext('2d');
 if(!ctx)throw Error('R100 poster drawing surface unavailable');
 ctx.fillStyle='#fff1cc';ctx.fillRect(0,0,512,320);
 ctx.fillStyle='#d7896e';ctx.fillRect(0,0,512,57);
 ctx.fillStyle='#213b54';ctx.textAlign='center';
 ctx.font='bold 105px sans-serif';ctx.fillText('社团招新',256,175);
 ctx.font='bold 39px sans-serif';ctx.fillText('一起出牌 · 一起发光',256,251);
 ctx.fillStyle='#e2ab6e';ctx.fillRect(30,277,452,8);
 const texture=new THREE.CanvasTexture(cvs);
 texture.colorSpace=THREE.SRGBColorSpace;
 const textPlane=put(poster,new THREE.PlaneGeometry(1.36,.81),
  new THREE.MeshBasicMaterial({map:texture,transparent:false,side:THREE.DoubleSide}),
  'poster_authorized_text_surface',[0,0,.032]);
 const shield=new THREE.Group();shield.name='R100_REAL_SHIELD_BUBBLE';world.add(shield);
 const dome=put(shield,new THREE.SphereGeometry(1.13,32,20,0,Math.PI*2,0,Math.PI),
  shine('#8ed9ff',.13),'three_dimensional_shield_sphere');
 const halo=put(shield,new THREE.TorusGeometry(.96,.025,8,80),
  shine(gold,.57),'actual_poster_shield_ring',[0,-.92,0],[Math.PI/2,0,0]);
 const flash=new THREE.PointLight('#a6eaff',0,4,2);world.add(flash);
 let playing=null,started=0,played=0,completed=0,skipped=0,realImpactFrames=0;
 let last=null,lastPhase='idle',doneNotice=null,impactNotice=null,impactAnnounced=false;
 const seen=new Set();
 const clip=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
 const smooth=x=>{const t=clip(x);return t*t*(3-2*t)};
 const hideAll=()=>{
  chalkGroup.visible=false;
  broadcast.visible=false;
  poster.visible=false;
  shield.visible=false;
  flash.intensity=0;
 };
 const finalize=(cause)=>{
  if(!playing)return false;
  doneNotice={serial:playing.serial,cause,effect:playing.effect};
  if(cause==='completed')completed++;
  else skipped++;
  playing=null;lastPhase='idle';world.visible=false;hideAll();
  impactNotice=null;
  if(caption)caption.hidden=true;
  if(skipButton)skipButton.hidden=true;
  if(caption?.parentElement)caption.parentElement.hidden=true;
  return true;
 };
 const reset=()=>{
  finalize('reset');
  seen.clear();
  if(!playing){world.visible=false;hideAll();
   if(caption)caption.hidden=true;if(skipButton)skipButton.hidden=true;
   if(caption?.parentElement)caption.parentElement.hidden=true;}
 };
 const skip=()=>finalize('skip');
 const play=(e,now,chapter=0)=>{
  const valid=normalizeRealCombo(e);
  if(!valid||!Number.isFinite(now)||!Number.isInteger(chapter)||chapter<0||chapter>3)return false;
  const key=chapter+':'+valid.side+':'+valid.serial+':'+valid.effect;
  if(seen.has(key))return false;
  if(seen.size>500)seen.clear();
  seen.add(key);
  if(playing)finalize('interrupted');
  playing={...valid,chapter};started=now;played++;last=playing;lastPhase='prepare';
  doneNotice=null;impactNotice=null;impactAnnounced=false;
  world.visible=true;hideAll();
  const chalkEffect=valid.effect.startsWith('chalk');
  const posterEffect=valid.effect.startsWith('poster');
  chalkGroup.visible=chalkEffect;
  broadcast.visible=valid.effect==='broadcast_draw';
  poster.visible=posterEffect;
  shield.visible=valid.effect==='poster_shield';
  const side=valid.side==='player'?-1:1;
  poster.position.set(side*1.75,1.84,.55);
  poster.rotation.set(.05,side*.14,-side*.07);
  shield.position.set(side*1.75,1.16,0);
  broadcast.position.set(0,0,0);
  flash.position.set((chalkEffect?-side:side)*1.75,1.3,.45);
  for(const [i,rod] of chalk.entries()){
   rod.visible=true;
   rod.position.set(side*1.28,1.1+(i-1)*.12,.44+(i-1)*.12);
   rod.rotation.z=side===-1?-.08:Math.PI+.08;
  }
  chalkImpact.position.set(-side*1.75,1.24,.4);
  chalkImpact.visible=false;
  if(caption){
   caption.replaceChildren();
   const title=document.createElement('strong');title.textContent=valid.title;
   const desc=document.createElement('span');desc.textContent=comboReceiptText(valid);
   caption.append(title,desc);caption.hidden=false;
   if(caption.parentElement)caption.parentElement.hidden=false;
  }
  if(skipButton)skipButton.hidden=false;
  return true;
 };
 const update=(now,reducedMotion=false)=>{
  if(!playing)return false;
  const p=playing;
  const duration=reducedMotion?.56:p.duration;
  const t=clip((now-started)/duration);
  const phase=t<.23?'prepare':t<.62?'action':t<.84?'impact':'settle';
  // One sound receipt PER actual engine combo, exactly when its 3D action
  // reaches the payoff. Skipping early prevents a late phantom hit sound.
  const hitAt=p.effect==='broadcast_draw'?.39:
   p.effect.startsWith('poster')?.56:.55;
  if(t>=hitAt&&!impactAnnounced){
   impactAnnounced=true;
   impactNotice={serial:p.serial,effect:p.effect,side:p.side,chapter:p.chapter};
  }

  lastPhase=phase;
  const side=p.side==='player'?-1:1;
  const movement=smooth((t-.16)/.53);
  const payoff=smooth((t-.48)/.16)*(1-smooth((t-.83)/.17));
  if(p.effect.startsWith('chalk')){
   chalk.forEach((rod,i)=>{
    const stagger=i*.047;
    const move=smooth((t-.16-stagger)/.40);
    rod.position.set(side*(1.28-3.03*move),
     1.16+(i-1)*.16+(reducedMotion?0:Math.sin(Math.PI*move)*(.5+.08*i)),
     .38+(i-1)*.11);
    rod.scale.setScalar(.98+.13*Math.sin(Math.PI*move));
    rod.visible=move<.95&&!reducedMotion;
   });
   chalkImpact.visible=payoff>.02;
   chalkRings.forEach((ring,i)=>{
    ring.scale.setScalar(.55+(1-payoff)*(.7+i*.22));
    ring.material.opacity=(.5-i*.085)*payoff;
   });
   chalkDust.children.forEach(x=>{
    const angle=x.userData.theta,r=x.userData.radius*(.4+2*(1-payoff));
    x.position.set(Math.cos(angle)*r,Math.sin(angle)*r,.05*Math.sin(angle*3));
    x.scale.setScalar(.4+.75*payoff);
    x.visible=payoff>.04;
   });
   if(payoff>.02)realImpactFrames++;
   flash.intensity=payoff*9;
  }else if(p.effect==='broadcast_draw'){
   speakers.forEach((sp,i)=>{
    sp.rotation.z=reducedMotion?0:(i===0?-1:1)*.07*Math.sin(now*28)*(1-payoff);
    sp.scale.setScalar(.9+.1*smooth(t/.30));
   });
   broadcastWaves.forEach((ring,i)=>{
    const wave=smooth((t-.16-i*.075)/.55);
    ring.scale.setScalar(.30+wave*2.45);
    ring.material.opacity=.64*(1-wave)*smooth((t-.12)/.19);
    ring.visible=t>=.12&&t<.84;
   });
   dial.rotation.y=t*Math.PI*.36;
   if(t>.48&&t<.86)realImpactFrames++;
   flash.intensity=payoff*4;
  }else if(p.effect.startsWith('poster')){
   poster.position.y=1.64+.5*(1-smooth(t/.38))+
    (reducedMotion?0:.045*Math.sin(now*7));
   const appearance=smooth((t-.08)/.24);
   poster.scale.setScalar(.75+.50*appearance);
   poster.rotation.z=side*.11*(1-appearance);
   if(p.effect==='poster_shield'){
    shield.visible=t>.35&&t<.97;
    const appearing=smooth((t-.34)/.25);
    dome.material.opacity=.17*appearing*(1-smooth((t-.84)/.14));
    dome.scale.setScalar(.65+appearing*.48);
    halo.material.opacity=.63*payoff;
    halo.scale.setScalar(.68+appearing*.46);
   }else shield.visible=false;
   if(t>.46&&t<.85)realImpactFrames++;
   flash.intensity=payoff*5;
  }
  if(t>=1){finalize('completed');return true}
  return false;
 };
 if(skipButton)skipButton.addEventListener('click',skip);
 hideAll();
 return {root:world,play,skip,reset,update,drainImpact(){
  const result=impactNotice;impactNotice=null;return result;
 },drainDone(){
  const notice=doneNotice;doneNotice=null;return notice;
 },get stats(){return{
  layer:'R100_REAL_RULE_DRIVEN_3D_COMBO_DIRECTOR',
  active:!!playing,phase:lastPhase,playing:playing?{...playing}:null,
  last:last?{...last}:null,played,completed,skipped,realImpactFrames,
  actualProps:{chalkSticks:chalk.length,chalkFragments:chalkDust.children.length,
   broadcastSpeakers:speakers.length,broadcastWaveMeshes:broadcastWaves.length,
   posterMeshes:poster.children.length,shieldMeshes:shield.children.length},
  activeEffects:{chalk:chalkGroup.visible,broadcast:broadcast.visible,
   poster:poster.visible,shield:shield.visible}
 }}};
}
