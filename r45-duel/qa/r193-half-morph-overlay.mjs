/**
 * R193 TEST-ONLY: browser interception of Three.js Morphtarget texture path.
 * Vendor module on disk and the production game are never modified.
 */
export function makeHalfMorphVendorOverlay(source,{native=false}={}){
 const needle='\t\t\tentry = {\n\t\t\t\tcount: morphTargetsCount,';
 if(typeof source!=='string'||source.split(needle).length!==2)
   throw Error('R193 vendor Three.js morph target insertion point changed');
 const convert=native
   ? "const r193HalfPayload = typeof Float16Array==='function' ? new Uint16Array(new Float16Array(buffer).buffer) : Uint16Array.from(buffer,v=>DataUtils.toHalfFloat(v));"
   : "const r193HalfPayload = new Uint16Array(buffer.length); for(let h=0;h<buffer.length;h++)r193HalfPayload[h]=DataUtils.toHalfFloat(buffer[h]);";
 const insert="\t\t\t// R193 QA only: actual GPU RGBA16F payload, full model geometry intact.\n"+
   "\t\t\t"+convert+"\n"+
   "\t\t\ttexture.image.data = r193HalfPayload;\n"+
   "\t\t\ttexture.type = HalfFloatType;\n"+
   "\t\t\ttexture.needsUpdate = true;\n";
 return "import { DataUtils } from './three.core.js';\n"+
   source.replace(needle,insert+needle);
}
