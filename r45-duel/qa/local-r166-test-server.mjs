/**
 * Local-only R147/R161 QA static server for visual and frame time inspection.
 * Not a production deployment. Only serves r45-duel public game assets.
 * All game assets come from immutable R147; only scene/stadium JS opt-in QA
 * test modules are overlaid from the separate R161 worktree.
 */
import {createServer} from 'node:http';
import {createReadStream,existsSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const canonical='/home/master/projects/after-school-duel-r147-hotfix-20261114';
const allowed=new Set(['r45-duel/scene/scene.mjs']);
const types={'.html':'text/html;charset=utf-8','.mjs':'text/javascript;charset=utf-8','.js':'text/javascript;charset=utf-8',
 '.css':'text/css;charset=utf-8','.json':'application/json;charset=utf-8','.svg':'image/svg+xml',
 '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp',
 '.woff2':'font/woff2','.glb':'model/gltf-binary','.vrm':'model/gltf-binary','.gz':'application/gzip'};
const server=createServer((req,res)=>{
 try{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const url=new URL(req.url,'http://127.0.0.1');
  if(url.pathname==='/healthz'){
   res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});
   res.end(JSON.stringify({ok:true,origin:'loopback',mode:'r166-shader-probe',r147Default:true}));return;
  }
  if(!url.pathname.startsWith('/r45-duel/')){res.writeHead(404);res.end();return;}
  const part=decodeURIComponent(url.pathname);
  const rel=part.replace(/^\/+/, '')+(part.endsWith('/')?'index.html':'');
  if(rel.split('/').includes('..'))throw Error('traversal');
  const fromOverlay=allowed.has(rel);
  const file=resolve(fromOverlay?root:canonical,rel);
  if(!file.startsWith(root+'/')&&!file.startsWith(canonical+'/'))throw Error('scope');
  if(!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end('404 '+rel);return;}
  res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream',
   'Content-Length':statSync(file).size,'Cache-Control':'no-store',
   'X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD'){res.end();return;}
  createReadStream(file).pipe(res);
 }catch(e){res.writeHead(500,{'Content-Type':'text/plain'});res.end(String(e));}
});
const port=Number(process.env.ASDC_R166_PORT||18666);
server.listen(port,'127.0.0.1',()=>{
 console.log('R166_LOCAL_READY http://127.0.0.1:'+port+'/r45-duel/?qa=1&seed=162&r166ShaderProbe=on');
 console.log('R166_LOCAL_PROBE http://127.0.0.1:'+port+'/r45-duel/?qa=1&seed=162&r166ShaderProbe=on');
});
