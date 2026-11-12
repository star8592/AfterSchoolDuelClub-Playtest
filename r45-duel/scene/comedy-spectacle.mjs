/**
 * R102 real, ephemeral, fully 3D school-comedy celebration layer.
 * No fake characters, no image standees, no untrusted damage/HP claims.
 * Instanced particles + volumetric rings are driven by engine event receipts,
 * scoped to four active shots maximum and automatically cleaned up.
 */
export const R102_SPECTACLES=Object.freeze({
 summon_ember:{color:'#ffb36b',shape:'star',motion:'bounce'},
 summon_grove:{color:'#c4ff8e',shape:'chalk',motion:'spiral'},
 summon_tide:{color:'#8ee3ff',shape:'note',motion:'fountain'},
 spell_buff:{color:'#ffdc8a',shape:'star',motion:'fountain'},
 spell_blast:{color:'#fc8c6b',shape:'star',motion:'burst'},
 spell_repair:{color:'#b6facb',shape:'chalk',motion:'spiral'},
 spell_draw:{color:'#ffeb9c',shape:'paper',motion:'fountain'},
 spell_heal:{color:'#ffb4c9',shape:'heart',motion:'pulse'},
 spell_confuse:{color:'#86d7fb',shape:'note',motion:'swirl'},
 combo_chalk_hit:{color:'#ffe9a5',shape:'chalk',motion:'burst'},
 combo_chalk_direct:{color:'#fbbad9',shape:'star',motion:'burst'},
 combo_broadcast_draw:{color:'#a7e8ff',shape:'note',motion:'swirl'},
 combo_poster_shield:{color:'#a4eff6',shape:'paper',motion:'fountain'},
 combo_poster_draw:{color:'#ffe9b3',shape:'paper',motion:'fountain'},
 actual_exchange:{color:'#fff0aa',shape:'star',motion:'burst'},
 direct_hit:{color:'#f8a79b',shape:'star',motion:'burst'}
});
export function createComedySpectacle(THREE,scene){
 const root=new THREE.Group();
 root.name='R102_Real_3D_Schoolyard_Spectacle';
 scene.add(root);
 // Five original volumetric motifs. Stars, music notes and hearts are
 // genuinely extruded 3D meshes, not flat sprites or low-poly people.
 const extrude=shape=>new THREE.ExtrudeGeometry(shape,{
  depth:.033,steps:1,bevelEnabled:true,bevelThickness:.012,
  bevelSize:.013,bevelSegments:1,curveSegments:7
 });
 const starShape=new THREE.Shape();
 for(let i=0;i<10;i++){
  const a=-Math.PI/2+i*Math.PI/5,r=i%2?.047:.116;
  if(!i)starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r);
  else starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r);
 }
 starShape.closePath();
 const noteShape=new THREE.Shape();
 noteShape.absellipse(-.026,-.059,.076,.043,0,Math.PI*2,false,0);
 noteShape.moveTo(.034,-.06);noteShape.lineTo(.044,.11);
 noteShape.lineTo(.12,.085);noteShape.lineTo(.118,.055);
 noteShape.lineTo(.050,.078);noteShape.lineTo(.040,-.055);
 const heartShape=new THREE.Shape();
 heartShape.moveTo(0,-.08);
 heartShape.bezierCurveTo(-.13,-.01,-.12,.10,-.036,.105);
 heartShape.bezierCurveTo(0,.10,0,.065,0,.063);
 heartShape.bezierCurveTo(0,.065,.035,.10,.066,.105);
 heartShape.bezierCurveTo(.15,.08,.125,-.01,0,-.08);
 const geometries={
  star:extrude(starShape),
  chalk:new THREE.CylinderGeometry(.035,.04,.23,8),
  note:extrude(noteShape),
  paper:new THREE.BoxGeometry(.18,.13,.016),
  heart:extrude(heartShape)
 };
 const ringGeometry=new THREE.TorusGeometry(.25,.029,8,56);
 const innerGeometry=new THREE.TorusGeometry(.18,.020,7,48);
 const shots=[],seen=new Set(),seenKinds=new Set();
 let played=0,completed=0,last=null,maxActive=0,visibleFrames=0,lastTime=0;
 const dummy=new THREE.Object3D(),white=new THREE.Color('#ffffff');
 const ease=x=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t)};
 const hash=(n,i)=>Math.sin((n+1)*12.9898+(i+1)*78.233)*43758.5453;
 const unit=(n,i)=>{const x=hash(n,i);return x-Math.floor(x)};
 const clean=shot=>{
  root.remove(shot.group);
  shot.mesh.material.dispose();shot.ring.material.dispose();shot.inner.material.dispose();
 };
 function clear(){
  for(const shot of shots.splice(0))clean(shot);
  seen.clear();last=null;
 }
 function trigger(type,side,serial,now,options={}){
  if(!Object.hasOwn(R102_SPECTACLES,type)||!['player','ai'].includes(side)||
   !Number.isInteger(serial)||serial<=0||!Number.isFinite(now))return false;
  const key=type+':'+side+':'+serial;
  if(seen.has(key))return false;
  seen.add(key);if(seen.size>400)seen.clear();
  const style=R102_SPECTACLES[type],sign=side==='player'?-1:1;
  while(shots.length>=4){const old=shots.shift();clean(old)}
  const material=new THREE.MeshBasicMaterial({color:'#ffffff',transparent:true,
   opacity:.84,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const mesh=new THREE.InstancedMesh(geometries[style.shape],material,30);
  mesh.name='R102_Original_Instanced_'+style.motion+'_'+type;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;
  const color=new THREE.Color(style.color);
  for(let i=0;i<30;i++)mesh.setColorAt(i,color.clone().lerp(white,i%4===0?.67:.10));
  mesh.instanceColor.needsUpdate=true;
  const ringMaterial=new THREE.MeshBasicMaterial({color:style.color,transparent:true,
   opacity:.64,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  const ring=new THREE.Mesh(ringGeometry,ringMaterial);
  ring.name='R102_Comic_Shockwave_3D';
  const inner=new THREE.Mesh(innerGeometry,ringMaterial.clone());
  inner.name='R102_Comic_Secondary_Ring_3D';
  const group=new THREE.Group();
  group.add(mesh,ring,inner);
  group.position.set(type.startsWith('summon_')?sign*1.75:
   type.startsWith('combo_')?0:sign*.65,
   type==='spell_draw'||type==='spell_heal'?1.52:1.22,.32);
  root.add(group);
  const shot={type,side,serial,start:now,style,group,mesh,ring,inner,duration:options.reduced?.44:1.23,
   count:options.reduced?8:30};
  shots.push(shot);played++;seenKinds.add(type);last={type,side,serial,shape:style.shape};
  maxActive=Math.max(maxActive,shots.length);
  return true;
 }
 function update(now,reduced=false){
  lastTime=now;
  for(let k=shots.length-1;k>=0;k--){
   const s=shots[k];
   const duration=reduced?.44:s.duration;
   const t=Math.max(0,(now-s.start)/duration),p=Math.min(t,1);
   if(t>=1){shots.splice(k,1);clean(s);completed++;continue}
   const arrive=ease(p/.15),depart=1-ease((p-.67)/.33);
   const alpha=arrive*depart;
   const {mesh,ring,inner,style}=s;
   const spin=(style.motion==='swirl'?7.2:style.motion==='spiral'?4.5:2.0);
   const count=reduced?8:s.count;
   mesh.count=count;
   mesh.material.opacity=.82*alpha;
   for(let i=0;i<count;i++){
    const u=unit(s.serial,i),v=unit(s.serial+57,i);
    const theta=(i*2.3999632+u*.38)+spin*p;
    const radius=(.15+1.45*p)*(.50+.6*v);
    let x=Math.cos(theta)*radius;
    let y=Math.sin(theta)*radius*.53;
    let z=Math.sin(theta*1.8)*radius*.22;
    if(style.motion==='bounce'){
     x+=Math.cos(theta)*.24*Math.sin(p*Math.PI*3)*depart;
     y+=Math.abs(Math.sin(p*Math.PI*2.5))*.38;
    }else if(style.motion==='fountain'){
     y+=p*1.32-(p*p)*.84;
     x+=(u-.5)*.38*p;
    }else if(style.motion==='pulse'){
     y=Math.sin(theta)*radius*.33+p*.21;
    }else if(style.motion==='swirl'){
     y+=.52*Math.sin(p*Math.PI*2+theta*.5);
    }
    dummy.position.set(x,y,z);
    dummy.rotation.set(theta*.29,p*11+i*.23,theta+p*9);
    dummy.scale.setScalar(Math.max(.001,(.3+.8*depart)*(i%3===0?1.18:.78)));
    dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
   }
   mesh.instanceMatrix.needsUpdate=true;
   ring.scale.setScalar(.48+p*5);
   ring.rotation.set(.23+p*.33,p*1.1,p*.9);
   ring.material.opacity=.57*alpha*(1-p*.75);
   inner.scale.setScalar(.3+p*3.4);
   inner.rotation.set(-.25-p*.42,p*.63,-p*1.4);
   inner.material.opacity=.42*alpha*(1-p*.84);
   if(alpha>.1)visibleFrames++;
  }
 }
 return {root,trigger,update,clear,get stats(){return{
  layer:'R102_ORIGINAL_3D_COMIC_PARTICLES',
  played,completed,active:shots.length,maxActive,visibleFrames,
  typesSeen:[...seenKinds],last:last?{...last}:null,
  activeShots:shots.map(x=>({type:x.type,side:x.side,serial:x.serial,
   instances:x.mesh.count,age:Math.round((lastTime-x.start)*10)/10})),
  availableTypes:Object.keys(R102_SPECTACLES).length,
  geometryKinds:Object.keys(geometries).length,
  authorizedByRealEventsOnly:true
 }}};
}
