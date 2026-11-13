/**
 * R123 THE BLEACHERS HAVE PROPS.
 *
 * Four real student GLBs carry visibly persistent 3D school accessories.
 * When verified R122 spell collateral arrives, ONE matching accessory
 * topples, sends physical-looking instanced objects flying, then recovers.
 * Nothing here may edit HP, rules, inventory, deck or scoreboard.
 */
const DETAILS=Object.freeze([
 Object.freeze({kind:'popcorn',label:'爆米花桶大翻车',caption:'爆米花飞出一条抛物线，邻座开始接玉米粒',
  line:'我的爆米花不是防弹衣啊！'}),
 Object.freeze({kind:'juice',label:'奶茶喷泉',caption:'饮料杯转了三圈，奶茶像喷泉一样洒出来',
  line:'啊！我的奶茶还没喝第一口！'}),
 Object.freeze({kind:'homework',label:'作业飞天',caption:'数学作业一页页飞向裁判席',
  line:'老师！不是我没写！是魔法把作业吹走了！'}),
 Object.freeze({kind:'backpack',label:'书包跳高',caption:'书包像运动员一样起跳，文具满天飞',
  line:'我的书包比我先参加了体育考试！'})
]);
export const SPECTATOR_PROPS=Object.freeze(DETAILS);
export function resolveSpectatorProp(incident){
 if(!incident||!Number.isInteger(incident.spectatorIndex)||
    incident.spectatorIndex<0||incident.spectatorIndex>=DETAILS.length||
    !Number.isInteger(incident.serial)||incident.serial<=0||
    !['ricochet','overshoot','shockwave','misfire'].includes(incident.scenario))return null;
 return Object.freeze({...DETAILS[incident.spectatorIndex],index:incident.spectatorIndex});
}

const clamp=x=>Math.min(1,Math.max(0,x));
const smooth=x=>{const t=clamp(x);return t*t*(3-2*t)};
export function createBleacherPropComedy(THREE,scene,{reducedMotion=false}={}){
 const stage=new THREE.Group();stage.name='R123_Persistent_Real_Spectator_Props';scene.add(stage);
 const props=new Map();let mounted=0,accidents=0,scatterFrames=0,returns=0,peak=0;
 const active=new Map();
 const cotton=(color,rough=.66,metal=0)=>new THREE.MeshStandardMaterial({
  color,roughness:rough,metalness:metal,side:THREE.DoubleSide});
 const mesh=(container,geometry,material,name)=>{
  const o=new THREE.Mesh(geometry,material);o.name='R123_'+name;
  o.castShadow=false;o.receiveShadow=true;container.add(o);return o;
 };
 function surface(draw){
  const cv=document.createElement('canvas');cv.width=512;cv.height=512;
  const ctx=cv.getContext('2d');draw(ctx,512,512);
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;
  t.anisotropy=4;return t;
 }
 function printedBucket(container){
  const g=new THREE.Group();g.name='R123_Striped_Popcorn_Tub';container.add(g);
  const paper=surface((c,w,h)=>{
   c.fillStyle='#fff4df';c.fillRect(0,0,w,h);
   for(let i=0;i<10;i++){
    c.fillStyle=i%2?'#e44b56':'#fff4df';
    c.fillRect(i*w/10,0,w/10,h);
   }
   c.fillStyle='#75283a';c.font='bold 96px sans-serif';
   c.fillText('POP!',110,280);c.font='bold 42px sans-serif';
   c.fillText('CLUB',186,340);
  });
  const cup=mesh(g,new THREE.CylinderGeometry(.29,.20,.48,32,1,true),
   new THREE.MeshStandardMaterial({map:paper,side:THREE.DoubleSide,roughness:.74}),
   'Popcorn_Cinema_Striped_Tub');
  cup.position.y=.02;
  const bottom=mesh(g,new THREE.CircleGeometry(.20,32),cotton('#f3e3c5'),
   'Popcorn_Cup_Bottom');bottom.rotation.x=-Math.PI/2;bottom.position.y=-.22;
  const rim=mesh(g,new THREE.TorusGeometry(.29,.025,10,32),cotton('#ffe7b9'),
   'Popcorn_Rolled_Rim');rim.rotation.x=Math.PI/2;rim.position.y=.26;
  for(let i=0;i<6;i++){
   const puff=mesh(g,new THREE.IcosahedronGeometry(.08,1),
    cotton(i%3?'#ffe6ad':'#fff5d6'),'Popcorn_Top_Piece_'+i);
   puff.position.set(Math.cos(i*2.4)*.14,.26+(i%2)*.04,Math.sin(i*2.4)*.14);
   puff.scale.set(1,.78,1.07);
  }
  return g;
 }
 function juiceCup(container){
  const g=new THREE.Group();g.name='R123_Milk_Tea_Cup';container.add(g);
  const plastic=mesh(g,new THREE.CylinderGeometry(.22,.17,.43,32,1),cotton('#daaa70',.31),
   'Tea_Cup_Body');plastic.position.y=.04;
  const band=mesh(g,new THREE.CylinderGeometry(.223,.223,.13,32,1,true),
   cotton('#e9f6ee'),'Tea_Cup_Paper_Sleeve');band.position.y=-.03;
  const lid=mesh(g,new THREE.CylinderGeometry(.25,.25,.055,32),
   cotton('#f5ead9',.25),'Tea_White_Lid');lid.position.y=.28;
  const straw=mesh(g,new THREE.CylinderGeometry(.019,.019,.47,12),
   cotton('#ed85a9',.2),'Tea_Straw');straw.position.set(.075,.49,.01);
  straw.rotation.z=-.18;
  const label=mesh(g,new THREE.BoxGeometry(.16,.07,.007),cotton('#4f7b6a'),
   'Tea_Cup_Brand');label.position.set(0,-.005,.207);
  return g;
 }
 function homework(container){
  const g=new THREE.Group();g.name='R123_Homework_Book';container.add(g);
  const paper=surface((c,w,h)=>{
   c.fillStyle='#f7fcff';c.fillRect(0,0,w,h);
   c.fillStyle='#587aa5';c.font='bold 72px sans-serif';c.fillText('MATH',90,105);
   c.strokeStyle='#a7bddc';c.lineWidth=7;
   for(let y=175;y<470;y+=55){c.beginPath();c.moveTo(45,y);c.lineTo(w-40,y);c.stroke()}
   c.fillStyle='#f56a54';c.font='bold 48px sans-serif';c.fillText('100%',300,443);
  });
  const book=mesh(g,new THREE.BoxGeometry(.36,.045,.47),
   cotton('#6c8ac2'),'Homework_Blue_Cover');
  book.rotation.y=-.17;
  const sheet=mesh(g,new THREE.PlaneGeometry(.34,.45),
   new THREE.MeshStandardMaterial({map:paper,side:THREE.DoubleSide,roughness:.8}),
   'Homework_Visible_Exam_Page');
  sheet.rotation.x=-Math.PI/2;sheet.rotation.z=.18;sheet.position.y=.029;
  return g;
 }
 function schoolbag(container){
  const g=new THREE.Group();g.name='R123_Schoolbag';container.add(g);
  const body=mesh(g,new THREE.SphereGeometry(.30,24,16),cotton('#537bb2',.88),
   'Schoolbag_Padded_Body');body.scale.set(1,1.18,.64);
  const pocket=mesh(g,new THREE.SphereGeometry(.19,20,12),cotton('#e6a978',.84),
   'Schoolbag_Front_Pocket');pocket.position.set(0,-.15,.20);pocket.scale.set(1,.8,.58);
  for(const side of [-1,1]){
   const strap=mesh(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(side*.14,.28,-.09),
    new THREE.Vector3(side*.33,.06,-.18),
    new THREE.Vector3(side*.23,-.34,-.14)]),14,.034,8,false),
    cotton('#354e78'),'Schoolbag_Shoulder_Strap_'+side);
  }
  const zip=mesh(g,new THREE.TorusGeometry(.22,.012,6,22,Math.PI),
   cotton('#e4d7af',.38,.4),'Schoolbag_Zipper');
  zip.rotation.z=Math.PI;zip.position.set(0,-.09,.255);
  const loop=mesh(g,new THREE.TorusGeometry(.09,.026,8,15,Math.PI),
   cotton('#2a3c5b'),'Schoolbag_Top_Handle');
  loop.position.y=.35;
  const logo=mesh(g,new THREE.BoxGeometry(.13,.09,.015),cotton('#f6d65e'),
   'Schoolbag_Club_Patch');logo.position.set(0,.15,.20);
  return g;
 }
 function scatterPrefab(kind,group){
  const count= reducedMotion?8:kind==='popcorn'?22:kind==='juice'?24:kind==='homework'?14:18;
  const geo=kind==='homework'?new THREE.PlaneGeometry(.22,.28):
    kind==='juice'?new THREE.SphereGeometry(.047,9,6):
    kind==='backpack'?new THREE.BoxGeometry(.055,.20,.035):
    new THREE.IcosahedronGeometry(.057,1);
  const mat=kind==='popcorn'?cotton('#ffedb6'):
    kind==='juice'?new THREE.MeshStandardMaterial({
      color:'#d6ae80',roughness:.15,transparent:true,opacity:.76}):
    kind==='homework'?cotton('#f7f4db'):cotton('#dfc675');
  const scatter=new THREE.InstancedMesh(geo,mat,count);
  scatter.name='R123_Instanced_'+kind+'_Scatter';
  scatter.count=0;scatter.frustumCulled=false;group.add(scatter);
  return {scatter,count};
 }
 function mount(anchors){
  if(props.size)return props.size;
  if(!Array.isArray(anchors)||anchors.length!==4||anchors.some((a,i)=>!a||a.index!==i||
   ![a.x,a.y,a.z].every(Number.isFinite)))return 0;
  for(let index=0;index<4;index++){
   const anchor=anchors[index],detail=DETAILS[index];
   const home=new THREE.Vector3(anchor.x,anchor.y+(
     index===0?1.38:index===1?1.24:index===2?1.17:.77),anchor.z+.41);
   const pivot=new THREE.Group();pivot.name='R123_'+detail.kind+'_Persistent_Carried_Prop';
   pivot.position.copy(home);stage.add(pivot);
   const model=detail.kind==='popcorn'?printedBucket(pivot):
     detail.kind==='juice'?juiceCup(pivot):
     detail.kind==='homework'?homework(pivot):schoolbag(pivot);
   model.scale.setScalar(index===3?.86:1);
   const {scatter,count}=scatterPrefab(detail.kind,stage);
   props.set(index,{detail,anchor,home,pivot,scatter,count});
  }
  mounted=props.size;
  return mounted;
 }
 const dummy=new THREE.Object3D();
 function play(incident,seconds){
  if(!Number.isFinite(seconds)||active.size>=3)return null;
  const detail=resolveSpectatorProp(incident),item=detail&&props.get(detail.index);
  if(!item||active.has(detail.index))return null;
  active.set(detail.index,{start:seconds,serial:incident.serial,
   scenario:incident.scenario,seed:incident.seed>>>0});
  accidents++;peak=Math.max(peak,active.size);
  return {kind:detail.kind,index:detail.index,label:detail.label};
 }
 function update(seconds){
  if(!Number.isFinite(seconds))return;
  for(const [index,act] of active){
   const item=props.get(index),elapsed=Math.max(0,seconds-act.start);
   if(elapsed>=3.25){
    item.pivot.position.copy(item.home);
    item.pivot.rotation.set(0,0,0);item.scatter.count=0;
    active.delete(index);returns++;continue;
   }
   // Anticipation -> accident -> scatter -> recovery. Prop follows a
   // stylized ballistic parabola, not an endless spinning placeholder.
   const launch=smooth(elapsed/.22);
   const settle=smooth((elapsed-1.05)/.78);
   const rise=Math.sin(Math.PI*clamp(elapsed/1.18))*1.18;
   const recovery=smooth((elapsed-2.17)/1.02);
   const spin=(1-recovery)*launch;
   const sign=(index%2?-1:1);
   item.pivot.position.set(
     item.home.x+sign*.32*spin,item.home.y+(1-recovery)*(rise-.45*settle),
     item.home.z+.22*spin);
   item.pivot.rotation.set(spin*.48,spin*sign*1.3,spin*sign*1.52);
   const particles=item.scatter,enabled=elapsed>.11&&elapsed<2.55;
   particles.count=enabled?item.count:0;
   if(enabled){
    const t=elapsed-.11;
    for(let j=0;j<item.count;j++){
     const angle=(j*2.399963+act.seed*.000047);
     const speed=.75+.13*(j%7),spread=(.12+t*.68)*speed;
     const height=(.25+.09*(j%5))*Math.sin(Math.PI*clamp(t/2.55))+
       t*(.48+.07*(j%4))-.45*t*t;
     dummy.position.set(
       item.home.x+Math.cos(angle)*spread,
       item.home.y+Math.max(-1.0,height),
       item.home.z+Math.sin(angle)*spread);
     dummy.rotation.set(t*(3+j%5),t*(4+j%4),t*(2+j%3));
     const scale= (1-smooth((t-1.6)/.9))*
       (reducedMotion?.55:.65+.15*(j%4));
     dummy.scale.setScalar(Math.max(.001,scale));
     dummy.updateMatrix();particles.setMatrixAt(j,dummy.matrix);
    }
    particles.instanceMatrix.needsUpdate=true;
    scatterFrames++;
   }
  }
 }
 function dispose(){
  active.clear();
  stage.traverse(o=>{
   if(o.isMesh||o.isInstancedMesh){
    o.geometry.dispose();
    const mats=Array.isArray(o.material)?o.material:[o.material];
    mats.forEach(m=>{m.map?.dispose();m.dispose()});
   }
  });
  stage.removeFromParent();props.clear();
 }
 return{mount,play,update,dispose,
  get stats(){return{
   mounted,types:[...props.values()].map(v=>v.detail.kind),
   propNames:[...props.values()].map(v=>v.pivot.name),
   active:active.size,activeTypes:[...active.keys()].map(k=>props.get(k)?.detail.kind),
   accidents,scatterFrames,returns,peak,ruleMutations:0,
   scatterInstances: [...props.values()].map(p=>p.scatter.count)
  }}};
}
