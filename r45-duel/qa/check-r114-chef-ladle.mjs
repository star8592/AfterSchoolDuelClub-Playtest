import assert from 'node:assert/strict';
import{readFileSync,statSync}from'node:fs';
import{resolve}from'node:path';
const file=resolve(import.meta.dirname,'../assets/summons/M02-CafeteriaAunt-ChefHat-Ladle-R114.glb');
const b=readFileSync(file);
assert.equal(b.toString('ascii',0,4),'glTF');
assert.equal(b.readUInt32LE(8),b.length);
const n=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+n).toString('utf8'));
const names=j.nodes.map(x=>x.name||'');
const skins=j.skins||[];
const skinIndex=skins.findIndex(s=>s.joints.some(i=>names[i]==='RightHand'));
assert.ok(skinIndex>=0,'original right-hand skeleton maintained');
const props=j.nodes.filter(x=>/Ladle|scoop_polished/i.test(x.name||'')&&x.mesh!==undefined);
assert.ok(props.length>=6,'real 3D deep dish, handle, collar and endcap');
assert.ok(props.every(x=>x.skin===skinIndex),'each ladle mesh is bound to true right-hand skeleton');
assert.ok(j.nodes.some(x=>/ChefHat_brim/.test(x.name||'')&&x.skin!==undefined),
 'chef hat skinned to original head');
assert.ok(names.includes('R114_DeepCafeteriaSoupLadle'));
assert.ok(!names.some(x=>/Spatula/.test(x)), 'no obsolete spatula geometry');
assert.ok(j.animations.length===10,'all ten original animations remain');
assert.ok(statSync(file).size>2800000&&statSync(file).size<3800000,'model reasonable size');
console.log('R114_CHEF_REAL_LADLE',JSON.stringify({passed:true,animations:j.animations.length,
 skinnedLadleNodes:props.map(x=>x.name),skins:skins.length,bytes:b.length}));
