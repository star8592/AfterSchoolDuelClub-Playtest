#!/usr/bin/env python3
"""Remove only the orphaned VRM 0.x editor thumbnail from four production VRMs.

Keep ALL meshes, skins, animation, texture/material, expression payloads byte-identical.
VRM originals are never mutated. Fail closed unless the thumbnail is provably
the last image and last GLB bufferView at the end of the BIN chunk.
"""
import argparse
import copy
import hashlib
import json
import struct
from pathlib import Path

MODELS = (
    "Shino-original-CC0.vrm",
    "Fumiriya-original-CC0.vrm",
    "Host-HairSample_Female-CC0.vrm",
    "Host-HairSample_Male-CC0.vrm",
)
GLB_MAGIC, JSON_CHUNK, BIN_CHUNK = b"glTF", 0x4E4F534A, 0x004E4942


def parse(path):
    data = path.read_bytes()
    assert data[:4] == GLB_MAGIC, f"{path}: not a GLB"
    magic, version, total = struct.unpack_from("<4sII", data)
    assert version == 2 and total == len(data)
    n, tag = struct.unpack_from("<II", data, 12)
    assert tag == JSON_CHUNK and n % 4 == 0
    j = json.loads(data[20 : 20+n].decode("utf-8"))
    pos = 20+n
    nbin, tag = struct.unpack_from("<II", data, pos)
    assert tag == BIN_CHUNK and pos+8+nbin == len(data)
    binary = data[pos+8:]
    assert j["buffers"][0]["byteLength"] <= nbin
    return j, binary


def encode(j, binary):
    raw = json.dumps(j, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    raw += b" " * ((-len(raw)) % 4)
    binary += b"\x00" * ((-len(binary)) % 4)
    total = 12+8+len(raw)+8+len(binary)
    return (struct.pack("<4sII", GLB_MAGIC, 2, total)
            + struct.pack("<II", len(raw), JSON_CHUNK) + raw
            + struct.pack("<II", len(binary), BIN_CHUNK) + binary)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--source", required=True, type=Path)
    a.add_argument("--output", required=True, type=Path)
    a.add_argument("--report", required=True, type=Path)
    args = a.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    results = []
    for name in MODELS:
        src = args.source/name
        srcdoc, binary = parse(src)
        j = copy.deepcopy(srcdoc)
        images, views = j["images"], j["bufferViews"]
        index = next((i for i, x in enumerate(images) if x.get("name") == "Thumbnail"), None)
        assert index == len(images)-1, f"{name}: thumbnail is not the last image"
        image = images[-1]
        vi = image["bufferView"]
        assert vi == len(views)-1, f"{name}: thumbnail not final view"
        view = views[-1]
        offset = view["byteOffset"]
        end = offset+view["byteLength"]
        assert end <= len(binary) and len(binary)-end < 4, f"{name}: image not at BIN tail"
        assert offset % 4 == 0 and offset >= 0
        # The thumbnail does not belong to a material texture; only VRM.meta
        # references this editor-only image. All runtime material references stay.
        assert all(tex.get("source") != index for tex in j.get("textures", [])),             f"{name}: thumbnail is a runtime material texture"
        extensions = j["extensions"]
        vrm = extensions["VRM"]
        assert vrm.get("meta", {}).get("texture") is not None, f"{name}: VRM meta texture missing"
        vrm["meta"].pop("texture", None)
        images.pop()
        views.pop()
        j["buffers"][0]["byteLength"] = offset
        output_bytes = encode(j, binary[:offset])
        outname = name[:-4] + "-R155-Runtime.vrm"
        dst = args.output/outname
        dst.write_bytes(output_bytes)
        outdoc, outbin = parse(dst)
        # Verify geometry, material, skin/bones, VRM expressions, animation,
        # accessors, and all original bufferView offsets and contents unchanged.
        protected = ("meshes", "nodes", "skins", "accessors", "textures",
                     "materials", "animations", "samplers")
        for key in protected:
            assert srcdoc.get(key) == outdoc.get(key), f"{name}: changed protected {key}"
        assert srcdoc["extensions"]["VRM"]["blendShapeMaster"] ==             outdoc["extensions"]["VRM"]["blendShapeMaster"]
        assert outbin == binary[:offset]
        assert outdoc["bufferViews"] == srcdoc["bufferViews"][:-1]
        assert outdoc["images"] == srcdoc["images"][:-1]
        results.append({
            "original": name, "runtime": outname,
            "original_bytes": src.stat().st_size, "runtime_bytes": len(output_bytes),
            "saved_bytes": src.stat().st_size-len(output_bytes),
            "original_sha256": sha(src.read_bytes()),
            "runtime_sha256": sha(output_bytes),
            "removed_image_name": image["name"],
            "removed_image_bytes": view["byteLength"],
            "original_nodes": len(srcdoc["nodes"]),
            "original_skins": len(srcdoc["skins"]),
            "original_meshes": len(srcdoc["meshes"]),
            "materials_unchanged": True,
            "animations_unchanged": True,
            "skin_and_geometry_binary_identical": True,
        })
        print("R155_VRM_PASS", name, "saved", results[-1]["saved_bytes"], flush=True)
    report = {
        "purpose": "strip unused embedded VRM editor thumbnails, preserve rendering",
        "gate": "no material references thumbnail; preserved accessor/material/skins/VRM blend shapes",
        "models": results,
        "saved_bytes": sum(r["saved_bytes"] for r in results),
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print("R155_VRM_COMPLETE", report["saved_bytes"], "bytes", flush=True)


if __name__ == "__main__":
    main()
