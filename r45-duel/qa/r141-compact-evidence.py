"""Reproduce compact truthful R141 GPU evidence from raw Z890 browser report."""
from pathlib import Path
import json
root=Path("r45-duel/qa/evidence/r141/seven-source-faces")
data=json.loads((root/"r141-real-three-source-face-voice.json").read_text())
assert data["passed"] is True and len(data["checks"])==152
assert all(x["pass"] is True for x in data["checks"])
assert {v["view"] for v in data["views"]}=={"desktop","portrait"}
rows={}
for view in data["views"]:
    assert set(view["actors"])=={"E03","G03","T04"}
    assert set(view["voices"])=={"E03","G03","T04"}
    for id,sample in view["actors"].items():
        assert set(sample["states"])=={"idle","attack","hit","celebrate"}
        for state,v in sample["states"].items():
            assert v["faceState"]==state.capitalize()
            assert v["jawAngle"]>=0
            assert v["eyeTargets"]
    for id,v in view["voices"].items():
        assert v["maxMouth"]>.10
        assert v["actualStopped"]>0
    rows[view["view"]]={
        "actors":view["actors"],
        "realRecordedQwenAudio":view["voices"]
    }
result={
    "passed":True,"checks":data["checks"],"total":152,"artApproved":False,
    "baseMain":"a92b43bda27372eb506737e07053e735a080c6e1",
    "modelSources":"R132 original weighted Blender GLB, no face texture overlays",
    "voiceSource":"Qwen prerecorded clips, HTMLAudioElement playing and ended/mute signals",
    "forcedPhonemeAlignment":False,
    "defaultOfficialModels":"R97",
    "pilotFlags":{"E03":"r135Pair=on","G03":"r134Jay=on","T04":"r135Pair=on"},
    "views":rows
}
file=root/"r141-three-original-faces-compact.json"
file.write_text(json.dumps(result,indent=2,ensure_ascii=False))
print("R141_152_REAL_SOURCE_FACE_QWEN_PASS",{"checks":len(data["checks"]),
    "views":list(rows),"bytes":file.stat().st_size})
