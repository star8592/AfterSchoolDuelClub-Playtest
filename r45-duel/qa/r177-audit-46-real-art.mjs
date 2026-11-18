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
 }],
 ['K07',{
  source:'art/hero-props/K07_Sculpted_Frog_Pudding_Bell.blend',
  runtime:'art/hero-props/K07_Sculpted_Frog_Pudding_Bell.glb',
  image:'art/hero-props/qa/K07_Sculpted_Frog_Pudding_Bell.png',
  reproducible:'art/hero-props/build_k07_frog_pudding.py'
 }],
 ['K06',{
  source:'art/hero-props/K06_Volcano_Chili_Boba_Tea.blend',
  runtime:'art/hero-props/K06_Volcano_Chili_Boba_Tea.glb',
  image:'art/hero-props/qa/K06_Volcano_Chili_Boba_Tea.png',
  reproducible:'art/hero-props/build_r182_signature_six.py'
 }],
 ['Q05',{
  source:'art/hero-props/Q05_Chalk_Press_Conference.blend',
  runtime:'art/hero-props/Q05_Chalk_Press_Conference.glb',
  image:'art/hero-props/qa/Q05_Chalk_Press_Conference.png',
  reproducible:'art/hero-props/build_r182_signature_six.py'
 }],
 ['P04',{
  source:'art/hero-props/P04_Mega_Sports_Whistle.blend',
  runtime:'art/hero-props/P04_Mega_Sports_Whistle.glb',
  image:'art/hero-props/qa/P04_Mega_Sports_Whistle.png',
  reproducible:'art/hero-props/build_r182_signature_six.py'
 }],
 ['S04',{
  source:'art/hero-props/S04_Wrong_Answer_Generator.blend',
  runtime:'art/hero-props/S04_Wrong_Answer_Generator.glb',
  image:'art/hero-props/qa/S04_Wrong_Answer_Generator.png',
  reproducible:'art/hero-props/build_r182_signature_six.py'
 }],
 ['P05',{
  source:'art/hero-props/P05_Volleyball_Basketball_Hoop.blend',
  runtime:'art/hero-props/P05_Volleyball_Basketball_Hoop.glb',
  image:'art/hero-props/qa/P05_Volleyball_Basketball_Hoop.png',
  reproducible:'art/hero-props/build_r182_signature_six.py'
 }],
 ['X05',{
  source:'art/hero-props/X05_Homework_Paper_Galaxy.blend',
  runtime:'art/hero-props/X05_Homework_Paper_Galaxy.glb',
  image:'art/hero-props/qa/X05_Homework_Paper_Galaxy.png',
  reproducible:'art/hero-props/build_r182_signature_six.py'
 }],
 ['P03',{
  source:'art/hero-props/P03_Cardboard_Tyrannosaurus_Stomp.blend',
  runtime:'art/hero-props/P03_Cardboard_Tyrannosaurus_Stomp.glb',
  image:'art/hero-props/qa/P03_Cardboard_Tyrannosaurus_Stomp.png',
  reproducible:'art/hero-props/build_r183_eight_character_props.py'
 }],
 ['S08',{
  source:'art/hero-props/S08_Angry_Campus_Vending_Machine.blend',
  runtime:'art/hero-props/S08_Angry_Campus_Vending_Machine.glb',
  image:'art/hero-props/qa/S08_Angry_Campus_Vending_Machine.png',
  reproducible:'art/hero-props/build_r183_eight_character_props.py'
 }],
 ['X03',{
  source:'art/hero-props/X03_Rooftop_School_Patrol_Car.blend',
  runtime:'art/hero-props/X03_Rooftop_School_Patrol_Car.glb',
  image:'art/hero-props/qa/X03_Rooftop_School_Patrol_Car.png',
  reproducible:'art/hero-props/build_r183_eight_character_props.py'
 }],
 ['Q06',{
  source:'art/hero-props/Q06_Three_Click_Moonlight_Desk_Lamp.blend',
  runtime:'art/hero-props/Q06_Three_Click_Moonlight_Desk_Lamp.glb',
  image:'art/hero-props/qa/Q06_Three_Click_Moonlight_Desk_Lamp.png',
  reproducible:'art/hero-props/build_r183_eight_character_props.py'
 }],
 ['K02',{
  source:'art/hero-props/K02_Watermelon_Rubber_Eraser_Stew.blend',
  runtime:'art/hero-props/K02_Watermelon_Rubber_Eraser_Stew.glb',
  image:'art/hero-props/qa/K02_Watermelon_Rubber_Eraser_Stew.png',
  reproducible:'art/hero-props/build_r183_eight_character_props.py'
 }],
 ['K08',{
  source:'art/hero-props/K08_Chocolate_Armored_Banana_Knight.blend',
  runtime:'art/hero-props/K08_Chocolate_Armored_Banana_Knight.glb',
  image:'art/hero-props/qa/K08_Chocolate_Armored_Banana_Knight.png',
  reproducible:'art/hero-props/build_r183_eight_character_props.py'
 }],
 ['S03',{
  source:'art/hero-props/S03_Antigravity_School_Broom.blend',
  runtime:'art/hero-props/S03_Antigravity_School_Broom.glb',
  image:'art/hero-props/qa/S03_Antigravity_School_Broom.png',
  reproducible:'art/hero-props/build_r183_eight_character_props.py'
 }],
 ['Q01',{
  source:'art/hero-props/Q01_SelfWriting_Apology_Eraser.blend',
  runtime:'art/hero-props/Q01_SelfWriting_Apology_Eraser.glb',
  image:'art/hero-props/qa/Q01_SelfWriting_Apology_Eraser.png',
  reproducible:'art/hero-props/build_r183_eight_character_props.py'
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
const dest=resolve(root,'qa/evidence/r183-sculpted-props/r183-46-prop-art-status.json');
mkdirSync(dirname(dest),{recursive:true});
writeFileSync(dest,JSON.stringify(summary,null,2));
console.log('R183_REAL_ART_AUDIT',JSON.stringify({
 all:summary.cardCount,sculptedCandidates:true3d,placeholders:records.length-true3d,
 visuallyAccepted:0,release:'NO_GO',report:dest}));
if(SCHOOL_MAGIC_COUNT!==46||records.length!==46||true3d!==17)process.exitCode=3;
if(process.argv.includes('--release')&&accepted!==46)process.exitCode=2;
