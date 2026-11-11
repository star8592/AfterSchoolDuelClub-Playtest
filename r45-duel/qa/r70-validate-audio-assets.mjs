/** R70: verify generated files, read-only metadata, Qwen provenance and codec. */
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const dir=resolve(import.meta.dirname,'../assets/audio');
const manifest=JSON.parse(readFileSync(resolve(dir,'voice-manifest.json'),'utf8'));
if(manifest.provider!=='Qwen3-TTS'||!manifest.model.includes('Qwen3-TTS'))throw Error('Wrong provider');
const voices=Object.entries(manifest.clips).flatMap(([id,entries])=>Object.entries(entries).map(([kind,v])=>({id,kind,...v})));
const cues=['select','cast','enemy_cast','turn','attack','hit','heal','win','lose',
 'card_flip','spell_charge','meteor_impact','sonic_wave','ice_shatter',
 'stadium_cheer','score_chime','shield_block'];
const songs=['school_duel_theme','duel_tension',
 'campus_parade','mischief_shuffle','tactical_pulse','heroic_comeback','final_overtime'];
for(const v of voices){
 if(!(/^([EGTM]\d{2})-(enter|attack|hit|special|shield|win|lose)(?:_v[2-9])?\.ogg$/.test(v.file)||/^HOST_(PLAYER|AI)-(cast|hurt|win|lose)(?:_v[2-9])?\.ogg$/.test(v.file))||!v.ready||v.review_status!=='pending-human-listening')throw Error('Voice manifest contract '+v.file);
 const path=resolve(dir,'voices',v.file);const data=readFileSync(path);
 if(data.length<6000||createHash('sha256').update(data).digest('hex')!==v.sha256)throw Error('Invalid voice SHA: '+v.file);
 if(!(v.duration_seconds>.25&&v.duration_seconds<15))throw Error('Invalid voice duration');
}
for(const name of [...cues,...songs]){
 const file=resolve(dir,name+'.ogg');
 if(statSync(file).size<(songs.includes(name)?120000:1000))throw Error('Missing/empty audio '+name);
 const codec=execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name','-of','default=nw=1:nk=1',file],{encoding:'utf8'}).trim();
 if(codec!=='opus')throw Error('Unexpected codec '+name+' '+codec);
}
console.log('R84_AUDIO_ASSETS_PASS',JSON.stringify({provider:manifest.provider,voiceClips:voices.length,voiceRoles:Object.keys(manifest.clips).length,cues:cues.length,songs:songs.length,pendingArtReview:voices.filter(x=>x.review_status==='pending-human-listening').length}));
