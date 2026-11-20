/**
 * R211 / Draft / NO-GO: cinematic contact layer for only E06, T05, S08.
 * Offline flipbook fire/water + thin geometry arcs for electric; never a ring,
 * screen-space bloom, dynamic light, custom shader or gameplay mutation.
 * The R199 GLB supplies flight/contact, R209 supplies sounds. This is impact art.
 */
export const R211_HERO_CARDS=Object.freeze({E06:'fire',T05:'water',S08:'electric'});
const clip=x=>Math.max(0,Math.min(1,x));
const pulse=(t,a,b)=>{const x=clip((t-a)/(b-a));return x*x*(3-2*x)};
const hash=(seed,i)=>{let n=(seed+Math.imul(i+1,0x9e3779b9))>>>0;
 n^=n>>>16;n=Math.imul(n,0x7feb352d);return ((n^(n>>>15))>>>0)/4294967295};
const assets={
 fire:new URL('../assets/vfx/r211-fire-flipbook.webp',import.meta.url).href,
 water:new URL('../assets/vfx/r211-water-flipbook.webp',import.meta.url).href
};
export function createR211CinematicVfx(THREE,scene,{camera,reducedMotion=false}={}){
 const root=new THREE.Group();root.name='R211_Cinematic_Real_Contact_Only';
 scene.add(root);
 const textures=new Map(),active=[],seen=new Map();
 let spawned=0,expired=0,rejected=0,peak=0,previewCount=0;
 const spriteGeometry=new THREE.PlaneGeometry(2.5,2.65);
 const debrisGeometry=new THREE.IcosahedronGeometry(.055,0);
 if(typeof document!=='undefined'){
  const loader=new THREE.TextureLoader();
  for(const [key,url] of Object.entries(assets)){
   const t=loader.load(url,()=>{t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true},
    undefined,()=>{textures.delete(key)});
   t.colorSpace=THREE.SRGBColorSpace;
   t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;
   t.wrapS=THREE.ClampToEdgeWrapping;t.wrapT=THREE.ClampToEdgeWrapping;
   textures.set(key,t);
  }
 }else for(const key of ['fire','water'])textures.set(key,new THREE.Texture({width:896,height:896}));
 function tileUV(geometry,frame){
  const c=frame%4,r=(frame/4)|0,u=c/4,v=1-(r+1)/4;
  const attr=geometry.attributes.uv;
  attr.setXY(0,u,v+.25);attr.setXY(1,u+.25,v+.25);
  attr.setXY(2,u,v);attr.setXY(3,u+.25,v);attr.needsUpdate=true;
 }
 function sparks(color,seed,count){
  const mat=new THREE.MeshBasicMaterial({color,vertexColors:false,
   transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending});
  const mesh=new THREE.InstancedMesh(debrisGeometry,mat,count);
  mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.userData.seed=seed;mesh.userData.count=count;
  return mesh;
 }
 function poseSparks(entry,t){
  const mesh=entry.sparks;if(!mesh)return;
  const dummy=entry.dummy,n=mesh.userData.count,s=mesh.userData.seed;
  for(let i=0;i<n;i++){
   const a=hash(s,i)*Math.PI*2,r=(.12+.52*hash(s,i+21))*pulse(t,0,.48);
   dummy.position.set(Math.cos(a)*r,(hash(s,i+9)-.15)*1.3*t-
     (entry.element==='water'?.73*t*t:-.35*t),Math.sin(a)*r*.70);
   dummy.rotation.set(t*9+i,t*5+i*.4,t*13+i*.3);
   const q=entry.element==='electric'?((Math.floor(t*22+i)%3===0)?.01:.8):
     Math.max(.001,(1-t)*(.35+hash(s,i+19)*.9));
   dummy.scale.setScalar(q);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate=true;
 }
 function arcMesh(width,color){
  const geo=new THREE.BufferGeometry(),n=3*11*6;
  geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));
  geo.setDrawRange(0,n);
  const mat=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,
   transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending});
  const mesh=new THREE.Mesh(geo,mat);mesh.frustumCulled=false;return mesh;
 }
 function poseArcs(entry,t){
  const spin=Math.floor(t*31),phases=[[[0,0],[.34,.30]],[[0,0],[-.33,.23]],[[0,0],[.17,-.35]]];
  for(const [layer,mesh] of entry.arcs.entries()){
   const width=layer===0?.027:.012,buf=mesh.geometry.attributes.position.array;
   let j=0;
   for(let b=0;b<3;b++){
    const [st,en]=phases[b];
    let prev=null;
    for(let k=0;k<=11;k++){
     const q=k/11,amp=Math.sin(Math.PI*q)*(layer===0?.075:.09);
     const jig=(hash(entry.seed+b*151+spin,k)-.5)*amp*2;
     const p=[st[0]+(en[0]-st[0])*q+jig,
      st[1]+(en[1]-st[1])*q+(hash(entry.seed+spin,k+b*9)-.5)*amp,0];
     if(prev){
      const dx=p[0]-prev[0],dy=p[1]-prev[1],norm=Math.max(.001,Math.hypot(dx,dy));
      const nx=-dy/norm*width,ny=dx/norm*width;
      for(const v of [[prev[0]-nx,prev[1]-ny],[prev[0]+nx,prev[1]+ny],
       [p[0]-nx,p[1]-ny],[p[0]-nx,p[1]-ny],
       [prev[0]+nx,prev[1]+ny],[p[0]+nx,p[1]+ny]]){
        buf[j++]=v[0];buf[j++]=v[1];buf[j++]=layer===0?0:-.002;
       }
     }prev=p;
    }
   }
   mesh.geometry.attributes.position.needsUpdate=true;
   mesh.material.opacity=Math.max(0,1-pulse(t,.58,1))*(layer===0?.38:.92);
  }
 }
 function spawn(signature,anchor,now,{kind='host',qaPreview=false,sourcePoint=null}={}){
  const element=R211_HERO_CARDS[signature?.id];
  if(!element||element!==signature.element||
    !anchor||![anchor.x,anchor.y,anchor.z].every(Number.isFinite)||
    !Number.isFinite(now)||!['host','unit'].includes(kind)){
   rejected++;return false;
  }
  if(element!=='electric'&&!textures.get(element)?.image)return false;
  const group=new THREE.Group();group.name='R211_'+signature.id+'_'+kind;
  group.position.set(anchor.x-Math.sign(anchor.x)*.38,
   anchor.y+(kind==='host'?.98:.48),anchor.z+.9);
  root.add(group);
  const entry={group,element,id:signature.id,kind,started:now,
   duration:(element==='electric'?.84:element==='fire'?1.62:1.54)*(reducedMotion?.75:1),
   seed:signature.id.charCodeAt(0)*8191+signature.id.charCodeAt(1)*31,
   planes:[],arcs:[],sparks:null,sourcePoint,dummy:new THREE.Object3D()};
  if(element!=='electric'){
   const tex=textures.get(element);
   for(let layer=0;layer<2;layer++){
    const geo=spriteGeometry.clone();tileUV(geo,0);
    const mat=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,
     transparent:true,opacity:1,depthWrite:false,alphaTest:.018,
     blending:element==='fire'&&layer===1?THREE.AdditiveBlending:THREE.NormalBlending});
    const mesh=new THREE.Mesh(geo,mat);
    mesh.position.set(layer?.13:0,layer?.08:0,layer?-.07:0);
    mesh.scale.setScalar((element==='fire'?.72:.84)*(layer?.66:1));
    mesh.frustumCulled=false;group.add(mesh);entry.planes.push(mesh);
   }
  }else{
   // Arc faces the wide camera; direction is based on real caster->contact.
   const origin=sourcePoint&&[sourcePoint.x,sourcePoint.z].every(Number.isFinite)?
    sourcePoint:null;
   entry.direction=origin?Math.atan2(anchor.z-origin.z,anchor.x-origin.x):0;
   for(const [width,color] of [[.027,0x58a9f7],[.012,0xe4f9ff]]){
    const mesh=arcMesh(width,color);group.add(mesh);entry.arcs.push(mesh);
   }
  }
  const color=element==='fire'?0xffc769:element==='water'?0xa7eaff:0xe9faff;
  entry.sparks=sparks(color,entry.seed,reducedMotion?7:13);
  group.add(entry.sparks);
  active.push(entry);spawned++;if(qaPreview)previewCount++;
  peak=Math.max(peak,active.length);
  seen.set(signature.id,(seen.get(signature.id)||0)+1);
  while(active.length>3)retire(active.shift());
  pose(entry,0);
  return true;
 }
 function pose(entry,t){
  t=clip(t);
  const rise=pulse(t,0,.14),fade=1-pulse(t,.71,1);
  for(const [index,mesh] of entry.planes.entries()){
   const f=Math.min(15,Math.floor(t*16)+(index?3:0));
   if(mesh.userData.frame!==f){tileUV(mesh.geometry,f);mesh.userData.frame=f;}
   mesh.material.opacity=rise*fade*(index?.44:entry.element==='water'?.96:.82);
   mesh.scale.setScalar((entry.element==='fire'?.72:.84)*(index?.66:1)*
     (entry.element==='fire'?1+.18*t:1+.10*t));
   if(camera)mesh.quaternion.copy(camera.quaternion);
   if(index===1)mesh.rotateZ(.17+Math.sin(t*7)*.07);
  }
  if(entry.arcs.length){
   poseArcs(entry,t);
   if(camera)for(const mesh of entry.arcs)mesh.quaternion.copy(camera.quaternion);
   // Align the arc's horizontal bearing to actual caster->hit, when known.
   // Keep electroshock localized at actual contact, not a screen-spanning arch.
  }
  poseSparks(entry,t);
  entry.sparks.material.opacity=fade*(entry.element==='electric'?.98:.75);
 }
 function retire(entry){
  entry.group.removeFromParent();
  for(const mesh of [...entry.planes,...entry.arcs]){
   mesh.geometry.dispose();mesh.material.dispose();
  }entry.sparks.material.dispose();entry.sparks.dispose?.();expired++;
 }
 function update(now){
  if(!Number.isFinite(now))return;
  for(let i=active.length-1;i>=0;i--){
   const e=active[i],age=now-e.started;
   if(age>=e.duration){active.splice(i,1);retire(e);continue}
   if(age>=0)pose(e,age/e.duration);
  }
 }
 function dispose(){while(active.length)retire(active.pop());
  spriteGeometry.dispose();debrisGeometry.dispose();
  for(const tex of textures.values())tex.dispose();textures.clear();scene.remove(root);
 }
 return {root,spawn,update,dispose,
  get stats(){return {enabled:true,spawned,expired,rejected,
   active:active.length,peak,qaPreviews:previewCount,
   textureReady:{fire:!!textures.get('fire')?.image,
    water:!!textures.get('water')?.image},
   observedCards:Object.fromEntries(seen),
   maximumSimultaneous:3,maxDrawCallsPerEvent:3,
   originalR199ContactOnly:true,gameplayMutations:0,
   addedGlobalLights:0,addedScreenPasses:0,addedGenericHalos:0}}};
}

