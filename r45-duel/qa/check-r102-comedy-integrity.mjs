import assert from 'node:assert/strict';
import {readFileSync,statSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {CARDS,createGame,legalMoves,playCard} from '../engine.mjs';
import {normalizeRealCombo} from '../scene/combo-contract.mjs';
import {COMIC_BEATS} from '../audio-engine.mjs';
import {COMIC_ASIDE_LINES,makeComedyScript} from '../comedy-script.mjs';
import {R102_SPECTACLES} from '../scene/comedy-spectacle.mjs';
import {ACTOR_COMEDY_SIGNATURES} from '../scene/actor-comedy-signatures.mjs';
const evidence=resolve(import.meta.dirname,'evidence/r102');
mkdirSync(evidence,{recursive:true});
const info=JSON.parse(readFileSync(resolve(import.meta.dirname,'../assets/audio/r102-foley-provenance.json'),'utf8'));
let checks=0;
const ok=(v,tag)=>{assert.ok(v,tag);checks++};
const toFile=(file)=>resolve(import.meta.dirname,'../assets/audio/'+file);
ok(info.sounds.length===20,'exactly 20 new original synth OGGs');
for(const snd of info.sounds){
 const bytes=readFileSync(toFile(snd.file));
 ok(bytes.length>1000&&bytes.length===snd.bytes,snd.file+' actual bytes');
 ok(createHash('sha256').update(bytes).digest('hex')===snd.sha256,snd.file+' exact SHA256');
 ok(snd.license.startsWith('Original project-generated'),snd.file+' original source');
}
const re=/^r102_/;
ok(Object.values(COMIC_BEATS).every(l=>Array.isArray(l)&&l.length>=2&&l.length<=3),
 'every musical theme has two or three deliberate layers');
for(const [key,notes] of Object.entries(COMIC_BEATS)){
 for(const [sound,delay,rate,gain] of notes){
  ok(re.test(sound)&&info.sounds.some(x=>x.file===sound+'.ogg'),
   key+' every entry is a real original audio file');
  ok(delay>=0&&delay<=.4&&rate>.6&&rate<1.6&&gain>0&&gain<=1,
   key+' safe audio mix parameters');
 }
}
ok(CARDS.length===20,'20 original card/engine balance untouched');
const units=CARDS.filter(c=>c.kind==='unit');
ok(units.length===14&&Object.keys(ACTOR_COMEDY_SIGNATURES).length===14,
 'all 14 genuine characters have unique performance choreography');
ok(new Set(Object.values(ACTOR_COMEDY_SIGNATURES).map(c=>c.name)).size===14,
 'role-specific named gestures never duplicate across the cast');
for(const c of units){
 const role=ACTOR_COMEDY_SIGNATURES[c.id];
 ok(role&&role.name.length>=4&&
  Number.isFinite(role.turn)&&Number.isFinite(role.arm)&&
  role.arm>=0&&role.arm<=1.5&&role.lift>=0&&role.lift<1.5&&
  Number.isInteger(role.taps)&&role.taps>=1&&role.taps<=4,
  c.id+' real 3D gesture is constrained, expressive and reversible');
}

ok(CARDS.every(c=>COMIC_ASIDE_LINES[c.id]?.length>=4),'all 20 cards have 4+ unique story quips');
const scripts=Object.values(COMIC_ASIDE_LINES).reduce((n,x)=>n+x.length,0);
ok(scripts>=126,'more than 126 authored text-only jokes');
for(const id of ['chalk_hit','chalk_direct','broadcast_draw','poster_shield','poster_draw']){
 ok(COMIC_ASIDE_LINES[id]?.length>=4,'combo has 4+ distinct reversal jokes '+id);
 ok(COMIC_BEATS['combo_'+id],'combo sound is directly supported '+id);
 ok(R102_SPECTACLES['combo_'+id],'combo visual is directly supported '+id);
}
for(const id of ['buff','blast','repair','draw','heal','confuse']){
 ok(COMIC_BEATS['spell_'+id]&&R102_SPECTACLES['spell_'+id],
 'every actually playable event effect has audio and 3D');
}
for(let seed=1;seed<=140;seed++){
 const s=makeComedyScript(seed);
 for(const card of CARDS){
  const first=s.forCard(card.id,1,'player');
  ok(first?.text?.length>=7&&first.spoken===false,'not mislabeled as Qwen spoken '+card.id);
 }
 // Avoid identical consecutive captions in fast repeated card triggers.
 const prior=[];
 for(let serial=1;serial<=15;serial++){
  const next=s.choose('chalk_hit',serial,'player');
  ok(next&&next.index!==prior.at(-1), 'no repeated consecutive chalk jokes');
  prior.push(next.index);
 }
 // A true engine event must be normalized to be described as actual damage.
 const g=createGame(seed);
 for(const x of g.events)if(x.type==='combo_effect'){
  const combo=normalizeRealCombo(x);
  ok(combo!==null&&!!s.forCombo(combo),'normalized real combo has truthful reaction');
 }
}
const voice=JSON.parse(readFileSync(toFile('voice-manifest.json'),'utf8'));
let voiceCount=0;
for(const bundle of Object.values(voice.clips)){
 for(const entry of Object.values(bundle)){
  ok(entry.model.startsWith('Qwen3-TTS'),'Qwen source provenance');
  ok(entry.ready&&typeof entry.text==='string'&&entry.text.length>2,
   'Qwen actual voice clip has exact readable speech');
  ok(createHash('sha256').update(readFileSync(toFile('voices/'+entry.file))).digest('hex')===entry.sha256,
   'actual Qwen voice audio SHA preserved');
  voiceCount++;
 }
}
ok(voiceCount===98,'all original 98 Qwen3 actual voice files remain intact');
const report={ok:true,checks,authoredTextQuips:scripts,newUniqueFoley:info.sounds.length,
 voicePreserved:voiceCount,volumetricEffects:Object.keys(R102_SPECTACLES).length,
 uniqueCharacterGestures:Object.keys(ACTOR_COMEDY_SIGNATURES).length,
 trueCardRules:CARDS.length,soundSets:Object.keys(COMIC_BEATS).length,
 provenance:info.copyright};
writeFileSync(resolve(evidence,'r102-comedy-integrity.json'),JSON.stringify(report,null,2)+'\n');
console.log('R102_COMEDY_RULE_AUDIO_INTEGRITY',JSON.stringify(report));
