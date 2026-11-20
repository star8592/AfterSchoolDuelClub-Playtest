#!/usr/bin/env python3
"""Non-invasive XPS Chrome 155 native CDP timing; no chromedriver, no user profile."""
import json, time, tempfile, pathlib, subprocess, requests, websocket, os, signal, statistics
BASE='http://10.10.10.138:18697/r45-duel/?qa=1&seed=1&deck=science&r199PhysicalMagic=on&r200Pbr=on&r200Readable=on&r202BodyHit=on&r203BodyHit=on&r210Elements=on&r211CinematicVfx=on&r212StadiumBatch=on'
OUT='/tmp/asdc-r216-xps-load-stages.json'
result={'platform':'XPS 15 7590 Intel UHD630 / Chrome155 native CDP','cases':[],'note':'One fresh XPS headless Chrome; 24-frame active FX sampling, --use-angle=gl --enable-unsafe-swiftshader, may use software fallback. Not certified GTX1650 frame time.'}
class CDP:
 def __init__(self,ws):self.ws=websocket.create_connection(ws,timeout=45,origin='http://localhost');self.i=0
 def call(self,method,params=None):
  self.i+=1;i=self.i;self.ws.send(json.dumps({'id':i,'method':method,'params':params or {}}))
  while True:
   msg=json.loads(self.ws.recv())
   if msg.get('id')==i:return msg
 def evaluate(self,expr,awaitPromise=False):
  m=self.call('Runtime.evaluate',{'expression':expr,'returnByValue':True,'awaitPromise':awaitPromise})
  if 'error' in m:raise Exception(str(m['error']))
  d=m['result']
  if 'exceptionDetails' in d:raise Exception(str(d['exceptionDetails'])[:900])
  return d['result'].get('value')
 def close(self):self.ws.close()
for i,(tag,flag) in enumerate([('R216-stages','&r213ThumbLite=on&r214Concurrency=4')]):
 port=19781+i;proc=None;c=None;case={'name':tag};start=time.monotonic()
 try:
  profile=tempfile.mkdtemp(prefix='asdc-cdp-'+tag.lower()+'-')
  argv=['/usr/bin/google-chrome','--headless=new','--no-sandbox','--disable-dev-shm-usage',
    '--remote-debugging-port='+str(port),'--remote-allow-origins=*','--user-data-dir='+profile,
    '--enable-webgl','--use-angle=gl','--enable-unsafe-swiftshader','--window-size=1280,720','about:blank']
  proc=subprocess.Popen(argv,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
  for j in range(90):
   try:
    tabs=requests.get(f'http://127.0.0.1:{port}/json/list',timeout=1).json()
    if tabs:break
   except Exception:pass
   time.sleep(.35)
  else:raise RuntimeError('Chrome native CDP did not listen')
  tab=next((p for p in tabs if p.get('type')=='page'),None)
  if not tab:raise RuntimeError('No Chrome tab')
  c=CDP(tab['webSocketDebuggerUrl'])
  c.call('Page.enable');c.call('Runtime.enable')
  c.call('Page.navigate',{'url':BASE+flag})
  for j in range(180):
   ready=c.evaluate("!!window.__r45QA?.sceneReady")
   if ready:break
   time.sleep(.65)
  else:raise RuntimeError('WebGL scene not ready by 117s')
  case['coldSceneReadySec']=round(time.monotonic()-start,2)
  if False:
   for j in range(32):
    if c.evaluate("!!document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r211CinematicVfx?.material?.textureReady?.fire && !!document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r211CinematicVfx?.material?.textureReady?.water"):break
    time.sleep(.3)
  details=c.evaluate("""(()=>{let w=document.getElementById('stadium')?.contentWindow,z=w?.__r45SceneQA;
    let can=w?.document?.querySelector('canvas'), gl=can?.getContext('webgl2')||can?.getContext('webgl');
    let dbg=gl?.getExtension('WEBGL_debug_renderer_info');
    return {drawBefore:z?.drawCalls,glRenderer:dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):'unavailable',
      glVendor:dbg?gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL):'unavailable',
      sceneReady:!!z?.ready, r211:z?.r211CinematicVfx};
  })()""")
  case['renderer']=details['glRenderer'];case['vendor']=details['glVendor'];case['drawCallsBefore']=details['drawBefore']
  metrics=c.evaluate("""new Promise(done=>{
    let z=document.getElementById('stadium')?.contentWindow?.__r45SceneQA;
    let ok=z.previewR210CardElements(['E06','T05','S08']);
    let d=[],prev=null;function frame(now){
      if(prev!==null)d.push(now-prev);prev=now;
      if(d.length<24)requestAnimationFrame(frame);
      else done({ok,intervals:d,drawCalls:z.drawCalls,r210:z.r210Elements?.material,
                  r211:z.r211CinematicVfx?.material});
    }requestAnimationFrame(frame);
  })""",True)
  d=sorted(metrics['intervals'])
  loadprofile=c.evaluate("document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r214LoadProfile||null")
  case['r213ThumbLite']=c.evaluate("document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r213ThumbLite||null")
  case['assetTransferBytes']=c.evaluate("document.getElementById('stadium')?.contentWindow?.__ASDC_LOAD_METRICS?.downloadedBytes")
  case['r214LoadProfile']=c.evaluate("document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r214LoadProfile||null")
  case['r212StadiumBatch']=c.evaluate("document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r212StadiumBatch||null")
  case['r216LoadStages']=c.evaluate("document.getElementById('stadium')?.contentWindow?.__r45SceneQA?.r216LoadStages||null")
  case.update({'qaAccepted':metrics['ok'],'meanFrameIntervalMs':round(statistics.mean(d),2),
       'p95FrameIntervalMs':round(d[int(.95*len(d))-1],2),
       'p99FrameIntervalMs':round(d[int(.99*len(d))-1],2),
       'frameCount':len(d),'drawCallsAtEnd':metrics['drawCalls'],
       'activeR210AtEnd':metrics['r210']['active'] if metrics.get('r210') else None,
       'activeR211AtEnd':metrics['r211']['active'] if metrics.get('r211') else None})
  cap=c.call('Page.captureScreenshot',{'format':'jpeg','quality':55})
  if 'data' in cap.get('result',{}):
   import base64
   f='/tmp/asdc-xps-native-'+tag.lower()+'.jpg';pathlib.Path(f).write_bytes(base64.b64decode(cap['result']['data']));case['screenshot']=f
  print(tag,'PASS',json.dumps(case,ensure_ascii=False),flush=True)
 except Exception as e:case['error']=repr(e);print(tag,'ERROR',repr(e),flush=True)
 finally:
  if c:
   try:c.close()
   except Exception:pass
  if proc:
   try:os.killpg(proc.pid,signal.SIGTERM);proc.wait(timeout=3)
   except Exception:pass
  result['cases'].append(case);pathlib.Path(OUT).write_text(json.dumps(result,ensure_ascii=False,indent=2))
print('XPS_CDP_REPORT',json.dumps(result,ensure_ascii=False))

