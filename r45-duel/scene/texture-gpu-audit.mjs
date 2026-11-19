/** R191 read-only QA: live Three.js texture owner and GPU-allocation audit. */
export function auditTextures(scene, renderer) {
  if (!scene || !renderer) return {enabled:true,ready:false};
  const textures=new Map(),roots=new Map(),sources=new Map();
  let renderableNodes=0,materialReferences=0,skinnedMeshes=0;
  function addTexture(t,root,object,slot) {
    if (!t?.isTexture) return;
    let x=textures.get(t.uuid);
    if(!x) {
      const data=t.source?.data??t.image, i=Array.isArray(data)?data[0]:data;
      const width=Number(i?.width||i?.videoWidth||0), height=Number(i?.height||i?.videoHeight||0);
      const faces=Array.isArray(data)?data.length:1, layers=Number(i?.depth||1);
      const allocated=!!renderer.properties.get(t)?.__webglTexture;
      x={uuid:t.uuid,name:t.name||'',source:t.source?.uuid||'',width,height,faces,layers,
        allocated,compressed:!!t.isCompressedTexture,mips:!!t.generateMipmaps,
        dataTexture:!!t.isDataTexture,type:t.type,format:t.format,
        proxyBytes:width*height*faces*layers*4,owners:new Set(),slots:new Set(),roots:new Set()};
      textures.set(t.uuid,x);
    }
    x.owners.add(object);x.slots.add(slot);x.roots.add(root);
  }
  function addMaterial(m,root,object) {
    for(const mat of (Array.isArray(m)?m:[m])) {
      if(!mat?.isMaterial)continue;
      materialReferences++;
      for(const [k,v] of Object.entries(mat)) {
        if(v?.isTexture)addTexture(v,root,object,k);
        if(k==='uniforms'&&v&&typeof v==='object')for(const [n,u] of Object.entries(v)) {
          if(u?.value?.isTexture)addTexture(u.value,root,object,'uniform:'+n);
          else if(Array.isArray(u?.value))u.value.forEach((y,j)=>{if(y?.isTexture)addTexture(y,root,object,'uniform:'+n+'['+j+']')});
        }
      }
    }
  }
  scene.children.forEach((node,index)=>{
    const root=node.name||node.type+'#'+index;let meshNodes=0;
    node.traverse(o=>{if(o.isMesh||o.isPoints||o.isLine||o.isSprite){
      renderableNodes++;meshNodes++;addMaterial(o.material,root,o.name||o.type);
      if(o.isSkinnedMesh){skinnedMeshes++;
        if(o.skeleton?.boneTexture)addTexture(o.skeleton.boneTexture,root,
          o.name||'SkinnedMesh','skeleton.boneTexture');
      }
    }});
    roots.set(root,{root,meshNodes});
    if(node.isLight&&node.shadow?.map?.texture)addTexture(node.shadow.map.texture,'(shadows)',root,'shadowMap');
  });
  addTexture(scene.background,'(scene)','scene','background');
  addTexture(scene.environment,'(scene)','scene','environment');
  for(const x of textures.values()){
    for(const root of x.roots){
      const r=roots.get(root)||{root,meshNodes:0};
      r.unique=(r.unique||0)+1;
      if(x.allocated)r.allocated=(r.allocated||0)+1;
      r.proxyMiB=(r.proxyMiB||0)+x.proxyBytes/1048576;
      roots.set(root,r);
    }
    if(x.source){const a=sources.get(x.source)||[];a.push(x);sources.set(x.source,a)}
  }
  const all=[...textures.values()],allocated=all.filter(x=>x.allocated);
  const round=n=>Math.round(n*100)/100;
  const emit=x=>({name:x.name,uuid:x.uuid,source:x.source,width:x.width,height:x.height,
    faces:x.faces,layers:x.layers,allocated:x.allocated,compressed:x.compressed,mips:x.mips,
    dataTexture:x.dataTexture,type:x.type,format:x.format,
    proxyMiB:round(x.proxyBytes/1048576),owners:[...x.owners].slice(0,5),
    slots:[...x.slots],roots:[...x.roots]});
  return {enabled:true,ready:true,
    gpuTextureObjects:renderer.info.memory.textures,
    gpuGeometryObjects:renderer.info.memory.geometries,
    programs:renderer.info.programs?.length||0,drawCalls:renderer.info.render.calls,
    renderableNodes,materialReferences,skinnedMeshes,uniqueReferenced:all.length,
    allocatedReferenced:allocated.length,
    countGap:renderer.info.memory.textures-allocated.length,
    rgba8AllocatedProxyMiB:round(allocated.reduce((s,x)=>s+x.proxyBytes,0)/1048576),
    note:'RGBA8 is only a pixel size comparison proxy, NOT measured VRAM. Count gap includes internal GPU resources, stale references and resources outside scene graph.',
    roots:[...roots.values()].sort((a,b)=>(b.allocated||0)-(a.allocated||0)),
    largestAllocated:[...allocated].sort((a,b)=>b.proxyBytes-a.proxyBytes).slice(0,25).map(emit),
    duplicatedSourceObjects:[...sources].filter(([,v])=>v.length>1).map(([source,v])=>
      ({source,objects:v.length,allocated:v.filter(x=>x.allocated).length,
        owners:[...new Set(v.flatMap(x=>[...x.owners]))].slice(0,6)})).sort((a,b)=>b.objects-a.objects).slice(0,25),
    records:all.map(emit)
  };
}
