import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import '../r125-asset-fingerprints.js';
const root=resolve(import.meta.dirname,'../assets');
const data=globalThis.ASDC_R125_FINGERPRINTS;
const rows=Object.entries(data);
const failed=[];
let total=0;
for(const [path,sha] of rows){
 const target=resolve(root,path);
 if(!existsSync(target)){failed.push('missing '+path);continue;}
 const bytes=readFileSync(target),actual=createHash('sha256').update(bytes).digest('hex');
 if(actual!==sha)failed.push('content hash mismatch '+path);
 if(!path.startsWith('model/')&&!path.endsWith('.glb.gz'))failed.push('unrecognized manifest path '+path);
 total+=bytes.length;
}
const result={passed:failed.length===0&&rows.length===16,assets:rows.length,
 modelCount:rows.filter(([k])=>k.startsWith('model/')).length,
 packCount:rows.filter(([k])=>k.startsWith('summons/')).length,
 byteCount:total,MiB:+(total/1048576).toFixed(2),errors:failed};
console.log('R125_FINGERPRINT_AUDIT',JSON.stringify(result));
if(!result.passed)process.exitCode=1;
