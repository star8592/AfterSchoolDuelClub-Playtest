import{createRequire}from'node:module';import{writeFileSync,mkdirSync}from'node:fs';import{resolve}from'node:path';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11080',out=resolve(import.meta.dirname,'evidence/r80');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
const results=[];
try{for(const width of [1440,430]){
 const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/r45-duel/'))errors.push(r.status()+' '+r.url())});
 await page.goto(origin+'/r45-duel/?qa=1&seed=1',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:70000});
 const pre={player:[{id:'G03',uid:'U101',hp:5,attack:2,shield:0},{id:'T04',uid:'U102',hp:5,attack:2,shield:0}],ai:[{id:'T04',uid:'U201',hp:5,attack:2,shield:0},{id:'G03',uid:'U202',hp:5,attack:2,shield:0}]};
 await page.evaluate(pre=>{document.querySelector('#stadium').contentWindow.postMessage({type:'ASDC_R45_BOARD',player:pre.player.map(x=>x.id),ai:pre.ai.map(x=>x.id),units:pre},location.origin)},pre);
 await page.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.total===4,null,{timeout:20000});
 await page.waitForTimeout(500);
 const idle=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
 await page.screenshot({path:resolve(out,`R80-${width}-idle.png`)});
 await page.evaluate(pre=>{const post=structuredClone(pre);post.ai[0].hp=3;document.querySelector('#stadium').contentWindow.postMessage({type:'ASDC_R51_COMBAT_EVENTS',pre,post,events:[{type:'exchange',side:'player',from:'G03',to:'T04',attacker_uid:'U101',target_uid:'U201',serial:1001,damage:2,attacker_hp_after:5,target_hp_after:3}]},location.origin)},pre);
 await page.waitForTimeout(430);
 const combat=await page.evaluate(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence);
 await page.screenshot({path:resolve(out,`R80-${width}-combat.png`)});
 const check=arr=>arr.entries.filter(e=>['G03','T04'].includes(e.id));
 const stat=check(idle),atk=check(combat);
 const passed=!errors.length&&idle.total===4&&combat.total===4&&stat.length===4&&atk.length===4&&stat.every(e=>e.visible&&e.inView&&e.metrics.minY>=-.1&&e.metrics.height>1.85)&&atk.some(e=>e.id==='G03'&&e.side==='player'&&e.motion?.clip==='R80_static_attack');
 results.push({width,passed,errors,normal:stat.map(e=>({id:e.id,side:e.side,height:e.metrics.height,ground:e.metrics.minY,clip:e.motion?.clip})),combat:atk.map(e=>({id:e.id,side:e.side,clip:e.motion?.clip})),seq:combat.sequence});
 console.log('R80_FILM_CAST_COMBAT',JSON.stringify(results.at(-1)));
 await page.close();
}}finally{writeFileSync(resolve(out,'qa-results.json'),JSON.stringify(results,null,2));await browser.close();}
if(results.length!==2||results.some(x=>!x.passed))process.exitCode=3;
