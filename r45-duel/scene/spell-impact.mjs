/**
 * R81 original impact choreography for real, already-resolved card effects.
 * This visual layer never changes HP, shields, winner or turn ownership.
 * Different playable spell cards intentionally have different silhouettes:
 * blackboard eraser strike, sonic broadcast, repair crystals,
 * field-note glyphs, warm canteen magic and rally energy.
 */
export const SPELL_CHOREOGRAPHY=Object.freeze({
 E05:{kind:'rally',label:'声浪加速',target:'allies'},
 E06:{kind:'eraser',label:'巨型黑板擦撞击',target:'enemy'},
 G05:{kind:'repair',label:'水晶修补',target:'allies'},
 G06:{kind:'pages',label:'立体书页符阵',target:'allies'},
 T05:{kind:'warmth',label:'暖汤光潮',target:'allies'},
 T06:{kind:'sonic',label:'广播声浪冲击',target:'enemy'}
});
const smooth=v=>{const x=Math.min(1,Math.max(0,v));return x*x*(3-2*x)};
export function createSpellImpact(THREE,scene){
 const root=new THREE.Group();root.name='R81_Resolved_Spell_Impact_Choreography';scene.add(root);
 const active=[];let played=0,hits=0,noHit=0,expired=0;
 const additive=THREE.AdditiveBlending;
 const circleGeo=new THREE.TorusGeometry(1,.038,8,72);
 const orbGeo=new THREE.IcosahedronGeometry(1,2);
 const rockGeo=new THREE.BoxGeometry(1.03,.43,.73);
 const sheetGeo=new THREE.BoxGeometry(.62,.85,.04);
 const mat=(c,o=1)=>new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,depthWrite:false,
  side:THREE.DoubleSide,blending:additive,toneMapped:false});
 function ring(parent,c,opacity=.8){const mesh=new THREE.Mesh(circleGeo,mat(c,opacity));
  mesh.rotation.x=Math.PI/2;parent.add(mesh);return mesh;}
 function mesh(parent,geometry,c){const m=new THREE.Mesh(geometry,mat(c,.9));parent.add(m);return m;}
 function play(m,now=0){
  if(!m||m.type!=='ASDC_R81_SPELL_RESULT'||!['player','ai'].includes(m.side)||
     !Number.isFinite(m.serial)||!SPELL_CHOREOGRAPHY[m.card])return false;
  const recipe=SPELL_CHOREOGRAPHY[m.card],offensive=recipe.target==='enemy';
  const foe=m.side==='player'?'ai':'player';
  const side=offensive?foe:m.side;
  const x=(side==='player'?-1:1)*(offensive&&m.directDamage>0?5.55:1.75);
  const validHits=Number.isFinite(m.damage)&&m.damage>0;
  const g=new THREE.Group();g.position.set(x,0,0);root.add(g);
  const colors={eraser:['#ff9e53','#f6e2a9'],sonic:['#69c6ff','#c5f8ff'],
   repair:['#6effc2','#e5fff6'],pages:['#ca96ff','#f5dafa'],
   warmth:['#ffc36e','#fff1b8'],rally:['#ffaf6d','#ffe5a6']};
  const [color,light]=colors[recipe.kind];
  const rings=[ring(g,color),ring(g,light),ring(g,color)];
  for(const r of rings)r.position.y=.20;
  const core=mesh(g,recipe.kind==='eraser'?rockGeo:orbGeo,recipe.kind==='eraser'?'#5e7f91':light);
  if(recipe.kind==='eraser'){
   core.material.dispose();
   core.material=new THREE.MeshStandardMaterial({color:'#34485c',roughness:.75,metalness:.06});
  }
  core.position.y=1.28;
  if(recipe.kind!=='eraser')core.scale.setScalar(.22);
  const projectiles=[];
  if(recipe.kind==='pages'){
   for(let i=0;i<7;i++){const p=mesh(g,sheetGeo,i%2?light:color);projectiles.push(p);}
  }else if(recipe.kind==='repair'||recipe.kind==='sonic'){
   for(let i=0;i<8;i++){const shard=mesh(g,new THREE.ConeGeometry(.13,.58,5),i%2?light:color);projectiles.push(shard);}
  }else if(recipe.kind==='eraser'){
   const paper=mesh(g,new THREE.BoxGeometry(.98,.08,.67),'#e9dbc2');
   paper.material.dispose();
   paper.material=new THREE.MeshStandardMaterial({color:'#efe1c4',roughness:.84});
   core.add(paper);paper.position.y=.22;projectiles.push(paper);
   // Distinct heavy impact silhouette: chipped rock / chalk splinters burst
   // away from the actual target, NOT another expanding colored sphere.
   for(let j=0;j<14;j++){
     const chip=mesh(g,new THREE.TetrahedronGeometry(.10+(j%4)*.024),j%3?'#e5ddc7':'#7e8a9a');
     chip.userData.r82Debris=j;projectiles.push(chip);
   }
  }else{
   for(let i=0;i<9;i++)projectiles.push(mesh(g,orbGeo,i%2?color:light));
  }
  const bolts=[];
  if(recipe.kind==='sonic'){
   for(let k=0;k<5;k++){
    const geometry=new THREE.BufferGeometry();
    const array=new Float32Array(16*3);geometry.setAttribute('position',new THREE.BufferAttribute(array,3));
    const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({
     color:k%2?light:color,transparent:true,opacity:0,blending:additive,depthWrite:false}));
    g.add(line);bolts.push({line,array});
   }
  }
  const flash=new THREE.PointLight(color,0,5.0,2);flash.position.set(0,1.35,0);g.add(flash);
  const duration=recipe.kind==='eraser'?1.52:recipe.kind==='sonic'?1.68:1.45;
  active.push({g,rings,core,projectiles,bolts,flash,recipe,side,created:now,duration,
   validHits,damage:m.damage||0,serial:m.serial,color});
  played++;if(validHits)hits++;else noHit++;
  while(active.length>7){disposeOne(active.shift());expired++;}
  return true;
 }
 function disposeOne(a){
  root.remove(a.g);a.g.traverse(o=>{
   if(o.material){const arr=Array.isArray(o.material)?o.material:[o.material];arr.forEach(m=>m.dispose());}
   // Shared circle, orb and eraser geometries disposed after all effects.
   if(o.geometry&&o.geometry!==circleGeo&&o.geometry!==orbGeo&&o.geometry!==rockGeo&&o.geometry!==sheetGeo)o.geometry.dispose();
  });
 }
 function update(now=0){
  for(let i=active.length-1;i>=0;i--){
   const a=active[i],age=Math.max(0,now-a.created);
   if(age>a.duration){disposeOne(a);active.splice(i,1);expired++;continue;}
   const t=age/a.duration,charge=smooth(t/.20),boom=smooth((t-.24)/.18);
   const fading=1-smooth((t-.70)/.30),scale=.16+2.20*boom;
   a.rings.forEach((r,j)=>{
    const shock=a.recipe.kind==='eraser'?smooth((t-.52)/.12):1;
    r.scale.setScalar(scale*(.74+j*.34));r.material.opacity=(.8-j*.18)*fading*shock*(a.validHits?1:.52);
    r.position.y=.15+.04*j;
   });
   const kind=a.recipe.kind;
   if(kind==='eraser'){
    // Projectile travels across the entire duel arena from the caster,
    // physically reaches the rival, then breaks into heavy fragments.
    const travel=smooth(t/.64);
    const sign=a.side==='ai'?1:-1;
    a.core.position.set(-sign*11.1*(1-travel),
      2.36+1.18*Math.sin(travel*Math.PI)-1.07*travel,0);
    a.core.rotation.set(t*2.2,t*4.1,t*1.9);
    a.core.material.opacity=travel>.97?.90*fading:1;
    a.core.scale.setScalar((.68+.80*charge)*fading);
    for(const shard of a.projectiles){
      const j=shard.userData.r82Debris;
      if(j===undefined)continue;
      const scatter=smooth((t-.56)/.17);
      const angle=j*Math.PI*2/14;
      const radius=(.4+j%4*.23)*scatter;
      shard.position.set(Math.cos(angle)*radius,.27+.75*scatter+(.17*j%3),Math.sin(angle)*radius);
      shard.rotation.set(t*(j+2),t*3,j*.58);
      shard.scale.setScalar(scatter*fading);
      shard.material.opacity=scatter*fading;
    }
   }else if(kind==='sonic'){
    a.core.visible=false;
    a.bolts.forEach(({line,array},j)=>{
     for(let n=0;n<16;n++){
      const u=n/15;
      array[n*3]=(u*3-1.5)*Math.cos(j*Math.PI*.4);
      array[n*3+1]=.75+u*.5+Math.sin(u*19+now*15+j)*.12;
      array[n*3+2]=(u*3-1.5)*Math.sin(j*Math.PI*.4);
     }
     line.geometry.attributes.position.needsUpdate=true;
     line.material.opacity=fading*charge;
    });
   }else{
    a.core.position.y=1.0+.16*Math.sin(t*12);
    a.core.scale.setScalar(.15+.30*charge);
    a.core.rotation.y=t*8;
    a.core.material.opacity=.62*fading;
   }
   if(kind==='pages'||kind==='repair'||kind==='sonic'||kind==='warmth'||kind==='rally'){
    a.projectiles.forEach((p,j)=>{
     const angle=j*Math.PI*2/a.projectiles.length+now*(kind==='pages'?2:3);
     const radius=.3+1.2*smooth(t/.5);
     p.position.set(Math.cos(angle)*radius,.4+.5*Math.sin(angle*2)+.4*boom,Math.sin(angle)*radius);
     p.rotation.set(t*3+j,angle,t*2);p.scale.setScalar((.25+.4*charge)*fading);
     p.material.opacity=.75*fading;
    });
   }
   a.flash.intensity=(a.validHits?8.5:3.1)*fading*charge*(.6+.4*Math.sin(18*t)**2);
  }
 }
 function dispose(){while(active.length)disposeOne(active.pop());
  root.removeFromParent();[circleGeo,orbGeo,rockGeo,sheetGeo].forEach(g=>g.dispose());
 }
 return{play,update,dispose,get stats(){return{played,hits,noHit,expired,
  active:active.length,activeKinds:active.map(a=>a.recipe.kind),ruleMutations:0};}};
}
