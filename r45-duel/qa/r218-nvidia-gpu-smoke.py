#!/usr/bin/env python3
import os,json,time,subprocess,tempfile,requests,websocket,signal,shutil
CASES=[
 ('prime_gl',['--use-angle=gl'],{'__NV_PRIME_RENDER_OFFLOAD':'1','__GLX_VENDOR_LIBRARY_NAME':'nvidia'}),
 ('prime_glx_desktop',['--use-gl=desktop'],{'__NV_PRIME_RENDER_OFFLOAD':'1','__GLX_VENDOR_LIBRARY_NAME':'nvidia'}),
 ('prime_vulkan',['--use-angle=vulkan','--enable-features=Vulkan,DefaultANGLEVulkan'],{'__NV_PRIME_RENDER_OFFLOAD':'1','__GLX_VENDOR_LIBRARY_NAME':'nvidia','__VK_LAYER_NV_optimus':'NVIDIA_only'}),
 ('prime_egl',['--use-gl=angle','--use-angle=gl'],{'__NV_PRIME_RENDER_OFFLOAD':'1','__GLX_VENDOR_LIBRARY_NAME':'nvidia','__EGL_VENDOR_LIBRARY_FILENAMES':'/usr/share/glvnd/egl_vendor.d/10_nvidia.json'}),
]
for i,(tag,extra,overrides) in enumerate(CASES):
 profile=tempfile.mkdtemp(prefix='asdc-r218-gpu-smoke-')
 port=19841+i
 env=os.environ.copy();env.update(overrides)
 args=['/usr/bin/google-chrome','--headless=new','--no-sandbox','--disable-dev-shm-usage',
 '--enable-webgl','--disable-software-rasterizer','--remote-debugging-port='+str(port),
 '--remote-allow-origins=*','--user-data-dir='+profile,'--window-size=640,480']+extra+['about:blank']
 p=None;ws=None
 try:
  p=subprocess.Popen(args,env=env,stderr=subprocess.DEVNULL,stdout=subprocess.DEVNULL,start_new_session=True)
  for j in range(40):
   try:
    tabs=requests.get('http://127.0.0.1:'+str(port)+'/json/list',timeout=.7).json()
    tab=next((x for x in tabs if x.get('type')=='page'),None)
    if tab:break
   except Exception:pass
   time.sleep(.35)
  else:raise RuntimeError('CDP unavailable')
  ws=websocket.create_connection(tab['webSocketDebuggerUrl'],timeout=15,origin='http://localhost')
  expr="""(()=>{
    const c=document.createElement('canvas');
    const gl=c.getContext('webgl2')||c.getContext('webgl');
    if(!gl)return {supported:false};
    const d=gl.getExtension('WEBGL_debug_renderer_info');
    return {supported:true,renderer:d?gl.getParameter(d.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),
    vendor:d?gl.getParameter(d.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR),
    version:gl.getParameter(gl.VERSION)};
  })()"""
  ws.send(json.dumps({'id':1,'method':'Runtime.evaluate','params':{'expression':expr,'returnByValue':True}}))
  for k in range(15):
   o=json.loads(ws.recv())
   if o.get('id')==1:break
  else:raise RuntimeError('CDP eval missing')
  d=o.get('result',{}).get('result',{}).get('value') or {}
  print(tag,json.dumps(d,ensure_ascii=False),flush=True)
 except Exception as e:print(tag,'ERROR',repr(e),flush=True)
 finally:
  if ws:
   try:ws.close()
   except:pass
  if p:
   try:os.killpg(p.pid,signal.SIGTERM);p.wait(timeout=3)
   except:pass
  shutil.rmtree(profile,ignore_errors=True)

