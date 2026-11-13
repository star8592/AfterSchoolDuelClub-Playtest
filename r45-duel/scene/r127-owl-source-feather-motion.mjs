/**
 * R127: actual owl feather anatomy. The source CC0 R84 bird has 129 real
 * individually-modelled meshes but zero skin and no embedded animations.
 * Grouping ORIGINAL existing wing meshes by their shoulder pivots produces
 * coordinated feathers rather than rotating only the entire bird actor.
 * No substitute meshes, material/texture/triangle changes, or rules mutation.
 */
export function createR127OwlSourceFeathers(THREE,source,{reduced=false}={}){
 const core=source.getObjectByName('Owl');
 if(!core)throw Error('R127 owl source root Owl absent');
 let actualSourceMeshes=0;
 core.traverse(o=>{if(o.isMesh)actualSourceMeshes++});
 if(actualSourceMeshes!==129)throw Error('R127 source model 129 mesh contract failed '+actualSourceMeshes);
 const wings=[[],[]],tufts=[[],[]],eyes=[[],[]],tail=[];
 const norm=name=>String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const pairs=Object.freeze({
  wing:['Cambered folded wing foundation','Layered wing covert','Overlapping closed flight feather'],
  eye:['Flush golden owl iris','Round dark owl pupil','Tiny owl corneal reflection'],
  tuft:['Paired owl feather tuft, not an anatomical ear']
 });
 core.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const name=mesh.name;
  const key=norm(name);
  // GLTFLoader sanitizes spaces and periods in author-created mesh names.
  // The *content* of the original source names, not their punctuation, is invariant.
  if(pairs.wing.some(x=>key.startsWith(norm(x)))){
   wings[key.endsWith('001')?1:0].push(mesh);
  }else if(pairs.eye.some(x=>key.startsWith(norm(x)))){
   eyes[key.endsWith('001')?1:0].push(mesh);
  }else if(pairs.tuft.some(x=>key.startsWith(norm(x)))){
   tufts[/00[345]$/.test(key)?1:0].push(mesh);
  }else if(key.startsWith(norm('Overlapping tail rectrix ')))tail.push(mesh);
 });
 if(wings.some(x=>x.length<28)||eyes.some(x=>x.length!==3)||tufts.some(x=>x.length!==3)||tail.length!==8)
  throw Error('R127 must bind native owl feathers/eyes EXACT source parts '+JSON.stringify({
   wings:wings.map(x=>x.length),eyes:eyes.map(x=>x.length),
   tufts:tufts.map(x=>x.length),tail:tail.length
  }));
 const groups=[];
 const convertLocal=(obj,target)=>{
  const world=obj.getWorldPosition(new THREE.Vector3());
  return target.worldToLocal(world);
 };
 function groupSource(parts,name,kind,index){
  const parent=parts[0].parent;
  if(parts.some(x=>x.parent!==parent))throw Error('R127 owl part parent mismatch '+name);
  source.updateMatrixWorld(true);
  const bounds=new THREE.Box3();
  for(const mesh of parts)bounds.union(new THREE.Box3().setFromObject(mesh));
  const center=convertLocal({getWorldPosition:t=>bounds.getCenter(t)},parent);
  if(kind==='wing'){
   // Hinge at shoulder side of the real folded wing, not wing tip. The
   // original mesh vertex coordinates are all retained through attach().
   center.y=Math.max(center.y,.20);
   center.z=Math.sign(center.z)*Math.min(.079,Math.abs(center.z));
  }
  const pivot=new THREE.Group();pivot.name=name;
  parent.add(pivot);
  pivot.position.copy(center);
  parent.updateMatrixWorld(true);
  for(const mesh of parts)pivot.attach(mesh);
  groups.push(pivot);
  return pivot;
 }
 const featherGroups=wings.map((parts,i)=>groupSource(parts,'R127_RealSourceWing_'+i,'wing',i));
 const eyeGroups=eyes.map((parts,i)=>groupSource(parts,'R127_SourceOwlEye_'+i,'eye',i));
 const tuftGroups=tufts.map((parts,i)=>groupSource(parts,'R127_SourceHeadTuft_'+i,'tuft',i));
 const tailGroup=groupSource(tail,'R127_SourceTailFeathers','tail',0);
 // Track actual POINTS ON THE EXISTING GEO METRY, not only pivot matrices.
 const tipSamples=featherGroups.map((pivot,i)=>{
  const feather=wings[i].find(x=>norm(x.name).startsWith(norm('Overlapping closed flight feather 00')));
  if(!feather)throw Error('R127 missing owl source wing tip');
  feather.geometry.computeBoundingBox();
  const bounds=feather.geometry.boundingBox;
  const corners=[];
  for(const x of [bounds.min.x,bounds.max.x])
   for(const y of [bounds.min.y,bounds.max.y])
    for(const z of [bounds.min.z,bounds.max.z])
     corners.push(new THREE.Vector3(x,y,z));
  source.updateMatrixWorld(true);
  const pivotWorld=pivot.getWorldPosition(new THREE.Vector3());
  const local=corners.sort((a,b)=>
   b.clone().applyMatrix4(feather.matrixWorld).distanceToSquared(pivotWorld)-
   a.clone().applyMatrix4(feather.matrixWorld).distanceToSquared(pivotWorld))[0];
  // Actor instance moves across the court. Compare source-local vertex
  // coordinates so whole-body translation never masquerades as a wing flap.
  return{mesh:feather,local,original:source.worldToLocal(feather.localToWorld(local.clone()))};
 });
 const startEye=eyeGroups.map(g=>g.position.clone());
 const signs=featherGroups.map(g=>Math.sign(g.position.z)||1);
 let state='idle',elapsed=0,frames=0;
 let movingFrames=0,maxTipTravel=0,maxAngle=0,eyeMovement=0;
 const sin=Math.sin,abs=Math.abs,min=Math.min,max=Math.max,PI=Math.PI;
 const smooth=t=>{const u=max(0,min(1,t));return u*u*(3-2*u)};
 const rise=(t,a,b,c,d)=>smooth((t-a)/(b-a))*(1-smooth((t-c)/(d-c)));
 const play=kind=>{
  if(!['idle','walk','attack','hit','celebrate','enter','defeat'].includes(kind))kind='idle';
  if(kind===state&&kind==='idle')return true;
  state=kind;elapsed=0;return true;
 };
 function update(dt){
  frames++;elapsed+=max(0,min(.06,dt));
  // Special action wind-up, emphatic motion and soft recovery.
  const mode=state;
  let power=0,frequency=2.3,posture=0;
  if(mode==='idle'){power=.10;frequency=2.3;}
  else if(mode==='walk'){power=.47;frequency=7.0;}
  else if(mode==='enter'){power=.62*rise(elapsed,0,.1,.85,1.30);frequency=8;}
  else if(mode==='attack'){power=.92*rise(elapsed,0,.15,.52,1.15);frequency=10;}
  else if(mode==='hit'){power=.48*rise(elapsed,0,.06,.38,.84);frequency=12;posture=-.10;}
  else if(mode==='celebrate'){power=.70*rise(elapsed,0,.13,1.15,1.85);frequency=8;}
  else if(mode==='defeat'){power=.32*smooth(elapsed/.5);frequency=1.7;posture=-.18;}
  if(reduced)power*=.25;
  const cycle=sin(elapsed*frequency+(mode==='idle'?0:.35));
  const spread=(mode==='attack'||mode==='celebrate'?power*(.50+.50*cycle):
    power*(.55+.45*cycle));
  for(let i=0;i<2;i++){
   // Source geometry remains independent, both wings flap in synchrony.
   // Mirroring uses true source-side z sign so the shoulder rotates outward.
   const pivot=featherGroups[i];
   const a=-(signs[i])*spread;
   pivot.rotation.set(a,0,posture*.17);
   maxAngle=max(maxAngle,abs(a));
   const eye=eyeGroups[i];
   eye.position.copy(startEye[i]);
   const gaze=.0030*sin(elapsed*2.7+(i===0?.1:.35))+
    (mode==='hit'?-.004*rise(elapsed,0,.08,.24,.48):0);
   eye.position.x+=gaze;
   eye.position.y+=.0018*sin(elapsed*2+(i*.20));
   eyeMovement=max(eyeMovement,abs(gaze));
   tuftGroups[i].rotation.x=(i===0?1:-1)*(.035*sin(elapsed*3.2)+power*.12);
  }
  tailGroup.rotation.x=.035*sin(elapsed*2.4)+spread*.15;
  source.updateMatrixWorld(true);
  for(const point of tipSamples){
   const actual=source.worldToLocal(point.mesh.localToWorld(point.local.clone()));
   maxTipTravel=max(maxTipTravel,actual.distanceTo(point.original));
  }
  if(spread>.11)movingFrames++;
  if(mode!=='idle'&&mode!=='walk'&&mode!=='defeat'&&elapsed>2.1)play('idle');
 }
 const inspect=()=>({
  enabled:true,sourceGeometry:true,sourceMeshes:actualSourceMeshes,
  wingMeshCounts:wings.map(x=>x.length),eyeMeshCounts:eyes.map(x=>x.length),
  tuftMeshCounts:tufts.map(x=>x.length),tailMeshCount:tail.length,
  active:state,frames,movingFrames,peakWingAngle:+maxAngle.toFixed(4),
  peakTipVertexTravel:+maxTipTravel.toFixed(4),peakEyeMovement:+eyeMovement.toFixed(5),
  sourceWingGroups:featherGroups.map(x=>x.name),reduced
 });
 return{play,update,inspect};
}
