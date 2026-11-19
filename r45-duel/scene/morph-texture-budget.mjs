/**
 * R192 no-write budget for WebGLMorphtargets DataArrayTexture.
 * Matches Three.js actual geometry->FloatType DataArrayTexture dimensions;
 * bytes are a theoretical uncompressed float32 payload, not measured VRAM.
 */
export function inspectMorphTextureBudget(scene,renderer){
  if(!scene||!renderer)return {enabled:true,ready:false};
  const geometries=new Map(),sourceGeometry=new Map();
  let morphNodes=0;
  const maxDimension=renderer.capabilities.maxTextureSize;
  for(const root of scene.children){
    const rootName=root.name||root.type;
    root.traverse(node=>{
      const geo=node.geometry;
      if(!geo?.isBufferGeometry)return;
      const ma=geo.morphAttributes;
      const positions=ma?.position??[],normals=ma?.normal??[],colors=ma?.color??[];
      const count=positions.length||normals.length||colors.length;
      if(!count)return;
      morphNodes++;
      const pos=geo.attributes.position;
      if(!pos)return;
      let dimensions=Number(positions.length>0)+Number(normals.length>0)+Number(colors.length>0);
      if(!dimensions)dimensions=1;
      const nominalWidth=pos.count*dimensions;
      const width=Math.min(maxDimension,nominalWidth);
      const height=Math.ceil(nominalWidth/width);
      const layers=count;
      let row=geometries.get(geo.uuid);
      if(!row){
        row={uuid:geo.uuid,name:geo.name||'',vertices:pos.count,
          morphCount:count,morphPositions:positions.length,morphNormals:normals.length,
          morphColors:colors.length,width,height,layers,
          byteProxy:width*height*layers*16,roots:new Set(),owners:new Set(),
          visibleOwners:0,totalOwners:0,morphInfluenceMax:0};
        geometries.set(geo.uuid,row);sourceGeometry.set(geo.uuid,geo);
      }
      row.roots.add(rootName);row.owners.add(node.name||node.type);
      row.totalOwners++;
      if(node.visible)row.visibleOwners++;
      row.morphInfluenceMax=Math.max(row.morphInfluenceMax,
        node.morphTargetInfluences?.length||0);
    });
  }
  const rows=[...geometries.values()];
  const round=n=>Math.round(n*1000)/1000;
  const payload=rows.reduce((s,x)=>s+x.byteProxy,0);
  const emit=x=>({uuid:x.uuid,name:x.name,vertices:x.vertices,
    morphCount:x.morphCount,morphPositions:x.morphPositions,
    morphNormals:x.morphNormals,morphColors:x.morphColors,
    width:x.width,height:x.height,layers:x.layers,
    floatPayloadMiB:round(x.byteProxy/1048576),
    roots:[...x.roots],owners:[...x.owners].slice(0,10),
    visibleOwners:x.visibleOwners,totalOwners:x.totalOwners,
    morphInfluenceMax:x.morphInfluenceMax});
  const groups=new Map();
  for(const r of rows){
    const key=[r.vertices,r.morphCount,r.morphPositions,r.morphNormals,r.morphColors,
      r.width,r.height].join('|');
    const v=groups.get(key)||[];
    v.push(r);groups.set(key,v);
  }
  // R192 candidate validation: compare full original typed-array contents,
  // metadata, all morph channels, draw ranges, and material groups. QA ONLY.
  const sameArray=(a,b)=>{
    if(a===b)return true;
    if(!a||!b||a.constructor!==b.constructor||a.byteLength!==b.byteLength)return false;
    const aa=new Uint8Array(a.buffer,a.byteOffset,a.byteLength);
    const bb=new Uint8Array(b.buffer,b.byteOffset,b.byteLength);
    for(let i=0;i<aa.length;i++)if(aa[i]!==bb[i])return false;
    return true;
  };
  const attrEqual=(a,b)=>!!a&&!!b&&a.itemSize===b.itemSize&&
    a.normalized===b.normalized&&a.count===b.count&&
    a.gpuType===b.gpuType&&sameArray(a.array,b.array);
  const attrsEqual=(a,b)=>{
    const aKeys=Object.keys(a||{}).sort(),bKeys=Object.keys(b||{}).sort();
    return aKeys.join('|')===bKeys.join('|')&&aKeys.every(k=>{
      const v=a[k],w=b[k];
      if(Array.isArray(v)||Array.isArray(w))return Array.isArray(v)&&Array.isArray(w)&&
        v.length===w.length&&v.every((x,i)=>attrEqual(x,w[i]));
      return attrEqual(v,w);
    });
  };
  const geometryEqual=(a,b)=>{
    if(!a||!b||a===b)return a===b;
    if(a.morphTargetsRelative!==b.morphTargetsRelative||
      a.drawRange.start!==b.drawRange.start||a.drawRange.count!==b.drawRange.count||
      JSON.stringify(a.groups)!==JSON.stringify(b.groups)||
      JSON.stringify(a.userData)!==JSON.stringify(b.userData))return false;
    if(Boolean(a.index)!==Boolean(b.index))return false;
    if(a.index&&!attrEqual(a.index,b.index))return false;
    return attrsEqual(a.attributes,b.attributes)&&attrsEqual(a.morphAttributes,b.morphAttributes);
  };
  const duplicateGroups=[];
  for(const [shape,items] of groups){
    if(items.length<2)continue;
    const validated=[];
    for(const row of items){
      const geo=sourceGeometry.get(row.uuid);
      const target=validated.find(group=>geometryEqual(sourceGeometry.get(group[0].uuid),geo));
      if(target)target.push(row);
      else validated.push([row]);
    }
    for(const list of validated){
      if(list.length<2)continue;
      duplicateGroups.push({shape,count:list.length,geometryUuids:list.map(x=>x.uuid),
        owners:list.flatMap(x=>[...x.owners]).slice(0,14),
        repeatedFloatMiB:round((list.length-1)*list[0].byteProxy/1048576),
        verifiedByteEqual:true});
    }
  }
  const exactDupPotentialMiB=round(duplicateGroups.reduce((s,g)=>s+g.repeatedFloatMiB,0));
  return {enabled:true,ready:true,
    uniqueMorphGeometries:rows.length,morphNodes,
    exactDuplicateGroups:duplicateGroups,exactDuplicatedFloatMiB:exactDupPotentialMiB,
    float32PayloadProxyMiB:round(payload/1048576),
    largest:rows.toSorted((a,b)=>b.byteProxy-a.byteProxy).slice(0,30).map(emit),
    distribution:[...groups].map(([shape,v])=>({shape,geometryCount:v.length,
      floatPayloadMiB:round(v.reduce((s,x)=>s+x.byteProxy,0)/1048576),
      ownerExamples:[...new Set(v.flatMap(x=>[...x.owners]))].slice(0,10)}))
      .sort((a,b)=>b.floatPayloadMiB-a.floatPayloadMiB),
    possibleDuplicateShapes:[...groups].filter(([,a])=>a.length>1)
      .map(([shape,a])=>({shape,count:a.length,
        combinedFloatMiB:round(a.reduce((s,x)=>s+x.byteProxy,0)/1048576),
        owners:[...new Set(a.flatMap(x=>[...x.owners]))].slice(0,10)}))
      .sort((a,b)=>b.combinedFloatMiB-a.combinedFloatMiB),
    note:'Equal shapes alone do NOT prove duplicate geometry or duplicate morph data. Float32 payload is a proxy, not measured GPU allocation. No geometry is changed.',
    rows:rows.map(emit)
  };
}
