/**
 * R201: original-GLB loader queue. Real played cards and explicit magic
 * previews jump ahead of queued speculative hand preloads, never ahead of
 * an already decoding source. Single decode lane prevents a CPU/GPU storm.
 * No retries into low-poly/procedural substitutes.
 */
export function createR201SpellLoadQueue(load,{onEvent=()=>{}}={}){
 if(typeof load!=='function')throw Error('R201 loader function required');
 const scheduled=new Map(),foreground=[],background=[];
 let running=null,stopped=false,sequence=0,promotions=0,loads=0,
  failed=0,backgroundFinished=0,urgentFinished=0;
 const stats=()=>({
  running:running?.id||null,urgentWaiting:foreground.map(x=>x.id),
  backgroundWaiting:background.map(x=>x.id),outstanding:scheduled.size,
  promotions,completed:loads,failed,backgroundFinished,urgentFinished,
  stopped
 });
 const pump=()=>{
  if(stopped||running)return;
  const job=foreground.shift()||background.shift();
  if(!job)return;
  running=job;
  onEvent('loading',{id:job.id,priority:job.priority,queue:stats()});
  Promise.resolve().then(()=>load(job.id,job.priority))
   .then(value=>{
    loads++;
    if(job.priority==='urgent')urgentFinished++;else backgroundFinished++;
    job.resolve(value);
    onEvent('loaded',{id:job.id,priority:job.priority,queue:stats()});
   },err=>{
    failed++;
    job.reject(err);
    onEvent('failed',{id:job.id,priority:job.priority,queue:stats()});
   })
   .finally(()=>{
    scheduled.delete(job.id);
    running=null;
    if(!stopped)queueMicrotask(pump);
   });
 };
 function request(id,{priority='background'}={}){
  if(stopped)return Promise.reject(Error('R201 queue disposed'));
  if(typeof id!=='string'||!id||!['urgent','background'].includes(priority))
   return Promise.reject(Error('R201 invalid load queue request'));
  const existing=scheduled.get(id);
  if(existing){
   // Promote only jobs that have not begun network/decode work.
   if(priority==='urgent'&&existing.priority==='background'){
    existing.priority='urgent';
    if(running!==existing){
     const i=background.indexOf(existing);
     if(i>=0){background.splice(i,1);foreground.push(existing);promotions++}
     onEvent('promoted',{id,queue:stats()});
    }
   }
   return existing.promise;
  }
  const task={id,priority,order:++sequence};
  task.promise=new Promise((resolve,reject)=>{task.resolve=resolve;task.reject=reject});
  scheduled.set(id,task);
  (priority==='urgent'?foreground:background).push(task);
  queueMicrotask(pump);
  return task.promise;
 }
 function stop(){
  if(stopped)return;
  stopped=true;
  for(const task of [...foreground,...background]){
   scheduled.delete(task.id);
   task.reject(Error('R201 loading queue disposed: '+task.id));
  }
  foreground.length=0;background.length=0;
  // Existing network load may finish, but caller must check its
  // own disposed state before registering GPU resources.
  onEvent('stopped',{queue:stats()});
 }
 return {request,stop,get stats(){return stats()}};
}
