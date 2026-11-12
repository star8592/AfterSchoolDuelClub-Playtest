#!/usr/bin/env python3
"""R109 isolated ComfyUI API image production. No edits to other Comfy projects."""
import argparse,json,os,time,urllib.request,hashlib
from pathlib import Path
from PIL import Image,ImageStat
ROOT=Path(__file__).resolve().parents[1]
WORK=Path(__file__).resolve().parent
CARDS=ROOT/'assets/cards/r109'
SOURCE=Path('/mnt/disk1/H3_Studio/output/ops/comfyui-v0.44.0-stage/ComfyUI-0.44.0/output')
HOST='http://127.0.0.1:8190'
CARDS.mkdir(parents=True,exist_ok=True)
P=json.loads((WORK/'r109-prompt-batch.json').read_text())
def get(url):
 with urllib.request.urlopen(url,timeout=30) as r:return json.load(r)
def post(obj):
 data=json.dumps(obj).encode()
 req=urllib.request.Request(HOST+'/prompt',data,headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(req,timeout=120) as r:return json.load(r)
def workflow(item):
 return {
 '1':{'class_type':'UNETLoader','inputs':{'unet_name':'z_image_turbo_nvfp4.safetensors','weight_dtype':'default'}},
 '2':{'class_type':'CLIPLoader','inputs':{'clip_name':'qwen_3_4b_fp4_mixed.safetensors','type':'lumina2','device':'default'}},
 '3':{'class_type':'VAELoader','inputs':{'vae_name':'ae.safetensors'}},
 '4':{'class_type':'CLIPTextEncode','inputs':{'text':item['prompt'],'clip':['2',0]}},
 '5':{'class_type':'EmptySD3LatentImage','inputs':{'width':640,'height':800,'batch_size':1}},
 '6':{'class_type':'ModelSamplingAuraFlow','inputs':{'model':['1',0],'shift':3.0}},
 '7':{'class_type':'KSampler','inputs':{'model':['6',0],'seed':item['seed'],'steps':9,'cfg':1.0,
     'sampler_name':'euler','scheduler':'beta','positive':['4',0],'negative':['4',0],
     'latent_image':['5',0],'denoise':1.0}},
 '8':{'class_type':'VAEDecode','inputs':{'samples':['7',0],'vae':['3',0]}},
 '9':{'class_type':'SaveImage','inputs':{'images':['8',0],'filename_prefix':'duel_r109_'+item['id']}}}
def run(item,timeout=500):
 ans=post({'prompt':workflow(item),'client_id':'duel-r109-card-art'})
 pid=ans['prompt_id']
 print('QUEUED',item['id'],pid,flush=True)
 start=time.monotonic()
 while time.monotonic()-start<timeout:
  hist=get(HOST+'/history/'+pid)
  job=hist.get(pid)
  if job:
   errs=job.get('status',{}).get('messages',[])
   output=job.get('outputs',{}).get('9',{}).get('images',[])
   if output:
    info=output[0]
    path=SOURCE/(info.get('subfolder') or '')/info['filename']
    if not path.is_file():raise RuntimeError('missing saved Comfy image: '+str(path))
    im=Image.open(path).convert('RGB')
    from PIL import ImageOps
    im=ImageOps.fit(im,(620,780),method=Image.Resampling.LANCZOS)
    dest=CARDS/(item['id']+'.webp')
    im.save(dest,'WEBP',quality=87,method=6)
    raw=dest.read_bytes()
    if not(25000<len(raw)<700000):raise RuntimeError('suspicious art size '+str(len(raw)))
    stat=ImageStat.Stat(im.resize((40,50)))
    if sum(stat.stddev)<75:raise RuntimeError('art is visually flat '+item['id'])
    return{'id':item['id'],'file':str(dest),'sha256':hashlib.sha256(raw).hexdigest(),
      'bytes':len(raw),'source_engine':'Z-Image Turbo NVFP4','seed':item['seed'],
      'resolution':[620,780],'prompt':item['prompt'],
      'stddev':sum(stat.stddev)}
   # Fail fast if execution ended with exception
   if job.get('status',{}).get('status_str')=='error':
    raise RuntimeError('Comfy workflow failure '+str(errs)[-4000:])
  time.sleep(3)
 raise TimeoutError(item['id']+' runtime timed out')
if __name__=='__main__':
 cli=argparse.ArgumentParser()
 cli.add_argument('--ids',nargs='*')
 cli.add_argument('--limit',type=int,default=0)
 args=cli.parse_args()
 todo=[i for i in P if not args.ids or i['id'] in args.ids]
 if args.limit:todo=todo[:args.limit]
 receipts=[]
 path=WORK/'r109-generated-receipts.json'
 for idx,item in enumerate(todo,1):
  if (CARDS/item['filename']).is_file():
   print('ALREADY_EXISTS',item['id'],flush=True)
   continue
  try:
   r=run(item);receipts.append(r);print('GENERATED',idx,'/',len(todo),item['id'],r['bytes'],flush=True)
   existing=json.loads(path.read_text()) if path.is_file() else {}
   existing[item['id']]=r
   path.write_text(json.dumps(existing,ensure_ascii=False,indent=2)+'\n')
  except Exception as e:
   print('ERROR',item['id'],str(e),flush=True)
   raise
 print('R109_GENERATED_BATCH_FINISHED',len(receipts))
