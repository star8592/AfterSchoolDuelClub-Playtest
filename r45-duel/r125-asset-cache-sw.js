/* R125 fingerprinted, bounded local CacheStorage for real 3D source assets.
 * Never caches HTML/JS/card rules, never supplies placeholder meshes.
 * A changed SHA produces a changed URL, so stale models cannot replace it.
 */
importScripts('./r125-asset-fingerprints.js');
const FINGERPRINTS=self.ASDC_R125_FINGERPRINTS;
const NAME='asdc-r125-immutable-models-v1';
const ROOT=new URL('assets/',self.registration.scope);
const METRICS={hits:0,misses:0,puts:0,failures:0};
const pathnameToKey=url=>{
 if(url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return null;
 const key=url.pathname.slice(ROOT.pathname.length);
 const expected=FINGERPRINTS[key];
 return expected&&url.searchParams.get('v')===expected.slice(0,16)?key:null;
};
function immutableRequest(key){
 const u=new URL(key,ROOT);u.searchParams.set('v',FINGERPRINTS[key].slice(0,16));
 return new Request(u.href,{credentials:'same-origin'});
}
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const c=await caches.open(NAME);
 // Keep unchanged assets across deploys; prune old digest keys in this cache.
 for(const request of await c.keys()){
  if(!pathnameToKey(new URL(request.url)))await c.delete(request);
 }
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const u=new URL(event.request.url);
 const key=pathnameToKey(u);if(!key)return;
 event.respondWith((async()=>{
  const c=await caches.open(NAME);
  const hit=await c.match(event.request);
  if(hit){METRICS.hits++;return hit;}
  METRICS.misses++;
  // Let the original fetch stream reach the game immediately. The cache write
  // runs separately: no additional decoding, no blocking gameplay readiness.
  const response=await fetch(event.request);
  const expected=FINGERPRINTS[key];
  if(response.ok&&response.type==='basic'&&
   (!response.headers.has('content-length')||
    Number(response.headers.get('content-length'))>0)){
   event.waitUntil(c.put(event.request,response.clone()).then(()=>{
    METRICS.puts++;
   }).catch(()=>{METRICS.failures++;}));
  }
  return response;
 })());
});
async function backfill(){
 const c=await caches.open(NAME),todo=Object.keys(FINGERPRINTS);
 let n=0;const failures=[];
 async function worker(){
  while(todo.length){
   const key=todo.shift(),req=immutableRequest(key);
   if(await c.match(req)){n++;continue;}
   try{
    // First navigation may have preceded Service Worker control; prefer the
    // just-downloaded browser HTTP cache (GitHub Pages max-age=600).
    const response=await fetch(req,{cache:'force-cache'});
    if(!response.ok||response.type!=='basic')throw Error('HTTP '+response.status);
    await c.put(req,response);
    METRICS.puts++;n++;
   }catch(err){METRICS.failures++;failures.push(key+': '+String(err));}
  }
 }
 await Promise.all([worker(),worker()]);
 return {cached:n,expected:Object.keys(FINGERPRINTS).length,errors:failures.slice(0,5)};
}
self.addEventListener('message',event=>{
 const type=event.data?.type;
 if(type!=='R125_BACKFILL'&&type!=='R125_STATS')return;
 event.waitUntil((async()=>{
  let extra={};
  if(type==='R125_BACKFILL')extra=await backfill();
  const cache=await caches.open(NAME);
  const records=(await cache.keys()).length;
  const reply={type:type==='R125_BACKFILL'?'R125_BACKFILL_DONE':'R125_STATS',
   records,metric:{...METRICS},...extra};
  event.ports?.[0]?.postMessage(reply);
  event.source?.postMessage?.(reply);
 })());
});
