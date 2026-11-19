/**
 * R192 QA-only WebGL texture life-cycle recorder.
 * Installs before WebGLRenderer obtains its context. No gameplay mutation.
 * Avoids patching draw-time calls; only texture create/delete are observed.
 */
export function installTextureLifecycleTrace(canvas){
  let nextId=1, installed=false, installError=null;
  const live=new Map(), ids=new WeakMap(), events=[],uploads3D=[],allocations3D=[];
  const nativeGetContext=canvas.getContext;
  const maxEvents=2000;
  canvas.getContext=function(...args){
    const gl=nativeGetContext.apply(this,args);
    if(!gl||!/^webgl2?$|^experimental-webgl$/.test(String(args[0]))||installed)return gl;
    installed=true;
    try{
      const rawCreate=gl.createTexture.bind(gl);
      const rawDelete=gl.deleteTexture.bind(gl);
      gl.createTexture=function(...p){
        const texture=rawCreate(...p);
        if(texture){
          const id=nextId++;
          const stack=(new Error().stack||'').split('\n').slice(2,9).join(' | ').slice(0,1050);
          const row={id,createdMs:Math.round(performance.now()),stack};
          ids.set(texture,id);live.set(id,row);
          if(events.length<maxEvents)events.push({kind:'create',id,ms:row.createdMs});
        }
        return texture;
      };
      // Three.js morphTargetsTexture uses Float DataArrayTexture uploaded via
      // texImage3D. We record API-visible payload dimensions only; no pixel data.
      const rawImage3D=gl.texImage3D?.bind(gl);
      if(rawImage3D)gl.texImage3D=function(...p){
        const [target,level,internalFormat,width,height,depth,border,format,type,pixels]=p;
        if(uploads3D.length<1000)uploads3D.push({
          target,level,internalFormat,width,height,depth,format,type,
          payloadBytes:pixels?.byteLength??null,timeMs:Math.round(performance.now())
        });
        return rawImage3D(...p);
      };
      const rawStorage3D=gl.texStorage3D?.bind(gl);
      if(rawStorage3D)gl.texStorage3D=function(...p){
        const [target,levels,internalFormat,width,height,depth]=p;
        if(allocations3D.length<1000)allocations3D.push({target,levels,internalFormat,
          width,height,depth,timeMs:Math.round(performance.now())});
        return rawStorage3D(...p);
      };
      const rawSubImage3D=gl.texSubImage3D?.bind(gl);
      if(rawSubImage3D)gl.texSubImage3D=function(...p){
        const [target,level,xoffset,yoffset,zoffset,width,height,depth,format,type,pixels]=p;
        if(uploads3D.length<1000)uploads3D.push({
          target,level,width,height,depth,format,type,
          payloadBytes:pixels?.byteLength??null,timeMs:Math.round(performance.now())
        });
        return rawSubImage3D(...p);
      };
      gl.deleteTexture=function(texture){
        const id=texture&&ids.get(texture);
        if(id){
          live.delete(id);
          if(events.length<maxEvents)events.push({kind:'delete',id,ms:Math.round(performance.now())});
        }
        return rawDelete(texture);
      };
    }catch(error){installError=String(error)}
    return gl;
  };
  return {
    idFor:t=>t?ids.get(t)||null:null,
    snapshot(renderer,activeTraceIds=[]){
      const owned=new Set(activeTraceIds.filter(x=>x!=null));
      const unowned=[...live.values()].filter(x=>!owned.has(x.id));
      const stacks=new Map();
      for(const o of unowned){
        const stack=o.stack;
        const x=stacks.get(stack)||{stack,count:0,ids:[]};
        x.count++;if(x.ids.length<12)x.ids.push(o.id);stacks.set(stack,x);
      }
      return {enabled:true,installed,installError,
        trackedCreated:nextId-1,trackedLive:live.size,
        rendererTextureObjects:renderer?.info?.memory?.textures??null,
        activeReferencedTracked:owned.size,
        unownedTracked:unowned.length,
        countDelta:live.size-(renderer?.info?.memory?.textures??0),
        arrayUploads3D:uploads3D.length,
        arrayAllocations3D:allocations3D.length,
        arrayAllocationShapes:[...allocations3D.reduce((map,u)=>{
          const shape=[u.width,u.height,u.depth,u.internalFormat].join('x');
          const v=map.get(shape)||{shape,count:0};v.count++;map.set(shape,v);return map;
        },new Map()).values()].sort((a,b)=>b.count-a.count).slice(0,12),
        arrayUploadedFloatPayloadMiB:Math.round(uploads3D.reduce((s,u)=>s+(u.payloadBytes||0),0)/1048576*1000)/1000,
        arrayUploadShapes:[...uploads3D.reduce((map,u)=>{
          const shape=[u.width,u.height,u.depth,u.format,u.type].join('x');
          const value=map.get(shape)||{shape,count:0,payloadBytes:0};
          value.count++;value.payloadBytes+=u.payloadBytes||0;
          map.set(shape,value);return map;
        },new Map()).values()].sort((a,b)=>b.payloadBytes-a.payloadBytes).slice(0,20),
        unownedStacks:[...stacks.values()].sort((a,b)=>b.count-a.count).slice(0,25),
        recentUnowned:unowned.slice(0,30),
        lastEvents:events.slice(-30)
      };
    }
  };
}
