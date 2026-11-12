/**
 * R99: R62 source-front calibration + spectator visibility.
 * M02's REAL Blender Head/headfront bone points toward -Y, which converts
 * to +Z in GLB; the old +PI/2 correction had made her face the wrong way.
 * In R104 all 14 models retain at least .60 opponent-facing dot AND
 * have >=.79 front-to-camera dot in default front-row stadium view.
 * All asset sources in R61 are visually verified to face +Z at local yaw 0.
 * For Gobkit, source preview E03/G02 has been manually checked;
 * other same-export-family clips inherit that axis until replaced.
 * R22 VRMs use +Z facial details for their true front.
 * Per-card correction stays explicit for future art upgrades.
 */
export const SOURCE_FRONT_YAW=Object.freeze({
 E01:0,E02:0,E03:0,E04:0,G01:0,G02:0,G03:0,G04:0,M01:0,M02:0,
 T01:Math.PI/2,T02:0,T03:0,T04:0
});
// R104: resolve the optional rollback once per module load, never per frame.
const LEGACY_FACING=(()=>{
 const params=new URLSearchParams(typeof location==='undefined'?'':location.search);
 let legacy=params.get('r104Facing')==='old';
 try{if(typeof window!=='undefined'&&window.parent!==window)
  legacy=legacy||new URLSearchParams(window.parent.location.search).get('r104Facing')==='old'}
 catch{}
 return legacy;
})();
export function faceOpponentYaw(id,side){
 if(!Object.hasOwn(SOURCE_FRONT_YAW,id))throw Error('No front calibration for '+id);
 if(side!=='player'&&side!=='ai')throw Error('Invalid side '+side);
 // 0.655 rad ~38°: 79% character front toward spectator +Z, while
 // retaining 61% of its forward vector toward opposing half of the stage.
 // Local correction SOURCE_FRONT_YAW is PER ROLE, not one-size-fits-all.
 const yaw=LEGACY_FACING?Math.PI/2-.31:.655;
 const target=side==='player'?yaw:-yaw;
 return target-SOURCE_FRONT_YAW[id];
}
export function faceOpponentDot(THREE,object,side,id){
 object.updateMatrixWorld(true);
 const front=SOURCE_FRONT_YAW[id]||0;
 const dir=new THREE.Vector3(Math.sin(front),0,Math.cos(front)).applyQuaternion(object.getWorldQuaternion(new THREE.Quaternion()));
 dir.y=0;dir.normalize();
 return dir.dot(new THREE.Vector3(side==='player'?1:-1,0,0));
}
