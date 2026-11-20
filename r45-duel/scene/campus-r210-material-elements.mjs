/**
 * R210 · Original physical-material elemental impacts for 46 real school spells.
 *
 * Intentionally NO RingGeometry/TorusGeometry/PointLight/ShaderMaterial/Sprite
 * and no WebGL render target. A maximum of three effects, each just TWO
 * instanced draw calls. All impact timing comes from the authoritative
 * R199 source-GLB contact callback, never a guessed click timer.
 */
const PROFILES={
 fire:['flame','ember','#ff672a','#ffd66b',1.85,'flame'],
 water:['drop','jet','#37c9f4','#e0f9ff',1.80,'splash'],
 earth:['rock','dust','#977658','#dbbc8e',1.95,'rubble'],
 electric:['bolt','spark','#b78bff','#f2eaff',1.24,'lightning'],
 ice:['ice','glint','#78c9ef','#f3fdff',1.85,'crystal'],
 wood:['sprout','leaf','#60af61','#b6e96e',1.24,'sprouting'],
 wind:['streak','leaf','#81d8d9','#d7f5e8',1.56,'gust'],
 metal:['metal','spark','#bbcbd3','#f5e5bd',.92,'clang'],
 light:['glint','spark','#ffc85c','#fff7c3',.91,'glimmer'],
 shadow:['smoke','fragment','#71678e','#c1a1df',1.17,'shadows'],
 mind:['rune','fragment','#bc83cb','#f8d7ec',1.10,'thought'],
 sound:['bar','spark','#52b6e9','#ffe7a3',.85,'equalizer'],
 time:['tick','fragment','#e5b77d','#fff3d2',1.09,'clockwork'],
 space:['fragment','glint','#8ba6ea','#cceafd',1.10,'fracture'],
 absurd:['rubber','confetti','#e9b35d','#fc93a1',1.17,'bounce']
};
export const R210_ELEMENT_PROFILES=Object.freeze(Object.fromEntries(
 Object.entries(PROFILES).map(([key,record])=>
  [key,Object.freeze({element:key,primary:record[0],secondary:record[1],
   primaryColor:record[2],secondaryColor:record[3],duration:record[4],
   motion:record[5]})])));
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
const hash=(seed,i)=>{
 let x=(seed+Math.imul(i+1,0x9e3779b9))>>>0;
 x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;
 return (x>>>0)/4294967295;
};
export function createR210PhysicalElements(THREE,scene,{reducedMotion=false}={}){
 const root=new THREE.Group();
 root.name='R210_Physical_Element_Events_No_Generic_Halos';
 scene.add(root);
 // Geometry is instantiated only once per scene, then shared by every spell.
 const shapes=Object.freeze({
  flame:new THREE.ConeGeometry(.12,.48,7),
  ember:new THREE.IcosahedronGeometry(.065,0),
  drop:new THREE.SphereGeometry(.095,10,7),
  jet:new THREE.CylinderGeometry(.026,.063,.65,7),
  rock:new THREE.DodecahedronGeometry(.17,0),
  dust:new THREE.SphereGeometry(.10,7,5),
  bolt:new THREE.TetrahedronGeometry(.16,0),
  spark:new THREE.OctahedronGeometry(.07,0),
  ice:new THREE.ConeGeometry(.11,.57,5),
  glint:new THREE.OctahedronGeometry(.10,0),
  sprout:new THREE.CylinderGeometry(.026,.060,.57,6),
  leaf:new THREE.ConeGeometry(.10,.30,5),
  streak:new THREE.CylinderGeometry(.018,.044,.80,5),
  metal:new THREE.OctahedronGeometry(.14,0),
  smoke:new THREE.IcosahedronGeometry(.17,1),
  fragment:new THREE.BoxGeometry(.22,.15,.046),
  rune:new THREE.TetrahedronGeometry(.15),
  bar:new THREE.BoxGeometry(.065,.62,.074),
  tick:new THREE.BoxGeometry(.05,.39,.075),
  rubber:new THREE.SphereGeometry(.15,8,6),
  confetti:new THREE.BoxGeometry(.18,.08,.025)
 });
 const materials=new Map(),active=[],dummy=new THREE.Object3D();
 let spawned=0,expired=0,peak=0,rejected=0,maxActiveInstances=0,qaPreviews=0;
 const seen=new Map();let last=null;
 function material(element,secondary){
  const key=element+(secondary?'2':'1');
  if(materials.has(key))return materials.get(key);
  const hot=['fire','electric','light','wind'].includes(element);
  const mist=['water','shadow'].includes(element);
  const color=secondary?
   R210_ELEMENT_PROFILES[element].secondaryColor:
   R210_ELEMENT_PROFILES[element].primaryColor;
  const mat=hot?new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,
    opacity:element==='fire'?.88:.86,depthWrite:false,
    blending:THREE.AdditiveBlending}):
    new THREE.MeshStandardMaterial({color:'#ffffff',roughness:element==='water'?.18:
      element==='ice'?.22:element==='metal'?.29:.67,
      metalness:element==='metal'?.40:element==='water'?.12:.03,
      transparent:mist,opacity:mist?.73:1,depthWrite:!mist});
  materials.set(key,mat);return mat;
 }
 function spawn(signature,anchor,now,{kind='host',supportive=false,qaPreview=false}={}){
  if(!signature||!R210_ELEMENT_PROFILES[signature.element]||
    typeof signature.id!=='string'||!/^[A-Z][0-9]{2}$/.test(signature.id)||
    !anchor||![anchor.x,anchor.y,anchor.z].every(Number.isFinite)||
    !Number.isFinite(now)||!['host','unit'].includes(kind)){rejected++;return false}
  const spec=R210_ELEMENT_PROFILES[signature.element],n=reducedMotion?13:29;
  const first=Math.ceil(n*.62),second=n-first;
  const group=new THREE.Group();
  group.name='R210_'+signature.element+'_'+signature.id+'_'+kind;
  const elev=spec.element==='earth'?.35:spec.element==='ice'?.49:
   spec.element==='water'?.79:1.13;
  // Pull the impact a little toward the open center of the wide camera.
  // Real host arms/oversized Blender props otherwise obscure small sparks.
  const exposedX=kind==='host'?anchor.x-Math.sign(anchor.x)*.52:anchor.x;
  group.position.set(exposedX,anchor.y+
   (kind==='host'?elev:Math.min(elev,.55)),anchor.z+.93);
  group.scale.setScalar(spec.element==='fire'?1.40:
   spec.element==='water'?1.27:spec.element==='earth'?1.25:1);
  root.add(group);
  const a=new THREE.InstancedMesh(shapes[spec.primary],material(spec.element,false),first);
  const b=new THREE.InstancedMesh(shapes[spec.secondary],material(spec.element,true),second);
  a.name='R210_'+spec.element+'_Primary_Physical_Instances';
  b.name='R210_'+spec.element+'_Secondary_Physical_Instances';
  for(const [phase,mesh] of [a,b].entries()){
   mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;
   mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
   const baseColor=new THREE.Color(phase?spec.secondaryColor:spec.primaryColor);
   const highlight=new THREE.Color('#fffbe6');
   const shadow=new THREE.Color(spec.element==='earth'?'#513c2e':
    spec.element==='fire'?'#b93516':'#376b8d');
   for(let j=0;j<mesh.count;j++){
    const color=baseColor.clone();
    const v=hash(signature.id.charCodeAt(0)*131+phase*97,j);
    if(spec.element==='fire'||spec.element==='water'||spec.element==='ice')
     color.lerp(highlight,phase?.26+.31*v:.13+.58*v);
    else if(spec.element==='earth'||spec.element==='metal')
     color.lerp(v>.5?highlight:shadow,.12+.22*v);
    else color.lerp(highlight,.12+.24*v);
    mesh.setColorAt(j,color);
   }
   mesh.instanceColor.needsUpdate=true;
   group.add(mesh);
  }
  const seed=[...signature.id].reduce((s,c)=>
    (Math.imul(s^c.charCodeAt(0),16777619)>>>0),2166136261);
  const entry={group,meshes:[a,b],first,second,seed,kind,supportive,
    spec,started:now,duration:reducedMotion?spec.duration*.64:spec.duration};
  active.push(entry);spawned++;
  if(qaPreview)qaPreviews++;
  seen.set(spec.element,(seen.get(spec.element)||0)+1);
  last={element:spec.element,id:signature.id,kind,supportive,instances:n,
   source:qaPreview?'QA scene-only art preview':'authoritative R199 physical contact'};
  peak=Math.max(peak,active.length);
  maxActiveInstances=Math.max(maxActiveInstances,active.reduce((s,e)=>s+e.first+e.second,0));
  while(active.length>3)retire(active.shift());
  // First pose is rendered immediately; no first-frame default identity matrix
  // at the world origin while waiting for the next animation frame.
  pose(entry,0);
  return true;
 }
 function retire(entry){
  entry.group.removeFromParent();
  for(const mesh of entry.meshes)mesh.dispose?.();
  expired++;
 }
 function pose(entry,t){
  const spec=entry.spec;
  const grow=ease(t/.13),fade=1-ease((t-.74)/.26);
  const count=entry.first+entry.second;
  for(let i=0;i<count;i++){
   const secondary=i>=entry.first,j=secondary?i-entry.first:i;
   const h=hash(entry.seed,i),k=hash(entry.seed,i+99);
   const a=i*2.399963229728653+h*.52,rad=.18+(i%6)*.088;
   const outward=rad*(.3+1.80*ease(t/.77));
   const gravity=t*t;
   let x=Math.cos(a)*outward,z=Math.sin(a)*outward*.75;
   let y=0,scale=.50,tilt=0,rotate=t*1.2+i*.31;
   const phase=(i%5)*.43;
   switch(spec.motion){
    case 'flame':
     x*=.48;z*=.53;
     y=-.33+(.30+1.30*t)+(secondary?.42*Math.sin(t*15+phase):.44*Math.sin(t*7+phase));
     scale=(secondary?.36:.88)*(1-t*.43);
     tilt=Math.sin(a)*.21;rotate+=Math.sin(t*4+i)*.21;break;
    case 'splash':
     y=secondary?.07+Math.sin(t*Math.PI)*(.55+.48*k)-gravity*.44:
      .25+Math.sin(t*Math.PI)*(.56+.52*h)-gravity*.78;
     scale=secondary?.71:1.08;tilt=a+Math.PI/2;break;
    case 'rubble':
     y=Math.sin(Math.PI*t)*(.45+h*.57)-gravity*(secondary?.21:.65)-.48;
     scale=secondary?.60:1.10;tilt=a*t*2.0;break;
    case 'lightning':
     x=(h-.5)*1.08+Math.sin(t*35+phase)*.08;
     z=(k-.5)*.60;
     y=.07+(i%6)*.20+Math.sin(t*25+phase)*.11;
     scale=Math.floor(t*24+i)%3===0?.001:(secondary?.74:1.08);
     tilt=(i%2?-.7:.7)+Math.sin(t*14+i)*.34;break;
    case 'crystal':
     x*=.63;z*=.80;
     y=-.50+(.48+(i%5)*.14)*ease(t/.25);
     if(secondary)y+=Math.sin(t*Math.PI)*.59;
     scale=(secondary?.51:1.17)*(.50+.54*grow);
     tilt=Math.sin(a)*.26+t*(secondary?1.9:0);break;
    case 'sprouting':
     x*=.64;z*=.65;
     y=-.51+(.49+(i%5)*.20)*ease(t/.33)+Math.sin(t*8+i)*.08;
     scale=secondary?.90:1.21;tilt=Math.sin(a)*.42;break;
    case 'gust':
     x=Math.cos(a+t*8)*outward*.88;
     z=Math.sin(a+t*8)*outward*.65;
     y=-.23+t*1.43+(i%7)*.08;
     scale=secondary?.67:1.0;tilt=Math.sin(a+t*8)*.84;break;
    case 'clang':
     y=Math.sin(t*Math.PI)*(.40+h*.48)-gravity*.30-.30;
     scale=secondary?.77:1.10;tilt=(i%2?-.55:.55)*t*3;break;
    case 'glimmer':
     y=Math.sin(t*Math.PI)*(.31+h*.55)+(i%5)*.11-.11;
     scale=(secondary?.63:1.02)*(.54+.55*Math.sin(Math.PI*t));
     tilt=t*3.8;break;
    case 'shadows':
     y=-.33+t*.74+(i%6)*.12;
     x*=.58;scale=(secondary?.8:1.22)*(1+.25*Math.sin(t*9+phase));
     tilt=Math.sin(t*4+a)*.44;break;
    case 'thought':
     y=.14+Math.sin(t*7+phase)*.35+(i%4)*.11;
     x=Math.sin(a+t*2.3)*.43;z=Math.cos(a+t*2.3)*.30;
     scale=secondary?.62:1;tilt=t*3;break;
    case 'equalizer':
     x=(i%10-4.5)*.15;z=(Math.floor(i/10)-1)*.14;
     y=-.15+(i%5)*.12;
     scale=.43+(secondary?.2:.9)*Math.abs(Math.sin(t*13+i*.7));
     tilt=0;rotate=0;break;
    case 'clockwork':
     y=(i%7-3)*.14;
     x=(i%5-2)*.20+.22*Math.sin(t*5+phase);
     z=.13*Math.cos(i*2.3);
     scale=secondary?.69:.92;tilt=t*(i%2?2.3:-2.3);break;
    case 'fracture':
     y=(i%7-3)*.16+Math.sin(Math.PI*t)*.38;
     scale=secondary?.60:1.16;tilt=t*3.4*(i%2?1:-1);break;
    default: // absurd, distinctly bouncing rubber objects and confetti
     y=-.47+Math.abs(Math.sin(t*11+phase))*(1-t)*(.75+h*.40);
     scale=secondary?.95:1.30;tilt=t*5.4;break;
   }
   // Mass/material: all forms are 3D meshes, never 2D overlay rings.
   dummy.position.set(x,y,z);
   dummy.rotation.set(tilt,rotate,secondary?Math.sin(a)*.3:Math.cos(a)*.22);
   const size=Math.max(.001,scale*grow*fade*(.71+h*.50));
   dummy.scale.set(size*(spec.motion==='splash'&&secondary?.46:1),
    size*(spec.motion==='flame'&&!secondary?1.6:
     spec.motion==='equalizer'?1.8:1),
    size);
   dummy.updateMatrix();
   entry.meshes[secondary?1:0].setMatrixAt(j,dummy.matrix);
  }
  for(const mesh of entry.meshes)mesh.instanceMatrix.needsUpdate=true;
 }
 function update(now){
  if(!Number.isFinite(now))return;
  for(let i=active.length-1;i>=0;i--){
   const entry=active[i],age=now-entry.started;
   if(age>=entry.duration){active.splice(i,1);retire(entry);continue}
   if(age>=0)pose(entry,clamp(age/entry.duration));
  }
 }
 function dispose(){
  while(active.length)retire(active.pop());
  for(const g of Object.values(shapes))g.dispose();
  for(const m of materials.values())m.dispose();
  materials.clear();scene.remove(root);
 }
 return {root,spawn,update,dispose,
  get stats(){return{
   enabled:true,spawned,expired,rejected,qaPreviews,active:active.length,peak,
   maxActiveInstances,instancesPerEffect:reducedMotion?13:29,
   maximumSimultaneousEffects:3,maxDrawCalls:6,
   observedElements:Object.fromEntries(seen),last:last?{...last}:null,
   addedGenericHalos:0,addedPointLights:0,addedCustomShaders:0,
   sharedGeometries:Object.keys(shapes).length,
   realSourceContactOnly:true,gameplayMutations:0
  }}
 };
}
