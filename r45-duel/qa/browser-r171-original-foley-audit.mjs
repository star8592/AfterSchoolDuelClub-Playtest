import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const out='/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r171-voices';
mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const report={date:new Date().toISOString(),errors:[],audio:[],patterns:[]};
try{
 const page=await browser.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:18672/r45-duel/',{waitUntil:'domcontentloaded',timeout:55000});
 const result=await page.evaluate(async()=>{
  const manifest=await (await fetch('/r45-duel/assets/audio/r171-original-foley-manifest.json')).json();
  const {COMIC_BEATS}=await import('/r45-duel/audio-engine.mjs');
  const {SCHOOL_MAGIC_IDENTITIES}=await import('/r45-duel/scene/campus-magic-bible.mjs');
  const context=new(window.AudioContext||window.webkitAudioContext)({sampleRate:48000});
  const files=[];
  try{
   for(const [key,clip]of Object.entries(manifest.clips)){
    const r=await fetch('/r45-duel/assets/audio/'+clip.file);
    if(!r.ok)throw Error('OGG response '+r.status+' '+key);
    const audio=await context.decodeAudioData(await r.arrayBuffer());
    const data=audio.getChannelData(0);
    const peak=Math.max(...Array.from(data).filter((_,i)=>i%250===0).map(Math.abs));
    if(audio.duration<.20||audio.duration>1.3||!Number.isFinite(peak)||peak<.001)
     throw Error('Invalid original OGG '+key);
    files.push({clip_id:key,duration:+audio.duration.toFixed(4),channels:audio.numberOfChannels,peak:+peak.toFixed(4)});
   }
  }finally{await context.close()}
  const spells=Object.values(SCHOOL_MAGIC_IDENTITIES);
  const patterns=spells.map(s=>{
   const p=COMIC_BEATS['school_'+s.id];return{id:s.id,parts:p?.length||0,
    own:p?.some(v=>v[0].startsWith('r171_'))||false};
  });
  return {files,patterns,identityCount:spells.length,
   authoredCueCount:patterns.filter(x=>x.own).length};
 });
 report.audio=result.files;report.patterns=result.patterns;
 report.passed=report.errors.length===0&&result.files.length===14&&
  result.identityCount===46&&result.authoredCueCount===14;
 console.log('R171_REAL_AUDIO_DECODE',JSON.stringify({
  passed:report.passed,decoded:result.files.length,
  heroSpellsWithNewFoley:result.authoredCueCount,
  avgDuration:+(result.files.reduce((a,b)=>a+b.duration,0)/result.files.length).toFixed(2),
  errors:report.errors}));
 await page.close();
}finally{
 writeFileSync(resolve(out,'r171-real-chrome-audio-decode.json'),JSON.stringify(report,null,2));
 await browser.close();
}
if(!report.passed)process.exitCode=2;
