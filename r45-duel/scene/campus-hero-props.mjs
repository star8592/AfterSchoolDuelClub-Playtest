/**
 * R170 hand-authored geometry enhancements for seven signature school spells.
 * Film-like readable silhouettes, tuned physically meaningful subparts,
 * deterministic colors and reusable cached Three.js geometry/materials.
 * No shader code, no texture downloads, no PointLight and no gameplay math.
 */
export const HERO_PROP_IDS=Object.freeze(['E06','K01','K06','Q05','P04','P05','X05']);
export function renderCampusHeroProp(id,{THREE,g,group,box,ball,cone,tube,torus,
 geometry,material,pan,book,paperStack,pencil}){
 if(!HERO_PROP_IDS.includes(id))return false;
 const panel=(p,w,h,d,color,x,y,z)=>box(p,w,h,d,color,x,y,z);
 const stem=(p,r,h,color,x,y,z,angle=0)=>{
  const v=tube(p,r,h,color,x,y,z);v.rotation.z=angle;return v;
 };
 const chip=(p,x,y,z,i)=>{
  const radius=.038+(i%4)*.018;
  const piece=cone(p,radius,.12+(i%3)*.08,i%3?'#eee8d9':'#a3b0ac',x,y,z);
  piece.rotation.z=i*2.399;piece.rotation.x=i*.6;
 };
 const ringSide=(p,r,c,x,y,z)=>{
  const o=torus(p,r,c,x,y,z);
  o.rotation.x=Math.PI/2;
  return o;
 };
 switch(id){
  case 'E06':{
   const eraser=group(g,0,.14,0);
   eraser.name='E06_Actual_Heavy_Eraser';
   panel(eraser,1.28,.30,.80,'#4b5b68',0,.13,0);
   panel(eraser,1.23,.095,.76,'#c7bba6',0,.34,0);
   panel(eraser,1.25,.095,.72,'#29363f',0,-.11,0);
   for(const x of [-.55,.55]){
    panel(eraser,.075,.24,.71,'#8797a3',x,.13,0);
    for(const z of [-.25,.25])ball(eraser,.04,'#e1d7bd',x,.25,z);
   }
   for(let i=0;i<18;i++){
    const x=-.8+((i*37)%20)*.080, y=-.30+(i%6)*.09,z=-.27+((i*7)%8)*.073;
    chip(g,x,y,z,i);
   }
   eraser.rotation.z=-.16;eraser.rotation.x=.09;
   return true;
  }
  case 'K01':{
   const wok=pan(g);
   wok.name='K01_Canteen_Wok';
   const eggplant=group(g,-.37,.52,.09);eggplant.name='Eggplant_Roasted';
   const e=ball(eggplant,.27,'#67407d');e.scale.set(.7,1.82,.78);
   eggplant.rotation.z=-.43;
   cone(eggplant,.21,.29,'#709e6e',-.10,.45,0).rotation.z=-.35;
   stem(eggplant,.045,.25,'#55765f',-.16,.65,0,.20);
   const banana=group(g,.42,.51,.02);banana.name='Banana_Sauteed';
   const arc=new THREE.Mesh(geometry('TorusGeometry',.38,.14,10,28,Math.PI*1.1),material('#efcc6d'));
   arc.rotation.z=-.7;arc.rotation.y=.42;banana.add(arc);
   for(const [x,y] of [[-.2,.35],[.35,.03]])ball(banana,.08,'#8a6740',x,y,0);
   for(let i=0;i<5;i++)ball(g,.075,'#c6b777',-.55+i*.30,.27,.16+(i%2)*.19);
   return true;
  }
  case 'K06':{
   const cup=group(g);cup.name='K06_Volcanic_Pepper_Milk_Tea';
   const main=panel(cup,.98,1.25,.75,'#cf9b74',0,-.05,0);
   panel(cup,1.08,.12,.86,'#f1dfc2',0,.60,0);
   panel(cup,.82,.28,.09,'#7c594f',0,-.12,.39);
   stem(cup,.083,1.32,'#f0cfa6',.28,1.07,.08,.18);
   for(let i=0;i<13;i++){
    const x=-.35+(i%5)*.165,y=-.45+Math.floor(i/5)*.13,z=.43;
    ball(cup,.07+(i%3)*.014,'#3a2b30',x,y,z);
   }
   const pepper=group(cup,-.24,.96,.04);
   const leaf=cone(pepper,.21,.68,'#c85143');leaf.rotation.z=-.44;
   cone(pepper,.18,.22,'#658e60',0,.36);
   for(let i=0;i<8;i++){
    const x=((i*17)%7-3)*.16,y=.94+(i%4)*.19,z=(i%3-1)*.17;
    const jet=cone(cup,.085,.22,'#f3c277',x,y,z);jet.rotation.z=i*.37;
   }
   return true;
  }
  case 'Q05':{
   const stage=group(g);stage.name='Q05_Chalk_Press_Conference';
   panel(stage,1.83,.84,.77,'#536c78',0,-.30,0);
   panel(stage,1.96,.12,.91,'#c79a68',0,.14,0);
   panel(stage,1.30,.17,.03,'#254c49',0,-.32,.41);
   for(const x of [-.42,.42]){
    stem(stage,.055,.47,'#a9aeb5',x,.57,.26,-.12);
    ball(stage,.135,'#323f48',x,.79,.26);
   }
   const chalk=group(stage,0,.84,.02);
   const body=stem(chalk,.13,.68,'#f1e8d7',0,0,0);
   body.rotation.z=-.18;
   const hat=cone(chalk,.25,.22,'#475469',-.05,.45);
   hat.rotation.z=.16;
   panel(chalk,.26,.06,.20,'#b0a19a',0,-.32,0);
   for(let i=0;i<9;i++)chip(stage,-.78+i*.19,.83+(i%3)*.15,.02,i);
   return true;
  }
  case 'P04':{
   const whistle=group(g);whistle.name='P04_Coach_Huge_Whistle';
   const head=ball(whistle,.49,'#d6ac66',-.22,.20,0);
   head.scale.set(1.15,.63,.80);
   panel(whistle,.89,.22,.49,'#d6ac66',.35,.19,.03);
   panel(whistle,.16,.18,.43,'#4d5969',.77,.17,.06);
   const hole=ball(whistle,.18,'#505762',-.25,.48,.24);
   hole.scale.y=.40;
   ringSide(whistle,.16,'#e5d8b9',-.60,-.06,-.01);
   const lanyard=torus(whistle,.78,'#ac6869',.08,-.38,-.22);
   lanyard.scale.set(.9,.36,.7);
   for(let i=0;i<4;i++)
    panel(whistle,.08,.30,.035,'#a0b9c9',-.89+i*.12,.11+i*.15,-.07);
   return true;
  }
  case 'P05':{
   const kit=group(g);kit.name='P05_Volleyball_Wrong_Basket';
   const ballGroup=group(kit,-.58,.06,.1);
   const main=ball(ballGroup,.47,'#e5dac0');
   main.scale.set(1.02,.99,1);
   for(let i=0;i<4;i++){
    const seam=torus(ballGroup,.468,'#566977',0,0,0);
    seam.rotation.x=i*Math.PI/4;
    seam.rotation.y=i*Math.PI/7;
   }
   stem(kit,.065,2.00,'#7c8a8d',.78,.06,-.30);
   panel(kit,1.27,.78,.07,'#f4e0c0',.48,.69,-.26);
   panel(kit,1.07,.57,.08,'#b37962',.48,.69,-.18);
   const hoop=ringSide(kit,.38,'#cd7964',.48,.43,.24);
   for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7;
    const cord=stem(kit,.012,.40,'#eee9d9',.48+Math.cos(a)*.36,.16,.24+Math.sin(a)*.36);
    cord.rotation.z=Math.sin(a)*.24;
   }
   return true;
  }
  case 'X05':{
   const library=group(g);library.name='X05_Homework_Galaxy';
   book(library,'#e3d0b1',0,.0,0);
   for(let i=0;i<11;i++){
    const a=i*2.4,rad=.33+(i%4)*.17;
    const page=group(library,Math.cos(a)*rad,.36+(i%5)*.24,Math.sin(a)*rad);
    panel(page,.46,.65,.028,i%3?'#f0e6cf':'#d9d3e9',0,0,0);
    page.rotation.set(i*.39,i*.48,i*.22);
    for(let j=0;j<3;j++)panel(page,.31,.022,.031,'#8d98ae',0,.20-j*.13,.03);
   }
   return true;
  }
 }
 return false;
}
