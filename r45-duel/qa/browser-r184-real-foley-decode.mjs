/** R184 verify every unique original sound file is truly playable by Chrome. */
import{createRequire}from'node:module';
import{readFileSync,mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const {chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const root=resolve(import.meta.dirname,'..');
const manifest=JSON.parse(readFileSync(resolve(root,
 'assets/audio/r184_original_foley_sha256_manifest.json'),'utf8'));
const browser=await chromium.launch({headless:true,
 executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const report={round:'R184',sourceFormat:'Ogg Vorbis',backend:'real Chrome WebAudio decodeAudioData',
 originalSynthFoley:10,recordedVoiceAssets:0,pass:false,clips:[],errors:[]};
try{
 const page=await browser.newPage();
 page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto('http://127.0.0.1:18684/r45-duel/qa/r181-android-gpu-preflight.html',
 {waitUntil:'domcontentloaded'});
 report.clips=await page.evaluate(async entries=>{
  const ctx=new window.AudioContext({sampleRate:32000});
  const results=[];
  for(const [id,info] of entries){
   const res=await fetch('/r45-duel/assets/audio/'+info.file,{cache:'no-store'});
   if(!res.ok)throw Error('R184 sound returned HTTP '+res.status+' '+id);
   const sample=await ctx.decodeAudioData(await res.arrayBuffer());
   const array=sample.getChannelData(0);
   let rms=0,peak=0;
   for(let i=0;i<array.length;i++){
    const v=array[i];rms+=v*v;peak=Math.max(peak,Math.abs(v));
   }
   rms=Math.sqrt(rms/array.length);
   results.push({id,file:info.file,durationSeconds:+sample.duration.toFixed(4),
    decodedRate:sample.sampleRate,channels:sample.numberOfChannels,
    peak:+peak.toFixed(5),rms:+rms.toFixed(5),
    browserCanHear:rms>.02&&peak<1});
  }
  await ctx.close();
  return results;
 },Object.entries(manifest.assets));
 report.pass=report.clips.length===10&&
  report.clips.every(c=>c.browserCanHear&&c.channels===1&&
   c.durationSeconds>=.9&&c.peak<1)&&!report.errors.length;
 console.log('R184_REAL_CHROME_AUDIO_DECODER_PASS',JSON.stringify(
 {pass:report.pass,clips:report.clips.length,errors:report.errors,
  lowestRms:Math.min(...report.clips.map(x=>x.rms))}));
 await page.close();
}catch(e){
 report.errors.push(String(e));
 console.log('R184_AUDIO_DECODE_FAILURE',String(e));
}finally{
 await browser.close();
 const dir=resolve(import.meta.dirname,'evidence/r184-sound');
 mkdirSync(dir,{recursive:true});
 writeFileSync(resolve(dir,'r184-10-original-foley-chrome-web-audio.json'),
  JSON.stringify(report,null,2));
}
if(!report.pass)process.exitCode=2;
