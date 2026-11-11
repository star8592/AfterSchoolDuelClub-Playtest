import{createRequire}from'node:module';import{mkdirSync,writeFileSync}from'node:fs';import{resolve}from'node:path';import{createGame}from'../engine.mjs';
const require=createRequire(import.meta.url),{chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');const base=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11007';const dir=resolve(import.meta.dirname,'evidence/r76');mkdirSync(dir,{recursive:true});
const seed=Array.from({length:1200},(_,i)=>i+1).find(s=>createGame(s).hand.player.includes('M02'));const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});let rows=[];
try{for(const[viewport,w,h]of [['desktop',1600,900],['portrait',430,900]]){
const page=await b.newPage({viewport:{width:w,height:h}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(`${base}/r45-duel/?qa=1&seed=${seed}`,{waitUntil:'domcontentloaded',timeout:50000});await page.waitForFunction(()=>window.__r45QA?.sceneReady,null,{timeout:100000});
await page.locator('#end').click();await page.waitForFunction(()=>window.__r45QA?.round===2,null,{timeout:25000});
await page.locator('#hand .card[data-card-id="M02"]').click();await page.locator('#play').click();
const placed=await page.evaluate(()=>window.__r45QA.board.player[0].some(x=>x.id==='M02'));
await page.locator('#end').click();await page.waitForFunction(()=>window.__r45QA?.round===3||window.__r45QA?.phase==='ended',null,{timeout:35000});
let details=await page.evaluate(()=>({round:__r45QA.round,phase:__r45QA.phase,units:__r45QA.board.player[0].map(x=>({id:x.id,hp:x.hp})),events:__r45QA.events.filter(x=>x.type==='direct_hit'||x.type==='exchange').map(x=>x.from)}));
if(details.round===3&&details.units.some(x=>x.id==='M02')){
 await page.locator('#end').click();
 await page.waitForFunction(()=>window.__r45QA?.events.some(x=>(x.type==='direct_hit'||x.type==='exchange')&&x.from==='M02'),null,{timeout:36000});
}
const attack=await page.evaluate(()=>({round:__r45QA.round,events:__r45QA.events.filter(x=>(x.type==='direct_hit'||x.type==='exchange')&&x.from==='M02'),scene:document.querySelector('#stadium').contentWindow.__r45SceneQA?.combatEvents}));
await page.screenshot({path:resolve(dir,`M02-actual-attack-${viewport}.png`)});
const pass=placed&&attack.events.length>0&&errors.length===0;
const row={viewport,seed,placed,pass,before:details,attack,errors};rows.push(row);console.log('R76_M02_REAL_GAME_ATTACK',JSON.stringify({viewport,seed,placed,pass,round:attack.round,events:attack.events.length,errors}));await page.close();
}}finally{writeFileSync(resolve(dir,'R76_M02_ATTACK_QA.json'),JSON.stringify(rows,null,2)+'\n');await b.close()}
if(rows.length!==2||rows.some(x=>!x.pass))process.exitCode=4;
