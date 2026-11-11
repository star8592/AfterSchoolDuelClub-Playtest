"""Read-only, source-grounded GLB/VRM tri/rig count and R73 art priority.
Never generates placeholder geometry or marks a character as art approved.
"""
from pathlib import Path
import json,struct,hashlib
root=Path(__file__).resolve().parents[1]
cards=json.loads((root/'assets/characters/CAST_MANIFEST.json').read_text())['unitCards']
registry={x['card_id']:x for x in json.loads((root/'assets/summons/runtime-assets.json').read_text())['models']}
out=Path(__file__).resolve().parent/'evidence/r76';out.mkdir(parents=True,exist_ok=True)
issues={
'E01':('P1','角色已有高面数 VRM，但发型、自然待机与独立脸型需和原画对齐','Blender 骨骼 IK、脸部形态键、发型服装统一'),
'E02':('P2','纸飞机比例已修，但折痕、材质边缘及飞行动画仍可深化','沿原始折纸模型精修贴图/法线，真实摄像机尺寸 QA'),
'E03':('P0','学生队长目前是普通学生底模，身份和姿态仍不够','先匹配清晰的队长原画与授权高品质学生模型，再做队长装束与双手 Pose'),
'E04':('P1','配送员底模不是独特的食堂接力冠军','食堂围裙、餐盘、运动鞋和奔跑/递餐动画绑定'),
'G01':('P1','VRM 人物骨架已有，橡皮筋建筑师的专属身份仍弱','原创配饰、材质与自然手势，补实体橡皮筋道具'),
'G02':('P0','工程师通用底模与学校黑板密码专家不一致','匹配校园人物底模+黑板/粉笔道具，高质量骨骼动作'),
'G03':('P1','医生服装不像校园实验学长','科研学生外套、眼镜、手部握试管与自然待机'),
'G04':('P1','办公室经理不是独立的社团计划总监','调整人物轮廓、服装和标志性讲解姿势'),
'M01':('P1','音乐老师已可正式出牌但源模型手指较粗、角色造型待统一','在已有 Polyfork Blender 母版上改音符道具和细腻手指，不破坏 M01 IK'),
'M02':('P1','食堂阿姨已采用 31k 原生高模、10 动画，但服装色彩和面部与原作尚未同机位比对','先核对《学渣决斗者》食堂阿姨原作，再决定保留原始高模或换另一套授权基板'),
'T01':('P1','已完成 Blender R73 耳机、麦克风与广播徽章，视觉质量待最终审批','下一轮依据原画统一材质与声音-口型、适当丰富侧面剪影'),
'T02':('P1','高面数活菜单虽可玩，但形象混乱且缺拟人身份','先出清晰的角色原画，使用原始真实高模重新建出完整一体化造型'),
'T03':('P0','送货骑手底模只代表单人，缺少“默契收发员”的成对故事','改双人/双角色协作动作及真正可辨认的邮差道具'),
'T04':('P2','保安形象可辨认但动作单调，低精度外套较平','Blender 服装 PBR 与自然守门/敬礼循环')
}
def inspect(path):
 b=path.read_bytes()
 assert b[:4]==b'glTF',path
 total,chunklen,ctype=struct.unpack_from('<III',b,8)
 assert total<=len(b) and ctype==0x4E4F534A
 j=json.loads(b[20:20+chunklen].decode('utf8').strip())
 a=j.get('accessors',[]);tri=0;badmode=0
 for m in j.get('meshes',[]):
  for p in m.get('primitives',[]):
   mode=p.get('mode',4)
   if mode!=4:badmode+=1;continue
   if 'indices' in p:tri+=a[p['indices']]['count']//3
   elif 'POSITION' in p.get('attributes',{}):tri+=a[p['attributes']['POSITION']]['count']//3
 return {'triangles':tri,'meshes':len(j.get('meshes',[])),
 'materials':len(j.get('materials',[])),'textures':len(j.get('textures',[])),
 'skins':len(j.get('skins',[])),'animations':[e.get('name','') for e in j.get('animations',[])],
 'unsupported_primitives':badmode,'file_size':len(b),'sha256':hashlib.sha256(b).hexdigest()}
rows=[]
for c in cards:
 id=c['id'];reg=registry.get(id)
 if reg:path=root/'assets/summons'/reg['file'];lic=reg['license']
 else:path=root/c['source'];lic='CC0 source VRM — check original source attribution'
 data=inspect(path)
 priority,risk,next_step=issues[id]
 rows.append({'card':id,'name':c['name'],'source_file':str(path.relative_to(root)),
 'priority':priority,'risk':risk,'blender_next_step':next_step,
 'license':lic,'approved_final_art':False,**data})
assert len(rows)>=14 and sum(x['skins']>0 for x in rows)>=10
(out/'cast-art-inventory.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
md=[f'# R76 · {len(rows)} 个角色的实际模型品质账本','',
 '以下数据直接读取仓库中的 GLB/VRM 二进制头与 glTF 资源字段，不把候选目录数量当成模型数量，也不以面数直接证明美术品质。','',
 '| 卡牌 | 三角面 | 蒙皮 | 动画 | 材质 | 艺术优先级 |','|---|---:|---:|---:|---:|---|']
for x in rows:md.append(f"| {x['card']} {x['name']} | {x['triangles']:,} | {x['skins']} | {len(x['animations'])} | {x['materials']} | {x['priority']} |")
md.extend(['','## 严重错配优先解决',''])
for x in sorted(rows,key=lambda y:(y['priority'],y['card'])):
 md.extend([f"- **{x['card']} · {x['name']}**：{x['risk']}。后续：{x['blender_next_step']}。"])
md.extend(['','## 流水线硬规则','','1. 每个正式角色先锁原画或三视图，再匹配授权底模；模型库和插件只作为工具，不代替选角审美。','2. Blender 保留 `.blend` 源工程、授权、原始 GLB SHA256、骨骼/贴图/权重/姿态/动作报告；不要用自动细分冒充有意义的高精度。','3. 输出 GLB 后必须运行 0/45/90/180°、双方朝向、重复召唤、自然手部、脚底接地、真实 GPU 游戏和人物语音联动。','4. 任何 `art_approved=false` 的候选可用于研发，但不标成最终商业美术。','5. 已确认 Blender 扩展包中 Mat-Baker、PlaceHelper 在隔离环境可启动；Sapling/UV Texel Density 仍需修复兼容，绝不假装所有插件均生产就绪。','6. 自然山体/岩壁不是本游戏角色生产任务，禁止从其他游戏中复用程序化山体作为真实艺术地貌。',''])
(out/'cast-art-review.md').write_text('\n'.join(md))
print('R76_CAST_ART_INVENTORY',json.dumps({'cards':len(rows),'p0':[x['card'] for x in rows if x['priority']=='P0'],'p1':[x['card'] for x in rows if x['priority']=='P1'],'total_triangles':sum(x['triangles'] for x in rows),'final_approved':0},ensure_ascii=False))
