#!/usr/bin/env python3
"""Create opt-in M01 adult character QA module from existing source, fail closed.

The generated module is for a loopback overlay only. It is not a game release
and must not replace the original summon-models.mjs or existing music teacher.
Requires a previously generated and SHA-audited M01 adult GLB served alongside
the overlay. Example:
  python3 r45-duel/qa/m01-adult-teacher-overlay-poc.py \
    --source /path/to/r45-duel/scene/summon-models.mjs \
    --output /isolated/evidence/m01-qa-summon-models.mjs
"""
from __future__ import annotations
import argparse
from pathlib import Path


FLAG = """// Isolated M01 adult teacher study: requires explicit QA flag, defaults OFF.
const isM01AdultTeacherStudy=(()=>{
 const local=new URLSearchParams(location.search);
 const parent=(()=>{try{return window.parent!==window?
  new URLSearchParams(window.parent.location.search):null;}catch{return null}})();
 return (local.get('qa')==='1'||parent?.get('qa')==='1')&&
  (local.get('m01Adult')==='on'||parent?.get('m01Adult')==='on');
})();
"""

REPLACEMENTS = (
    ("const isG03R86Study=(()=>{", FLAG + "const isG03R86Study=(()=>{"),
    ("const selectedFile=id==='M02'&&r99ChefOld?",
     "const selectedFile=id==='M01'&&isM01AdultTeacherStudy?"
     "'M01-MusicTeacher-Adult-Ara-STUDY.glb':\n   id==='M02'&&r99ChefOld?"),
    ("const r126Teacher=template.id==='M01'?createR126MusicTeacherClips(THREE,instance):null;",
     "const r126Teacher=template.id==='M01'&&!isM01AdultTeacherStudy?"
     "createR126MusicTeacherClips(THREE,instance):null;"),
    ("const choose=(kind)=>{\n  if(!mixer)return null;\n  const clips=availableClips;",
     """const choose=(kind)=>{
  if(!mixer)return null;
  const clips=availableClips;
  if(template.id==='M01'&&isM01AdultTeacherStudy){
   const action={idle:'Idle',walk:'Walk',attack:'Punch',hit:'Hit reaction',
    death:'Hit reaction',celebrate:'Cheer'}[kind]||'Talk';
   return clips.find(c=>c.name===action)||clips[0];
  }"""),
    ("r126Teacher?teacherUpdate:filmStatic?updateStatic:null,instance,",
     "r126Teacher?teacherUpdate:filmStatic?updateStatic:\n"
     "  template.id==='M01'&&isM01AdultTeacherStudy?(dt=>mixer?.update(dt)):null,instance,"),
    ("const clip=availableClips.find(x=>x.name===name);\n  if(!clip)return 0;",
     """const remap=template.id==='M01'&&isM01AdultTeacherStudy?{
   R126_M01_Conduct:'Wave',R126_M01_Order:'Talk',
   R126_M01_Shocked:'Hit reaction',R126_M01_Cheer:'Cheer'}:null;
  const clip=availableClips.find(x=>x.name===(remap?.[name]||name));
  if(!clip)return 0;"""),
)


def generate(source: Path, output: Path, attack_clip: str = "Punch") -> None:
    source = source.resolve(strict=True)
    output = output.absolute()
    if output.resolve() == source or output.exists():
        raise ValueError("Refusing to overwrite the source or an existing output")
    value = source.read_text(encoding="utf-8")
    for i, (before, after) in enumerate(REPLACEMENTS):
        count = value.count(before)
        if count != 1:
            raise ValueError(f"Source changed: exact patch {i + 1} expected once, found {count}")
        value = value.replace(before, after)
    if "const isM01AdultTeacherStudy" not in value or "m01Adult" not in value:
        raise ValueError("Missing QA guard")
    # A role-aware alternative: orchestral cue / arm-raise instead of boxing.
    # Both choices are original embedded GLB clips; no bone editing.
    if attack_clip not in ("Punch", "Wave"):
        raise ValueError("Unsupported adult teacher attack clip")
    if attack_clip == "Wave":
        marker = "attack:'Punch',hit:'Hit reaction'"
        if value.count(marker) != 1:
            raise ValueError("Adult teacher attack mapping changed")
        value = value.replace(marker, "attack:'Wave',hit:'Hit reaction'")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(value, encoding="utf-8")
    print(f"M01_ADULT_QA_OVERLAY_GENERATED {output}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--attack-clip", choices=("Punch", "Wave"), default="Punch",
                        help="QA-only M01 animation: Wave is a teacher cue; Punch is baseline")
    args = parser.parse_args()
    generate(args.source, args.output, args.attack_clip)


if __name__ == "__main__":
    main()
