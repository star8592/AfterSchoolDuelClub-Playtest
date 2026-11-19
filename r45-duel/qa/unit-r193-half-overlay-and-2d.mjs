import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installTextureLifecycleTrace} from '../scene/texture-gpu-lifecycle.mjs';
import {makeHalfMorphVendorOverlay} from './r193-half-morph-overlay.mjs';
const original=readFileSync('r45-duel/assets/three/build/three.module.js','utf8');
const changed=makeHalfMorphVendorOverlay(original);
assert(changed.length>original.length);
assert(changed.includes('texture.type = HalfFloatType;'));
assert(changed.includes('r193HalfPayload'));
assert.equal(original.includes('r193HalfPayload'),false,'production vendor module must remain unmodified');
assert.throws(()=>makeHalfMorphVendorOverlay('broken vendor revision'),/changed/);
const objects=new Set();
const gl={TEXTURE0:33984,TEXTURE_2D:3553,TEXTURE_2D_ARRAY:35866,
  createTexture(){const x={};objects.add(x);return x},
  deleteTexture(x){objects.delete(x)},
  bindTexture(){},activeTexture(){},texStorage2D(){},texSubImage2D(){},
  texImage2D(){},texStorage3D(){},texSubImage3D(){},texImage3D(){}};
const canvas={getContext(t){return t==='webgl2'?gl:null}};
const trace=installTextureLifecycleTrace(canvas);
assert.equal(canvas.getContext('webgl2'),gl);
const a=gl.createTexture(),b=gl.createTexture();
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D,a);
gl.texStorage2D(gl.TEXTURE_2D,1,35907,768,184);
gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,768,184,6408,5121,new Uint8Array(768*184*4));
gl.activeTexture(gl.TEXTURE0+1);gl.bindTexture(gl.TEXTURE_2D,b);
gl.texStorage2D(gl.TEXTURE_2D,1,35907,1,1);
const renderer={info:{memory:{textures:2}}};
const got=trace.snapshot(renderer,[]);
assert.equal(got.installed,true);
assert.equal(got.installError,null);
assert.equal(got.unowned2DDetail.length,2);
assert.equal(got.unowned2DDetail[0].storage2D.width,768);
assert.equal(got.unowned2DDetail[0].uploads2D,2);
assert.equal(got.unowned2DDetail[1].storage2D.width,1);
gl.deleteTexture(a);
assert.equal(trace.snapshot(renderer,[]).unowned2DDetail.length,1);
console.log('R193_VENDOR_QA_OVERLAY_AND_2D_BIND_LIFECYCLE_PASS',
  JSON.stringify({originalUnmodified:true,tracedTextures:2,trackedAfterDelete:1}));
