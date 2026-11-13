/**
 * R117: genuine existing art parts react to the match, without counterfeit
 * humanoid bones. Paper wings, owl eyes/wings and the talking menu are NOT
 * the same anatomical rig. M01 alone has genuine skinned human skeleton.
 */
const SPECIAL=new Set(['E02','T01','T02','M01']);
const rule={
 E02:['left folded outer wing','right folded outer wing'],
 T01:['Cambered folded wing foundation','Shallow inset forward-facing owl eye'],
 T02:['PIVOTABLE_FRONT_PAGE'],
 M01:['Head','Spine2','LeftShoulder','RightShoulder']
};
export function createPropLifeActing(THREE,root,id){
 const parts=[];const include=rule[id]||[];
 const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 // The R127 owl owns the exact same original wing/eye meshes. Never let
 // the old tiny-angle decorator reset their real shoulder/flap transforms.
 const nativeOwl=id==='T01'&&!!root.userData.r61?.getR127OwlMotion?.()?.enabled;
 if(SPECIAL.has(id)&&!nativeOwl)root.traverse(o=>{
  const kind=include.find(n=>norm(o.name).includes(norm(n)));
  if(!kind)return;
  const bound={node:o,rest:o.quaternion.clone(),start:o.position.clone(),
    kind};
  parts.push(bound);
 });
 const enabled=parts.length>=1;
 let frames=0,expressiveFrames=0,maxMovement=0;
 function update(seconds,life,{busy=false,reduced=false}={}){
  if(!enabled)return false;
  frames++;
  const intent=life?.intent||'idle';
  const power=!busy&&!reduced?Math.max(0,Math.min(1,life?.weight||0)):0;
  const engagement=['challenge','smirk','cheer','half_wave','stretch','tiny_clap'].includes(intent)?1:
   ['fidget','flinch','peek','scratch','headshake'].includes(intent)?-.68:.22;
  const breathing=!busy&&!reduced?.015*Math.sin(seconds*(id==='E02'?3.1:1.8)+id.charCodeAt(1)*.13):0;
  const response=power*engagement;
  for(let i=0;i<parts.length;i++){
   const part=parts[i],s=i%2?-1:1;
   const amount=Math.max(-.085,Math.min(.085,breathing+response*.052*s));
   if(busy)continue; // Do not override the original authored attack clip.
   part.node.quaternion.copy(part.rest);
   const axis=part.kind?.includes('wing')?new THREE.Vector3(0,0,1):
    part.kind?.includes('eye')?new THREE.Vector3(0,1,0):
    new THREE.Vector3(1,0,0);
   part.node.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(axis,amount));
   maxMovement=Math.max(maxMovement,Math.abs(amount));
  }
  if(power>.18)expressiveFrames++;
  return true;
 }
 function clear(){for(const p of parts)p.node.quaternion.copy(p.rest)}
 return{enabled,update,clear,inspect:()=>({id,enabled,parts:parts.map(x=>x.node.name),
  frames,expressiveFrames,maxMovement:+maxMovement.toFixed(4)})};
}
