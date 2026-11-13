/** Reject false narrator provenance, wrong speaker or mismatched recorded text. */
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {resolve} from 'node:path';import {execFileSync} from 'node:child_process';
import {GUIDED_LINES} from '../guided-tutorial.mjs';
const base=resolve(import.meta.dirname,'../assets/audio/tutorial');
const manifest=JSON.parse(readFileSync(resolve(base,'tutorial-manifest.json'),'utf8'));
const keys=Object.keys(GUIDED_LINES),clips=manifest.clips;
if(manifest.provider!=='Qwen3-TTS'||keys.length!==14||Object.keys(clips).length!==14)throw Error('Wrong narrator manifest');
let bytes=0,male=0,female=0;
for(const key of keys){
 const clip=clips[key],line=GUIDED_LINES[key];
 if(!clip?.ready||clip.side!==line.side||clip.text!==line.text||clip.file!==`r120_${key}.ogg`||
  clip.speaker!==(line.side==='player'?'serena':'dylan')||clip.review_status!=='pending-human-listening')throw Error('Wrong narrator '+key);
 const buffer=readFileSync(resolve(base,clip.file));
 if(buffer.toString('ascii',0,4)!=='OggS')throw Error('Not an Ogg file '+key);
 const hash=createHash('sha256').update(buffer).digest('hex');if(hash!==clip.sha256)throw Error('Hash mismatch '+key);
 const seconds=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',resolve(base,clip.file)],{encoding:'utf8'}));
 if(Math.abs(seconds-clip.duration_seconds)>.011||seconds<1)throw Error('Bad duration '+key);
 bytes+=buffer.length;line.side==='player'?female++:male++;
}
console.log('R120_REAL_VOICES_PASS',JSON.stringify({clips:keys.length,female,male,bytes,provider:manifest.provider,review:manifest.review_status}));
