'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/mnt/disk1/H3_Studio/game-toolchain/node_modules/playwright-core');
const fs=require('node:fs'),path=require('node:path');
const out=process.env.ASDC_QA_EVIDENCE_DIR||__dirname,base=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:8775';
fs.mkdirSync(out,{recursive:true});
const report={status:'RUNNING',passed:[],failed:[],samples:[],errors:[],url:base+'/r45-duel/scene/?qa=1&m01Adult=on&r90Motion=on'};
const browserErrors=report.errors;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
  args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-dev-shm-usage'],timeout:40000});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>browserErrors.push('JS '+e.message));
 page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)browserErrors.push('HTTP '+r.status()+' '+r.url())});
 const check=(ok,name,detail)=>{(ok?report.passed:report.failed).push({name,detail});if(!ok)throw Error(name+': '+JSON.stringify(detail).slice(0,900))};
 const read=()=>page.evaluate(()=>{const q=window.__r45SceneQA;return {total:q.summonPresence.total,
  entries:q.summonPresence.entries.map(e=>({side:e.side,id:e.id,uid:e.uid,clips:e.playingClips,
  facing:e.metrics?.frontDot,footMin:e.metrics?.minY,skins:e.skins,meshes:e.meshes})),
  combat:q.combatEvents, loaded:q.summonModels.find(m=>m.id==='M01')}});
 const units={player:[{id:'M01',uid:'U101',hp:10,attack:2,shield:0}],ai:[{id:'M02',uid:'U201',hp:10,attack:2,shield:0}]};
 const postBoard=units=>page.evaluate(u=>window.postMessage({type:'ASDC_R45_BOARD',units:u,
  player:u.player.map(x=>x.id),ai:u.ai.map(x=>x.id)},location.origin),units);
 const event=(side,attackerId,targetId,attackerUid,targetUid,serial)=>{
  const pre={player:[{...units.player[0]}],ai:[{...units.ai[0]}]};
  const post={player:[{...pre.player[0]}],ai:[{...pre.ai[0]}]};
  post[side==='player'?'ai':'player'][0].hp=8;
  return {type:'ASDC_R51_COMBAT_EVENTS',pre,post,events:[{
   type:'exchange',side,from:attackerId,to:targetId,attacker_uid:attackerUid,
   target_uid:targetUid,serial,damage:2,attacker_hp_after:10,target_hp_after:8
  }]};
 };
 const send=x=>page.evaluate(data=>window.postMessage(data,location.origin),x);
 const grab=async name=>page.screenshot({path:path.join(out,name)});
 try{
  const resp=await page.goto(report.url,{waitUntil:'domcontentloaded',timeout:70000});
  check(resp.status()===200,'scene_200',resp.status());
  await page.waitForFunction(()=>window.__r45SceneQA?.ready===true,null,{timeout:140000});
  check(true,'real_stadium_scene_ready');
  await postBoard(units);
  await page.waitForFunction(()=>window.__r45SceneQA?.summonPresence?.total===2,null,{timeout:30000});
  const idle=await read();
  report.samples.push({stage:'idle',...idle});
  const me=idle.entries.find(e=>e.id==='M01');
  check(me&&me.clips.includes('Idle')&&idle.loaded?.file==='M01-MusicTeacher-Adult-Ara-STUDY.glb',
        'real_adult_model_loaded_idle', {me,loaded:idle.loaded});
  check(me.facing>.9&&me.skins>=1,'actual_adult_model_faces_opponent',{facing:me.facing,skins:me.skins});
  await grab('m01-qa-real-stage-idle.png');

  await send(event('player','M01','M02','U101','U201',20411));
  await page.waitForFunction(()=>window.__r45SceneQA.combatEvents?.playedEvents>=1,null,{timeout:12000});
  await page.waitForFunction(expected=>window.__r45SceneQA.summonPresence.entries.some(e=>e.id==='M01'&&e.playingClips.includes(expected)),
    process.env.M01_ATTACK_EXPECTED||'Punch',{timeout:9000});
  const attacker=await read();
  report.samples.push({stage:'true_event_attack',...attacker});
  check(attacker.entries.find(e=>e.id==='M01')?.clips.includes(process.env.M01_ATTACK_EXPECTED||'Punch'),'true_game_event_m01_plays_expected_attack_clip',attacker.entries);
  await grab('m01-qa-real-stage-attack.png');
  await page.waitForFunction(()=>window.__r45SceneQA.combatEvents.r90ImpactTriggers>=1,null,{timeout:9000});
  const impact=await read();
  report.samples.push({stage:'true_event_impact',...impact});
  check(impact.combat.r90ImpactTriggers>=1,'actual_combat_hit_impact_triggered',impact.combat);
  await grab('m01-qa-real-stage-attack-impact.png');
  await page.waitForFunction(()=>window.__r45SceneQA.combatEvents.active===false,null,{timeout:9000});
  // Reverse who attacks/receives on the exact same preserved actors.
  await postBoard(units);
  await page.waitForFunction(()=>window.__r45SceneQA.summonPresence.total===2,null,{timeout:7000});
  await send(event('ai','M02','M01','U201','U101',20412));
  await page.waitForFunction(()=>window.__r45SceneQA.combatEvents.playedEvents>=2,null,{timeout:9000});
  await page.waitForFunction(()=>window.__r45SceneQA.summonPresence.entries.some(e=>e.id==='M01'&&e.playingClips.includes('Hit reaction')),
    null,{timeout:9000});
  const hit=await read();
  report.samples.push({stage:'true_event_hit',...hit});
  check(hit.entries.find(e=>e.id==='M01')?.clips.includes('Hit reaction'),
        'true_game_event_m01_plays_embedded_Hit_reaction',hit.entries);
  await grab('m01-qa-real-stage-hit.png');
  check(browserErrors.length===0,'no_browser_errors',browserErrors);
  report.status='REAL_STAGE_M01_EMBEDDED_ATTACK_AND_HIT_PASS';
 }catch(e){report.status='FAILED';report.failure=String(e);await grab('m01-qa-real-stage-debug.png').catch(()=>{});}
 finally{fs.writeFileSync(path.join(out,'m01-combat-clips-qa.json'),JSON.stringify(report,null,2)+'\n');await browser.close();}
 console.log('M01_REAL_SCENE_MOTION',JSON.stringify({
  status:report.status,passed:report.passed.map(x=>x.name),failed:report.failed,
  errors:browserErrors,failure:report.failure||null,
  samples:report.samples.map(x=>({stage:x.stage,combat:x.combat,
   m01:x.entries.find(e=>e.id==='M01'),m02:x.entries.find(e=>e.id==='M02')}))
 }));
 if(report.status==='FAILED')process.exitCode=1;
})().catch(e=>{console.error('FATAL',e);process.exitCode=2});
