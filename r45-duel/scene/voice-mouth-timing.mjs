/**
 * R122 approximate speech-timed visemes. A frame is legal only while the
 * ACTUAL pre-rendered Qwen audio is playing, as signalled by the audio
 * engine's confirmed HTMLAudioElement playback/stop callbacks.
 * NOT phoneme forced alignment: transcription + duration gives a readable,
 * per-utterance syllable rhythm. No browser synthetic voice and no lip
 * movement during muted/text-only dialogue.
 */
export const MOUTH_SHAPES=Object.freeze(['a','i','u','e','o']);
export function speechMouthAt(speech,seconds){
 if(!speech||!Number.isFinite(seconds)||!Number.isFinite(speech.started)||
  !Number.isFinite(speech.duration)||speech.duration<=0||
  speech.duration>18||typeof speech.text!=='string'||!speech.text.trim())return null;
 const elapsed=seconds-speech.started;
 if(elapsed<0||elapsed>=speech.duration)return null;
 const chars=Array.from(speech.text).filter(c=>/[\p{Script=Han}a-zA-Z0-9，、。！？!?]/u.test(c)).slice(0,110);
 if(!chars.length)return null;
 const beat=(elapsed/speech.duration)*chars.length;
 const index=Math.min(chars.length-1,Math.floor(beat));
 const c=chars[index];
 const phase=beat-index;
 const punctuation=/[，、。！？!?]/u.test(c);
 const profile=Math.abs(c.codePointAt(0)+index*31)%5;
 const shape=punctuation?'a':MOUTH_SHAPES[profile];
 // A spoken syllable makes one open/close arc. A phrase ends gently.
 const syllablePulse=Math.pow(Math.max(0,Math.sin(Math.PI*phase)),.61);
 const fade=Math.min(1,elapsed/.085,(speech.duration-elapsed)/.115);
 const openness=punctuation?0:
  Math.max(0,Math.min(1,(.36+.48*((index*7)%5)/4)*
   syllablePulse*fade));
 return {shape,openness,index,count:chars.length,
  elapsed:+elapsed.toFixed(3),duration:speech.duration,
  source:'confirmed-qwen-playback',serial:speech.serial};
}
