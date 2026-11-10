import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const ROOT=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:10982';
const dir=resolve(import.meta.dirname,'evidence/r54');
mkdirSync(dir,{recursive:true});let browser,failed=false;const results=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
  '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer']});
 for(const [name,width,height] of [['desktop',1920,1080],['portrait',430,900]]){
  const p=await browser.newPage({viewport:{width,height}});
  const errors=[];
  p.on('pageerror',e=>errors.push(String(e)));
  const http=await p.goto(ROOT+'/r45-duel/?qa=1',{waitUntil:'domcontentloaded',timeout:33000});
  await p.waitForFunction('window.__r45QA?.sceneReady',null,{timeout:65000});
  await p.evaluate(()=>{
   const unit=(id,uid)=>({id,uid,hp:id==='E02'?1:3,attack:2,shield:0});
   document.querySelector('#stadium').contentWindow.postMessage({
    type:'ASDC_R45_BOARD',player:['E02','T01'],ai:['G01','G02'],
    units:{player:[unit('E02','U101'),unit('T01','U102')],
           ai:[unit('G01','U201'),unit('G02','U202')]}},location.origin);
  });
  await p.waitForFunction(()=>document.querySelector('#stadium').contentWindow.__r45SceneQA?.summonPresence?.total===4,null,{timeout:15000});
  await p.waitForTimeout(600);
  const frame=await p.locator('#stadium').boundingBox();
  const clickAt=async(side,id)=>{
   const target=await p.evaluate(({side,id})=>{
    return document.querySelector('#stadium').contentWindow.__r45SceneQA.summonPresence.entries.find(x=>x.side===side&&x.id===id);
   },{side,id});
   if(!target)throw Error('No target '+side+id);
   const px=frame.x+(target.screen[0]+1)*frame.width/2;
   const py=frame.y+(1-target.screen[1])*frame.height/2;
   await p.mouse.click(px,py);await p.waitForTimeout(240);
   return p.evaluate(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{selected:q.summonPresence.selectedKey,toast:document.querySelector('#battle-toast').textContent,
       orbit:q.framing.yaw};
   });
  };
  const player=await clickAt('player','E02');
  const ai=await clickAt('ai','G01');
  const dragStart={x:frame.x+frame.width*.46,y:frame.y+frame.height*.32};
  await p.mouse.move(dragStart.x,dragStart.y);
  await p.mouse.down();
  await p.mouse.move(dragStart.x+190,dragStart.y,{steps:12});
  await p.mouse.up();await p.waitForTimeout(920);
  const after=await p.evaluate(()=>{
   const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
   return{selected:q.summonPresence.selectedKey,orbit:q.framing.yaw};
  });
  await p.screenshot({path:resolve(dir,name+'-selection.png')});
  const pass=http.status()===200&&player.selected==='player:U101'&&
   /拐弯纸飞机/.test(player.toast)&&/♥1/.test(player.toast)&&
   ai.selected==='ai:U201'&&/橡皮筋建筑师/.test(ai.toast)&&
   after.selected==='ai:U201'&&Math.abs(after.orbit)>35&&!errors.length;
  const result={name,pass,player,ai,after,errors};
  console.log('R54_CLICK_TO_INSPECT',JSON.stringify(result));
  results.push(result);if(!pass)failed=true;
  await p.close();
 }
}catch(e){console.error('R54_PICK_FAILED',String(e));failed=true}
finally{writeFileSync(resolve(dir,'results.json'),JSON.stringify(results,null,2)+'\n');await browser?.close().catch(()=>{})}
if(failed)process.exitCode=3;
