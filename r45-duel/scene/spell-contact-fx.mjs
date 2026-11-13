/**
 * R121 — target-anchored physical spell contact. Never mutates game rules.
 * Different geometries / movement envelopes for the fifteen elements,
 * deliberately not one recolored sphere. No third-party effect assets.
 */
import {ELEMENTS} from './spell-response-contract.mjs';
const clamp=x=>Math.min(1,Math.max(0,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
export function createSpellContactFX(THREE,scene,{reducedMotion=false}={}){
 const root=new THREE.Group();root.name='R121_Elemental_Real_Target_Contacts';
 scene.add(root);
 const active=[];const MAX=8;
 let spawned=0,expired=0,rejected=0,peak=0;
 function add(parent,geometry,color,opacity=.82,glow=false){
  const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity,
   depthWrite:false,side:THREE.DoubleSide,
   blending:glow?THREE.AdditiveBlending:THREE.NormalBlending});
  const mesh=new THREE.Mesh(geometry,material);
  parent.add(mesh);mesh.userData.baseOpacity=opacity;
  return mesh;
 }
 function shard(group,color,i,n,shape='crystal'){
  const geom=shape==='disc'?new THREE.TorusGeometry(.18,.036,6,15):
    shape==='leaf'?new THREE.ConeGeometry(.13,.48,5):
    shape==='rock'?new THREE.DodecahedronGeometry(.17,0):
    new THREE.TetrahedronGeometry(.15,0);
  const obj=add(group,geom,color,.85,i%2===0);
  const a=i*Math.PI*2/n;
  obj.position.set(Math.cos(a)*.34,.65+(.21*(i%4)),Math.sin(a)*.32);
  obj.userData.angle=a;obj.userData.phase=i;obj.userData.role=shape;
  return obj;
 }
 // Distinct 3D silhouettes and dynamics for each actual element, built
 // entirely from original geometry. The 32 pre-existing casting motifs
 // remain separate in magic-arsenal.mjs; this is the real TARGET payoff.
 function addElementForm(group,parts,element,color,accent,variant){
  const limit=reducedMotion?3:6;
  function part(geom,i,xyz,{shade=color,opacity=.65,glow=false,rotation=null}={}){
   const p=add(group,geom,shade,opacity,glow);
   p.position.set(...xyz);
   if(rotation)p.rotation.set(...rotation);
   p.userData.role='form';p.userData.phase=i;p.userData.form=element;
   p.userData.home=xyz;p.userData.initialScale=1;
   parts.push(p);return p;
  }
  if(element==='fire'){
   for(let i=0;i<limit;i++){
    const a=(i+variant*.12)*Math.PI*2/limit;
    part(new THREE.ConeGeometry(.16+(i%2)*.04,.56+(i%3)*.10,7),i,
     [Math.cos(a)*.38,.70,Math.sin(a)*.25],
     {shade:i%2?accent:color,opacity:.88,glow:true});
   }
  }else if(element==='ice'){
   for(let i=0;i<limit;i++){
    const a=i*Math.PI*2/limit;
    part(new THREE.ConeGeometry(.13,.75+(i%3)*.18,5),i,
     [Math.cos(a)*.38,.83,Math.sin(a)*.38],
     {shade:i%2?accent:color,opacity:.80});
   }
  }else if(element==='wood'||element==='wind'){
   for(let i=0;i<(reducedMotion?2:4);i++){
    const pts=[];
    for(let j=0;j<=17;j++){
     const u=j/17,angle=i*Math.PI*.5+u*Math.PI*(element==='wind'?3.4:1.9);
     const r=element==='wind'?.38+.27*u:.33+.19*Math.sin(u*Math.PI);
     pts.push(new THREE.Vector3(Math.cos(angle)*r,.28+1.48*u,Math.sin(angle)*r));
    }
    part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),30,
      element==='wood'?.042:.028,5,false),i,[0,0,0],
      {shade:i%2?color:accent,opacity:element==='wind'?.60:.90,glow:element==='wind'});
   }
  }else if(element==='water'||element==='absurd'||element==='shadow'){
   for(let i=0;i<limit;i++){
    const a=i*Math.PI*2/limit;
    part(new THREE.SphereGeometry(element==='absurd'?.25:.20,9,7),i,
      [Math.cos(a)*.36,.52+(i%3)*.31,Math.sin(a)*.38],
      {shade:i%2?accent:color,opacity:element==='shadow'?.24:.50,
       glow:element==='water'});
   }
  }else if(element==='earth'||element==='metal'){
   for(let i=0;i<limit;i++){
    const a=i*Math.PI*2/limit;
    part(element==='earth'?new THREE.DodecahedronGeometry(.23,0):
      new THREE.OctahedronGeometry(.23,0),i,
      [Math.cos(a)*.49,.66+(i%3)*.26,Math.sin(a)*.33],
      {shade:i%2?color:accent,opacity:.87});
   }
  }else if(element==='light'){
   for(let i=0;i<limit;i++){
    const a=i*Math.PI*2/limit;
    part(new THREE.CylinderGeometry(.014,.07,.88,5),i,
     [Math.cos(a)*.36,1.06+Math.sin(a)*.26,Math.sin(a)*.39],
     {shade:i%2?accent:color,opacity:.79,glow:true,
      rotation:[Math.sin(a)*.42,0,Math.cos(a)*.5]});
   }
  }else if(element==='time'){
   for(let i=0;i<12;i++){
    const a=i*Math.PI/6;
    part(new THREE.BoxGeometry(.03,i%3===0?.15:.08,.024),i,
      [Math.sin(a)*.51,1.08+Math.cos(a)*.51,.13],
      {shade:i%3===0?accent:color,opacity:.78});
   }
   for(let i=0;i<2;i++){
    part(new THREE.BoxGeometry(.04,i?.48:.30,.026),i,
      [0,1.20,.16],{shade:accent,opacity:.95});
   }
  }else if(element==='space'||element==='sound'){
   for(let i=0;i<(reducedMotion?2:5);i++){
    const a=i*Math.PI*.25;
    part(new THREE.TorusGeometry(.32+i*.12,.032,5,40),i,
      [0,1.14,0],{shade:i%2?accent:color,opacity:.61,glow:true,
       rotation:[element==='space'?a*.45:0,element==='space'?a:0,0]});
   }
  }else if(element==='mind'){
   for(let i=0;i<limit;i++){
    const a=i*Math.PI*2/limit;
    part(new THREE.OctahedronGeometry(.19,0),i,
      [Math.sin(a)*.52,1.07+Math.cos(a)*.4,Math.cos(a)*.22],
      {shade:i%2?accent:color,opacity:.71,glow:true});
   }
  }else if(element==='electric'){
   for(let i=0;i<(reducedMotion?2:4);i++){
    const a=i*Math.PI*.5;
    part(new THREE.CylinderGeometry(.025,.04,.78,5),i,
      [Math.cos(a)*.29,.95,Math.sin(a)*.29],
      {shade:accent,opacity:.9,glow:true,rotation:[Math.sin(a)*.54,0,Math.cos(a)*.46]});
   }
  }
 }
 function play(signature,anchor,now=0,{kind='host'}={}){
  const element=ELEMENTS[signature?.element];
  if(!element||!Number.isFinite(now)||!anchor||!Number.isFinite(anchor.x)||
     !Number.isFinite(anchor.y)||!Number.isFinite(anchor.z)){
   rejected++;return false;
  }
  const group=new THREE.Group();group.name='R121_CONTACT_'+signature.element+'_'+signature.id;
  group.position.set(anchor.x,anchor.y,anchor.z);root.add(group);
  const color=element.color;const accent=new THREE.Color(color).lerp(new THREE.Color(0xffffff),.53);
  const parts=[];
  const ringCount=['water','wind','sound','time','space','mind','shadow'].includes(signature.element)?3:1;
  for(let i=0;i<ringCount;i++){
   const ring=add(group,new THREE.TorusGeometry(.38+i*.19,.032,6,36),
    i%2?accent:color,.57,true);
   ring.position.y=kind==='host'?1.25:1.05;
   ring.rotation.x=signature.element==='wind'||signature.element==='space'?.2:Math.PI/2;
   ring.userData.role='ring';ring.userData.phase=i;parts.push(ring);
  }
  let shape='crystal';
  if(['fire','wood','wind'].includes(signature.element))shape='leaf';
  if(['water','ice','sound','time','mind','space'].includes(signature.element))shape='disc';
  if(['earth','absurd','shadow'].includes(signature.element))shape='rock';
  const count=reducedMotion?5:signature.element==='electric'?11:8;
  // The stable card signature drives individualized burst phase/shape.
  const variant=[...String(signature.signature||signature.id)].reduce(
    (v,c)=>(v*31+c.charCodeAt(0))%997,7)%17;
  for(let i=0;i<count;i++){
   const mote=shard(group,i%2?color:accent,i,count,shape);
   mote.userData.angle+=variant*.047;
   parts.push(mote);
  }
  addElementForm(group,parts,signature.element,color,accent,variant);
  if(signature.element==='electric'){
   for(let i=0;i<4;i++){
    const pts=[[-.34,1.8,-.05],[-.1+(i%2)*.11,1.36,.04],[.20,1.15,-.1],[.07,.72,.12]];
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      pts.map(p=>new THREE.Vector3(...p))),
     new THREE.LineBasicMaterial({color,transparent:true,opacity:.9,
       depthWrite:false,blending:THREE.AdditiveBlending}));
    line.rotation.y=i*Math.PI*.5;group.add(line);
    line.userData={role:'bolt',baseOpacity:.9,phase:i};parts.push(line);
   }
  }
  const light=new THREE.PointLight(color,0,reducedMotion?1.6:2.3,2);
  light.position.y=1.14;group.add(light);
  const duration=reducedMotion?.46:signature.element==='ice'||signature.element==='time'?1.02:.82;
  active.push({group,parts,light,element:signature.element,started:now,duration,
   id:signature.id,target:kind});
  spawned++;peak=Math.max(peak,active.length);
  while(active.length>MAX)disposeOne(active.shift());
  return true;
 }
 function disposeOne(fx){
  fx.group.removeFromParent();
  fx.group.traverse(o=>{o.geometry?.dispose?.();o.material?.dispose?.()});
  expired++;
 }
 function update(now){
  for(let i=active.length-1;i>=0;i--){
   const a=active[i],elapsed=now-a.started;
   if(elapsed<0)continue;
   if(elapsed>=a.duration){disposeOne(a);active.splice(i,1);continue}
   const t=elapsed/a.duration,appear=smooth(t/.13),fade=1-smooth((t-.60)/.40),strength=appear*fade;
   const frozen=a.element==='ice'||a.element==='time';
   for(const p of a.parts){
    const {role,phase=0,angle=0,baseOpacity=.8}=p.userData;
    if(role==='ring'){
     p.scale.setScalar(.55+1.75*smooth(t));
     p.rotation.z+=(frozen?0:.016)*(phase%2?1:-1);
     p.material.opacity=baseOpacity*strength;
    }else if(role==='bolt'){
     p.visible=t<.69&&(Math.floor(t*21+phase)%3!==0);
     p.material.opacity=baseOpacity*strength;
    }else if(role==='form'){
     const home=p.userData.home;
     const wobble=reducedMotion?0:1;
     p.material.opacity=baseOpacity*strength;
     if(a.element==='fire'){
      p.position.y=home[1]+t*.88*wobble;
      p.scale.setScalar(.55+(1.0-t)*.7);
      p.rotation.y=t*2.8+phase*.7;
     }else if(a.element==='earth'){
      p.position.y=home[1]-.67*smooth(t/.48);
      p.rotation.z=t*3*wobble;
     }else if(a.element==='ice'||a.element==='time'){
      p.position.y=home[1];
      p.rotation.z=a.element==='time'&&phase>=12?
       t*(phase===12?4:-2)*wobble:0;
      p.scale.setScalar(.66+.34*smooth(t/.22));
     }else if(a.element==='wood'){
      p.rotation.y=t*1.4*wobble;
      p.scale.setScalar(.5+.52*smooth(t/.26));
     }else if(a.element==='wind'){
      p.rotation.y+=.12*wobble;
      p.scale.setScalar(.67+.39*smooth(t/.38));
     }else if(a.element==='water'){
      p.position.y=home[1]+.34*Math.sin(t*10+phase)*wobble;
      p.scale.setScalar(.60+.52*smooth(t/.22));
     }else if(a.element==='electric'){
      p.visible=(Math.floor(t*27+phase)%3!==0);
      p.rotation.z+=.13*wobble;
     }else if(a.element==='space'){
      p.rotation.x+=.06*wobble;
      p.rotation.y+=.12*wobble;
      p.scale.setScalar(.58+1.2*smooth(t/.72));
     }else if(a.element==='absurd'){
      p.position.y=home[1]+Math.abs(Math.sin(t*11+phase))*t*.68*wobble;
      p.scale.setScalar(.55+Math.abs(Math.sin(t*9+phase))*.6);
     }else{
      p.position.y=home[1]+Math.sin(t*5+phase)*.09*wobble;
      p.rotation.y+=.045*wobble;
      p.scale.setScalar(.75+.4*smooth(t));
     }
    }else{
     const radial=frozen?.37:.37+1.17*smooth(t/.72);
     p.position.x=Math.cos(angle)*radial;
     p.position.z=Math.sin(angle)*radial*.75;
     if(a.element==='water')p.position.y=.25+.62*Math.abs(Math.sin(t*9+phase));
     else if(a.element==='wind')p.position.y=.42+t*1.15+.20*Math.sin(t*17+phase);
     else if(a.element==='fire')p.position.y=.45+t*1.37;
     else if(a.element==='electric')p.position.y=.52+.92*Math.abs(Math.sin(t*19+phase));
     else if(a.element==='earth')p.position.y=.84-1.2*smooth(t);
     else if(frozen)p.position.y=.40+(phase%5)*.24;
     else p.position.y=.52+.55*smooth(t)+.12*Math.sin(t*13+phase);
     p.rotation.z=t*(frozen?.2:5)+(phase*.67);
     p.scale.setScalar((.40+.93*smooth(t/.27))*fade);
     p.material.opacity=baseOpacity*strength;
    }
   }
   a.light.intensity=(reducedMotion?.7:2.5)*strength;
  }
 }
 function reset(){while(active.length)disposeOne(active.pop());}
 function dispose(){reset();root.removeFromParent()}
 return {play,update,reset,dispose,get stats(){return{
  elements:Object.keys(ELEMENTS).length,spawned,expired,rejected,active:active.length,
  peak,activeElements:active.map(x=>x.element),ruleMutations:0
 }}};
}
