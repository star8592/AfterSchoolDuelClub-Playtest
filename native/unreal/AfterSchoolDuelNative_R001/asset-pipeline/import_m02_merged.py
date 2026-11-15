import json,time,pathlib,traceback
import unreal
proj=pathlib.Path('/mnt/disk1/H3_Studio/ue5_projects/AfterSchoolDuelNative_R001')
src=pathlib.Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-unreal-native-character-test-20261115/M02-CafeteriaAunt-ONE-SKIN-ALL-DETAILS.glb')
record={'source':str(src),'status':'START','assets':[]}
try:
 task=unreal.AssetImportTask()
 task.filename=str(src)
 task.destination_path='/Game/ASDCNativeMerged/M02'
 task.automated=True;task.replace_existing=False;task.save=True
 start=time.monotonic()
 unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
 for path in task.imported_object_paths:
  obj=unreal.EditorAssetLibrary.load_asset(str(path))
  item={'path':str(path),'class':obj.get_class().get_name() if obj else None}
  if isinstance(obj,unreal.SkeletalMesh):
   item['material_slots']=len(obj.get_editor_property('materials'))
   try: item['morphs']=len(obj.get_all_morph_target_names())
   except Exception:pass
  if isinstance(obj,unreal.AnimSequence):
   item['duration']=round(obj.get_play_length(),3)
  record['assets'].append(item)
 record['elapsed_s']=round(time.monotonic()-start,2)
 record['skeletal_meshes']=sum(a['class']=='SkeletalMesh' for a in record['assets'])
 record['animations']=sum(a['class']=='AnimSequence' for a in record['assets'])
 record['status']='PASS' if record['skeletal_meshes']==1 and record['animations']==10 else 'FAILED_COUNTS'
except BaseException as e:
 record['status']='ERROR';record['error']=str(e);record['traceback']=traceback.format_exc()
(proj/'QA/import_m02_merged_report.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
unreal.log('ASDC_M02_MERGED_IMPORT_RESULT '+json.dumps({k:v for k,v in record.items() if k!='assets'},ensure_ascii=False))
