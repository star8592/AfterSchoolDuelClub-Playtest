/** R177 content-integrity guard: never call procedural placeholders film-grade. */
import {SCHOOL_MAGIC_IDENTITIES,SCHOOL_MAGIC_COUNT} from '../scene/campus-magic-bible.mjs';
import {existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const candidateIds=new Map([
 ['E06',{
  source:'art/hero-props/E06_Cinematic_Eraser.blend',
  runtime:'art/hero-props/E06_Cinematic_Eraser.glb',
  image:'art/hero-props/qa/E06_Cinematic_Eraser.png',
  reproducible:'art/hero-props/build_e06_sculpt.py'
 }],
 ['K01',{
  source:'art/hero-props/K01_Sculpted_Wok_Eggplant_Banana.blend',
  runtime:'art/hero-props/K01_Sculpted_Wok_Eggplant_Banana.glb',
  image:'art/hero-props/qa/K01_Sculpted_Wok_Eggplant_Banana.png',
  reproducible:'art/hero-props/build_k01_wok_sculpt.py'
 }]
]);
const records=Object.values(SCHOOL_MAGIC_IDENTITIES).map(e=>{
 const candidate=candidateIds.get(e.id);
 const files=candidate?Object.fromEntries(Object.entries(candidate)
  .map(([k,p])=>[k,existsSync(resolve(root,p))])):null;
 const validCandidate=files&&Object.values(files).every(Boolean);
 return {id:e.id,name:e.originalName,family:e.family,prop:e.prop,
  assetTier:validCandidate?'true3d_review_candidate':'procedural_placeholder',
  independentlySculpted:!!validCandidate,
  visualAccepted:false,performanceAccepted:false,
  releaseEligible:false,
  files};
});
const true3d=records.filter(x=>x.independentlySculpted).length;
const accepted=records.filter(x=>x.releaseEligible).length;
const summary={cardCount:SCHOOL_MAGIC_COUNT,true3dCandidateCount:true3d,
  proceduralPlaceholderCount:records.length-true3d,visuallyAccepted:0,
  releaseReady:accepted,release:'NO_GO',
  note:'Scans true physical authored model and referenced source files. Does not automatically validate beauty or mobile performance; manual visual signoff required.',records};
const dest=resolve(root,'qa/evidence/r178-sculpted-props/r178-46-prop-art-status.json');
mkdirSync(dirname(dest),{recursive:true});
writeFileSync(dest,JSON.stringify(summary,null,2));
console.log('R178_REAL_ART_AUDIT',JSON.stringify({
 all:summary.cardCount,sculptedCandidates:true3d,placeholders:records.length-true3d,
 visuallyAccepted:0,release:'NO_GO',report:dest}));
if(SCHOOL_MAGIC_COUNT!==46||records.length!==46||true3d!==2)process.exitCode=3;
if(process.argv.includes('--release')&&accepted!==46)process.exitCode=2;
