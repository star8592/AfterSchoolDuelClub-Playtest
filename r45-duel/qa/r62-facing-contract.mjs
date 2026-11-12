import {SOURCE_FRONT_YAW,faceOpponentYaw} from '../scene/summon-orientation.mjs';
import {readFileSync} from 'node:fs';
const known=new Set(JSON.parse(readFileSync(new URL('../assets/summons/runtime-assets.json',import.meta.url),'utf8')).models.map(x=>x.card_id));
const ALL=['E01','E02','E03','E04','G01','G02','G03','G04','M01','M02','T01','T02','T03','T04'];
let ok=0;
for(const id of ALL){
 if(!(id in SOURCE_FRONT_YAW))throw Error(id+' missing calibrated front');
 if(!['E01','G01','M01','M02'].includes(id)&&!known.has(id))throw Error(id+' missing model scale');
 for(const side of ['player','ai']){
  const yaw=faceOpponentYaw(id,side);
  const frontX=Math.sin(yaw+SOURCE_FRONT_YAW[id]);
  const delta=frontX*(side==='player'?1:-1);
  // R104 now balances both teams facing their opponent while revealing 52 degrees
  // more of their source face to the spectator (camera from +Z).
  const frontZ=Math.cos(yaw+SOURCE_FRONT_YAW[id]);
  if(delta<.60||frontZ<.79)throw Error(id+' not both audience-visible and opponent-facing: '+side);
  ok++;
 }
}
console.log('R62_SIDE_FACING_CONTRACT',JSON.stringify({cards:ALL.length,sides:2,checks:ok,pass:true}));
