import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)('/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11453';
const dir=resolve(import.meta.dirname,'evidence/r146/seven-source-cast');
mkdirSync(dir,{recursive:true});
const ids=['E03','E04','G02','G03','G04','T03','T04'];
const expected={
 E03:'E03-Ellie-Skinned-R132-BakedRest-PILOT.glb',
 E04:'E04-Phil-Skinned-R131-BakedRest-PILOT.glb',
 G02:'G02-Snow-Skinned-R132-BakedRest-PILOT.glb',
 G03:'G03-Jay-Skinned-R132-BakedRest-PILOT.glb',
 G04:'G04-Victoria-Skinned-R132-BakedRest-PILOT.glb',
 T03:'T03-Rain-Skinned-R132-BakedRest-PILOT.glb',
 T04:'T04-Rex-Skinned-R144-WeightedPelvis-PILOT.glb'};
const result={passed:false,checks:[],errors:[],views:[]};
const check=(ok,label,d)=>{result.checks.push({pass:!!ok,label});if(!ok)throw Error(label+' '+JSON.stringify(d).slice(0,1500))};
const b=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-webgl','--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer','--disable-dev-shm-usage']});
try{
 for(const [view,width]of [['desktop',1440],['portrait',430]]){
  const p=await b.newPage({viewport:{width,height:900}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push('HTTP '+r.status())});
  const modes={};
  for(const [mode,query]of [['official',''],['off','&r146Cast=off'],['on','&r146Cast=on']]){
   await p.goto(origin+'/r45-duel/?qa=1&seed=146'+query,{waitUntil:'domcontentloaded',timeout:90000});
   await p.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:160000});
   const q=await p.evaluate(()=>{
    const s=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{models:s.summonModels,drawCalls:s.drawCalls,camera:s.r145ActionShot};
   });
   check(q.models.length===12,view+' '+mode+' all 12 original model identities present',q.models.length);
   for(const id of ids){
    const actual=q.models.find(a=>a.id===id)?.file;
    const want=mode==='on'?expected[id]:({
     E03:'E03-Ellie',E04:'E04-Phil',G02:'G02-Snow',G03:'G03-Jay',
     G04:'G04-Victoria',T03:'T03-Rain',T04:'T04-Rex'}[id]+'-Landing-R97.glb');
    check(actual===want,view+' '+mode+' '+id+' correct source and independent rollback',{actual,want});
   }
   check(q.camera.enabled===true,view+' '+mode+' R145 normal camera still active',q.camera);
   check(Number.isFinite(q.drawCalls)&&q.drawCalls<1100,view+' '+mode+' bounded draw calls',q.drawCalls);
   modes[mode]={drawCalls:q.drawCalls,files:q.models.filter(x=>ids.includes(x.id))};
  }
  check(errors.length===0,view+' no asset load or JS failure in all modes',errors);
  result.views.push({view,modes});
  await p.close();
 }
 result.passed=true;
}catch(e){result.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r146-cast-safe-rollback.json'),JSON.stringify(result,null,2));await b.close()}
console.log('R146_SEVEN_SKINNED_CAST_INDEPENDENT_ROLLBACK',JSON.stringify({
 passed:result.passed,checks:result.checks.length,errors:result.errors,
 views:result.views.map(v=>({view:v.view,drawCalls:Object.fromEntries(Object.entries(v.modes).map(([k,a])=>[k,a.drawCalls]))}))}));
if(!result.passed)process.exitCode=1;
