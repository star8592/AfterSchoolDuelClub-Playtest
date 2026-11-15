import unreal,json,pathlib,time,hashlib,traceback
root=pathlib.Path('/mnt/disk1/H3_Studio/ue5_projects/AfterSchoolDuelNative_R001/QA')
src=pathlib.Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-unreal-native-character-test-20261115/M02-CafeteriaAunt-24Bone-10Clip-MergedMesh-QA.glb')
report={'status':'PENDING','engine':str(unreal.SystemLibrary.get_engine_version()),
'source_sha256':hashlib.sha256(src.read_bytes()).hexdigest(),'source':str(src),'assets':[]}
try:
 task=unreal.AssetImportTask()
 task.filename=str(src)
 task.destination_path='/Game/ASDCNativeMerged/M02'
 task.automated=True
 task.replace_existing=False
 task.save=True
 start=time.monotonic()
 unreal.AssetToolsHelpers.get_asset_tools().import_asset_tasks([task])
 report['elapsed_s']=round(time.monotonic()-start,2)
 for path in task.imported_object_paths:
  obj=unreal.EditorAssetLibrary.load_asset(str(path))
  if not obj:continue
  x={'path':str(path),'class':obj.get_class().get_name()}
  if isinstance(obj,unreal.SkeletalMesh):
   x['morph_targets']=len(obj.get_all_morph_target_names())
   x['material_slots']=len(obj.get_editor_property('materials'))
  if isinstance(obj,unreal.AnimSequence):
   x['seconds']=round(obj.get_play_length(),3)
  report['assets'].append(x)
 counts={k:sum(a['class']==k for a in report['assets']) for k in ['SkeletalMesh','Skeleton','AnimSequence','PhysicsAsset']}
 report['counts']=counts
 report['status']='PASS' if counts['SkeletalMesh']==1 and counts['AnimSequence']==10 and counts['Skeleton']==1 else 'REVIEW_REQUIRED'
except BaseException as e:
 report['status']='FAILED';report['error']=str(e);report['traceback']=traceback.format_exc()
(root/'m02-merged-unreal-import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
unreal.log('ASDC_M02_SINGLE_MESH_IMPORT '+json.dumps({'status':report['status'],'counts':report.get('counts'),'elapsed_s':report.get('elapsed_s'),'error':report.get('error')},ensure_ascii=False))
