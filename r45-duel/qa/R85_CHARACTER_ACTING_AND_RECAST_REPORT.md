# R85 · 游戏人物自然动作与五旧低模彻底退出运行版

日期：2026-11-12。工作区：`feature/duel-r85-character-action-recast-20261112`，R84 的独立增量分支，不直接覆盖主站。

## 这次实际解决的故障

1. **左右两位常驻出牌者**：旧代码只滚动肩膀，静态时的上臂仍向两侧平举，形成 T/A 字。现在在真实来源 VRM 上逐帧求解肩膀→肘→手腕两段 IK，持续使用自然待机手位；同时有看牌、抽牌、亮牌、出牌施法、受击闪躲、回位以及人物真实脸部 blendshape 眨眼和轻微体态变化。两侧各有错开的动作节奏，不再同步机械摆臂。
2. **五名已知 Gobkit 旧低模人物**：E03、E04、G02、G04、T03 已从正式可玩 R85 的 `scene/summon-models.mjs` 映射全部替换，并删除这五个旧 GLB 运行副本。旧版脚本 `assets/summons/build_runtime_assets.py` 改为显式历史/禁用状态，不能意外把旧货复活。历史审计文件仍保持可追溯，但不能当新版运行资产。
3. **另两名先前“高模但静态”的 G03/T04**：恢复官方原生 Blender 源，操纵真实作者的 IK 手腕控制器，将自然站姿、举手、攻击、受击四组 artist mesh 变形烘焙为 GLTF morph targets。攻击/受击动作由现有真实牌局事件触发，在 `scene/summon-presence.mjs` 中没有触碰伤害规则，也没有新造低模身体。
4. **形变首帧 bug**：新烘焙的 shape keys 默认是 1.0，导致开局全身形变同时启用，呈现奇怪的双手上举。修复为每个 morph 默认 0；所有 7 个新 GLB 文件已检查零默认权重。自然呼吸/待机时仅有极轻的 gesture morph。
5. **比例、落地与遮挡**：在 R85 动画模型预加载阶段使用 Three.js 精确的 `Box3.setFromObject(model,true)`，而非包含所有 morph 极限的过大保守包围盒。五名进入真体育馆的人物高度实测 2.081—2.086 个游戏世界单位，脚与地面的绝对间距 0—0.007；镜头朝向 frontDot=1。两队重新错开 X/Z 站位，五人可以同时看到，不会堆在一个位置。

## R85 当前实际运行模型

| 卡牌 | 真人美术替换来源 | 本地三角面 | 动作状态 | 美术最终身份 |
|---|---|---:|---|---|
| E03 加油队长 | Blender Studio Phil | 45,698 | 3 原生骨骼姿势 morph | 尚待服装及校园角色修改 |
| E04 食堂接力员 | Blender Studio Gabby | 32,613 | 同上 | 尚待食堂职业外观改造 |
| G02 黑板密码专家 | Blender Studio Lunte | 35,566 | 同上 | **机械形象与原作角色尚不匹配，需重点改** |
| G03 实验学长 | Blender Studio Jay | 70,676 | 同上 | 高精度美术方向已在 R80 建立 |
| G04 社团总监 | Blender Studio Victoria | 58,422 | 同上 | 尚待成熟总监服装及造型修改 |
| T03 默契收发员 | Blender Studio Ellie | 88,331 | 同上 | 尚待收发员/邮差制服改造 |
| T04 守门人 | Blender Studio Rex | 89,626 | 同上 | 高精度美术方向已在 R80 建立 |

`M01` 音乐老师仍为约3,777三角面但有真实角色动作，属于**仍需高质量换模**的剩余问题。E01/G01 原生 VRM、M02、T01/T02等其他卡牌未被此分支贸然替换；所有12种召唤模型仍可由游戏完整加载。**上表的已替换是“当前可玩模型与动效已更新”，绝不是“与原作最终匹配”的美术验收通过。**

## 代码与复现证据

- 可玩 R85：`http://127.0.0.1:11025/r45-duel/`
- 五名实际运行用 GLB、可按按钮切换动作并旋转的 WebGL 展厅：`http://127.0.0.1:11025/r45-duel/qa/r85-five-native-motion-gallery.html`
- 真人素材源及 GLB SHA256：`qa/evidence/r85/r85-source-provenance.json`（Blender Studio 原始 CC-BY 动画电影人物来源；正式用时保留署名）
- 真运行模型/三角数/当前真实路径：`qa/evidence/r85/r85-runtime-art-mesh-audit.json`
- 原生 Blender 5.2 动作烘焙器：`qa/r85-export-native-morphs.py`
- 真 WebGL 浏览器截图：`qa/evidence/r85/r85-five-recasts-real-stadium.png`、`qa/evidence/r85/r85-five-recasts-attack-in-real-stadium.png`
- 五角色动态候选浏览器截图：`qa/evidence/r85/r85-five-real-character-artist-idle.png` 和 attack.png
- 演员站台验收脚本：`qa/browser-r85-permanent-duelist-acting.mjs`
- 真实单位攻击、受击及回位验收脚本：`qa/browser-r85-native-artist-morph.mjs`
- 五名实际替换模型在同一场馆同时载入验收脚本：`qa/browser-r85-five-recasts-real-game.mjs`
- 五模型原作者动画 WebGL 展厅验收脚本：`qa/browser-r85-five-gallery.mjs`
- 已重跑 R81 真实伤害扣血/场馆实体座椅比分、R82 AI 无伤害法术、R84 默认有声/动态七首音乐/98条配音回归，所有对应浏览器 QA PASS、JS/HTTP errors 0。

## QA 通过数值
- 两名常驻站台人物四条上臂自然向下，落差方向余弦约 -0.908/-0.962/-0.895/-0.903；首次卡牌操作真实手腕移动0.314游戏单位；IK端点误差小于0.02。
- G03实际攻击 morph1.0；T04真实受击 morph约0.80。E03→G04模拟真实棋盘战斗事件同样可见攻击与受击动作，动作结束恢复待机。
- 五个角色在实际两队中同屏加载、朝向正确、脚落地；没有拿静态展厅截图冒充游戏实装。
- R81实伤害 E06 对手 HP20→17，座椅396，比分更新；R82 AI G05辅助技HP没有伪扣血；R84音频测试七首音乐、98条真人语音技术校验通过。

## 明确尚未完成
- 五名新模型视觉身份/发型/服饰没有与原作角色逐个一一对齐，Gabby/Lunte尤其不是最终食堂接力员或黑板专家。
- G03等新动画已能攻击与受击，但尚属简单有限动作，仍需逐人物增加跑步、互动、自然走动、面部语音联动和更精细权重渐变。
- M01等剩余视觉风格差异需要另行高质量换模。
- 需下一轮人工真 Web 主观审美评审+性能 profiling，才能合并生产发布。当前网页是本机环回试验地址，非公网。
