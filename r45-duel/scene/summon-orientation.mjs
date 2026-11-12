/**
 * R105: one facing rule: every player's real physical front points to the
 * opposing team, independent of spectator camera and screen orientation.
 * R106 independent VRM mesh evidence: Shino, Fumiriya and both new
 * podium VRMs have EyeIris material facing local -Z (face vertices at z<0).
 * R105 incorrectly assumed all VRMs face +Z, hence every visible VRM
 * was BACK-TO-BACK on the arena even though its front-dot test passed.
 * E01/G01 share the same VRM local axis for summons and podium hosts.
 * Asset-specific SOURCE_FRONT_YAW corrects this; GLB axes differ.
 * Characters' momentary action/recoil turns may add small animation offsets.
 */
export const SOURCE_FRONT_YAW=Object.freeze({
 E01:Math.PI,E02:0,E03:0,E04:0,G01:Math.PI,G02:0,G03:0,G04:0,M01:0,M02:0,
 T01:Math.PI/2,T02:0,T03:0,T04:0
});
export function faceOpponentYaw(id,side){
 if(!Object.hasOwn(SOURCE_FRONT_YAW,id))throw Error('No front calibration for '+id);
 if(side!=='player'&&side!=='ai')throw Error('Invalid side '+side);
 // +/-90 degrees is an actual duel stance, not a three-quarter pose for the camera.
 // The correction handles individual models whose imported front axis differs.
 return (side==='player'?Math.PI/2:-Math.PI/2)-SOURCE_FRONT_YAW[id];
}
export function faceOpponentDot(THREE,object,side,id){
 object.updateMatrixWorld(true);
 const front=SOURCE_FRONT_YAW[id]||0;
 const dir=new THREE.Vector3(Math.sin(front),0,Math.cos(front)).applyQuaternion(object.getWorldQuaternion(new THREE.Quaternion()));
 dir.y=0;dir.normalize();
 return dir.dot(new THREE.Vector3(side==='player'?1:-1,0,0));
}
