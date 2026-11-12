import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const files=[
 'Shino-original-CC0.vrm','Fumiriya-original-CC0.vrm',
 'Host-HairSample_Female-CC0.vrm','Host-HairSample_Male-CC0.vrm'
];
const root=resolve(import.meta.dirname,'../assets/model');
const results=[];
for(const name of files){
 const bytes=readFileSync(resolve(root,name));
 if(bytes.toString('ascii',0,4)!=='glTF')throw Error('Invalid VRM: '+name);
 const jsonLen=bytes.readUInt32LE(12);
 const gltf=JSON.parse(bytes.subarray(20,20+jsonLen).toString());
 const binOffset=20+jsonLen+8;
 const face=gltf.meshes.find(m=>m.name==='Face.baked');
 if(!face)throw Error('Missing original VRM face geometry: '+name);
 const meanZ=primitive=>{
  const pos=gltf.accessors[primitive.attributes.POSITION];
  const pView=gltf.bufferViews[pos.bufferView];
  const pOffset=binOffset+(pView.byteOffset||0)+(pos.byteOffset||0);
  const stride=pView.byteStride||12;
  const indices=gltf.accessors[primitive.indices];
  const iView=gltf.bufferViews[indices.bufferView];
  const iOffset=binOffset+(iView.byteOffset||0)+(indices.byteOffset||0);
  let sum=0,count=0;const unique=new Set();
  for(let i=0;i<indices.count;i++){
   const addr=iOffset+i*(indices.componentType===5125?4:2);
   unique.add(indices.componentType===5125?bytes.readUInt32LE(addr):bytes.readUInt16LE(addr));
  }
  for(const i of unique){sum+=bytes.readFloatLE(pOffset+i*stride+8);count++}
  return sum/count;
 };
 const rows=face.primitives.map(p=>({
  material:gltf.materials[p.material].name,z:meanZ(p)
 }));
 const iris=rows.find(p=>p.material.includes('EyeIris_'));
 const skin=rows.filter(p=>p.material.includes('Face_00_SKIN'));
 if(!iris||!skin.length)throw Error('No independent eyes vs face evidence '+name);
 const backZ=Math.max(...skin.map(x=>x.z));
 const proof={file:name,eyeZ:+iris.z.toFixed(5),backOfFaceZ:+backZ.toFixed(5),
  towardNegativeZ:iris.z<backZ-.04};
 if(!proof.towardNegativeZ)throw Error('VRM eye front axis was not -Z '+JSON.stringify(proof));
 results.push(proof);
}
console.log('R106_INDEPENDENT_VRM_FACE_GEOMETRY',JSON.stringify(results));
