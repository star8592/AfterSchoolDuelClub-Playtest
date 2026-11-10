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
  // Distant seat/color markers: instances rather than individual draw calls.
  const seatGeo=new THREE.BoxGeometry(.43,.19,.16);
  const seatMat=[coral,teal,mat('#b8c9d5')];
  for(let j=0;j<3;j++){
    const locations=[];
    for(let row=0;row<6;row++)for(let col=0;col<33;col++){
      if((row*17+col*11)%3!==j)continue;
      const z=-6.5-row*.80-.20,y=.56+row*.48;
      locations.push([-8.85+col*.55,y,z]);
    }
    const seats=new THREE.InstancedMesh(seatGeo,seatMat[j],locations.length);
    seats.name='Stadium_Seats_Instanced_Color_'+j;
    locations.forEach((p,i)=>{tr.position.set(...p);tr.updateMatrix();seats.setMatrixAt(i,tr.matrix)});
    group.add(seats);stats.instancedObjects++;stats.seats+=locations.length;stats.meshCount++;
  }
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
    const x=sign*6.70;
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
  return {group,stats:{...stats,geometryTypes:[...stats.geometryTypes],
    totalPhysicalBleacherRows:stats.bleacherRows+8,
    distinctAreas:['LEFT_DUELIST_STATION','CENTRAL_SUMMONING_RING','RIGHT_DUELIST_STATION',
      'RAISED_BLEACHERS','ROOF_TRUSSES','SCOREBOARD']},
    physical:true};
}
