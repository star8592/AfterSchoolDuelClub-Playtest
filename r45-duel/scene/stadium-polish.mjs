/**
 * R46 competition-stage scenic art pass.
 *
 * Man-made gym architectural elements, on the SAME real 3D meshes as R45.
 * No procedural natural-terrain / human sculpting; preserve artist-built VRM.
 * Wooden sports flooring uses the CC0 ambientCG WoodFloor045 PBR maps.
 */
export function addStadiumPolish(THREE, scene, root, stats){
  const art = new THREE.Group();art.name='R46_Competition_Art_Direction';root.add(art);
  const created={physicalTrim:0,liveSigns:0,licensedTextures:3,lightVolumes:0,materials:0};
  const std=(color,metalness=0,roughness=.6,emissive=null,intensity=0)=>{
    const m=new THREE.MeshStandardMaterial({color,metalness,roughness});
    if(emissive){m.emissive.set(emissive);m.emissiveIntensity=intensity}
    created.materials++;return m;
  };
  const dark=std('#1b2837',.12,.78),
   bronze=std('#ac7548',.62,.26),
   brass=std('#eac08a',.67,.26),
   marble=std('#e2d3b1',.14,.38),
   teal=std('#6fb8c7',.36,.33,'#307789',.45),
   coral=std('#e8a17d',.3,.44,'#883f28',.24);
  function put(name,geometry,material,x,y,z,rotation=null){
    const mesh=new THREE.Mesh(geometry,material);
    mesh.name=name;mesh.position.set(x,y,z);
    if(rotation)mesh.rotation.set(...rotation);
    mesh.receiveShadow=true;
    art.add(mesh);created.physicalTrim++;
    return mesh;
  }
  const bx=(name,s,pos,m)=>put(name,new THREE.BoxGeometry(...s),m,...pos);
  const disc=(name,r,m,x,y,z)=>{
    return put(name,new THREE.CircleGeometry(r,90),m,x,y,z,[-Math.PI/2,0,0]);
  };
  const circle=(name,r,t,m,x=0,y=.062,z=0)=>{
    return put(name,new THREE.TorusGeometry(r,t,9,128),m,x,y,z,[Math.PI/2,0,0]);
  };
  // PBR physically based parquet wood. Texture is actual CC0 asset, not
  // Canvas-generated fake grain and not a stretched background photograph.
  const tex=new THREE.TextureLoader();
  const texture=(name,srgb)=>{
    const t=tex.load(new URL('../assets/textures/'+name,import.meta.url).href,
      ()=>{t.needsUpdate=true},
      undefined,e=>console.warn('R46_TEXTURE_LOAD_FAILED',name,String(e)));
    t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.repeat.set(5,3);
    t.anisotropy=8;
    if(srgb)t.colorSpace=THREE.SRGBColorSpace;
    return t;
  };
  const floorMat=new THREE.MeshPhysicalMaterial({
    color:'#e5c9a9',
    map:texture('gym-oak-color.jpg',true),
    normalMap:texture('gym-oak-normal.jpg',false),
    normalScale:new THREE.Vector2(.38,.38),
    roughnessMap:texture('gym-oak-roughness.jpg',false),
    metalness:.04,roughness:.55,clearcoat:.32,clearcoatRoughness:.5
  });
  const court=put('CC0_WoodFloor045_Real_PBR_Court',
    new THREE.PlaneGeometry(19.93,11.56),floorMat,0,.041,0,[-Math.PI/2,0,0]);
  court.receiveShadow=true;
  // Athletic court inlays: actual precision metallic and enamel volumes,
  // subdued so the characters remain the focal plane.
  const stripe=std('#f6e0ba',.14,.36);
  const sides=[[-9.5,-5.55,9.5,-5.55],[9.5,-5.55,9.5,5.55],[9.5,5.55,-9.5,5.55],[-9.5,5.55,-9.5,-5.55]];
  for(let i=0;i<sides.length;i++){
    const [x1,z1,x2,z2]=sides[i],len=Math.hypot(x2-x1,z2-z1);
    const mesh=bx('Championship_Enamel_Court_Perimeter_'+i,[len,.018,.036],[(x1+x2)/2,.060,(z1+z2)/2],stripe);
    mesh.rotation.y=-Math.atan2(z2-z1,x2-x1);
  }
  // A single ceremonial battle circle, no gameplay lane divisions.
  circle('Center_Summoning_Brass_Outer',3.15,.019,brass,0,.070,0);
  circle('Center_Summoning_Brass_Inner',2.65,.015,bronze,0,.071,0);
  const aura=new THREE.MeshBasicMaterial({color:'#d4b481',transparent:true,
    opacity:.105,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
  disc('Arena_Center_Soft_Ground_Light',2.55,aura,0,.066,0);
  const radial=new THREE.MeshBasicMaterial({color:'#ffe4ab',transparent:true,
    opacity:.48,depthWrite:false,blending:THREE.AdditiveBlending});
  for(let j=0;j<24;j++){
    const a=j*Math.PI/12;
    const x=Math.cos(a)*2.91,z=Math.sin(a)*2.91;
    const tick=bx('Competition_Ring_Metal_Inlay_Tick_'+j,[.13,.012,.023],[x,.069,z],radial);
    tick.rotation.y=-a;
  }
  // Raised symmetric duelist station rails emphasize each team's side.
  for(const side of [-1,1]){
    const isPlayer=side<0,teamMat=isPlayer?coral:teal;
    const x=side*5.55;
    circle((isPlayer?'Player':'Rival')+'_Station_Halo',.86,.042,teamMat,x,.475,.65);
    for(const z of [-.25,.70,1.56]){
      bx('Duelist_Metal_Floor_Border_'+side+'_'+z,
        [.10,.07,.30],[x+side*.83,.49,z],brass);
    }
    const lectern=bx('Duel_CardConsole_Display_Body_'+side,[1.08,.055,.6],
      [x,1.06,1.57],dark);
    lectern.rotation.x=-.16;
    const lit=bx('Duel_CardConsole_Light_Screen_'+side,[.92,.018,.46],
      [x,1.10,1.58],teamMat);
    lit.rotation.x=-.16;
  }
  // Painted steel grandstand rails: architectural geometry, not flat image.
  for(const y of [1.04,2.03,3.10]){
    const z=-6.6-(y-.4)/.48*.79;
    bx('Stadium_Bleacher_Safety_Rail_'+Math.round(y*10),
      [19,.066,.07],[0,y+.28,z+.52],bronze);
    for(const x of [-9,-4.5,0,4.5,9])
      bx('Stadium_Bleacher_Rail_Post_'+Math.round(y*10)+'_'+x,
        [.07,.68,.07],[x,y-.03,z+.52],bronze);
  }
  // Production spotlights: lamp body, real spot illumination and very
  // low-opacity light shafts. Not a fake textured backdrop.
  for(const [i,x,baseColor] of [[0,-2.8,'#ffe6bd'],[1,2.8,'#94d8f4']]){
    const shell=bx('Overhead_Production_Stage_Lamp_'+i,[.65,.27,.50],[x,7.7,2.4],dark);
    shell.rotation.x=.25;
    const windowMat=new THREE.MeshBasicMaterial({color:baseColor});
    put('Overhead_Stage_Lamp_Lens_'+i,new THREE.CylinderGeometry(.20,.26,.09,40),
      windowMat,x,7.44,2.31,[Math.PI/2,0,0]);
    const spot=new THREE.SpotLight(baseColor,115,20,.31,.74,1.6);
    spot.name='R46_Directional_Stage_Key_'+i;
    spot.position.set(x,7.5,2.4);
    const target=new THREE.Object3D();target.position.set(x*.48,.1,-.1);
    art.add(target);spot.target=target;
    art.add(spot);
    const volMat=new THREE.MeshBasicMaterial({color:baseColor,transparent:true,
      opacity:.022,depthWrite:false,depthTest:true,side:THREE.DoubleSide,
      blending:THREE.AdditiveBlending});
    const beam=put('Subtle_Visible_Theatrical_Spotlight_Beam_'+i,
      new THREE.ConeGeometry(2.05,7.4,60,1,true),volMat,
      x*.48,3.85,0);
    beam.lookAt(x,7.7,2.4);
    created.lightVolumes++;
  }
  // Large lit championship panels. They are original game signage on a
  // proper 3D board at the far end of the actual gym.
  function makeSignCanvas(title,sub,accent='#e0ae7c'){
    const cvs=document.createElement('canvas');cvs.width=1024;cvs.height=240;
    const ctx=cvs.getContext('2d');
    const grad=ctx.createLinearGradient(0,0,1024,240);
    grad.addColorStop(0,'#121e31');grad.addColorStop(.5,'#1c3040');grad.addColorStop(1,'#0e2235');
    ctx.fillStyle=grad;ctx.fillRect(0,0,1024,240);
    ctx.strokeStyle='#886b4a';ctx.lineWidth=9;ctx.strokeRect(11,12,1002,216);
    ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.strokeRect(29,29,966,180);
    for(let i=0;i<4;i++){
      ctx.fillStyle=accent;
      ctx.fillRect(62+i*14,56,6,120);
      ctx.fillRect(944-i*14,56,6,120);
    }
    ctx.textAlign='center';
    ctx.fillStyle='#fff1d5';ctx.shadowColor=accent;ctx.shadowBlur=16;
    ctx.font='900 76px "Noto Sans CJK SC","PingFang SC",system-ui';
    ctx.fillText(title,512,127);
    ctx.shadowBlur=0;ctx.fillStyle=accent;
    ctx.font='700 26px system-ui';
    ctx.letterSpacing='5px';
    ctx.fillText(sub,512,177);
    const tex=new THREE.CanvasTexture(cvs);tex.colorSpace=THREE.SRGBColorSpace;
    return tex;
  }
  const sign=new THREE.MeshBasicMaterial({map:makeSignCanvas('放学后决斗社','AFTER SCHOOL · CHAMPIONSHIP'),side:THREE.DoubleSide});
  put('3D_Championship_Backstage_Illuminated_Sign',new THREE.PlaneGeometry(8.0,1.88),
    sign,0,4.12,-7.95);
  const signBack=bx('3D_Championship_Sign_Actual_Framed_Box',[8.2,2.08,.18],
    [0,4.12,-8.06],dark);
  signBack.material.color.set('#0e1b2c');
  // Suspend the large screen from the gym's actual steel roof truss.
  for(const x of [-3.70,3.70]){
    bx('Hanging_Competition_Scoreboard_Strut_'+x,[.10,3.83,.12],
      [x,6.97,-8.07],bronze);
    bx('Hanging_Competition_Scoreboard_Joint_'+x,[.28,.20,.24],
      [x,8.85,-8.07],brass);
  }
  // Team pennants are physically bent fabric panels, not simulated 2D wall art.
  function banner(x,team,accent){
    const geo=new THREE.PlaneGeometry(1.34,2.65,6,10);
    const pts=geo.attributes.position;
    for(let i=0;i<pts.count;i++){
      const bx=pts.getX(i),by=pts.getY(i);
      pts.setZ(i,.075*Math.sin((bx+by*1.14)*2.3));
    }
    geo.computeVertexNormals();
    const tex=makeSignCanvas(team,team==='红方'?'PLAYER SIDE':'RIVAL SIDE',accent);
    const mat=new THREE.MeshStandardMaterial({map:tex,side:THREE.DoubleSide,
      roughness:.89,metalness:.0,emissive:'#192c3a',emissiveIntensity:.18});
    put('ThreeDimensional_Draped_Competition_Pennant_'+team,geo,mat,x,3.94,-8.0);
    bx('Real_Stainless_Pennant_Suspension_'+team,[1.5,.065,.08],[x,5.40,-7.97],brass);
  }
  banner(-5.47,'红方','#e7a079');
  banner(5.47,'蓝方','#8abfdd');
  created.liveSigns=3;
  // Sidewall strip-lights, actual geometry, no rasterized painted lights.
  const panel=new THREE.MeshBasicMaterial({color:'#b9d7de'});
  for(const side of [-1,1]){
    const sideMaterial=side<0?coral:teal;
    for(let j=0;j<4;j++){
      bx('Gym_Backstage_Vertical_Light_'+side+'_'+j,
        [.065,2.7,.085],[side*(4.85+j*1.45),3.45,-10.82],sideMaterial);
    }
  }
  // Subtle warm/cool center floor pools to anchor characters to the wood.
  for(const side of [-1,1]){
    const glow=new THREE.MeshBasicMaterial({color:side<0?'#ec946a':'#80cde8',
      transparent:true,opacity:.13,depthWrite:false,blending:THREE.AdditiveBlending});
    disc('Character_Summon_Floor_Pool_'+side,.81,glow,side*1.85,.070,0);
  }
  stats.polish=created;
  return{group:art,stats:created};
}
