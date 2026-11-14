"""Fail closed on actual Z890 GPU evidence, including legacy acting and voices."""
from pathlib import Path
import json
root=Path("r45-duel/qa/evidence")
cases={
 "r141NewThreeSourceFaceVoice":("r141/seven-source-faces/r141-real-three-source-face-voice.json",152),
 "r134JayOriginalActing":("r134/r134-jay-acting-pilot.json",22),
 "r135EllieRexOriginalActing":("r135/original-pair/r135-pair-original-source-stage.json",53),
 "r135FifteenSecIdle":("r135/original-pair/r135-pair-original-idle-15sec.json",16),
 "r135OriginalFlagIsolation":("r135/original-pair/r135-independent-flag-isolation.json",25),
 "r140FourSourceFaces":("r140/source-faces/r140-real-source-face.json",170),
 "r140FourActualQwenVoices":("r140/source-faces/r140-all-four-actual-qwen.json",54),
 "r139VictoriaFullBody":("r139/victoria/r139-victoria-stage.json",36),
 "r138RealCamera":("r138/visible-silhouette/r138-visibility-baseline.json",70),
 "r136FourSourceActing":("r136/four-source/r136-four-source-action.json",83),
 "r136FlagRollback":("r136/four-source/r136-flag-rollback.json",63),
 "r136FourSource15s":("r136/four-source/r136-four-ensemble-15sec.json",36),
 "r124CardFullChain":("r124-full-chain/r124-full-chain-report.json",18),
 "r122HostQwenMouth":("r122-qwen-mouth/r122-real-qwen-mouth-report.json",28)
}
receipt={}
for name,(relative,expected) in cases.items():
 file=root/relative
 j=json.loads(file.read_text())
 assert j.get("passed") is True,(name,"reported failure",j.get("errors"))
 checks=j.get("checks",[])
 assert len(checks)==expected,(name,"wrong test count",len(checks),expected)
 assert all(x.get("pass") is True for x in checks),(name,"actual failed check")
 receipt[name]=expected
new=json.loads((root/cases["r141NewThreeSourceFaceVoice"][0]).read_text())
assert {v["view"] for v in new["views"]}=={"desktop","portrait"}
for v in new["views"]:
 assert set(v["actors"])=={"E03","G03","T04"}
 assert set(v["voices"])=={"E03","G03","T04"}
 for id,row in v["voices"].items():
  assert row["maxMouth"]>.10 and row["actualStopped"]>0,(v["view"],id,row)
total=sum(receipt.values())
assert total==826,total
result={
 "passed":True,"total":826,"new":152,"historicRetested":674,
 "mainBase":"a92b43bda27372eb506737e07053e735a080c6e1",
 "artApproved":False,"defaultOfficialModels":"R97",
 "originalSourceActors":["E03","E04","G02","G03","G04","T03","T04"],
 "sourceVoices":"pre-recorded Qwen3 clips only",
 "speechAccuracy":"approximate syllable timing, not forced phoneme alignment",
 "sourceFaceStagePilot":{"E03":"r135Pair=on",
  "G03":"r134Jay=on","T04":"r135Pair=on"},
 "checks":receipt,
 "newActorsGPU":{
  v["view"]:{id:{"peakMouth":v["voices"][id]["maxMouth"],
    "states":list(v["actors"][id]["states"])}
   for id in ["E03","G03","T04"]}
  for v in new["views"]
 },
 "unresolved":["Official site deploy acceptance","Director art review 85/100",
  "Low-end real-device mobile GPU","Full remaining cast and spectator emotion parity"],
 "evidencePaths":[x[0] for x in cases.values()]
}
dest=root/"r141/seven-source-faces/r141-convergence.json"
dest.parent.mkdir(parents=True,exist_ok=True)
dest.write_text(json.dumps(result,ensure_ascii=False,indent=2))
print("R141_826_REAL_GPU_CHECKS_PASS",
 json.dumps({"total":total,"new":152,"legacy":674,
   "artApproved":False,"defaultOfficialModels":"R97"},ensure_ascii=False))
