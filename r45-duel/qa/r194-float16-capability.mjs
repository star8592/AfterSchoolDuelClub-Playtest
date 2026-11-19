/** R194: disposable WebGL2 GPU capability probe; never alters live game context. */
export async function probeRgba16fMorphSupport({exerciseRestore=false}={}){
 const startMs=performance.now();
 const canvas=document.createElement('canvas');canvas.width=4;canvas.height=4;
 const out={ready:false,webgl2:false,supported:false,reason:'',maxTextureSize:0,
  maxArrayTextureLayers:0,sample:null,gpuRenderer:null,
  contextLoss:{requested:exerciseRestore,extension:false,lost:false,restored:false,reProbePass:false}};
 let gl=null,tex=null,program=null,v=null,f=null,vao=null;
 const cleanup=()=>{
  if(!gl)return;
  if(vao)gl.deleteVertexArray(vao);
  if(program)gl.deleteProgram(program);
  if(v)gl.deleteShader(v);
  if(f)gl.deleteShader(f);
  if(tex)gl.deleteTexture(tex);
 };
 try{
  gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:true});
  if(!gl){out.reason='WebGL2 unavailable';return out}
  out.webgl2=true;
  out.maxTextureSize=gl.getParameter(gl.MAX_TEXTURE_SIZE);
  out.maxArrayTextureLayers=gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS);
  const dbg=gl.getExtension('WEBGL_debug_renderer_info');
  out.gpuRenderer=dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):'renderer unavailable';
  tex=gl.createTexture();
  if(!tex)throw Error('createTexture failure');
  gl.bindTexture(gl.TEXTURE_2D_ARRAY,tex);
  gl.texStorage3D(gl.TEXTURE_2D_ARRAY,1,gl.RGBA16F,2,2,1);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  const data=new Uint16Array(16);
  for(let i=0;i<16;i+=4){data[i]=0x3800;data[i+3]=0x3c00}
  gl.texSubImage3D(gl.TEXTURE_2D_ARRAY,0,0,0,0,2,2,1,gl.RGBA,gl.HALF_FLOAT,data);
  if(gl.getError()!==gl.NO_ERROR)throw Error('RGBA16F allocation/upload GL error');
  const compile=(kind,text)=>{
    const sh=gl.createShader(kind);gl.shaderSource(sh,text);gl.compileShader(sh);
    if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))
      throw Error('shader compile: '+gl.getShaderInfoLog(sh));
    return sh;
  };
  v=compile(gl.VERTEX_SHADER,`#version 300 es
  void main(){vec2 p[3]=vec2[3](vec2(-1.,-1.),vec2(3.,-1.),vec2(-1.,3.));
  gl_Position=vec4(p[gl_VertexID],0.,1.);}`);
  f=compile(gl.FRAGMENT_SHADER,`#version 300 es
  precision highp float; precision highp sampler2DArray;
  uniform sampler2DArray t;out vec4 c;
  void main(){c=vec4(texelFetch(t,ivec3(0,0,0),0).r,0.,0.,1.);}`);
  program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))
    throw Error('shader link: '+gl.getProgramInfoLog(program));
  gl.viewport(0,0,4,4);gl.useProgram(program);
  vao=gl.createVertexArray();gl.bindVertexArray(vao);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D_ARRAY,tex);
  gl.uniform1i(gl.getUniformLocation(program,'t'),0);
  gl.drawArrays(gl.TRIANGLES,0,3);
  const px=new Uint8Array(4);
  gl.readPixels(1,1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
  out.sample=[...px];
  if(gl.getError()!==gl.NO_ERROR||Math.abs(px[0]-128)>1)
    throw Error('RGBA16F texture sample readback failed');
  out.supported=true;out.reason='RGBA16F storage/upload/sampler2DArray sample verified';
  cleanup();tex=null;program=null;v=null;f=null;vao=null;
  if(exerciseRestore){
    const ext=gl.getExtension('WEBGL_lose_context');
    out.contextLoss.extension=!!ext;
    if(ext){
      const lost=new Promise(resolve=>{
        canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();out.contextLoss.lost=true;resolve()}, {once:true});
        setTimeout(resolve,1500);
      });
      const restored=new Promise(resolve=>{
        canvas.addEventListener('webglcontextrestored',()=>{out.contextLoss.restored=true;resolve()}, {once:true});
        setTimeout(resolve,3500);
      });
      ext.loseContext();await lost;
      if(out.contextLoss.lost){
        ext.restoreContext();await restored;
        if(out.contextLoss.restored){
          const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D_ARRAY,t);
          gl.texStorage3D(gl.TEXTURE_2D_ARRAY,1,gl.RGBA16F,2,2,1);
          gl.texSubImage3D(gl.TEXTURE_2D_ARRAY,0,0,0,0,2,2,1,gl.RGBA,gl.HALF_FLOAT,data);
          out.contextLoss.reProbePass=gl.getError()===gl.NO_ERROR;
          gl.deleteTexture(t);
        }
      }
    }
  }
 }catch(error){out.reason=String(error);out.supported=false}
 finally{out.ready=true;out.probeDurationMs=Math.round((performance.now()-startMs)*100)/100}
 return out;
}
export function selectMorphTextureMode(probe,{requested=true,forceReject=false,requireRestore=false}={}){
 if(!requested)return {mode:'rgba32f',reason:'not requested',fallback:false};
 if(forceReject)return {mode:'rgba32f',reason:'QA forced capability rejection',fallback:true};
 if(!probe?.ready||!probe.webgl2||!probe.supported)
  return {mode:'rgba32f',reason:probe?.reason||'probe unavailable',fallback:true};
 if(requireRestore&&(!probe.contextLoss?.requested||!probe.contextLoss.restored||!probe.contextLoss.reProbePass))
  return {mode:'rgba32f',reason:'context-loss restore/reprobe not verified',fallback:true};
 if(probe.maxTextureSize<2048||probe.maxArrayTextureLayers<64)
  return {mode:'rgba32f',reason:'conservative hardware limits',fallback:true};
 return {mode:'rgba16f',reason:'RGBA16F allocation and sampling supported',fallback:false};
}
