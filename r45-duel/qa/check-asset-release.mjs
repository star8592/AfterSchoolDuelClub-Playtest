/**
 * R92: guard against switching a running game's static-file root.
 *
 * Players can keep an R85 iframe open while a new R91 bundle is deployed.
 * Asset file names are immutable: retained older GLBs must remain readable,
 * and production GLBs must still contain genuine valid glTF meshes.
 *
 * Usage:
 *   node r45-duel/qa/check-asset-release.mjs
 *   node r45-duel/qa/check-asset-release.mjs https://example.com/r45-duel/
 */
import {readFileSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const old={
 E03:'E03-CheerCaptain-Phil-R85-Acting.glb',
 E04:'E04-CanteenRelay-Gabby-R85-Acting.glb',
 G02:'G02-BlackboardExpert-Lunte-R85-Acting.glb',
 G03:'G03-Jay-BlenderStudio-R85-Acting.glb',
 G04:'G04-ClubDirector-Victoria-R85-Acting.glb',
 M01:'M01-MusicTeacher-PolyforkSchoolTeacher.glb',
 M02:'M02-CafeteriaAunt-CartoonR76.glb',
 T01:'T01-BroadcastOwl-PolyforkRadio-R73.glb',
 T03:'T03-MailPair-Ellie-R85-Acting.glb',
 T04:'T04-Rex-BlenderStudio-R85-Acting.glb'
};
const current=()=>{
 const s=readFileSync(resolve(root,'scene/summon-models.mjs'),'utf8');
 const start=s.indexOf('export const UNIT_MODEL_SPECS=Object.freeze({');
 if(start===-1)throw Error('Production model registry missing');
 const end=s.indexOf('});',start);
 if(end===-1)throw Error('Unterminated production model registry');
 const rows=Object.fromEntries([...s.slice(start,end).matchAll(/\b([A-Z][0-9]{2}):\s*\{file:'([^']+\.glb)'/g)]
   .map(x=>[x[1],x[2]]));
 if(Object.keys(rows).length!==10)throw Error('Expected 10 current GLB character/object specs, got '+Object.keys(rows).length);
 return rows;
};
const remote=process.argv[2] ? new URL(process.argv[2].replace(/\/?$/,'/') ) :null;
const results=[];
for(const [generation,entries] of [['legacy-R85',old],['production-R91+',current()]]){
 for(const [id,file] of Object.entries(entries)){
  const p=resolve(root,'assets/summons',file);
  const buf=readFileSync(p);
  if(buf.toString('ascii',0,4)!=='glTF'||buf.readUInt32LE(4)!==2||buf.readUInt32LE(8)!==buf.byteLength)
   throw Error('Invalid GLB header '+generation+' '+file);
  const jsonSize=buf.readUInt32LE(12);
  if(buf.toString('ascii',16,20)!=='JSON'||jsonSize<50||jsonSize+20>buf.byteLength)
   throw Error('Invalid GLB JSON chunk '+file);
  const data=JSON.parse(buf.toString('utf8',20,20+jsonSize));
  if(!data.meshes?.length||!data.nodes?.length||!data.scenes?.length)
   throw Error('Not a genuine scene GLB '+file);
  if(statSync(p).size!==buf.byteLength)throw Error('GLB size mismatch '+file);
  let httpStatus=null;
  if(remote){
   const uri=new URL('assets/summons/'+encodeURIComponent(file),remote);
   // Ask the CDN for raw bytes; if it still sends gzip/br, Content-Length
   // measures the compressed transfer rather than the decoded GLB payload.
   const res=await fetch(uri,{method:'HEAD',
    headers:{'accept-encoding':'identity'},signal:AbortSignal.timeout(20000)});
   if(!res.ok)throw Error('Serving '+generation+' '+file+' returned HTTP '+res.status);
   const encoding=(res.headers.get('content-encoding')||'identity').toLowerCase();
   const contentLength=res.headers.get('content-length');
   const size=contentLength===null?null:Number(contentLength);
   if(encoding==='identity'&&size!==null&&Number.isFinite(size)&&size!==buf.byteLength)
    throw Error('Served length mismatch '+file+' '+size+' vs '+buf.byteLength);
   httpStatus=res.status;
  }
  results.push({generation,id,file,bytes:buf.byteLength,meshes:data.meshes.length,httpStatus});
 }
}
console.log('ASSET_RELEASE_OK',JSON.stringify({production:Object.keys(current()).length,
 legacy:Object.keys(old).length,count:results.length,
 totalBytes:results.reduce((sum,row)=>sum+row.bytes,0),
 remote:remote?.href||null,results}));
