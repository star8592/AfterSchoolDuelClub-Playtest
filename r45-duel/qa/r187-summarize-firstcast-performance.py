"""R187 independently recorded real Chrome first-use GPU performance receipts."""
import json,hashlib,shutil
from pathlib import Path
root=Path(__file__).resolve().parents[1]
src=Path('/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r187-interleaved-firstcast')
out=root/'qa/evidence/r187-perf'
raw=out/'raw-browser';raw.mkdir(parents=True,exist_ok=True)
rows=[]
for folder in sorted(src.iterdir()):
 if not folder.is_dir():continue
 a=list(folder.glob('r173-*-batched-cpu*.json'))
 if len(a)!=1:continue
 j=json.loads(a[0].read_text())
 assert j['pass'] and not j['errors'],folder.name
 assert j['initial']['models']==16 and j['initial']['cards']==60
 assert j['initial']['soundPatterns']==46
 assert j['passTwo']['stage']['played']==93 and j['passTwo']['stage']['uniqueRenderedProps']==46
 dst=raw/(folder.name+'.json');shutil.copy2(a[0],dst)
 rows.append({'case':folder.name,'view':j['view'],'cpu':j['cpu'],
 'pair':folder.name.split('-hairON')[0],'magic':j['initial']['selectedNewHero']['id'],
 'owlFile':j['initial'].get('owlRuntimeSource') or ('T01-Owl-Innerscene-R84.glb' if j['initial']['bytes']==75569762 else None),
 'prime':j['initial']['r187InterleaveReceipt'].get('mode','off'),
 'serialWarm':bool(j['initial']['primeTwo']),
 'startupMs':j['initial']['startupMs'],
 'firstRafMaxMs':j['cold']['max'],
 'firstLongTaskMaxMs':j['cold']['longTaskMax'],
 'firstShaderDelta':j['cold']['shaderDelta'],
 'downloadedSourceBytes':j['initial']['bytes'],'events':93,
 'pass':True,'rawReceipt':'qa/evidence/r187-perf/raw-browser/'+dst.name})
assert len(rows)>=22,len(rows)
def pick(card='P01',view='desktop',edge='off',mode='off',serial=False,pair='T01-E03'):
 return next((r for r in rows if r['magic']==card and r['view']==view and
  r['pair']==pair and r['prime']==mode and r['serialWarm']==serial and
  r['owlFile']==('T01-Owl-Innerscene-R84.glb' if edge=='off' else
  'T01-Owl-Innerscene-R187-'+edge+'.glb')),None)
a=pick();b=pick(edge='1024');c=pick(edge='512')
m=pick(view='mobile');n=pick(view='mobile',edge='512')
assert all([a,b,c,m,n])
assert a['firstLongTaskMaxMs']>300 and c['firstLongTaskMaxMs']<=60
assert c['startupMs']<a['startupMs']
assert n['firstRafMaxMs']<m['firstRafMaxMs']
prov=json.loads((out/'r187-owl-texture-budget-provenance.json').read_text())
base=(root/'assets/summons/T01-Owl-Innerscene-R84.glb').read_bytes()
assert hashlib.sha256(base).hexdigest()==prov['originalSha256']
for edge in ('1024','512'):
 x=prov['variants'][edge]
 dat=(root/'assets/summons'/x['file']).read_bytes()
 assert hashlib.sha256(dat).hexdigest()==x['sha256']
 assert x['geometryAnimBufferViewsByteForByteEqual']
report={'round':'R187','qaOnly':True,'release':'NO_GO',
 'original3DGeometryAndVRMCharactersPreserved':True,
 'sourceOriginalSha256':prov['originalSha256'],
 'oldOwlSourceBytes':len(base),
 'optimized512OwlSourceBytes':prov['variants']['512']['bytes'],
 'potentialOriginalUncompressedRgbaMiB':192,
 'potential512UncompressedRgbaMiB':12,
 'realChromeFullCombatRuns':len(rows),
 'realChromeTotalSpells':len(rows)*93,
 'keyComparison':{'originalDesktop':a,'texture1024Desktop':b,'texture512Desktop':c,
  'originalMobileViewport':m,'texture512MobileViewport':n,
  'actorsInterleaved':pick(mode='actors'),
  'heroInterleaved':pick(mode='hero'),
  'compileAsyncOnly':pick(mode='compile'),
  'oldSerialPrewarm':pick(serial=True)},
 'limitations':['Single sample per condition, not randomized','Mobile viewport has desktop RTX GPU not Android',
  'Source 512 texture variant has not passed cinematic closeup review',
  'Actual allocated GPU VRAM not directly measured','M02/G04 can still have 119ms longtasks',
  'Only QA flags; not merged or shipped'], 'runs':rows}
(out/'r187-performance-actual-ab-summary.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
doc=['# R187｜卡顿优先：真实GPU瓶颈和纹理资源优化','',
 '2026-11-19，Z890 RTX5070Ti、Chrome Vulkan WebGL2。仅QA、尚未发布。',
 '',
 '## 实测找出的原因','',
 '首次出场时加载猫头鹰T01，实际含12张2048×2048的WebP贴图。未压缩RGBA8理论像素量约192MiB；并不等于实际GPU VRAM。原始GLB 12,317,072B。确切源资产、动画、Meshopt压缩几何、骨骼、材质UV均原封不动。',
 '',
 '## 真正Chrome同一角色对照 (1280×720 CPU×2)','',
 '| 模式 | 首次可玩ms | 第一次出牌最大rAF间隔ms | 观测最长LongTask ms |',
 '|---|---:|---:|---:|']
series=[('2048原始无预热',a),('1024贴图',b),('512贴图',c),
 ('只编译shader',pick(mode='compile')),
 ('只预热校园道具',pick(mode='hero')),
 ('只预热两个真实角色',pick(mode='actors')),
 ('旧版两位角色加新模型串行预热',pick(serial=True))]
for title,row in series:
 if row:doc.append('| %s | %s | %s | %s |'%(title,row['startupMs'],
   row['firstRafMaxMs'],row['firstLongTaskMaxMs']))
doc+=['','1024贴图将本组343ms左右LongTask降到94–98ms；512贴图将其降到50–52ms，且首次可玩也缩短。原来靠额外预热，会把卡顿转移到加载阶段；512贴图直接减少GPU上传量。',
 '',
 '## 移动视口模拟，非Android真机','',
 '| 条件 | 首次可玩ms | 最大rAF帧间隔ms |','|---|---:|---:|',
 '| 原始2048px | %s | %s |'%(m['startupMs'],m['firstRafMaxMs']),
 '| 512px | %s | %s |'%(n['startupMs'],n['firstRafMaxMs']),
 '',
 '设备仍然是Z890 RTX显卡，CPU×4，只模拟移动端430×900，不能宣称三星Android通过。尽管从583.3ms降为133.2ms，这个长帧仍需继续优化。',
 '',
 '## GPU模型库存与视觉证据',
 '',
 '12种召唤模型中，T01的原始RGBA8像素预算192MiB最高，G02是45MiB，T03为27MiB；其余较小。实测G02/T03组合并没有观测到首次长任务，因此不批量无差别压缩全部模型。详细文件 r187-12-original-summons-texture-budget.json。',
 '',
 '真实Chrome WebGL体育馆原始截图三分辨率并排放在 r187-owl-three-actual-chrome-stadium-frames.jpg，日常对战距离下没有明显视觉退化，但不代表特写验收。',
 '',
 '1024源GLB约5.51MB，512源GLB约2.53MB；源2048约12.32MB。源GLB SHA256未变，几何/动画原始Meshopt bufferViews逐字节对照一致，只有WebP贴图重采样。所有源码可重新生成。',
 '',
 '## 严格发布边界','',
 '只有明确qa=1且r187OwlTex=512或1024时才使用实验素材；正式R147和GitHub main不动。另有r187Interleave=actors、hero、compile用于隔离研究，默认全部关闭。48小时内不添加新角色高精模型、不提升贴图分辨率。',
 '',
 '本轮真实Chrome完整93张法术每组皆PASS，原16人物、60卡、46魔法身份保持完整。原始逐组真实Chrome测试和截图均已归档。此前S21低内存崩溃尚未重测、真Android断联，本次保持NO_GO。M02/G04还有119ms长任务，下一轮继续排查。']
(root/'docs/R187_FIRSTCAST_PERFORMANCE_TEXTURE_BUDGET_20261119.md').write_text('\n'.join(doc))
print('R187_REAL_A_B_SUMMARY',len(rows),'full 93cast browser runs',len(rows)*93,'events',
      'cold',a['firstLongTaskMaxMs'],'512',c['firstLongTaskMaxMs'],
      'mobileRAF',m['firstRafMaxMs'],'to',n['firstRafMaxMs'])
