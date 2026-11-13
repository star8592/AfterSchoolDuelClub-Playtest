/**
 * R114 contact-aware victory footwork. Pure contact schedule plus a small
 * runtime ankle anchor for genuine humanoid skeletons; never invent legs for
 * flyers or menu props. Visual only; authoritative board positions unchanged.
 */
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const smooth=t=>{const x=clamp(t,0,1);return x*x*(3-2*x)};
export function contactStep(elapsed,stage,index=0,reduced=false){
 const t=Number.isFinite(elapsed)?Math.max(0,elapsed):0;
 if(reduced||!['stomp','side_step','crowd_clap'].includes(stage))
  return {stance:'both',swing:null,lift:0,weight:0};
 const beat=stage==='side_step'?1.9:stage==='crowd_clap'?2.15:2.5;
 const step=Math.floor((t+(index%3)*.06)*beat);
 const phase=((t+(index%3)*.06)*beat)%1;
 const stance=step%2===0?'L':'R';
 const swing=stance==='L'?'R':'L';
 const lift=.045*Math.pow(Math.sin(Math.PI*phase),2)*
  smooth(phase/.10)*(1-smooth((phase-.83)/.15));
 return {stance,swing,lift:clamp(lift,0,.045),weight:1};
}
function findFoot(root,side){
 const candidates=side==='L'?
  ['LeftFoot','J_Bip_L_Foot','DEF-Foot.L','mixamorigLeftFoot','LeftAnkle']:
  ['RightFoot','J_Bip_R_Foot','DEF-Foot.R','mixamorigRightFoot','RightAnkle'];
 for(const n of candidates){const b=root.getObjectByName(n);if(b?.isObject3D&&b.parent)return b}
 return null;
}
export function createFootContact(THREE,root,id){
 const feet={L:findFoot(root,'L'),R:findFoot(root,'R')};
 const debugFootNodes=[];
 root.traverse(node=>{
  if(/foot|ankle/i.test(node.name||'')&&debugFootNodes.length<22)
   debugFootNodes.push({name:node.name,isBone:!!node.isBone});
 });
 const isHumanoid=!!feet.L&&!!feet.R;
 const leg=id==='M02'?{
  L:root.getObjectByName('LeftUpLeg'),R:root.getObjectByName('RightUpLeg')
 }:null;
 const local=new THREE.Vector3(),anchors={L:null,R:null};
 const legRests=leg?Object.fromEntries(['L','R'].map(s=>[s,leg[s]?.quaternion.clone()||null])):null;
 let frames=0,corrections=0,maxStanceError=0,last=null;
 function sample(side){
  root.updateMatrixWorld(true);
  return feet[side].getWorldPosition(local).y;
 }
 function apply(elapsed,stage,index,reduced=false,{animated=false,grounded=true}={}){
  if(!grounded||!isHumanoid)return null;
  const plan=contactStep(elapsed,stage,index,reduced);
  if(leg){
   for(const side of ['L','R']){
    const bone=leg[side];if(!bone)continue;
    if(!animated&&legRests[side])bone.quaternion.copy(legRests[side]);
    if(plan.swing===side&&plan.lift>.0001){
     const q=new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1,0,0),(side==='L'?1:-1)*plan.lift*1.65);
     bone.quaternion.multiply(q);
    }
   }
  }
  for(const side of ['L','R'])if(anchors[side]===null)anchors[side]=sample(side);
  // The stance ankle is the only constraint. Limit root corrections to a few
  // centimeters: existing sourced mocap, hit animations and camera framing win.
  const stance=plan.stance==='both'?'L':plan.stance;
  const measured=sample(stance);
  const delta=clamp(anchors[stance]-measured,-.065,.065);
  root.position.y+=delta;
  root.updateMatrixWorld(true);
  const error=Math.abs(sample(stance)-anchors[stance]);
  maxStanceError=Math.max(maxStanceError,error);frames++;
  if(Math.abs(delta)>.0005)corrections++;
  last={stance,swing:plan.swing,lift:+plan.lift.toFixed(4),
   correction:+delta.toFixed(4),error:+error.toFixed(4)};
  return last;
 }
 return {enabled:isHumanoid,apply,
  reset(){anchors.L=null;anchors.R=null;last=null;frames=corrections=0;maxStanceError=0},
  inspect:()=>({enabled:isHumanoid,footCandidates:debugFootNodes,frames,corrections,
   maxStanceError:+maxStanceError.toFixed(4),last})};
}
