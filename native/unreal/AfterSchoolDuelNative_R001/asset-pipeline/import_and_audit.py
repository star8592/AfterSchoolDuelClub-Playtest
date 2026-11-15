"""Real UnrealEditor-Cmd native import of the project's character GLBs.
Never touches prior H3/UE games. Only its independent QA .uproject."""
import os, pathlib, hashlib, json, traceback, time
import unreal
base=pathlib.Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-unreal-native-character-test-20261115')
files=[
  ('MusicTeacher','/mnt/disk1/H3_Studio/game-toolchain/evidence/ara-m01-music-wardrobe-r153-20261115/M01-Maestro-Burgundy-Coat-STUDY.glb'),
  ('CafeteriaAunt','/mnt/disk1/H3_Studio/game-toolchain/evidence/m01-engine-eval-20261115/M02-CafeteriaAunt-StandardGLB-UNCOMPRESSED.glb')
]
report={'status':'STARTED','engine':str(unreal.SystemLibrary.get_engine_version()),'sources':[],'errors':[],'project':'ISOLATED_ASDC_CHARACTER_QA'}
try:
 for label,filename in files:
  fp=pathlib.Path(filename)
  start=time.monotonic()
  rec={'label':label,'source':str(fp),'source_sha256':hashlib.sha256(fp.read_bytes()).hexdigest(),'source_bytes':fp.stat().st_size}
  task=unreal.AssetImportTask()
  task.filename=str(fp)
  task.destination_path='/Game/ASDCCharacterQA/'+label
  task.destination_name=''
  task.automated=True
  task.replace_existing=False
  task.save=True
  unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
  rec['imported_paths']=[str(p) for p in task.imported_object_paths]
  audited=[]
  for ref in rec['imported_paths']:
   obj=unreal.EditorAssetLibrary.load_asset(ref)
   if obj is None:
    audited.append({'path':ref,'class':None,'missing':True})
    continue
   entry={'path':ref,'class':obj.get_class().get_name()}
   if isinstance(obj,unreal.SkeletalMesh):
    try:
     skel=obj.get_editor_property('skeleton')
     entry['skeleton_class']=skel.get_class().get_name() if skel else None
    except Exception as e:entry['skeleton_error']=str(e)
    try:
     entry['morph_target_count']=len(obj.get_morph_targets())
    except Exception as e:entry['morph_error']=str(e)
    try:
     entry['material_slots']=len(obj.get_editor_property('materials'))
    except Exception as e:entry['materials_error']=str(e)
   if isinstance(obj,unreal.AnimSequence):
    try: entry['length_seconds']=round(obj.get_play_length(),2)
    except Exception as e:entry['length_error']=str(e)
   audited.append(entry)
  rec['assets']=audited
  rec['native_skeletal_assets']=sum(x['class']=='SkeletalMesh' for x in audited)
  rec['native_animation_sequences']=sum(x['class']=='AnimSequence' for x in audited)
  rec['elapsed_seconds']=round(time.monotonic()-start,2)
  rec['source_unchanged']=hashlib.sha256(fp.read_bytes()).hexdigest()==rec['source_sha256']
  rec['result']='IMPORTED' if rec['imported_paths'] else 'NO_IMPORTED_OBJECTS'
  report['sources'].append(rec)
  unreal.log('ASDC_NATIVE_IMPORT_RESULT '+json.dumps(rec,ensure_ascii=False))
 report['status']='NATIVE_IMPORT_AUDITED'
except BaseException as e:
 report['status']='FAILED'
 report['errors'].append(str(e))
 report['traceback']=traceback.format_exc()
 unreal.log_error('ASDC_NATIVE_IMPORT_FATAL '+str(e))
finally:
 p=base/'unreal-character-import-report.json'
 p.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 unreal.log('ASDC_NATIVE_IMPORT_FINAL '+report['status'])
