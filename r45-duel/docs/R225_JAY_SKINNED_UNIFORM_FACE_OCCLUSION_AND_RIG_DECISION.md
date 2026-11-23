# R225｜Jay 校园服装与出牌卡牌防遮脸：真实骨骼模型、Chrome 对照和后续重建裁决

2026-11-23；隔离候选沿用 R224（`927ea77`）。**本轮实际修改在 `r45-duel/qa/r220-character-audition/` 内完成，不接入生产竞技场、不修改 `main` 或已正式发布的R198**。保留R224原图作为前后视觉依据。

## 1. 与财富小镇 / 丹道的成熟流水线复用情况

从财富小镇 `/mnt/disk2/projects/WealthTown3D/web-v10-optimized/assets/teen_desktop.glb` 导入真实24骨架男孩，继续使用R224已经验证的11组NLA动画和脚部稳定方案。借鉴丹道 `art-lab/w49/scripts/build_hanfu_v04.py` 中的**服装网格单独创建→近邻原模型权重转移→同骨架变形**流程；在Blender 5.2.3中完成：

- 原精致单网格的服装三角面重分配材料（头、手、腿的皮肤材质不改），海军蓝上衣、米白袖片、酒红校园饰边。
- 9份真实可编辑、可随原24骨骼变形的校服细节：校服门襟、领口、下摆、领带和校徽等；为了控制DrawCalls，实际导出前**合并成一个带四种材质的蒙皮附件网格**（341额外顶点，四个glTF primitive）；没有把静态衣服贴到screen HUD上，也没额外套T字型人物。
- 新生成的四张256×256细布纹贴图，原创本地像素生成（`generate_jay_r225_weave.py`）；新GLB整体 **5,413,268字节**，基线R224 **5,194,764字节**，增量 **218,504字节**（约4.2%）。
- 源文件 `author_jay_v06_school.py`、`style_jay_r225.py`、`source/jay-teen-duel-v06-school.blend`；导出 `assets/jay-teen-duel-v06-school.glb`。

**实际踩到的跨工程错误**：财富小镇的 `Armature` 原始对象缩放是0.01（源网格以厘米建模，glTF以米保存）。如果直接照搬丹道W49的 `matrix_parent_inverse=arm.matrix_world.inverted()`，会将新配饰放大100倍，Chrome Scene包围盒把人物压缩成小点。已修正为**使用与源蒙皮网格一致的父级变换和单位缩放**，且所有导出primitive米制坐标在合理范围内；不再忽略原人物的坐标空间。领口另一问题也已排除：直接用原Mesh的外侧/朝前表面，避免饰边从胸前穿过人物背后。

## 2. 原始 Chrome 实机视觉证据

- [R224 vs R225：同机位真实Chrome五动作校服前后对照](../qa/r220-character-audition/evidence/r225-jay-campus-outfit-r224-before-after-5-actions.jpg)
- [10.44秒 R225 真实Chrome/WebGL人物完整动作录像](../qa/r220-character-audition/evidence/r225-jay-campus-uniform-five-actions-real-chrome.mp4)
- [R224→R225 出牌卡牌遮脸缺陷、两个时刻正面截图](../qa/r220-character-audition/evidence/r225-jay-face-occlusion-r224-vs-r225-real-chrome.jpg)
- [镜头实际逐时刻屏幕像素和3D坐标](../qa/r220-character-audition/evidence/r225-card-face/r225-card-face-occlusion-real-chrome-ab.json)
- [R225源GLB与Chrome截图完整自动审计](../qa/r220-character-audition/evidence/r225-model-browser-visual-integrity.json)

### 出牌卡牌不挡脸：实机像素测量

先前 R224 错误是卡牌从右手释放后，沿着人物中心线前进，随着视距拉近，屏幕上会遮挡脸部。R225保持右手释放点、适度向人物身体外侧前方飞行，而不是将卡牌追踪到头部中心。在1600×900 Chrome实机正面镜头：

| 时刻 | R224卡中心到头中心距离 | R225距离 |
|---|---:|---:|
| 0.79秒 | 49.3px | 66.4px |
| 0.90秒 | **15.9px（严重遮脸）** | **85.9px** |
| 1.03秒 | 35.4px | **152.1px** |
| 1.17秒 | 125px | 260.3px |

四帧均来自真正GLB和Chrome WebGL画面，展示截图和原始坐标同存。**不意味着可以从任意玩家视角保证无遮挡**：这里只验证了现有的正面试验镜头，正式竞技场需要另做镜头、对手反应及卡牌命中点检查。

## 3. 可验证的技术状态

`diagnostics/r225-verify-real-outfit-browser.py` 完整PASS，明确检查：

- R225仍是一套**24关节原骨架、11个原有动画**，所有SkinnedMesh primitive仍含真实 `JOINTS_0/WEIGHTS_0`；
- 全部服装附件几何已经标准化为**合理米制GLB包围盒**，不再有100倍错误单位；
- R224原骨骼动作与R225抽牌、甩牌、受击、胜利的手腕前向/脚位差距小于12mm（同相位采样，没篡改底层动画解决贴图）；
- 正面、侧面各五个动作（**10张非空Chrome真实截图**），HTTP/JS错误0；
- 卡牌遮脸实机四时刻对照通过；
- 10.44秒实际连续视频和两组前后AB图经过文件/非空像素审计；
- 模型额外素材开销218KB，合并前试验场攻击帧约24 DrawCalls，合并后约19；此前R224同机位约12。**单角色额外DrawCalls还未达到大规模复用门槛，不能宣称整局游戏性能PASS**。

重复运行：
```bash
python3 r45-duel/qa/r220-character-audition/generate_jay_r225_weave.py
blender -b -t 8 --python r45-duel/qa/r220-character-audition/author_jay_v06_school.py
python3 r45-duel/qa/r220-character-audition/diagnostics/r225-verify-real-outfit-browser.py
```

局域网试玩：`http://10.10.10.138:18720/r45-duel/qa/r220-character-audition/?focus=jay&revision=r225&camera=profile`，与R224及更早模型可切换。注意该Viewer依赖Z890本地链接的财富小镇/丹道源模型，公共GitHub提供**已经生成的R225模型及真实截图/录像**，不能声称公开网页能完全脱离私有源资产独立部署。

## 4. 必须停止的错误前提与下一步核心问题

源结构实审 `diagnostics/r225-finger-rig-feasibility.py`：

| 角色原始模型 | skin joints | 其中指骨关联节点 | 内置原生骨骼动画 |
|---|---:|---:|---|
| 财富小镇男孩→R225新Jay | 24 | **0** | 11组，每组24骨骼旋转 |
| 旧R97高精Jay | 1605 | **220个手指相关关节条目** | **0**；内置Idle/Attack/Hit只有Morph weights |

**重要结论**：目前R225校服男孩不具备独立的五指抓牌/张指松牌能力，当前持牌只是卡牌道具在右手骨骼附近运动，不是手指抓握。老Jay真实高精Rig虽然有完整手指结构，但1605个joint直接用于浏览器实时动画带来明显资源/兼容性风险；不能用“全套骨骼已经存在”直接上线。可行的下一轮是：在Blender中从老Jay高精模型抽取/烘焙**最小全身+双手指骨架**（需真实验证骨架、mesh材质和方向），离线重定位与动作清理，保留脸部必要形态键，单角色逐段录像和FPS验收；若无法保留高精原造型则拒绝方案。此目标**本轮未实现**，禁止假称已经做到手指动画。

## 5. 实际视觉结论：技术可用，正式艺术仍未通过

当前R225角色从蓝T恤改成了海军蓝／米白／酒红的校园服装，有随骨骼移动的装饰部件，整体比R224更完整，但与旧Jay的造型精致度、标志性帽子、人物个性化表演相比**仍然不足**；一部分手腕/手掌姿势仍明显不自然。**维持Draft/NO-GO，不替换正式Jay。** 这个试验验证了跨项目服装、单位变换、身体动作与道具遮挡的可复用管线，并提供可见真实证据，不把下一步关键任务偷换为“动画骨骼测试通过”。
