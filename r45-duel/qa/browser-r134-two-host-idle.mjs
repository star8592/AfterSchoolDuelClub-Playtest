import{createRequire}from'node:module';
import{mkdirSync,writeFileSync}from'node:fs';
import{resolve}from'node:path';
const{chromium}=createRequire(import.meta.url)(
 '/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright');
const origin=process.env.ASDC_QA_ORIGIN||'http://127.0.0.1:11440';
const dir=resolve(import.meta.dirname,'evidence/r134/duelist-hosts');
mkdirSync(dir,{recursive:true});
const rep={passed:false,checks:[],views:[],errors:[]};
const check=(v,label,more)=>{
 rep.checks.push({pass:!!v,label});
 if(!v)throw Error(label+' '+JSON.stringify(more).slice(0,1700));
};
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome',
 args:['--no-sandbox','--enable-webgl','--use-angle=vulkan',
 '--enable-features=Vulkan,DefaultANGLEVulkan','--disable-software-rasterizer',
 '--disable-dev-shm-usage']});
try{
 for(const [view,width] of [['desktop',1440],['portrait',430]]){
  for(const mode of ['enabled','rollback']){
   const page=await browser.newPage({viewport:{width,height:900}});
   const errors=[];
   page.on('pageerror',e=>errors.push('JS '+e.message));
   page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url())});
   await page.goto(origin+'/r45-duel/?qa=1&seed=134&deck=kitchen'+(mode==='rollback'?'&r134Hosts=off':''),
    {waitUntil:'domcontentloaded',timeout:90000});
   await page.waitForFunction(()=>window.__r45QA?.sceneReady===true,null,{timeout:210000});
   const snap=()=>page.evaluate(()=>{
    const q=document.querySelector('#stadium').contentWindow.__r45SceneQA;
    return{hosts:q.duelistHosts,handCards:q.handCards,
     drawCalls:q.drawCalls,loaded:q.ready};
   });
   const first=await snap();
   check(first.hosts.length===2&&first.hosts.every(x=>x.bones>80&&x.skins>=2),
    view+' '+mode+' genuine two independent VRM source hosts',first);
   check(first.handCards?.actors?.every(x=>x.realFingerBones===15),
    view+' '+mode+' two real 15 finger grasp rigs remain',first.handCards);
   const seq=[];
   for(let i=0;i<6;i++){
    if(i>0)await page.waitForTimeout(3000);
    seq.push(await snap());
   }
   for(const id of ['E01','G01']){
    const arr=seq.map(x=>x.hosts.find(a=>a.id===id));
    const stages=arr.map(a=>a.posture?.r134Idle);
    check(arr.every(x=>x&&x.posture?.arms?.R?.worldHand&&x.posture?.arms?.L?.worldHand),
     view+' '+mode+' '+id+' both true wrists track source arm pose',arr);
    if(mode==='enabled'){
     check(stages.every(x=>x&&x.strength>.15),
      view+' '+id+' 15sec all six original-body idle beats driven',stages);
     check(new Set(stages.map(x=>x.story)).size>=2,
      view+' '+id+' multiple distinct attentive/expressive beats',stages);
     check(new Set(stages.map(x=>JSON.stringify([x.headYaw,x.thighL,x.thighR]))).size>=4,
      view+' '+id+' visible source head/leg animation changes over time',stages);
    }else{
     check(stages.every(x=>x===null),view+' '+id+' explicit rollback removes host idle layer',stages);
    }
   }
   if(mode==='enabled'){
    const a=seq[0].hosts.find(x=>x.id==='E01').posture.r134Idle;
    const b=seq[0].hosts.find(x=>x.id==='G01').posture.r134Idle;
    check(a.phase!==b.phase&&a.story!==b.story||a.phase!==b.phase&&a.headYaw!==b.headYaw,
     view+' genuine independent personality timeline per duelist',{a,b});
   }
   check(errors.length===0,view+' '+mode+' has no scene JS errors / missing files',errors);
   rep.views.push({view,mode,samples:seq.map(x=>({
    hosts:x.hosts.map(h=>({id:h.id,posture:h.posture,
     skins:h.skins,bones:h.bones})),drawCalls:x.drawCalls
   }))});
   await page.screenshot({path:resolve(dir,view+'-'+mode+'-15sec.png')});
   await page.close();
  }
 }
 rep.passed=true;
}catch(e){rep.errors.push(String(e))}
finally{writeFileSync(resolve(dir,'r134-two-host-15sec-report.json'),JSON.stringify(rep,null,2));await browser.close()}
console.log('R134_TWO_HOST_SOURCE_IDLE',JSON.stringify({
 passed:rep.passed,checks:rep.checks.length,errors:rep.errors,
 scenes:rep.views.map(v=>({view:v.view,mode:v.mode,
 stories:Object.fromEntries(['E01','G01'].map(id=>[id,new Set(v.samples.map(s=>s.hosts.find(h=>h.id===id).posture.r134Idle?.story)).size]))}))}));
if(!rep.passed)process.exitCode=1;
