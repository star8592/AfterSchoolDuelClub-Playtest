import {addStadiumPolish} from './stadium-polish.mjs';
/**
 * R45 procedural 3D school-gymnasium battle environment.
 * All architecture (court, bleachers, roof, light rigs, podiums and screens)
 * is 3D mesh. No background plane or false-perspective photo.
 *
 * No gameplay or collision state here. This is the visual world only.
 */
export function createStadium(THREE, scene, {detail='medium'}={}) {
  const stats={label:'R45_ONE_ARENA_GYM_3D',geometryTypes:new Set(),meshCount:0,
    instancedObjects:0,bleacherRows:0,seats:0,lights:0};
  const mat=(color,metalness=0,roughness=.7)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const navy=mat('#24374a',.12,.86),wood=mat('#ab7b51',.04,.44),woodA=mat('#bc885e',.04,.44),
    beam=mat('#485d70',.36,.51),gold=mat('#e6b66f',.24,.5),paint=mat('#e2d3b2',.02,.46),
    coral=mat('#dc8573',.16,.58),teal=mat('#79bcbf',.16,.53),dark=mat('#0a1d30',.12,.75);
  const group=new THREE.Group();group.name='R45_Real_3D_Stadium';scene.add(group);
  function object(geo,material,position,name,cast=false,receive=true){
    const mesh=new THREE.Mesh(geo,material);
    mesh.position.set(...position);mesh.name=name;mesh.castShadow=cast;mesh.receiveShadow=receive;
    group.add(mesh);stats.meshCount++;stats.geometryTypes.add(geo.type);return mesh;
  }
  const box=(size,pos,m,name,cast=false)=>object(new THREE.BoxGeometry(...size),m,pos,name,cast);
  const cylinder=(rt,rb,h,seg,pos,m,name)=>object(new THREE.CylinderGeometry(rt,rb,h,seg),m,pos,name,true);
  const tube=(coords,radius,m,name,segments=50)=>{
    const curve=new THREE.CatmullRomCurve3(coords.map(p=>new THREE.Vector3(...p)));
    return object(new THREE.TubeGeometry(curve,segments,radius,8,false),m,[0,0,0],name,false);
  };
  // Wood grain expressed through actual individual plank geometry instead of
  // a photograph stretched across the scene.
  box([20,.32,12],[0,-.17,0],navy,'Court_Structure');
  // Cover the near-floor region when looking back from 180 degrees.
  // Reversible stands are behind the court from this viewpoint; without
  // apron geometry R48 shows an empty dark void below the near sideline.
  box([20,.032,6.55],[0,.004,-9.23],woodA,'R49_North_Court_Apron');
  box([20,.032,6.55],[0,.004,9.23],woodA,'R49_South_Court_Apron');
  const numPlanks=detail==='low'?14:30;
  const plankGeometry=new THREE.BoxGeometry(20/numPlanks-.01,.036,11.65);
  const planks=new THREE.InstancedMesh(plankGeometry,woodA,numPlanks);
  planks.name='Instanced_Oak_Floor_Planks';
  const tr=new THREE.Object3D();
  for(let i=0;i<numPlanks;i++){
    tr.position.set(-10+(i+.5)*20/numPlanks,.018,0);
    tr.updateMatrix();planks.setMatrixAt(i,tr.matrix);
  }
  planks.receiveShadow=true;group.add(planks);stats.instancedObjects+=1;stats.meshCount++;
  for(let i=0;i<3;i++){
    const stripe=box([.035,.009,11.4],[(i-1)*5,.046,0],paint,'Center_Court_Stripe_'+i);
    stripe.material.transparent=true;stripe.material.opacity=.57;
  }
  // A single circular arena: the fight happens here, NOT in three tactical lanes.
  const ring=(radius,width,material,name,y=.053)=>{
    const m=object(new THREE.RingGeometry(radius-width,radius,110),material,[0,y,0],name,false);
    m.rotation.x=-Math.PI/2;return m;
  };
  ring(2.8,.055,paint,'Single_Battle_Ring',.057);
  ring(2.38,.026,gold,'Conjuration_Aura_Ring',.059);
  const courtDivider=box([.045,.016,11.2],[0,.049,0],paint,'Court_Center_Mark');
  courtDivider.material.transparent=true;courtDivider.material.opacity=.53;
  // Six true 3D rows: raised bleacher steps with structural risers.
  for(let row=0;row<6;row++){
    const y=.31+row*.48;
    const z=-6.5-row*.80;
    box([19,.25,.90],[0,y,z],row%2?beam:navy,'Grandstand_Back_Tier_'+row);
    box([19,.45,.12],[0,y-.3,z-.43],dark,'Grandstand_Riser_'+row);
    stats.bleacherRows++;
  }
  for(const sign of [-1,1])for(let row=0;row<4;row++){
    const y=.28+row*.50,x=sign*(10.8+row*.78);
    box([.74,.22,11],[x,y,0],row%2?beam:navy,'Side_Bleacher_'+sign+'_'+row);
    box([.12,.45,11],[x+sign*.32,y-.27,0],dark,'Side_Riser_'+sign+'_'+row);
  }
  // R112: proper gym retractable-chair architecture, not floating cubes.
  // Padded curved seat + substantial raised back + metal twin support.
  // All hundreds of seats share a handful of InstancedMeshes / draw calls.
  const seatColors=[
    mat('#334963',.08,.82),mat('#477184',.09,.76),mat('#9d7259',.05,.83)
  ];
  const steel=mat('#293947',.32,.68);
  const padding=mat('#27394b',.02,.9);
  function roundedRect(w,h,r){
    const sh=new THREE.Shape();
    sh.moveTo(-w/2+r,-h/2);sh.lineTo(w/2-r,-h/2);
    sh.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
    sh.lineTo(w/2,h/2-r);sh.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
    sh.lineTo(-w/2+r,h/2);sh.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
    sh.lineTo(-w/2,-h/2+r);sh.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
    return sh;
  }
  const seatGeo=new THREE.ExtrudeGeometry(roundedRect(.445,.32,.075),{
    depth:.055,steps:1,bevelEnabled:true,bevelThickness:.012,
    bevelSize:.012,bevelSegments:2,curveSegments:3});
  const backGeo=new THREE.ExtrudeGeometry(roundedRect(.445,.43,.07),{
    depth:.075,steps:1,bevelEnabled:true,bevelThickness:.018,
    bevelSize:.012,bevelSegments:2,curveSegments:3});
  const pedestalGeo=new THREE.BoxGeometry(.045,.20,.055);
  const armGeo=new THREE.BoxGeometry(.075,.055,.22);
  const reverse=new THREE.Group();
  reverse.name='R49_Reverse_Grandstand';
  reverse.visible=false;
  group.add(reverse);
  const rearBox=(size,pos,m,name)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),m);
    mesh.position.set(...pos);mesh.name=name;
    mesh.receiveShadow=true;reverse.add(mesh);stats.meshCount++;
    return mesh;
  };
  for(let row=0;row<6;row++){
    const y=.31+row*.48,z=6.5+row*.80;
    rearBox([19,.25,.90],[0,y,z],row%2?beam:navy,'Reverse_Grandstand_Tier_'+row);
    rearBox([19,.45,.12],[0,y-.3,z+.43],dark,'Reverse_Grandstand_Riser_'+row);
  }
  function seatBank(back=false){
    const destination=back?reverse:group,side=back?-1:1,tiers=6,cols=33;
    const buckets=[[],[],[]];
    for(let row=0;row<tiers;row++)for(let col=0;col<cols;col++){
      // Cohesive color blocks, no random confetti checkerboard.
      const color=Math.floor(col/11)===1?1:
        (Math.floor(row/2)===2&&Math.floor(col/11)===2?2:0);
      const x=-8.85+col*.55,y=.31+row*.48,z=side*(6.5+row*.8);
      buckets[color].push({x,y,z,side});
      stats.seats++;
    }
    const tag=back?'Reverse_Stadium_Seats_Instanced':'Stadium_Seats_Instanced';
    function batch(name,geo,material,positions,pose){
      const batch=new THREE.InstancedMesh(geo,material,positions.length);
      batch.name=name;batch.receiveShadow=true;
      positions.forEach((p,i)=>{
        tr.position.set(0,0,0);tr.rotation.set(0,0,0);tr.scale.set(1,1,1);
        pose(p);
        tr.updateMatrix();batch.setMatrixAt(i,tr.matrix);
      });
      batch.instanceMatrix.needsUpdate=true;
      batch.computeBoundingSphere();
      destination.add(batch);stats.instancedObjects++;stats.meshCount++;
    }
    for(let j=0;j<3;j++){
      const seats=buckets[j];if(!seats.length)continue;
      batch(tag+'_Cushion_Color_'+j,seatGeo,seatColors[j],seats,p=>{
        tr.position.set(p.x,p.y+.205,p.z+p.side*.14);
        tr.rotation.set(-Math.PI/2,p.side<0?Math.PI:0,0);
      });
      batch(tag+'_Backrest_Color_'+j,backGeo,seatColors[j],seats,p=>{
        tr.position.set(p.x,p.y+.44,p.z-p.side*.19);
        tr.rotation.set(p.side>0?.09:-.09,p.side<0?Math.PI:0,0);
      });
    }
    const all=buckets.flat();
    // Left and right real posts, low shelf, two small arm rests per seat.
    const twin=[];
    for(const p of all)for(const xsign of [-1,1])
      twin.push({...p,xOffset:xsign*.205});
    batch(tag+'_Steel_Pedestals',pedestalGeo,steel,twin,p=>{
      tr.position.set(p.x+p.xOffset,p.y+.168,p.z-p.side*.17);
    });
    batch(tag+'_Armrests',armGeo,padding,twin,p=>{
      tr.position.set(p.x+p.xOffset,p.y+.33,p.z+p.side*.045);
    });
  }
  seatBank(false);seatBank(true);
  rearBox([24,10,.46],[0,4.7,11.85],navy,'Reverse_Gym_Wall');
  rearBox([5.2,1.45,.22],[0,6.04,11.34],dark,'Reverse_Scoreboard_Body');
  rearBox([4.7,1.05,.08],[0,6.04,11.16],teal,'Reverse_Scoreboard_Display');
  // School-gym architecture, with actual volume: walls, beams and truss roof.
  box([24,10,.46],[0,4.7,-11.85],navy,'Gym_Back_Wall');
  for(const x of [-11.5,11.5])box([.5,11.8,24],[x,4.7,-.6],navy,'Gym_Side_Wall_'+x);
  for(const x of [-10,-5,0,5,10]){
    box([.24,9.9,.58],[x,4.7,-11.50],beam,'Structural_Pilaster_'+x);
    const window=box([2.5,2.4,.055],[x+2.15,6.8,-11.48],mat('#53718b',.35,.22),'High_Window_'+x);
    window.material.emissive=new THREE.Color('#152e43');window.material.emissiveIntensity=.7;
  }
  for(let x=-12;x<=12;x+=3){
    box([.15,.21,24],[x,9.3,-.1],beam,'Roof_Truss_Longitudinal_'+x);
    box([.12,.31,24],[x,9.55,-.1],dark,'Roof_Truss_Shadow_'+x);
  }
  for(const z of [-10,-5,0,5,10]){
    box([24,.22,.18],[0,9.2,z],beam,'Roof_Crossbar_'+z);
    for(const x of [-8,-4,0,4,8]){
      const light=box([.9,.10,.45],[x,8.92,z],mat('#fff4d4',.04,.35),'3D_Ceiling_Lamp_'+x+'_'+z);
      light.material.emissive=new THREE.Color('#ffdba2');light.material.emissiveIntensity=.65;
      stats.lights++;
    }
  }
  // Real arena scoreboard mesh, not an HTML label floating in 3D.
  box([5.2,1.45,.22],[0,6.04,-11.34],dark,'Gym_Scoreboard_Body');
  box([4.7,1.05,.08],[0,6.04,-11.16],mat('#274d58',.08,.45),'Gym_Scoreboard_Display');
  for(const x of [-2.08,2.08]){
    box([.12,.68,.09],[x,6.03,-11.10],x<0?coral:teal,'Gym_Scoreboard_Team_Rail_'+x);
  }
  box([19,.19,.3],[0,4.9,-11.32],gold,'Gym_Sponsor_Rail');
  // Side duelists stand beyond the actual summon zone, with distinct plinths.
  for(const sign of [-1,1]){
    const x=sign*5.55;
    cylinder(.86,1.01,.46,48,[x,.2,.65],sign<0?coral:teal,
      'Duelist_Platform_'+(sign<0?'PLAYER':'AI'));
    cylinder(.52,.55,.03,48,[x,.445,.65],gold,
      'Duelist_Platform_Inlay_'+(sign<0?'PLAYER':'AI'));
    const pillar=box([.12,1.45,.16],[x+sign*.68,1.15,1.2],gold,
      'Duelist_Station_Rail_'+(sign<0?'PLAYER':'AI'));
    pillar.material.emissive=new THREE.Color(sign<0?'#32211a':'#17343c');
    // Card lectern in front of the duelist: intentional empty player station.
    box([.84,.07,.48],[x,1.0,1.6],sign<0?coral:teal,
      '3D_Duel_Card_Console_'+(sign<0?'PLAYER':'AI'));
    box([.14,.66,.13],[x,.71,1.6],beam,'3D_Duel_Console_Stand_'+sign);
  }
  // Static sports equipment and edge markers establish real venue scale.
  for(const sign of [-1,1]){
    const x=sign*9.3;
    const mast=box([.12,3.1,.12],[x,1.5,-2.1],beam,'Court_Floodlight_Mast_'+sign);
    mast.castShadow=true;
    cylinder(.22,.25,.07,20,[x,3.1,-2.1],gold,'Court_Floodlight_Head_'+sign);
  }
  const polish=addStadiumPolish(THREE,scene,group,stats);
  // R112: the venue participates in the story. Existing lights and the
  // real three-dimensional scoreboard react; no extra postprocess/draw calls.
  const scoreDisplay=group.getObjectByName('Gym_Scoreboard_Display');
  const keys=[];
  group.traverse(o=>{if(o.isSpotLight&&o.name.startsWith('R46_Directional_Stage_Key_'))
    keys.push({spot:o,base:o.intensity});});
  let finale=null,finaleFrames=0;
  function beginFinale(winner,seconds){
   if(!['player','ai','draw'].includes(winner)||!Number.isFinite(seconds))return false;
   finale={winner,start:seconds,duration:7.2};
   scoreDisplay?.material?.emissive?.set(winner==='ai'?'#0d556d':
    winner==='player'?'#7b4230':'#504e78');
   return true;
  }
  function update(seconds,{reduced=false}={}){
   const t=finale?seconds-finale.start:-1;
   if(!finale||t<0||t>finale.duration){
    keys.forEach(x=>{x.spot.intensity=x.base});
    if(scoreDisplay?.material)scoreDisplay.material.emissiveIntensity=0;
    if(finale&&t>finale.duration)finale=null;
    return;
   }
   finaleFrames++;
   const opening=Math.min(1,Math.max(0,t/.38));
   const closing=Math.min(1,Math.max(0,(finale.duration-t)/.6));
   const envelope=opening*closing;
   if(reduced){
    keys.forEach(x=>{x.spot.intensity=x.base});
    scoreDisplay.material.emissiveIntensity=.14*envelope;
   }else{
    keys.forEach((x,i)=>{
     x.spot.intensity=x.base*(1+(.10+.035*Math.sin(t*6+i*2))*envelope);
    });
    scoreDisplay.material.emissiveIntensity=
     (.20+.22*(.5+.5*Math.sin(t*6.8)))*envelope;
   }
  }
  return {group,polish,beginFinale,update,
   get ambience(){return {finale,finaleFrames,reactiveSpotlights:keys.length,
    displayEmissiveIntensity:scoreDisplay?.material?.emissiveIntensity||0}},
   stats:{...stats,geometryTypes:[...stats.geometryTypes],
    totalPhysicalBleacherRows:stats.bleacherRows+8,
    distinctAreas:['LEFT_DUELIST_STATION','CENTRAL_SUMMONING_RING','RIGHT_DUELIST_STATION',
      'RAISED_BLEACHERS','ROOF_TRUSSES','SCOREBOARD']},
    physical:true};
}
