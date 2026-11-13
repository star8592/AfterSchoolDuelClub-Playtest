/* Register passive model cache without holding up first playable scene. */
const disabled=()=>new URLSearchParams(location.search).get('r125Cache')==='off';
if('serviceWorker'in navigator&&window.isSecureContext&&!disabled()&&
 !navigator.connection?.saveData){
 let completed=false,registration=null;
 const init=navigator.serviceWorker.register('./r125-asset-cache-sw.js',{
  scope:'./',updateViaCache:'none'}).then(r=>{registration=r;return r;})
  .catch(()=>null);
 window.addEventListener('message',async event=>{
  if(event.origin!==location.origin||event.data?.type!=='ASDC_R45_SCENE_READY'||
   completed)return;
  // The scene, not a timer, is the source of 16/16 real-model readiness.
  if(event.data?.loadedSummonGlbs!==12||
   event.data?.independentHostVRMRigs!==2||event.data?.originalVRMRigs!==2)return;
  completed=true;
  const r=await init;if(!r)return;
  const estimate=await navigator.storage?.estimate?.().catch(()=>null);
  if(estimate?.quota&&estimate.quota-estimate.usage<160*1048576)return;
  const warm=()=>r.active?.postMessage({type:'R125_BACKFILL'});
  if('requestIdleCallback'in window)requestIdleCallback(warm,{timeout:2500});
  else setTimeout(warm,600);
 });
}
