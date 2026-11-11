import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const m=JSON.parse(readFileSync(resolve(root,'assets/characters/CAST_MANIFEST.json'),'utf8'));
const ids=['E01','E02','E03','E04','G01','G02','G03','G04','M01','T01','T02','T03','T04'];
if(m.unitCards?.length!==ids.length||m.unitCards.some((a,i)=>a.id!==ids[i]))
 throw Error('Canonical R72 13-unit art roster changed');
let sources=0,pending=0;
for(const a of m.unitCards){
 if(a.visual==='source_vrm'){
  const path=resolve(root,a.source||'missing');
  if(!existsSync(path)||statSync(path).size<8000000)
   throw Error('Missing/undersized character source VRM '+a.id);
  sources++;
 }else{
  if(a.source||a.unique3DCharacterComplete===true)
   throw Error('Unapproved temporary proxy disguised as production art: '+a.id);
  pending++;
 }
 if(a.unique3DCharacterComplete===true&&
    ['artSourceSHA256','frontQA','sideQA','backQA','actualRigQA','browserQA','approvedByHuman'].some(k=>!a[k]))
  throw Error('Missing original-art comparison and human signoff: '+a.id);
}
if(sources!==2||pending!==11)throw Error('Art provenance mismatch '+sources+'/'+pending);
console.log('R52_ART_GATE',JSON.stringify({passed:true,roster:ids.length,
 sourceVrms:sources,pendingArt:pending,approvedCharacterModels:0}));
