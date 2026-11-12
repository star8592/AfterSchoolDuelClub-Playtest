/**
 * R99: R62 source-front calibration + spectator visibility.
 * M02's REAL Blender Head/headfront bone points toward -Y, which converts
 * to +Z in GLB; the old +PI/2 correction had made her face the wrong way.
 * All active units retain >=.95 opponent-facing dot plus a visible front
 * three-quarter angle in the default camera.
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
export function faceOpponentYaw(id,side){
 if(!Object.hasOwn(SOURCE_FRONT_YAW,id))throw Error('No front calibration for '+id);
 if(side!=='player'&&side!=='ai')throw Error('Invalid side '+side);
 // Front-of-stage spectator (+Z) must see the expressions instead of
 // character backs. Keep a 0.31rad frontal bias while still facing the
 // opponent (cos(.31) = .9523, within current 3D opponent-facing QA).
 const target=side==='player'?Math.PI/2-.31:-Math.PI/2+.31;
 return target-SOURCE_FRONT_YAW[id];
}
export function faceOpponentDot(THREE,object,side,id){
 object.updateMatrixWorld(true);
 const front=SOURCE_FRONT_YAW[id]||0;
 const dir=new THREE.Vector3(Math.sin(front),0,Math.cos(front)).applyQuaternion(object.getWorldQuaternion(new THREE.Quaternion()));
 dir.y=0;dir.normalize();
 return dir.dot(new THREE.Vector3(side==='player'?1:-1,0,0));
}
