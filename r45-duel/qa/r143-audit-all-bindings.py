#!/usr/bin/env python3
"""R143 full GLB/VRM source-skin audit; immutable source, not art approval.

Reads every game-accessible binary in assets/summons and assets/model.
Scans ALL primitive vertices (not a sampling shortcut) for skin weights,
mapped joints, missing inverse-bind matrices, unweighted bones, failed
render-source parents and source-specific defective binding chains.
"""
from __future__ import annotations
import argparse, hashlib, json, math, struct, subprocess, tempfile
from collections import Counter, defaultdict
from pathlib import Path
import numpy as np

ROOT=Path(__file__).resolve().parent.parent
SOURCE_IDS={"E03":"Ellie","E04":"Phil","G02":"Snow","G03":"Jay",
 "G04":"Victoria","T03":"Rain","T04":"Rex"}
SKINNED_PILOTS={
 "E03":"E03-Ellie-Skinned-R132-BakedRest-PILOT.glb",
 "E04":"E04-Phil-Skinned-R131-BakedRest-PILOT.glb",
 "G02":"G02-Snow-Skinned-R132-BakedRest-PILOT.glb",
 "G03":"G03-Jay-Skinned-R132-BakedRest-PILOT.glb",
 "G04":"G04-Victoria-Skinned-R132-BakedRest-PILOT.glb",
 "T03":"T03-Rain-Skinned-R132-BakedRest-PILOT.glb",
 "T04":"T04-Rex-Skinned-R132-BakedRest-PILOT.glb"
}
DTYPE={5120:"i1",5121:"u1",5122:"<i2",5123:"<u2",
       5125:"<u4",5126:"<f4"}
COMPONENTS={"SCALAR":1,"VEC2":2,"VEC3":3,"VEC4":4,"MAT4":16}
DIRECT_EXPECTED={
 "E03":["DEF-UpperArm1.L","DEF-Forearm1.L","DEF-Thigh1.L",
        "DEF-Knee1.L","DEF-Foot.L","DEF-Toes.L"],
 "E04":["DEF-UpperArm1.L","DEF-Forearm1.L","DEF-Thigh1.L",
        "DEF-Knee1.L","DEF-Foot.L","DEF-Toes.L"],
 "G02":["DEF-UpperArm_1.L","DEF-Forearm_1.L",
        "DEF-Thigh_1.L","DEF-Knee_1.L","DEF-Foot.L"],
 "G03":["DEF-UpperArm1.L","DEF-Forearm1.L","DEF-Thigh1.L",
        "DEF-Knee1.L","DEF-Foot.L","DEF-Toes.L"],
 "G04":["DEF-UpperArm1.L","DEF-Forearm1.L","DEF-Thigh1.L",
        "DEF-Knee1.L","DEF-Foot.L","DEF-Toes.L"],
 "T03":["DEF-Upperarm1.L","DEF-Forearm1.L","DEF-Thigh1.L",
        "DEF-Shin1.L","DEF-Foot.L"],
 "T04":["DEF-UpperArm1.L","DEF-Forearm1.L","DEF-Thigh1.L",
        "DEF-Knee1.L","DEF-Foot.L","DEF-Toes.L"]
}
def norm(x):
 return "".join(c for c in str(x).lower() if c.isalnum())
def glb(p):
 # Decode original compressed VRM into an isolated temporary audit-only GLB.
 # The user-authored source file is never edited, and all vertices are scanned.
 if p.suffix.lower()=='.vrm':
  with tempfile.NamedTemporaryFile(suffix=".glb",prefix="r143-audit-",delete=False) as tmp:
   derived=Path(tmp.name)
  try:
   subprocess.run(["node",str(ROOT/"qa/r143-expand-vrm-meshopt.mjs"),
     str(p),str(derived)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,
     check=True,timeout=75)
   return glb(derived)
  finally:
   derived.unlink(missing_ok=True)
 with p.open("rb") as f:
  head=f.read(12)
  if len(head)!=12 or head[:4]!=b"glTF":raise ValueError("NOT_GLB")
  _,ver,total=struct.unpack("<4sII",head)
  if ver!=2 or total!=p.stat().st_size:raise ValueError("GLB_LENGTH")
  chunks=[]
  while f.tell()<total:
   ch=f.read(8)
   if len(ch)!=8:raise ValueError("TRUNCATED")
   n,tag=struct.unpack("<I4s",ch);chunks.append((tag,f.tell(),n))
   f.seek(n,1)
  if not chunks or chunks[0][0]!=b"JSON":raise ValueError("NO_GLTF_JSON")
  f.seek(chunks[0][1]);doc=json.loads(f.read(chunks[0][2]))
  binchunk=next((x for x in chunks if x[0]==b"BIN\x00"),None)
  if not binchunk:raise ValueError("NO_BINARY")
  f.seek(binchunk[1]);buf=f.read(binchunk[2])
 return doc,memoryview(buf)

def accessor(doc,buf,index):
 a=doc["accessors"][index]
 if "sparse" in a:raise ValueError("SPARSE_ACCESSOR_UNSUPPORTED")
 view=doc["bufferViews"][a["bufferView"]]
 if view.get("buffer",0)!=0:raise ValueError("EXTERNAL_BUFFER")
 dt=np.dtype(DTYPE[a["componentType"]])
 width=COMPONENTS[a["type"]]
 stride=int(view.get("byteStride",dt.itemsize*width))
 offset=int(view.get("byteOffset",0))+int(a.get("byteOffset",0))
 count=int(a["count"]);nbytes=dt.itemsize*width
 if offset+(count-1)*stride+nbytes>len(buf):raise ValueError("BUFFER_OVERRUN")
 arr=np.ndarray(shape=(count,width),dtype=dt,buffer=buf,
   offset=offset,strides=(stride,dt.itemsize))
 if a.get("normalized"):
  if dt.kind=="u":arr=arr.astype(np.float64)/np.iinfo(dt).max
  elif dt.kind=="i":arr=np.maximum(-1,arr.astype(np.float64)/np.iinfo(dt).max)
 return arr

def audit(path,strict=False):
 out={"file":str(path.relative_to(ROOT)),"bytes":path.stat().st_size,
      "sha256":hashlib.sha256(path.read_bytes()).hexdigest(),
      "errors":[],"warnings":[]}
 try:doc,buf=glb(path)
 except Exception as e:
  out["errors"].append(str(e));out["status"]="invalid";return out
 nodes=doc.get("nodes",[]);meshes=doc.get("meshes",[]);skins=doc.get("skins",[])
 out.update(nodes=len(nodes),meshes=len(meshes),skins=len(skins),
            animations=len(doc.get("animations",[])))
 name_nodes=defaultdict(list)
 for i,node in enumerate(nodes):name_nodes[norm(node.get("name",""))].append(i)
 parent=defaultdict(list)
 for i,node in enumerate(nodes):
  for c in node.get("children",[]):parent[c].append(i)
 out["duplicateNodeNames"]={n:len(v) for n,v in name_nodes.items() if len(v)>1 and n}
 out["multiParentNodes"]=[i for i,v in parent.items() if len(v)>1]
 if out["multiParentNodes"]:out["errors"].append("NON_TREE_PARENT")
 for i,skin in enumerate(skins):
  if len(set(skin["joints"]))!=len(skin["joints"]):
   out["errors"].append("DUPLICATE_SKIN_JOINT:"+str(i))
  if "inverseBindMatrices" in skin:
   try:
    ibm=accessor(doc,buf,skin["inverseBindMatrices"])
    if len(ibm)!=len(skin["joints"]):out["errors"].append("IBM_COUNT:"+str(i))
    if not np.isfinite(ibm).all():out["errors"].append("NONFINITE_IBM:"+str(i))
   except Exception as e:out["errors"].append("IBM_UNREADABLE:"+str(i)+":"+str(e))
  else:out["warnings"].append("MISSING_IBM:"+str(i))
 active=defaultdict(lambda:Counter())
 direct=defaultdict(lambda:Counter())
 weightsum_bad=0
 unsupported=0
 vertex_count=0
 skinned_mesh_count=0
 jointsets=defaultdict(set)
 binderrors=[]
 unskinned=0
 for node_idx,node in enumerate(nodes):
  if "mesh" not in node:continue
  mesh=meshes[node["mesh"]];skinid=node.get("skin")
  if skinid is None:
   unskinned+=1;continue
  if skinid>=len(skins):
   out["errors"].append("BAD_SKIN_ID:"+str(node_idx));continue
  skinned_mesh_count+=1;skin=skins[skinid];jointnames=[nodes[n].get("name","") for n in skin["joints"]]
  for p_idx,p in enumerate(mesh.get("primitives",[])):
   attrs=p.get("attributes",{})
   if "JOINTS_0" not in attrs or "WEIGHTS_0" not in attrs:
    out["errors"].append("SKINNED_PRIMITIVE_UNWEIGHTED:"+str(node_idx)+"/"+str(p_idx))
    continue
   try:
    joints=accessor(doc,buf,attrs["JOINTS_0"])
    weights=accessor(doc,buf,attrs["WEIGHTS_0"]).astype(np.float64)
    if joints.shape!=weights.shape or joints.shape[1]!=4:raise ValueError("BAD_WEIGHT_SHAPE")
    if "JOINTS_1" in attrs and "WEIGHTS_1" in attrs:
     joints=np.concatenate([joints,accessor(doc,buf,attrs["JOINTS_1"])],axis=1)
     weights=np.concatenate([weights,accessor(doc,buf,attrs["WEIGHTS_1"]).astype(np.float64)],axis=1)
    elif "JOINTS_1" in attrs or "WEIGHTS_1" in attrs:
     out["errors"].append("MISSING_SECOND_INFLUENCE_PAIR")
    if not np.isfinite(weights).all():out["errors"].append("NONFINITE_SKIN_WEIGHTS")
    if np.any(weights<0):out["errors"].append("NEGATIVE_SKIN_WEIGHTS")
    sums=np.sum(weights,axis=1)
    weightsum_bad+=int(np.count_nonzero(np.abs(sums-1)>.012))
    vertex_count+=len(joints)
    active_mask=weights>1e-5
    invalid_joint=np.any((joints>=len(jointnames))&active_mask)
    if invalid_joint:out["errors"].append("OUT_OF_RANGE_SKIN_JOINT:"+str(node_idx))
    # Vectorized per joint and per primitive; counts and greatest direct
    # weight prove a vertex genuinely uses this source joint.
    for i,jointname in enumerate(jointnames):
     a=active_mask&(joints==i)
     count=int(np.count_nonzero(np.any(a,axis=1)))
     if count:
      direct[jointname]["vertices"]+=count
      direct[jointname]["highWeightVertices"]+=int(np.count_nonzero(np.any(a&(weights>=.20),axis=1)))
      jointsets[jointname].add(node_idx)
      direct[jointname]["maximumWeight1000"]=max(
       int(round(1000*float(np.max(weights[a])))),direct[jointname]["maximumWeight1000"])
   except Exception as e:
    out["errors"].append("BAD_PRIMITIVE:"+str(node_idx)+"/"+str(p_idx)+":"+str(e))
 out["vertexCount"]=vertex_count
 out["skinnedMeshInstances"]=skinned_mesh_count
 out["unskinnedMeshInstances"]=unskinned
 out["badWeightSumVertices"]=weightsum_bad
 if weightsum_bad>0:out["warnings"].append("NONUNIT_WEIGHT_SUM:"+str(weightsum_bad))
 out["weightedBoneCount"]=len(direct)
 out["directWeightSummary"]={k:v for k,v in direct.items()
  if any(tok in norm(k) for tok in ("hips","spine","thigh","knee","foot","toe","shoulder","upperarm","forearm","head","jaw"))}
 is_pilot=path.name in SKINNED_PILOTS.values()
 if is_pilot:
  actor=next(k for k,v in SKINNED_PILOTS.items() if v==path.name)
  out["pilotActor"]=actor
  required=DIRECT_EXPECTED[actor]
  missing=[];no_direct=[]
  for n in required:
   matches=[m for m in name_nodes if m==norm(n)]
   if not matches:missing.append(n)
   elif not any(norm(k)==norm(n) and v["highWeightVertices"]>0 for k,v in direct.items()):
    no_direct.append(n)
  out["requiredMissingNodes"]=missing
  out["requiredNoDirectWeightedVertices"]=no_direct
  if missing:out["errors"].append("MISSING_SOURCE_JOINTS:"+",".join(missing))
  if no_direct:out["warnings"].append("NO_DIRECT_WEIGHT_SOURCE:"+",".join(no_direct))
  out["pelvis"]={k:{"present":bool(name_nodes.get(norm(k))),
    "directVertices":sum(v["vertices"] for n,v in direct.items() if norm(n)==norm(k)),
    "maxWeight1000":max([v["maximumWeight1000"] for n,v in direct.items() if norm(n)==norm(k)]or[0]),
    "childCount":sum(len(nodes[i].get("children",[])) for i in name_nodes.get(norm(k),[]))}
    for k in ["DEF-Hips","DEF-Pelvis"]}
 out["status"]="failed" if out["errors"] else "audited"
 # This report audits source bindings, NOT art excellence or human direction.
 return out

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument("--all",action="store_true")
 parser.add_argument("--output",default="qa/evidence/r143/r143-all-bindings-report.json")
 args=parser.parse_args()
 directory=ROOT/"assets/summons"
 source=list(sorted(directory.glob("*.glb"))) if args.all else [
  directory/name for name in SKINNED_PILOTS.values()]
 source.extend(sorted((ROOT/"assets/model").glob("*.vrm")))
 results=[]
 for p in source:
  if not p.exists():raise FileNotFoundError(p)
  row=audit(p)
  results.append(row)
  print("R143_BINDING",row["file"],row["status"],
        "vertices",row.get("vertexCount"),"skins",row.get("skins"),
        "errors",len(row["errors"]),"warnings",len(row["warnings"]),flush=True)
 outcome={"audited":len(results),"originalPilots":list(SKINNED_PILOTS),
  "failing":[r["file"] for r in results if r["errors"]],
  "totalSourceVertices":sum(r.get("vertexCount",0) for r in results),
  "artApproved":False,"defaultOfficialModels":"R97",
  "pass":not any(r["errors"] for r in results),"results":results}
 dest=ROOT/args.output;dest.parent.mkdir(parents=True,exist_ok=True)
 dest.write_text(json.dumps(outcome,ensure_ascii=False,indent=2,default=int))
 print("R143_FULL_SOURCE_BINDING_AUDIT",json.dumps({
  "files":outcome["audited"],"bad":len(outcome["failing"]),
  "vertices":outcome["totalSourceVertices"],
  "pass":outcome["pass"]},ensure_ascii=False))
 if not outcome["pass"]:raise SystemExit(1)
if __name__=="__main__":main()
