# R132：六名高精真实蒙皮人物自然站姿与动作精修

基线 main 1adcadc（R131），2026-11-14。保留一个正式游戏入口和默认 R97 高精角色。新模型仅供明确开启的研究参数使用，未经逐帧美术终审不得默认替换。

## 根因与真正修复

R119 原作者真实骨骼的技术通过不能保证 T 手、关节力学及双脚落地自然。六份原作者 Blender Studio 角色 .blend 均经 Blender 5.2.3 --disable-autoexec 在 Z890 隔离内存副本中核验。E03、G02、G03、G04、T04 使用 FK-UpperArm.L/R，Rain T03 使用 FK-Upperarm.L/R，并有十条活跃 IK 约束覆盖 FK 控件。此次针对 Rain 先停用该十条控制器上的 IK 覆盖，否则先前 FK 烘焙时雨的手臂完全没有变化。

Ellie、Rex 的原作者 Mirror/其他拓扑修改器在直接评估网格时改变顶点数；本轮只在姿态采样时暂时关闭产生新顶点的修改器，完成源骨骼 Pose as Rest Pose 和源网格 Basis 同步烘焙后再恢复原作者修改器。保留原来源顶点组、形态键、皮肤权重、材质和作者面部细节，绝不编辑或覆盖作者 .blend 文件。

## 真实源数据（原 GLB 局部单位）

| 来源 | 旧 R119 原主体横向跨度 | 新 R132 自然绑姿跨度 | 正式 R97 参考跨度 | 可见来源蒙皮网格 | 关节 |
|---|---:|---:|---:|---:|---:|
| E03 Ellie | 1.00223 | 0.48221 | 0.27992 | 28 | 329 |
| G02 Snow | 1.78740 | 0.54852 | 0.54852 | 13 | 293 |
| G03 Jay | 0.91223 | 0.21919 | 0.21919 | 16 | 295 |
| G04 Victoria | 1.19103 | 0.54957 | 0.39717 | 18 | 311 |
| T03 Rain | 1.39655 | 0.35268 | 0.35268 | 18 | 392 |
| T04 Rex | 1.84313 | 0.74376 | 0.99858 | 21 | 299 |

这些跨度是每个角色同名来源身体网格在原模型坐标系中的 X 尺寸，不是实际人物尺寸。六人的原始 mesh 顶点数与新 GLB 对应网格的顶点数完全一致，都有真实 JOINTS_0/WEIGHTS_0 和来源骨骼链。Snow、Jay、Rain 与 R97 对应部位横向跨度一致；Ellie、Victoria 与 R97 还有差距；Rex 的新跨度反而小于 R97，需检查过度内扣，不能宣称全部美术合格。详细自动证据在 r45-duel/qa/evidence/r132/r132-six-source-rest-audit.json。

Snow 原始 Blender GLB 约 92.3 MB，贴图压缩后 11.8 MB（815 个原始非图片 bufferView 保持完全不变）；Rain 最终原始 GLB 70.3 MB，压缩到 18.55 MB（858 个非图片 bufferView 保持不变）。两份原作者模型在 Blender 导出完成并写出 GLB 和 proof.json 之后，进程退出时曾出现 SIGSEGV，不能称为 Blender 进程正常退出；我们另行核验了完整 GLB、SHA-256、真实蒙皮数据、图片压缩证明和浏览器载入。

## 真实 Chrome 检查

六名角色都通过近景待机、攻击、受击、庆祝、恢复待机流程；验证了来源肩、肘、腕、指骨父子链和受权重源网格实际运动、对手方向、原鞋关节、截图以及请求与 JS 无异常。

- Desktop 1440px：66/66 通过。
- Portrait 430px：66/66 通过。
- 首轮默认版本隔离四场景通过：普通默认=正式 R97；仅带 r132BakedRest=on 而无 qa=1 仍 R97；仅带 r119Rig=all 时仍旧 R119；qa=1 + r119Rig=all + r132BakedRest=on 才是六份 R132 本轮研究资产。
- 正式规则、主角表情、语音、魔法、食堂阿姨 M02 都沿用原主线，不新增正式入口。

仍存在真实视觉问题，不能将 132 项技术通过当成美术签收：G03 的 jay_shoes_base 在受击采样最低约 -0.047 原场景单位，T04 的 rex_shoes 在攻击时约 -0.031；E03 的 ellie_boots 攻击最低约 -0.033。独立从真实 SkinnedMesh 取得最低网格而非仅从整体角色外框猜测，证据见 r45-duel/qa/evidence/r132/r132-ground-owner-report.json。应开展逐人鞋底接地、脚踝抵消/落地缓冲及衣服穿插复核，不应为消除红字而直接抬高整个人物造成双脚悬空。

## 上线隔离及原始授权

新资产是主线上的受控研究功能，不是另一套部署。开启需显式添加 qa=1&r119Rig=all&r132BakedRest=on；新增自然源动作研究可再加 r128Body=on&r129Body=on&r130Body=on&r131Arms=on。R131 E04 原生已验证样板独立保留，其他角色及默认继续使用 R97。qa=1 是浏览器研究模式参数，不是访问授权控制。

Blender Foundation / Blender Studio 的 Ellie、Snow、Jay、Victoria、Rain、Rex 均按 CC BY 4.0 使用。人物与改编来源、许可 URL 和用户可见署名已在 r45-duel/index.html 的角色素材鸣谢及 credits.html 展示。本轮具体改编：原作者 FK 自然站姿和绑姿烘焙、原关节父子链补连、素材压缩和自制动作曲线。

## 复验路径

- r45-duel/qa/r132-batch-preflight.py、r132-source-rig-preflight.py：来源 Blender 骨骼、FK/IK 逐人审计；
- r45-duel/qa/r132-export-baked-rest-skin.py、r132-batch-bake.py：源姿态导出和输出记录；
- r45-duel/qa/r132-source-pose-audit.py：源网格数量、顶点数、绑姿跨度、蒙皮和纹理数据独立审计；
- r45-duel/qa/browser-r132-six-source-acting.mjs：1440px 与 430px 真 GPU Chrome 近景完整动作；
- r45-duel/qa/browser-r132-ground-ownership.mjs：真实穿地网格来源检查；
- r45-duel/qa/browser-r132-rollout-isolation.mjs：四场景默认版本、旧试验与 R132 新试验的隔离回归。

正式默认切换尚无美术批准，不能改变主站默认 R97。
