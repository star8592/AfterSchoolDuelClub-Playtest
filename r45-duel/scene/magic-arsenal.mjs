/**
 * R111 — original WebGL2 campus magic arsenal.
 *
 * Derived conceptually from our own R79 elemental shader research and
 * GlobalGameFoundry's author-verified open-source VFX study, not a copy of
 * third-party code, texture files, 3D character rigs, audio, or FX artwork.
 *
 * 46 spell cards => 30 distinct readable physical motifs. The game engine
 * always resolves the attack first. This module is display-only.
 */
import {BY_ID,CARDS} from '../engine.mjs';
import {SPELL_CHOREOGRAPHY} from './spell-impact.mjs';

export const CARD_MAGIC_MOTIFS=Object.freeze({
 E05:'aurora',E06:'meteor',G05:'crystal',G06:'runes',T05:'tidal',T06:'lightning',
 K01:'banana',K02:'shield',K03:'fruit',K04:'chili',K05:'steam',K06:'volcano',
 K07:'frog',K08:'chocolate',
 Q01:'eraser',Q02:'beasts',Q03:'dream',Q04:'broadcast',Q05:'papers',
 Q06:'lamp',Q07:'moons',Q08:'chalk',
 S01:'clock',S02:'pencil',S03:'tornado',S04:'lightning',S05:'robot',
 S06:'elastic',S07:'portal',S08:'vending',
 P01:'tornado',P02:'ball',P03:'beasts',P04:'broadcast',P05:'ball',
 P06:'elastic',P07:'tidal',P08:'meteor',
 X01:'clock',X02:'portal',X03:'meteor',X04:'dream',X05:'cosmic',
 X06:'echo',X07:'eraser',X08:'portal'
});
export const MAGIC_MOTIF_COUNT=new Set(Object.values(CARD_MAGIC_MOTIFS)).size;
const playableSpells=CARDS.filter(c=>c.kind==='spell');
if(playableSpells.length!==46||
 playableSpells.some(c=>!Object.hasOwn(CARD_MAGIC_MOTIFS,c.id)))
 throw new Error('R111 arsenal must cover every one of 46 legitimate spell cards');
const clamp=v=>Math.max(0,Math.min(1,v));
const ease=v=>{const x=clamp(v);return x*x*(3-2*x)};
const palettes={
 ember:['#ff9445','#ffe3a1','#ee5438'],
 grove:['#68d5a7','#d8ffb6','#3ca47f'],
 tide:['#77c9f5','#d5ebff','#6f8df5']
};

export function createMagicArsenal(THREE,scene,{reducedMotion=false}={}){
 const root=new THREE.Group();
 root.name='R111_Campus_30_Magic_Motif_Arsenal';scene.add(root);
 const active=[];
 const LIMIT=4;
 let played=0,expired=0,rejected=0,totalMeshes=0,peakMeshes=0;
 const lastBySide={player:null,ai:null};
 const additive=THREE.AdditiveBlending;
 const mat=(color,opacity=.85,glow=false)=>new THREE.MeshBasicMaterial({
  color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,
  blending:glow?additive:THREE.NormalBlending,toneMapped:!glow
 });
 function add(parent,geometry,color,{opacity=.85,glow=false,role='orbit',phase=0}={}){
  const obj=new THREE.Mesh(geometry,mat(color,opacity,glow));
  obj.userData={role,phase,initialOpacity:opacity};
  parent.add(obj);
  return obj;
 }
 function hoop(parent,radius,color,{vertical=false,arc=Math.PI*2,phase=0,role='spin',glow=true}={}){
  const o=add(parent,new THREE.TorusGeometry(radius,.025,6,60,arc),color,
   {opacity:.85,glow,role,phase});
  if(!vertical)o.rotation.x=-Math.PI/2;
  return o;
 }
 function bits(parent,n,color,geo,role='burst',y=.8){
  const out=[];
  for(let i=0;i<n;i++){
   const o=add(parent,geo(),color,{opacity:.9,glow:i%2===0,role,phase:i});
   o.position.set(Math.cos(i*2.4)*(.3+(i%4)*.13),y+(i%3)*.19,
    Math.sin(i*2.4)*(.3+(i%4)*.13));
   out.push(o);
  }
  return out;
 }
 function line(parent,points,color,phase=0){
  const geo=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
  const o=new THREE.Line(geo,new THREE.LineBasicMaterial({
   color,transparent:true,opacity:.94,depthWrite:false,blending:additive
  }));
  o.userData={role:'line',phase,initialOpacity:.94};parent.add(o);return o;
 }
 // One GPU draw call for 48 independent soft-glow particles per spell.
 // This is a clean-room WebGL2 adaptation of our own R79 shader approach.
 function auraParticles(parent,color,serial){
  const N=reducedMotion?16:48,pos=new Float32Array(N*3),
    phase=new Float32Array(N),speed=new Float32Array(N);
  for(let i=0;i<N;i++){
   const x=Math.sin(i*12.9898+serial*1.125)*43758.5453;
   const n=x-Math.floor(x),theta=i*2.39996,r=.16+.85*n;
   pos[i*3]=Math.cos(theta)*r;
   pos[i*3+1]=.21+(i%9)*.16;
   pos[i*3+2]=Math.sin(theta)*r;
   phase[i]=(i*.6180339887+n)%1;
   speed[i]=.35+(i%5)*.12;
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('aPhase',new THREE.BufferAttribute(phase,1));
  geo.setAttribute('aSpeed',new THREE.BufferAttribute(speed,1));
  const vtx=[
   'attribute float aPhase; attribute float aSpeed;',
   'uniform float uTime; uniform float uSize;',
   'varying float vLife;',
   'void main(){',
   '  float t=fract(aPhase+uTime*aSpeed);',
   '  vec3 p=position;',
   '  p.y+=t*1.15;',
   '  p.x+=sin(uTime*3.0+aPhase*17.0)*t*.23;',
   '  p.z+=cos(uTime*2.0+aPhase*14.0)*t*.24;',
   '  vec4 mv=modelViewMatrix*vec4(p,1.0);',
   '  gl_Position=projectionMatrix*mv;',
   '  gl_PointSize=clamp(uSize*(8.0/max(1.0,-mv.z))*(1.0-.53*t),1.0,32.0);',
   '  vLife=(1.0-t)*(.7+.3*sin(aPhase*13.0+uTime*4.0));',
   '}'
  ].join('\\n').replaceAll('\\n','\n');
  const frag=[
   'uniform vec3 uColor; uniform float uAlpha;',
   'varying float vLife;',
   'void main(){',
   '  vec2 uv=gl_PointCoord-.5;',
   '  float r=length(uv);',
   '  float v=pow(max(0.0,1.0-r*2.0),2.6);',
   '  gl_FragColor=vec4(uColor,v*vLife*uAlpha);',
   '}'
  ].join('\\n').replaceAll('\\n','\n');
  const material=new THREE.ShaderMaterial({
   vertexShader:vtx,fragmentShader:frag,transparent:true,depthWrite:false,
   blending:THREE.AdditiveBlending,
   uniforms:{uTime:{value:0},uSize:{value:reducedMotion?10:18},
    uColor:{value:new THREE.Color(color)},uAlpha:{value:1}}
  });
  const points=new THREE.Points(geo,material);
  points.userData={role:'spark-cloud',initialOpacity:1};
  parent.add(points);return points;
 }
 function build(group,motif,c){
  const [primary,white,secondary]=palettes[c.style]||palettes.tide;
  const sphere=(r=.3)=>new THREE.SphereGeometry(r,12,8);
  const shard=(r=.18,h=.7)=>new THREE.ConeGeometry(r,h,6);
  const box=(x=.5,y=.5,z=.12)=>new THREE.BoxGeometry(x,y,z);
  const orbit=()=>hoop(group,.8,primary,{role:'pulse'});
  const glitter=(n=10,col=white)=>bits(group,n,col,()=>new THREE.IcosahedronGeometry(.09,0));
  switch(motif){
   case 'aurora':
    for(let i=0;i<4;i++){const o=hoop(group,.62+i*.15,i%2?white:primary,
     {vertical:true,arc:Math.PI*1.5,phase:i,role:'rise'});
     o.position.y=.7+i*.22;o.rotation.y=i*.58;}
    glitter(9);break;
   case 'meteor':
    {const core=add(group,new THREE.DodecahedronGeometry(.55,0),secondary,{role:'fall'});
     core.position.y=2.6;
     bits(group,12,primary,()=>shard(.08,.48),'fall',2.2);
     hoop(group,.7,white,{role:'pulse'});break;}
   case 'crystal':
    bits(group,9,primary,()=>shard(.18,.94),'rise',.6);orbit();break;
   case 'runes':
    hoop(group,.95,primary,{vertical:true,role:'spin'});
    hoop(group,.68,white,{vertical:true,role:'spin',phase:3});
    bits(group,12,white,()=>box(.11,.13,.04),'orbit',1.15);break;
   case 'tidal':
    for(let i=0;i<4;i++){
     const o=hoop(group,.46+i*.22,i%2?white:primary,{role:'wave',phase:i});
     o.position.y=.18+i*.22;
    }bits(group,8,white,()=>sphere(.1),'rise');break;
   case 'lightning':
    for(let j=0;j<5;j++){
     const points=[];
     for(let i=0;i<12;i++){
      const t=i/11;
      points.push([-1.2+2.4*t,1.6+.18*Math.sin(t*9+j*2)+(i%2?.20:-.20),
       .3*Math.sin(t*11+j)]);
     }
     line(group,points,j%2?white:primary,j);
    }bits(group,10,white,()=>shard(.08,.20));break;
   case 'banana':
   case 'chocolate':
    {const tint=motif==='banana'?'#f5d660':'#e4ba61';
     const fruit=add(group,new THREE.TorusGeometry(.66,.13,10,28,Math.PI*1.28),
      tint,{role:'bounce'});fruit.rotation.x=.38;fruit.position.y=1.15;
     const purple=add(group,sphere(.38),motif==='banana'?'#8555b6':'#4f2e25',
      {role:'orbit'});purple.position.set(-.57,.86,0);
     glitter(9,motif==='banana'?'#ffbdff':'#a77942');break;}
   case 'shield':
    {const dome=add(group,new THREE.SphereGeometry(1.12,20,12,0,Math.PI*2,0,Math.PI/2),
     '#78d5ff',{opacity:.22,glow:true,role:'pulse'});
     dome.position.y=.20;
     for(let i=0;i<3;i++){const p=hoop(group,.65+i*.19,white,{role:'pulse',phase:i});
      p.position.y=.23+i*.2;}break;}
   case 'fruit':
    bits(group,16,'#9dd75d',()=>sphere(.13),'orbit',.9);
    bits(group,6,'#9b6df8',()=>sphere(.23),'rise',.4);break;
   case 'chili':
    bits(group,9,'#ff5339',()=>shard(.12,.55),'fall',1.6);
    bits(group,9,'#f6c45c',()=>sphere(.08));break;
   case 'steam':
    bits(group,14,'#d7e8f4',()=>sphere(.18),'rise',.3);break;
   case 'volcano':
    {const crater=add(group,new THREE.ConeGeometry(.83,1.13,12,1,true),
     '#85503b',{role:'pulse'});crater.position.y=.64;
     bits(group,15,'#ff782b',()=>shard(.13,.42),'rise',1.35);
     hoop(group,.91,'#ffcd75',{role:'wave'});break;}
   case 'frog':
    {const cake=add(group,new THREE.CylinderGeometry(.65,.78,.32,20),
     '#92cc70',{role:'bounce'});cake.position.y=.50;
     for(const x of [-.28,.28]){
      const eye=add(group,sphere(.20),'#f7f2ce',{role:'bounce'});
      eye.position.set(x,.88,.40);
      const pupil=add(group,sphere(.07),'#263929',{role:'orbit'});
      pupil.position.set(x,.88,.55);
     }
     bits(group,8,'#bce99c',()=>sphere(.07),'burst',.5);break;}
   case 'eraser':
    for(let i=0;i<3;i++){const b=add(group,box(.65,.29,.4),i%2?'#d0bada':'#f4f2e3',
     {role:'fall',phase:i});b.position.set((i-1)*.5,1.4+i*.23,0);}
    bits(group,13,'#e9ecef',()=>shard(.08,.24));break;
   case 'beasts':
    for(let i=0;i<3;i++){
     const creature=add(group,sphere(.31),['#ffd0a0','#cdd8ff','#c7efbf'][i],
      {role:'bounce',phase:i});creature.position.set((i-1)*.76,.65,0);
     for(const sign of [-1,1]){
      const ear=add(group,shard(.12,.28),'#b59d83',{role:'bounce',phase:i});
      ear.position.set((i-1)*.76+sign*.22,.97,0);
     }
    }break;
   case 'dream':
    bits(group,14,'#f5ccf8',()=>new THREE.TetrahedronGeometry(.18),'orbit',1.5);
    hoop(group,.83,'#a3c8ff',{vertical:true});break;
   case 'broadcast':
    for(let i=0;i<6;i++){
     const p=hoop(group,.20+i*.20,i%2?white:primary,{vertical:true,role:'wave',phase:i});
     p.position.y=1.1;
    }break;
   case 'papers':
    bits(group,14,'#fff2cb',()=>box(.34,.45,.025),'orbit',1.4);break;
   case 'lamp':
    {const stand=add(group,new THREE.CylinderGeometry(.065,.10,1.16,8),'#e5ce9c',{role:'pulse'});
     stand.position.y=.72;
     const bulb=add(group,sphere(.33),'#fffabb',{glow:true,role:'lamp'});
     bulb.position.y=1.55;hoop(group,.63,'#ffe1a6',{role:'pulse'});break;}
   case 'moons':
    for(let i=0;i<2;i++){
     const m=add(group,sphere(.43-i*.07),'#e5d9f9',{role:'orbit',phase:i*3});
     m.position.set(i?+.7:-.7,1.3+i*.45,0);
    }hoop(group,1.16,'#97a7ee',{vertical:true,role:'spin'});break;
   case 'chalk':
    for(let i=0;i<4;i++)hoop(group,.30+i*.27,'#f5fbff',{role:'wave',phase:i});
    bits(group,10,'#ebeff8',()=>box(.08,.30,.07),'fall',1.4);break;
   case 'clock':
    {const face=hoop(group,.81,'#ffd2b0',{vertical:true,role:'spin'});face.position.y=1.24;
     for(let i=0;i<2;i++){
      const needle=add(group,box(.05,i?.57:.88,.04),'#faf1d7',{role:'clock',phase:i});
      needle.position.y=1.24;
     }bits(group,10,primary,()=>sphere(.08),'orbit');break;}
   case 'pencil':
    {const shaft=add(group,new THREE.CylinderGeometry(.095,.095,1.4,6),'#ffd873',{role:'spin'});
     shaft.position.y=1.2;
     const tip=add(group,new THREE.ConeGeometry(.12,.31,6),'#b5ab98',{role:'spin'});
     tip.position.y=.40;glitter();break;}
   case 'tornado':
    for(let i=0;i<3;i++){
     const coords=[];
     for(let k=0;k<50;k++){
      const t=k/49,angle=t*Math.PI*5+i*2.1,r=.15+t*.75;
      coords.push(new THREE.Vector3(Math.cos(angle)*r,.2+t*2.1,
       Math.sin(angle)*r));
     }
     add(group,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coords),49,.032,5,false),
      i%2?white:primary,{glow:true,role:'spin',phase:i});
    }break;
   case 'robot':
    {const torso=add(group,box(.88,.82,.56),'#8f9eab',{role:'bounce'});torso.position.y=.86;
     for(let i=0;i<2;i++){
      const eye=add(group,sphere(.12),'#b3efff',{glow:true,role:'lamp',phase:i});
      eye.position.set(i?.21:-.21,1.03,.32);
     }const antenna=add(group,box(.07,.37,.07),'#e6f5fc',{role:'spin'});
     antenna.position.y=1.55;break;}
   case 'elastic':
    for(let i=0;i<5;i++){
     const o=hoop(group,.32+i*.13,'#c9a9ff',{role:'elastic',phase:i});
     o.position.y=.45+i*.31;o.rotation.z=i*.36;
    }break;
   case 'portal':
    for(let i=0;i<3;i++){
     const p=hoop(group,.77+i*.13,i%2?white:primary,{vertical:true,role:'spin',phase:i});
     p.position.y=1.23;p.rotation.y=i*.31;
    }{const disk=add(group,new THREE.CircleGeometry(.70,30),'#182a41',
      {opacity:.73,role:'pulse'});disk.position.y=1.23;disk.position.z=-.2;}break;
   case 'vending':
    {const machine=add(group,box(.82,1.60,.60),'#8f7fa1',{role:'bounce'});
     machine.position.y=1.04;
     bits(group,6,'#eae9fa',()=>new THREE.CylinderGeometry(.10,.1,.27,8),
      'fall',.8);break;}
   case 'ball':
    {const b=add(group,sphere(.48),'#f1eddd',{role:'bounce'});b.position.y=1.2;
     for(let i=0;i<3;i++){const line=hoop(group,.50,'#51617a',
      {vertical:true,role:'spin',phase:i});line.position.y=1.2;line.rotation.y=i*Math.PI/3;}
     bits(group,8,white,()=>sphere(.065),'burst',1.3);break;}
   case 'cosmic':
    {const core=add(group,new THREE.IcosahedronGeometry(.55,1),'#b9a4ff',
      {role:'spin'});core.position.y=1.35;
     for(let i=0;i<3;i++){const o=hoop(group,.81+i*.12,i%2?white:primary,
      {vertical:true,role:'spin',phase:i});o.position.y=1.35;o.rotation.x=i*.42;}
     glitter(13);break;}
   case 'echo':
    for(let i=0;i<7;i++){
     const o=hoop(group,.27+i*.15,i%2?primary:white,{vertical:true,role:'wave',phase:i});
     o.position.y=1.05;
    }break;
   default:throw new Error('Unknown campus-magic motif '+motif);
  }
  // A tiny surface reflection grounds the spell without forcing all motifs
  // to share the huge generic R81 triple-ring appearance.
  const floor=hoop(group,.34,secondary,{role:'pulse',glow:false});
  floor.position.y=.04;floor.material.opacity=.23;
  auraParticles(group,primary,c.id.charCodeAt(0)*101+Number(c.id.slice(1)));
  const flash=new THREE.PointLight(primary,0,3.0,2);flash.position.y=1.1;group.add(flash);
  return flash;
 }

 function destroy(a){
  root.remove(a.group);
  a.group.traverse(o=>{
   o.material?.dispose?.();
   o.geometry?.dispose?.();
  });
  expired++;
 }
 function play(message,now=0){
  const card=BY_ID[message?.card],motif=CARD_MAGIC_MOTIFS[message?.card];
  if(!message||message.type!=='ASDC_R81_SPELL_RESULT'||
    !['ai','player'].includes(message.side)||
    !Number.isInteger(message.serial)||message.serial<=0||
    card?.kind!=='spell'||!motif||
    (message.effect!==undefined&&message.effect!==card.effect)){
   rejected++;return false;
  }
  const target=SPELL_CHOREOGRAPHY[card.id]?.target==='enemy'?
   (message.side==='player'?'ai':'player'):message.side;
  const group=new THREE.Group();
  group.name='R111_'+motif+'_'+card.id;
  group.position.set((target==='player'?-1:1)*1.72,0,-.18);
  root.add(group);
  const light=build(group,motif,card);
  // Capture spawn transforms: all animations derive from absolute elapsed
  // time, never from frame count or accumulated position drift.
  for(const node of group.children){
   if(node.userData?.role){
    node.userData.basePosition=node.position.clone();
    node.userData.baseRotation=node.rotation.clone();
    node.userData.baseScale=node.scale.clone();
   }
  }
  const duration=reducedMotion?.68:motif==='portal'||motif==='volcano'?2.15:1.52;
  const entry={group,light,motif,id:card.id,side:message.side,
   created:now,duration,parts:group.children.length,
   phase:(message.serial%19)*.13};
  active.push(entry);played++;lastBySide[message.side]=card.id;
  totalMeshes+=group.children.filter(x=>x.isMesh||x.isLine).length;
  peakMeshes=Math.max(peakMeshes,active.reduce((sum,x)=>sum+x.parts,0));
  while(active.length>LIMIT)destroy(active.shift());
  return true;
 }
 function update(now=0){
  for(let i=active.length-1;i>=0;i--){
   const a=active[i],age=Math.max(0,now-a.created);
   if(age>=a.duration){destroy(a);active.splice(i,1);continue}
   const t=clamp(age/a.duration),intro=ease(t/.23),fade=1-ease((t-.68)/.32);
   const strength=intro*fade;
   const scaleFactor=new Set(['meteor','portal','tornado','volcano','cosmic','clock'])
    .has(a.motif)?1.24:1.80;
   a.group.scale.setScalar(scaleFactor*(.65+.35*intro));
   a.group.rotation.y=Math.sin(t*6+a.phase)*.13;
   const children=a.group.children;
   for(let j=0;j<children.length;j++){
    const o=children[j],role=o.userData?.role;
    if(!role)continue;
    const phase=(o.userData.phase||0);
    if(role==='spark-cloud'){
     o.material.uniforms.uTime.value=age;
     o.material.uniforms.uAlpha.value=strength;
     continue;
    }
    const b=o.userData.basePosition,r=o.userData.baseRotation,
      scale=o.userData.baseScale;
    if(b&&r&&scale){o.position.copy(b);o.rotation.copy(r);o.scale.copy(scale);}
    switch(role){
     case 'rise':o.position.y+=.7*ease(t/.66)+.12*Math.sin(t*10+phase);o.rotation.y+=(t*4+phase);break;
     case 'fall':o.position.y-=1.2*ease(t/.80);o.rotation.x+=t*5+phase*.25;break;
     case 'orbit':o.rotation.y+=t*6+phase*.40;
      o.position.x+=.18*Math.sin(t*12+phase);break;
     case 'spin':o.rotation.z+=t*(a.motif==='clock'?-5:5)+phase*.16;break;
     case 'bounce':o.position.y+=.15*Math.abs(Math.sin(t*11+phase));o.rotation.z+=Math.sin(t*10+phase)*.12;break;
     case 'wave':o.scale.multiplyScalar(.5+1.5*ease((t+phase*.05)%1));break;
     case 'pulse':o.scale.multiplyScalar(.80+.35*Math.sin(t*12+phase)**2);break;
     case 'elastic':o.scale.y=.7+.6*Math.sin(t*12+phase*.4)**2;break;
     case 'clock':o.rotation.z-=t*13+phase*1.7;break;
     case 'lamp':o.scale.multiplyScalar(.7+((t*3)%1<.25?.55:0));break;
     case 'burst':o.scale.multiplyScalar(.25+1.5*ease(t/.40));break;
     default:break;
    }
    if(o.material){
     o.material.opacity=(o.userData.initialOpacity||.8)*strength;
    }
   }
   a.light.intensity=(reducedMotion?1.1:2.7)*strength;
  }
 }
 function dispose(){while(active.length)destroy(active.pop());root.removeFromParent()}
 return {root,play,update,dispose,get stats(){return{
  name:'R111_ORIGINAL_WEBGL2_CAMPUS_MAGIC',
  playableSpellCoverage:playableSpells.length,
  motifCount:MAGIC_MOTIF_COUNT,played,expired,rejected,
  active:active.length,activeMotifs:active.map(x=>x.motif),
  lastBySide:{...lastBySide},maxActive:LIMIT,peakMeshes,totalMeshes,
  ruleMutations:0
 }}};
}
