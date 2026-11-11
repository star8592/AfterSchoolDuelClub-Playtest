/**
 * R81 physical LED scoreboard (not a 2D screen-space mock).
 * Numbers are received only from the canonical R45 rules engine.
 */
export function createLiveStadiumScoreboard(THREE,scene){
 const root=new THREE.Group();root.name='R81_Real_Time_Stadium_Jumbotron';
 root.position.set(0,4.16,-7.75);
 scene.add(root);
 const base=new THREE.Mesh(new THREE.BoxGeometry(8.15,1.52,.20),
   new THREE.MeshStandardMaterial({color:'#0e1928',metalness:.48,roughness:.44}));
 base.position.z=-.12;root.add(base);
 const rim=new THREE.Mesh(new THREE.BoxGeometry(8.27,1.63,.08),
   new THREE.MeshStandardMaterial({color:'#aa8755',metalness:.65,roughness:.25}));
 rim.position.z=-.24;root.add(rim);
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=288;
 const ctx=canvas.getContext('2d');
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 tex.anisotropy=8;
 const screen=new THREE.Mesh(new THREE.PlaneGeometry(7.85,1.30),
   new THREE.MeshBasicMaterial({map:tex,toneMapped:false,depthWrite:false}));
 screen.position.z=.009;root.add(screen);
 const previous={player:null,ai:null};
 let data={player:20,ai:20,round:1,turn:'player',comboPlayer:0,comboAi:0,energy:2};
 let hits={player:0,ai:0},lastTick=0,updates=0,errors=0;
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 function draw(now=0){
   const t=now/1000;lastTick=t;
   const bg=ctx.createLinearGradient(0,0,1536,288);
   bg.addColorStop(0,'#401c27');bg.addColorStop(.5,'#081625');bg.addColorStop(1,'#143b4a');
   ctx.fillStyle=bg;ctx.fillRect(0,0,1536,288);
   const team=(side,x,color,title)=>{
     const hp=data[side],flash=now-hits[side]<650;
     ctx.fillStyle=flash?'#fff7d6':color;
     ctx.shadowColor=color;ctx.shadowBlur=flash?34:13;
     ctx.textAlign='center';ctx.font='bold 38px system-ui';
     ctx.fillText(title,x,51);
     ctx.font='900 118px ui-monospace,monospace';
     ctx.fillText(String(hp).padStart(2,'0'),x,182);
     ctx.shadowBlur=0;
     ctx.font='600 22px system-ui';ctx.fillStyle='#d5dee8';ctx.fillText('人气 / 20',x,220);
     ctx.fillStyle='#0a1724';ctx.fillRect(x-205,238,410,15);
     ctx.fillStyle=color;ctx.fillRect(x-205,238,410*clamp(hp/20,0,1),15);
   };
   team('player',340,'#ffbc91','红方 · PLAYER');
   team('ai',1196,'#95dff5','蓝方 · RIVAL');
   ctx.textAlign='center';ctx.shadowBlur=0;
   ctx.fillStyle='#f7d6a4';ctx.font='900 79px system-ui';
   ctx.fillText('VS',768,141);
   ctx.fillStyle='#e4d9c5';ctx.font='bold 23px system-ui';
   ctx.fillText('ROUND '+String(data.round).padStart(2,'0'),768,49);
   ctx.fillStyle='#90adc3';ctx.font='600 20px system-ui';
   ctx.fillText(data.turn==='player'?'红方行动中':data.turn==='ai'?'蓝方行动中':'比赛结束',768,217);
   ctx.fillStyle='#d6b78b';ctx.font='600 16px system-ui';
   ctx.fillText('连携 '+data.comboPlayer+' : '+data.comboAi+' 连携',768,265);
   tex.needsUpdate=true;
 }
 function setState(value,now=performance.now()){
   if(!value||!Number.isInteger(value.player)||!Number.isInteger(value.ai)||
    !Number.isInteger(value.round)||value.player<0||value.ai<0||
    value.player>20||value.ai>20||value.round<1||value.round>30||
    !['player','ai','ended'].includes(value.turn)){errors++;return false;}
   for(const side of ['player','ai']){
     if(previous[side]!==null&&value[side]<previous[side])hits[side]=now;
     previous[side]=value[side];
   }
   data={...data,...value};updates++;draw(now);
   return true;
 }
 draw(0);
 return{root,setState,update(now=performance.now()){
    if(now-hits.player<660||now-hits.ai<660){if(now-lastTick*1000>66)draw(now);}
   },
   get stats(){return{updates,errors,data:{...data},size:[canvas.width,canvas.height],physical:true,
     hitFlashCount:Object.values(hits).filter(v=>v>0).length,visible:root.visible};}
 };
}
