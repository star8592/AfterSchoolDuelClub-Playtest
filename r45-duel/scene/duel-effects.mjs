/**
 * R46: physically located, restrained anime duel VFX.
 * 3D rings, particle bursts, light pulses. Does not touch core gameplay.
 * Deterministic curves and shader-free meshes prevent visual jitter.
 */
export function createDuelEffects(THREE,scene){
  const root=new THREE.Group();root.name='R46_Duel_Magic_Presentation';scene.add(root);
  const TEAM=['#ffc391','#8fdaff'];
  let updateCount=0,impactRendered=0;
  const mat=(color,opacity)=>new THREE.MeshBasicMaterial({
    color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,
    blending:THREE.AdditiveBlending
  });
  function floorCircle(x,col){
    const m=mat(col,.34);
    const geo=new THREE.CircleGeometry(.9,72);
    const obj=new THREE.Mesh(geo,m);
    obj.rotation.x=-Math.PI/2;obj.position.set(x,.087,0);
    obj.visible=false;root.add(obj);
    return obj;
  }
  function ring(x,r,col,vertical=false,baseOpacity=.68){
    const m=mat(col,baseOpacity),geo=new THREE.TorusGeometry(r,.018,9,96);
    const obj=new THREE.Mesh(geo,m);obj.position.set(x,vertical?1.45:.105,0);
    if(!vertical)obj.rotation.x=Math.PI/2;
    obj.visible=false;root.add(obj);return obj;
  }
  const teams=TEAM.map((c,index)=>{
    const x=index===0?-1.75:1.75;
    const pool=floorCircle(x,c);
    const rings=[ring(x,.67,c,false,.53),ring(x,.94,c,false,.34)];
    const vertical=ring(x,.71,c,true,.42);
    vertical.position.y=1.5;
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.42,.79,3.15,64,1,true),mat(c,.075));
    shaft.position.set(x,1.58,0);
    shaft.visible=false;root.add(shaft);
    const sparkGeo=new THREE.BufferGeometry();
    const pos=new Float32Array(88*3);
    for(let k=0;k<88;k++){
      const t=k/88,r=.17+.8*Math.sqrt(t),a=k*2.399963229728653;
      pos[k*3]=Math.cos(a)*r;
      pos[k*3+1]=.16+(k%13)/12*2.9;
      pos[k*3+2]=Math.sin(a)*r;
    }
    sparkGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const sparkMat=new THREE.PointsMaterial({color:c,transparent:true,opacity:.7,size:.055,
      depthWrite:false,blending:THREE.AdditiveBlending});
    const spark=new THREE.Points(sparkGeo,sparkMat);
    spark.position.x=x;spark.visible=false;root.add(spark);
    const glow=new THREE.PointLight(c,0,4,2);
    glow.position.set(x,1.2,0);root.add(glow);
    return{x,c,pool,rings,vertical,shaft,spark,glow,shown:false,pulseStart:-100};
  });
  const hits=[];
  for(let k=0;k<3;k++){
    const m=ring(0,.32+.18*k,k===1?'#8fe2ff':'#ffe0a0',true,.7);
    m.position.set(0,1.38,.55+k*.04);
    hits.push(m);
  }
  const burstG=new THREE.BufferGeometry(),n=96,vertices=new Float32Array(n*3);
  for(let i=0;i<n;i++){
    const a=i*2.39996323;
    const u=(i+.5)/n,r=.28+.95*Math.sqrt(u);
    vertices[i*3]=Math.cos(a)*r;
    vertices[i*3+1]=Math.sin(a)*r;
    vertices[i*3+2]=Math.sin(i*1.51)*.42;
  }
  burstG.setAttribute('position',new THREE.BufferAttribute(vertices,3));
  const burstMat=new THREE.PointsMaterial({
    color:'#ffe1af',size:.11,transparent:true,opacity:0,
    blending:THREE.AdditiveBlending,depthWrite:false
  });
  const burst=new THREE.Points(burstG,burstMat);
  burst.position.set(0,1.38,.68);
  burst.visible=false;root.add(burst);
  const shock=ring(0,.66,'#fff0cf',false,.75);
  shock.position.y=.115;
  const hitLight=new THREE.PointLight('#ffcb85',0,5,2);
  hitLight.position.set(0,1.40,.55);root.add(hitLight);
  const impactSphere=new THREE.Mesh(
    new THREE.IcosahedronGeometry(.22,2),
    mat('#ffdcad',0));
  impactSphere.position.set(0,1.38,.65);
  impactSphere.visible=false;root.add(impactSphere);
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const ease=x=>{const v=clamp(x);return v*v*(3-2*v)};
  const pulse=(side,absoluteSec)=>{
    const i=side==='player'?0:1;
    teams[i].pulseStart=absoluteSec;
    return i;
  };
  const update=({absoluteSec=0,fightTime=0,playing=false,visible=[false,false],reducedMotion=false}={})=>{
    updateCount++;
    teams.forEach((t,i)=>{
      t.shown=!!visible[i];
      const age=Math.max(0,absoluteSec-t.pulseStart);
      const entrance=clamp(1-age/1.35);
      const isVisible=t.shown||entrance>0.001;
      const breathing=reducedMotion?0:Math.sin(absoluteSec*2.0+i*.7);
      t.pool.visible=isVisible;
      t.pool.material.opacity=t.shown?.085+.035*(1+breathing):entrance*.22;
      t.pool.scale.setScalar(t.shown?1.0+.018*breathing:.4+.7*ease(1-entrance));
      t.rings.forEach((ring,k)=>{
        ring.visible=isVisible;
        ring.material.opacity=t.shown?(.31-k*.12)+.12*entrance:.46*entrance;
        const scale=1+.04*breathing+.09*entrance;
        ring.scale.setScalar(scale);
        ring.rotation.z=0;
      });
      const intense=entrance*entrance;
      t.shaft.visible=intense>.004;
      t.shaft.material.opacity=.115*intense;
      t.vertical.visible=intense>.01;
      t.vertical.material.opacity=.42*intense;
      t.vertical.scale.setScalar(.6+.5*(1-intense));
      t.spark.visible=intense>.006;
      t.spark.material.opacity=.65*intense;
      t.spark.rotation.y=absoluteSec*.23;
      t.glow.intensity=(t.shown?.85:0)+intense*9;
    });
    const phaseCenters=[2.93,4.00];
    let impact=0,attackSide=0;
    if(playing){
      for(let k=0;k<2;k++){
        const diff=Math.abs(fightTime-phaseCenters[k]);
        const v=1-ease(diff/.33);
        if(v>impact){impact=v;attackSide=k}
      }
    }
    if(reducedMotion)impact=Math.min(impact,.55);
    if(impact>.01)impactRendered++;
    hits.forEach((ring,k)=>{
      ring.visible=impact>.01;
      ring.material.color.set(attackSide===0?'#ffd6a1':'#a9dfff');
      ring.material.opacity=impact*(.58-k*.1);
      ring.scale.setScalar((.75+k*.26)+(1-impact)*(.62+k*.19));
    });
    burst.visible=impact>.01;
    burst.scale.setScalar(.45+(1-impact)*1.55);
    burst.rotation.z=0;
    burst.material.opacity=impact*.9;
    shock.visible=impact>.01;
    shock.material.opacity=impact*.72;
    shock.scale.setScalar(1+(1-impact)*1.6);
    hitLight.intensity=impact*23;
    hitLight.color.set(attackSide===0?'#ffe0a7':'#a3d9ff');
    impactSphere.visible=impact>.01;
    impactSphere.material.opacity=impact*.48;
    impactSphere.scale.setScalar(1+(1-impact)*.85);
  };
  return{root,teams,pulse,update,get stats(){return{
    layer:'R46_TRUE_3D_SUMMON_AND_IMPACT',
    teamEffects:teams.length,impactRings:hits.length,particlePoints:88*2+96,
    updateCount,impactRendered,
    liveSummonBeams:teams.filter(t=>t.shaft.visible).length
  }}};
}
