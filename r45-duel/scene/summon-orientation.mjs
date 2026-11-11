/**
 * R62: Source-facing calibration independent of orbit camera orientation.
 * All asset sources in R61 are visually verified to face +Z at local yaw 0.
 * For Gobkit, source preview E03/G02 has been manually checked;
 * other same-export-family clips inherit that axis until replaced.
 * R67 source-VRM frontal renders prove E01/G01 FACE -Z, not +Z:
 * original R62's mathematical frontDot assumed +Z for every asset and was
 * tautological, allowing those two to face away despite 1.0 measurements.
 * The ten GLB source-family models remain +Z until independently replaced.
 * Per-card correction stays explicit for future art upgrades.
 */
export const SOURCE_FRONT_YAW=Object.freeze({
 E01:Math.PI,E02:0,E03:0,E04:0,G01:Math.PI,G02:0,G03:0,G04:0,M01:0,M02:Math.PI/2,
 T01:0,T02:0,T03:0,T04:0
});
export function faceOpponentYaw(id,side){
 if(!Object.hasOwn(SOURCE_FRONT_YAW,id))throw Error('No front calibration for '+id);
 if(side!=='player'&&side!=='ai')throw Error('Invalid side '+side);
 const target=side==='player'?Math.PI/2:-Math.PI/2;
 return target-SOURCE_FRONT_YAW[id];
}
export function faceOpponentDot(THREE,object,side,id){
 if(!Object.hasOwn(SOURCE_FRONT_YAW,id))throw Error('Missing visual face axis for '+id);
 object.updateMatrixWorld(true);
 const dir=new THREE.Vector3(0,0,1)
  .applyAxisAngle(new THREE.Vector3(0,1,0),SOURCE_FRONT_YAW[id])
  .applyQuaternion(object.getWorldQuaternion(new THREE.Quaternion()));
 dir.y=0;dir.normalize();
 return dir.dot(new THREE.Vector3(side==='player'?1:-1,0,0));
}
