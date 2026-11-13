/**
 * R113 Character-driven victory choreography. Pure math, no Three.js, audio
 * or game-rule dependency. Everyone keeps facing the opponent (yaw < .16).
 */
export const VICTORY_DURATION=6.4;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const ease=v=>{const t=clamp(v);return t*t*(3-2*t)};
const shapes=Object.freeze({
 M02:{mode:'ladle_parade',arms:1.25,bob:.85,swagger:1.30},
 E03:{mode:'cheer_captain',arms:1.45,bob:1.1,swagger:1.15},
 E04:{mode:'relay_runner',arms:1,bob:1.40,swagger:1.35},
 G02:{mode:'blackboard_wizard',arms:.8,bob:.8,swagger:.65},
 G03:{mode:'lab_professor',arms:.9,bob:.75,swagger:.8},
 G04:{mode:'club_director',arms:.9,bob:.9,swagger:1.05},
 T03:{mode:'mail_team',arms:1.05,bob:1,swagger:1.1},
 T04:{mode:'gate_guard',arms:.8,bob:.75,swagger:1.2},
 T01:{mode:'owl_broadcast',arms:1.35,bob:.9,swagger:1.05},
 T02:{mode:'menu_dance',arms:.65,bob:1.05,swagger:.75},
 E01:{mode:'hero',arms:1.15,bob:1.05,swagger:1},
 G01:{mode:'rival',arms:1.05,bob:.95,swagger:1.1}
});
const stages=[
 {id:'surprise',start:0,end:1.12},
 {id:'stomp',start:1.12,end:2.30},
 {id:'side_step',start:2.30,end:3.80},
 {id:'crowd_clap',start:3.80,end:5.15},
 {id:'final_pose',start:5.15,end:VICTORY_DURATION}
];
export const VICTORY_STAGES=Object.freeze(stages);
export function choreographVictory({elapsed,winner,side,id='E03',index=0,reduced=false}={}){
 const t=Math.max(0,Number(elapsed)||0),shape=shapes[id]||{mode:'individual',arms:1,bob:1,swagger:1};
 const owner=winner===side,draw=winner==='draw';
 const current=stages.find(x=>t>=x.start&&t<x.end)||stages.at(-1);
 const u=clamp((t-current.start)/(current.end-current.start));
 const stage=current.id;
 const exit=1-ease((t-5.85)/.53),enter=ease(t/.40);
 const strength=t>=VICTORY_DURATION||reduced?0:enter*exit;
 const offset=index*.13+(side==='ai'?.5:0);
 const beat=t*Math.PI*3.0+offset,ta=Math.sin(beat),tb=Math.sin(beat*2);
 let x=0,vertical=0,lean=0,yaw=0,armLeft=0,armRight=0,head=0;
 if(draw){
  if(stage==='final_pose'){armLeft=.12;armRight=.12;head=.03;}
  else{lean=.017*ta;head=.05*Math.sin(beat*.5);}
 }else if(owner){
  if(stage==='surprise'){
   const p=ease(u);
   armLeft=.03+.11*p;armRight=.04+.15*p;head=-.09*(1-p);
  }else if(stage==='stomp'){
   vertical=(.016+.024*Math.max(0,tb))*shape.bob;
   lean=.075*ta*shape.swagger;x=.06*Math.sin(beat)*shape.swagger;
   armLeft=.21-.12*ta;armRight=.22+.15*ta;
  }else if(stage==='side_step'){
   const walk=Math.sin(u*Math.PI*4+offset);
   x=.15*walk*shape.swagger;
   vertical=.03*Math.abs(Math.sin(u*Math.PI*4));
   lean=.095*walk; yaw=.11*walk;
   armLeft=.36-.12*walk;armRight=.34+.12*walk;
  }else if(stage==='crowd_clap'){
   const clap=Math.sin(u*Math.PI*5);
   armLeft=.47+.14*clap;armRight=.47-.14*clap;
   vertical=.02*Math.abs(clap);lean=.04*ta;
  }else{
   const swell=ease(u/.5);
   armLeft=.44+.23*swell;armRight=.52+.17*swell;
   head=.14*swell;lean=.03*Math.sin(u*Math.PI);
   vertical=.033*swell;
  }
  armLeft*=shape.arms;armRight*=shape.arms;
  // Props remain in the hand: the chef does a funny single-spoon salute.
  if(id==='M02'&&stage==='final_pose')armRight*=1.28;
  if(id==='G02'&&stage==='crowd_clap')armLeft*=.65;
  if(id==='T01')lean*=1.25;
 }else{
  head=-.15*(.6+.4*ease(t/.9));
  lean=-.035-.020*Math.sin(t*1.5);
  armLeft=-.045;armRight=-.045;
 }
 return {stage,mode:owner?shape.mode:draw?'draw':'defeat',winner:owner,weight:strength,
  x:clamp(x*strength,-.19,.19),bob:vertical*strength,lean:lean*strength,
  yaw:clamp(yaw*strength,-.15,.15),head:head*strength,
  left:armLeft*strength,right:armRight*strength};
}
