import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11101';
const dest=resolve(import.meta.dirname,'evidence/r101');mkdirSync(dest,{recursive:true});
const report={origin,ok:false,checks:[],errors:[],state:null};
const check=(pass,name,detail=null)=>{
 report.checks.push({pass:!!pass,name,detail});
 if(!pass)throw Error('R101 '+name+': '+JSON.stringify(detail));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:[
 '--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan',
 '--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},
  permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push('JS '+e.message));
 await page.goto(origin+'/r45-duel/?seed=1&qa=1',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:145000});
 const terminal=await page.evaluate(()=>{
  let clicks=0;
  while(window.__r45QA.phase==='playing'&&clicks<30){
   const end=document.querySelector('#end');
   if(end.disabled)break;
   end.click();clicks++;
  }
  return{clicks,phase:window.__r45QA.phase,hp:window.__r45QA.hp,
   winner:window.__r45QA.events.findLast(x=>x.type==='game_end')?.winner};
 });
 check(terminal.phase==='ended'&&terminal.clicks<=30,
  'same original engine ends authentic match, no synthetic win',terminal);
 await page.locator('#result-overlay').waitFor({state:'visible',timeout:13000});
 check(await page.locator('#result-challenge').isVisible()&&
  await page.locator('#result-feedback').isVisible(),
  'result shows accessible Share and Feedback actions');
 await page.locator('#result-challenge').click();
 const clipboard=await page.evaluate(()=>navigator.clipboard.readText());
 const link=clipboard.match(/https?:\/\/[^\s]+/g)?.at(-1);
 const url=link&&new URL(link);
 check(url&&url.pathname==='/r45-duel/'&&url.searchParams.get('seed')==='1'&&
  url.searchParams.get('ref')==='challenge',
  'copied challenge link preserves same deterministic seed for friends',{clipboard});
 const issue=await page.evaluate(()=>{
  let result=null;window.open=u=>{result=u;return null};
  document.querySelector('#result-feedback').click();
  return result;
 });
 const feedback=new URL(issue);
 check(feedback.hostname==='github.com'&&
  feedback.pathname==='/star8592/AfterSchoolDuelClub-Playtest/issues/new'&&
  feedback.searchParams.get('body').includes('随机牌局种子：1')&&
  feedback.searchParams.get('body').includes('最终人气：'),
  'real match feedback includes seed and actual scores',{issue:issue.slice(0,150)});
 await page.screenshot({path:resolve(dest,'desktop-result-share.png')});
 await page.locator('#result-rematch').click();
 await page.waitForURL(/seed=2/,{timeout:90000});
 await page.waitForFunction(()=>window.__r45QA?.sceneReady&&window.__r45QA?.round===1,
  null,{timeout:145000});
 check(await page.locator('#result-overlay').isHidden()&&
  await page.locator('#end').isEnabled(),
  'sharing does not break R91 real rematch and new seed');
 report.state={terminal,copy:clipboard.slice(-190),issue:issue.slice(0,150)};
 await page.close();await context.close();
 // Fresh no-seed sessions should not be stuck at seed 1 on every entry.
 const fresh=[];
 for(let i=0;i<2;i++){
  const p=await browser.newPage();
  await p.route(/\.(glb|vrm)(?:\?|$)/i,route=>route.abort());
  await p.goto(origin+'/r45-duel/',{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForFunction(()=>/^\?seed=\d+$/.test(location.search),null,{timeout:20000});
  const seed=Number(new URL(p.url()).searchParams.get('seed'));
  check(Number.isInteger(seed)&&seed>=1&&seed<=2147483646,
   'new visit uses valid random seed even without opening assets',seed);
  fresh.push(seed);await p.close();
 }
 check(fresh[0]!==fresh[1],
  'two independent visits are not forced into identical first-hand seed',fresh);
 report.ok=report.checks.every(x=>x.pass)&&!report.errors.length;
}catch(e){report.errors.push(String(e))}
finally{
 writeFileSync(resolve(dest,'r101-same-seed-report.json'),JSON.stringify(report,null,2));
 console.log('R101_SAME_SEED_BROWSER',JSON.stringify({ok:report.ok,
  checks:report.checks.length,errors:report.errors,state:report.state}));
 await browser.close();
}
if(!report.ok)process.exitCode=6;
