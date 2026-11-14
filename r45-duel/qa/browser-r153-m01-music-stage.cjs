'use strict';
const fs=require('fs');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/mnt/disk1/H3_Studio/game-toolchain/node_modules/playwright-core');
const url=(process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:18784')+'/r45-duel/m01-music-teacher-preview.html';
const root=process.env.ASDC_QA_EVIDENCE_DIR||'/mnt/disk1/H3_Studio/game-toolchain/evidence/ara-m01-music-wardrobe-r153-20261115';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1450,height:900}});
 const errors=[],report={url,status:'PENDING',checks:[],errors};
 fs.mkdirSync(root,{recursive:true});
 const conductor=()=>page.evaluate(()=>document.querySelector('#arena').contentWindow.__m01ConductorQA||null);
 page.on('pageerror',e=>errors.push('JS '+e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith('http://127.0.0.1:18784'))errors.push('HTTP '+r.status()+' '+r.url())});
 const check=(v,k)=>{report.checks.push({name:k,pass:!!v});if(!v)throw Error('CHECK_FAILED '+k)};
 const get=()=>page.evaluate(()=>{
  const q=document.querySelector('#arena').contentWindow.__r45SceneQA;
  return {ready:q?.ready,m01:q?.summonPresence?.entries?.find(e=>e.id==='M01'),
    events:q?.combatEvents,closeup:q?.studyCloseup};
 });
 try{
  const resp=await page.goto(url,{waitUntil:'domcontentloaded',timeout:70000});
  check(resp?.status()===200,'interactive_page_http_200');
  await page.waitForFunction(()=>!document.querySelector('#attack').disabled,null,{timeout:140000});
  const initial=await get();
  check(initial.ready&&initial.m01?.playingClips?.includes('Idle'),'full_scene_adult_m01_idle');
  check(initial.closeup==='M01','closeup_auto_enabled');
  const baseline=await conductor();
  check(baseline?.batonAttached===true&&baseline?.bone==='WeaponR','baton_follows_real_WeaponR_socket');
  check(baseline?.faceMeshCount>=1,'native_glb_face_morph_targets_present');
  await page.screenshot({path:root+'/m01-r153-current-main-initial.png'});
  await page.click('#attack');
  await page.waitForFunction(()=>{
   const q=document.querySelector('#arena').contentWindow.__r45SceneQA;
   return q?.summonPresence?.entries?.some(e=>e.id==='M01'&&e.playingClips?.includes('Wave'));
  },null,{timeout:11000});
  const atk=await get();
  check(atk.m01.playingClips.includes('Wave'),'button_dispatch_real_scene_teacher_Wave');
  await page.waitForFunction(()=>document.querySelector('#arena').contentWindow.__m01ConductorQA?.notesVisible>0,
    null,{timeout:5000});
  const duringAttack=await conductor();
  check(duringAttack?.cues>=1&&duringAttack?.notesVisible>=1,
    'real_attack_triggers_hand_music_notes');
  check(duringAttack.faceFrames>0,
    'native_face_morphs_animated_by_teacher_event');
  await page.screenshot({path:root+'/m01-r153-current-main-attack.png'});
  await page.waitForFunction(()=>!document.querySelector('#hit').disabled,null,{timeout:9000});
  await page.click('#hit');
  await page.waitForFunction(()=>{
   const q=document.querySelector('#arena').contentWindow.__r45SceneQA;
   return q?.summonPresence?.entries?.some(e=>e.id==='M01'&&e.playingClips?.includes('Hit reaction'));
  },null,{timeout:11000});
  const hit=await get();
  check(hit.m01.playingClips.includes('Hit reaction'),'button_dispatch_real_scene_m01_hit');
  const duringHit=await conductor();
  check(duringHit?.hitAge<1,
    'real_hit_triggers_teacher_facial_reaction');
  check(hit.events?.r90ImpactTriggers>=2,'battle_impact_events_twice');
  await page.screenshot({path:root+'/m01-r153-current-main-hit.png'});
  await page.waitForFunction(()=>!document.querySelector('#camera').disabled,null,{timeout:9000});
  await page.click('#camera');
  const wide=await get();
  check(wide.closeup===null,'camera_toggle_from_closeup_to_full');
  check(!errors.length,'zero_browser_and_http_errors');
  report.status='INTERACTIVE_REAL_GAME_REVIEW_PASS';
  report.conductor={baseline,duringAttack,duringHit};
  report.samples={initial:{clips:initial.m01.playingClips,frontDot:initial.m01.metrics?.frontDot},
    attack:atk.m01.playingClips,hit:hit.m01.playingClips,impacts:hit.events.r90ImpactTriggers};
 }catch(e){report.status='FAILED';report.failure=String(e);await page.screenshot({path:root+'/m01-r153-current-main-debug.png'}).catch(()=>{})}
 finally{await browser.close();fs.writeFileSync(root+'/m01-r153-current-main-report.json',JSON.stringify(report,null,2)+'\n')}
 console.log('M01_INTERACTIVE_GAME_DEMO',JSON.stringify(report));
 if(report.status==='FAILED')process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=2});
