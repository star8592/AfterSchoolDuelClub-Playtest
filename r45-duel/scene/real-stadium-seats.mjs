/**
 * R81 stadium chair geometry: actual contoured seat / back / arms / underframe.
 * Modular manufactured geometry only; no character or terrain proxy modelling.
 * Each repeated component uses Three.js InstancedMesh for predictable GPU cost.
 */
export function addRealBleacherSeats(THREE,frontRoot,reverseRoot) {
  const stats={chairs:0,front:0,reverse:0,instances:0,partsPerChair:5};
  // Rounded manufactured shells: bucket-seat profile instead of flat marker cubes.
  // These are conventional hard-surface objects, not procedural landscape assets.
  const seatProfile=new THREE.Shape();
  seatProfile.moveTo(-.19,-.15);seatProfile.quadraticCurveTo(-.245,-.14,-.24,-.08);
  seatProfile.lineTo(-.24,.105);seatProfile.quadraticCurveTo(-.24,.16,-.17,.16);
  seatProfile.lineTo(.17,.16);seatProfile.quadraticCurveTo(.24,.16,.24,.105);
  seatProfile.lineTo(.24,-.08);seatProfile.quadraticCurveTo(.245,-.14,.19,-.15);
  seatProfile.closePath();
  const shellGeom=new THREE.ExtrudeGeometry(seatProfile,{depth:.065,bevelEnabled:true,
    bevelThickness:.012,bevelSize:.018,bevelSegments:2,curveSegments:8});
  shellGeom.rotateX(Math.PI/2);shellGeom.center();
  const backProfile=new THREE.Shape();
  backProfile.moveTo(-.225,-.155);
  backProfile.quadraticCurveTo(-.26,.15,-.145,.175);
  backProfile.quadraticCurveTo(0,.205,.145,.175);
  backProfile.quadraticCurveTo(.26,.15,.225,-.155);
  backProfile.quadraticCurveTo(0,-.18,-.225,-.155);
  const backGeom=new THREE.ExtrudeGeometry(backProfile,{depth:.055,bevelEnabled:true,
   bevelThickness:.014,bevelSize:.016,bevelSegments:2,curveSegments:8});
  backGeom.center();
  const frameGeom=new THREE.BoxGeometry(.045,.29,.042);
  const armGeom=new THREE.BoxGeometry(.055,.054,.29);
  const trimGeom=new THREE.BoxGeometry(.42,.024,.034);
  const colors=['#c67c74','#72aab8','#bac1bd'];
  const seatMats=colors.map(c=>new THREE.MeshStandardMaterial({color:c,metalness:.12,roughness:.55}));
  const railMat=new THREE.MeshStandardMaterial({color:'#263f51',metalness:.54,roughness:.37});
  const cushionMats=colors.map(c=>new THREE.MeshStandardMaterial({color:new THREE.Color(c).multiplyScalar(.83),roughness:.76}));
  const assemblies=[
    {name:'MoldedSeat',geo:shellGeom,mat:'shell',p:[0,.13,0],s:[1,1,1]},
    {name:'ComfortBack',geo:backGeom,mat:'shell',p:[0,.34,-.115],s:[1,1,1]},
    {name:'ChairStand',geo:frameGeom,mat:'frame',p:[0,-.005,-.07],s:[1,1,1]},
    {name:'LeftArm',geo:armGeom,mat:'frame',p:[-.245,.215,.015],s:[1,1,1]},
    {name:'RightArm',geo:armGeom,mat:'frame',p:[.245,.215,.015],s:[1,1,1]},
    {name:'FrontSeam',geo:trimGeom,mat:'trim',p:[0,.164,.155],s:[1,1,1]}
  ];
  const temp=new THREE.Object3D();
  const places=[];
  for(const dir of [-1,1]){
    for(let row=0;row<6;row++) for(let col=0;col<33;col++){
      const color=(row*17+col*11)%3;
      const x=-8.85+col*.55;
      const y=.42+row*.48;
      // Front: back of chair away from court; reverse bank faces -Z.
      const z=dir*(6.5+row*.80+.02);
      places.push({dir,row,col,color,x,y,z});
    }
  }
  for(const dir of [-1,1]){
    const root=dir<0?frontRoot:reverseRoot;
    for(let color=0;color<3;color++){
      const subset=places.filter(p=>p.dir===dir&&p.color===color);
      for(const part of assemblies) {
        const material=part.mat==='shell'?seatMats[color]:part.mat==='trim'?cushionMats[color]:railMat;
        const mesh=new THREE.InstancedMesh(part.geo,material,subset.length);
        mesh.name='R81_Actual_Stadium_'+part.name+'_'+(dir<0?'Front':'Rear')+'_'+color;
        for(let i=0;i<subset.length;i++){
          const p=subset[i];
          temp.position.set(p.x+(dir>0?-part.p[0]:part.p[0]),p.y+part.p[1],p.z+(dir>0?-part.p[2]:part.p[2]));
          temp.rotation.set(0,dir>0?Math.PI:0,0);temp.scale.set(1,1,1);temp.updateMatrix();
          mesh.setMatrixAt(i,temp.matrix);
        }
        mesh.instanceMatrix.needsUpdate=true;mesh.receiveShadow=true;
        mesh.computeBoundingSphere();
        root.add(mesh);stats.instances++;
      }
      stats.chairs+=subset.length;
      if(dir<0)stats.front+=subset.length;else stats.reverse+=subset.length;
    }
  }
  return stats;
}
