/**
 * R193 QA-only morph quantization survey. NEVER rewrites source geometry.
 * Scans actual buffer attributes in the active real scene and evaluates
 * round-trip IEEE 754 binary16 error with the vendored Three.js converter.
 */
export function auditMorphHalfError(THREE,scene){
 if(!scene||!THREE?.DataUtils)return {enabled:true,ready:false};
 const seen=new Set(),perGeometry=[];
 const accum={
   position:{scalars:0,sumSq:0,maxAbs:0,over0001:0,over001:0,over01:0},
   normal:{scalars:0,sumSq:0,maxAbs:0,over0001:0,over001:0,over01:0},
   color:{scalars:0,sumSq:0,maxAbs:0,over0001:0,over001:0,over01:0}
 };
 let nonfinite=0,overflows=0,underflows=0,nonzero=0,totalScalars=0;
 const nativeSamples=[];
 const round=n=>Math.round(n*1000000)/1000000;
 for(const root of scene.children)root.traverse(obj=>{
   const g=obj.geometry;
   if(!g?.isBufferGeometry||!g.morphAttributes||seen.has(g.uuid))return;
   const attrs=g.morphAttributes;
   if(!Object.keys(attrs).some(k=>attrs[k]?.length))return;
   seen.add(g.uuid);
   const local={uuid:g.uuid,owner:obj.name||obj.type,
     morphCounts:{position:attrs.position?.length||0,
       normal:attrs.normal?.length||0,color:attrs.color?.length||0},
     maxPositionAbs:0,maxNormalAbs:0,maxColorAbs:0,
     positionsAbove001:0,positionsAbove01:0,samples:0};
   for(const [key,group] of [
     ['position',attrs.position||[]],['normal',attrs.normal||[]],
     ['color',attrs.color||[]]]){
     const stats=accum[key];
     for(const attr of group){
       // GLTF morphs can be interleaved. Three.js Vector4.fromBufferAttribute
       // reads scalar channels via getX/getY/getZ/getW, not raw array offset.
       const count=attr.count,size=attr.itemSize;
       for(let i=0;i<count;i++){
         for(let j=0;j<size;j++){
           const value=j===0?attr.getX(i):j===1?attr.getY(i):
             j===2?attr.getZ(i):attr.getW(i);
           totalScalars++;
           if(!Number.isFinite(value)){nonfinite++;continue}
           if(Math.abs(value)>65504){overflows++;continue}
           if(value!==0)nonzero++;
           if(nativeSamples.length<250000&&(totalScalars%53)===0)nativeSamples.push(value);
           const restored=THREE.DataUtils.fromHalfFloat(
             THREE.DataUtils.toHalfFloat(value));
           const error=Math.abs(restored-value);
           if(value!==0&&restored===0)underflows++;
           stats.scalars++;stats.sumSq+=error*error;
           if(error>stats.maxAbs)stats.maxAbs=error;
           if(error>0.0001)stats.over0001++;
           if(error>0.001)stats.over001++;
           if(error>0.01)stats.over01++;
           if(key==='position'){
             local.maxPositionAbs=Math.max(local.maxPositionAbs,error);
             if(error>0.001)local.positionsAbove001++;
             if(error>0.01)local.positionsAbove01++;
           }
           if(key==='normal')local.maxNormalAbs=Math.max(local.maxNormalAbs,error);
           if(key==='color')local.maxColorAbs=Math.max(local.maxColorAbs,error);
           local.samples++;
         }
       }
     }
   }
   if(local.samples)perGeometry.push(local);
 });
 const native16Available=typeof Float16Array==='function';
 let nativeBitsMismatch=null,nativeBetter=0,nativeWorse=0,nativeEqualError=0;
 let nativeMaxVsSoftware=0,nativeMaxAbsError=0,nativeOver0001=0,nativeOver001=0;
 if(native16Available){
   const asFloat32=new Float32Array(nativeSamples);
   const asHalfBits=new Uint16Array(new Float16Array(asFloat32).buffer);
   nativeBitsMismatch=0;
   for(let i=0;i<asFloat32.length;i++){
     const actual=asFloat32[i],native=THREE.DataUtils.fromHalfFloat(asHalfBits[i]);
     const software=THREE.DataUtils.fromHalfFloat(THREE.DataUtils.toHalfFloat(actual));
     const nativeError=Math.abs(native-actual),softwareError=Math.abs(software-actual);
     if(asHalfBits[i]!==THREE.DataUtils.toHalfFloat(actual))nativeBitsMismatch++;
     if(nativeError<softwareError)nativeBetter++;
     else if(nativeError>softwareError)nativeWorse++;
     else nativeEqualError++;
     nativeMaxVsSoftware=Math.max(nativeMaxVsSoftware,Math.abs(native-software));
     nativeMaxAbsError=Math.max(nativeMaxAbsError,nativeError);
     if(nativeError>0.0001)nativeOver0001++;
     if(nativeError>0.001)nativeOver001++;
   }
 }
 const stats=Object.fromEntries(Object.entries(accum).map(([k,v])=>[k,{
   ...v,sumSq:undefined,rmse:round(Math.sqrt(v.sumSq/Math.max(1,v.scalars))),
   maxAbs:round(v.maxAbs)}]));
 return {enabled:true,ready:true,geometries:perGeometry.length,
   totalScalars,nonzeroScalars:nonzero,nonfinite,overflows,underflows,
   native16Available,nativeBitsSamples:nativeSamples.length,nativeBitsMismatch,
   nativeBetter,nativeWorse,nativeEqualError,
   nativeMaxVsSoftware:round(nativeMaxVsSoftware),
   nativeMaxAbsError:round(nativeMaxAbsError),nativeOver0001,nativeOver001,
   stats,
   highestPositionErrors:perGeometry.toSorted((a,b)=>b.maxPositionAbs-a.maxPositionAbs)
     .slice(0,24).map(x=>({...x,maxPositionAbs:round(x.maxPositionAbs),
       maxNormalAbs:round(x.maxNormalAbs),maxColorAbs:round(x.maxColorAbs)})),
   note:'CPU IEEE754 half round-trip of real Morph Attributes, not an animation visual acceptance test. No source vertex data was changed.'};
}
