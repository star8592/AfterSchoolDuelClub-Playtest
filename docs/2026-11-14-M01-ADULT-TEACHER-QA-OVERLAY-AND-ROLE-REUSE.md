# M01 成年教师形象复用：独立游戏试验记录（2026-11-14）

前置决策：用户认可 Ara 一批人物具有成年人特征，适合改为老师、教职工、其他成年角色。停止把这批有价值的模型硬修成学生，也不继续把 329+ 原始复杂 DEF 骨逐根调整。游戏本体仍以**高品质动画电影风、自然动作与完整材质**为标准；现有 M02 食堂阿姨继续保留并作为表演对照。

## 明确身份（不要混用）

- `M01`：游戏早已存在的「音乐老师」角色，现有旧文件 `M01-MusicTeacher-PolyforkSchoolTeacher.glb`，10 skins/310 joint references、3 clips、1 material、0 images；原 R126 专属动作系统还使用旧骨名。此项成人替换优先。
- `School-Club-Mentor`：本轮提出的「社团指导老师」男性候选，**目前游戏里没有正式独立卡牌/角色 ID**；只是研究资产，不可把 T04 Rex（现有「活动室守门人」）误写成新成年导师身份。
- `M02`：现有食堂阿姨保留；不要误认为她与新角色共用一个最终授权完毕的包。

## 已完成的真实资产与演出

Z890 的 Ara 3D Gen 隔离工作区重新生成：
- `M01-MusicTeacher-Adult-Ara-STUDY.glb`（35 岁女教师、浅色上衣＋蓝裙，12,032,848 bytes、110,316 tris、69 bones、15 materials、15 images）。
- `School-Club-Mentor-Adult-Ara-STUDY.glb`（43 岁男性指导教师、完整深色西装，13,812,224 bytes、149,466 tris、69 bones、18 materials、14 images）。

二者各有九段内嵌动画：Idle / Walk / Run / Talk / Wave / Cheer / Laugh / Hit reaction / Punch。真实 GLB 结构检验无异常，Chrome/Playwright 的九项网页播放检查全部通过、八张动作截图已生成，JS/HTTP 错误 0。真人看过 Idle/ Talk/ Wave 截图，成人职业外观比错误学生制服版本完整、符合教师方向；夸张音乐指挥/人格演出仍待验证。

## 完整游戏 M01 替换实验：是 QA overlay，不是正式代码替换

为保护 R133 并发开发工作区里的 37 项未提交修改，使用**隔离本地 HTTP overlay** 仅在 URL `?qa=1&m01Adult=on` 下将网络返回的 `scene/summon-models.mjs` 和 M01 实验 GLB 切换；源文件与原 M01 模型没动，原 M01 GLB SHA256 仍为 `cb4b14e7f4a5e0b11e24f178bd2a0fe3b401bf9c9869bc9a5b0b1e415dbc86c3`。

覆盖层在该特殊 QA 场景里：
- M01 使用新 GLB 的内嵌动画，绕开不相容的旧 R126 骨驱动；
- 语义将 idle→Idle, walk→Walk, attack→Punch, hit→Hit reaction, celebrate→Cheer，R126 演出类动作在 QA 中做安全映射；
- 原游戏的 12 模型加载、召唤系统、角色占位、卡牌/生命值规则及其他人物均维持原样。

2026-11-14 通过 Z890 **真实场景 QA 5/5**：
1. 游戏 HTTP 200。
2. 完整场景 12 模型加载完成。
3. 真正召唤 M01，GLB 元数据可见 2 SkinnedMesh/15 Mesh/9 Clips，正在播放 `Idle`，面敌 `frontDot=1.0`，实测高度 2.091 个游戏单位。
4. 真实 K01 卡牌出牌后敌方生命值 20→19，旧规则未受模型替换影响。
5. 无页面 JS 错误和本机 HTTP 错误。

**局限**：实际战斗后模型可能从队列移走；晚于出牌后的采样不能证明 M01 的 Punch 动画瞬间已经触发。独立模型预览已真实播放 Punch，但游戏内 Punch 仍列为 **PENDING**。第一轮 QA 还犯过测试 UID 不合规的脚本错误，已按 `U[0-9]+` 修正，不是资产问题。完整画面和验证回执留在 Z890 `/mnt/disk1/H3_Studio/game-toolchain/evidence/ara-adult-teachers-20261114/` 下。

## Z890 本机可看

- **成年人物九动作对照**：`http://127.0.0.1:8774/pilot.html`
- **真实游戏 M01 限 QA 替换**：`http://127.0.0.1:8775/r45-duel/?qa=1&m01Adult=on`

当前这两条本机 loopback URL 已检查 HTTP 200，新 M01 原始 12,032,848 字节可完整提供。受管 QA server 非公网，**不是玩家在线版**。普通正式 PlayMoru 原样使用旧 M01，未经独立艺术验收不得改默认。

## 角色艺术后续

先把 M01 当成成年教师进行高品质演出打磨，而不是继续按学生方向优化。音乐老师需要有自然且夸张的挥指挥棒、指挥台手势、喊停、错愕和胜利庆祝；保持既有配音/音效，确保动作时的五官、衣服、腿脚和材质可信。男性社团指导老师仅作可选未来成年 NPC，需独立角色功能与来源授权核实才可登记角色卡。

整套资源基于 Ara 3D Gen 源代码 MIT、MakeHuman CC0；CMU 部分 Mocap 动作可嵌入商业游戏但不能将动作数据直接转售。相关脚本和技术雷达归档在 GlobalGameFoundry `docs/research/2026-11-14-ara-adult-teachers-reuse-and-m01-real-game-qa.md`。

**没有修改原有主线、没有发布到 playmoru.com、没有增加新的正式游戏角色或缴费素材。**

## 2026-11-15：真实战斗事件驱动动画和近景复核（补充）

上一轮仅能证明 M01 的静止 `Idle` 和卡牌扣血 20→19，尚未观测到具体攻击瞬间。**这一缺口已通过真正场景事件补齐**，不是独立人物 viewer 里的动作切换。

在隔离正式场景 `/r45-duel/scene/?qa=1&m01Adult=on&r90Motion=on`，沿用既有的 `ASDC_R45_BOARD`＋`ASDC_R51_COMBAT_EVENTS` 契约，指定 player `M01/U101`、ai `M02/U201`：
- 实际战斗事件进入后，M01 的 `getPlayingClips` 观测为 **`Punch`**，伴随真实场景中 `playedEvents=1`；命中时 `r90ImpactTriggers=1`，现有特效同步触发。
- 反向让 M02 攻击 M01，M01 在真正受击阶段播出 **`Hit reaction`**，全程观察 `r90ImpactTriggers=2`。
- 独立实际场景首次检验 **8/8 检查 PASS、JS/HTTP 错误 0**。近景模式下相同战斗链通过 **9/9**；近景截图实际显示 M01 身体和完整裙装、抬臂攻击及后仰受击，而非只改数据字段。
- 模型实际朝向 `frontDot=1.0`、2 个 skinned mesh、15 mesh；静止站立脚底约 `minY=0.002`。动态最深观测到 `minY≈-0.041` 游戏单位，仍需检查脚底穿地或步幅，不得称为完全零穿模。

### 更适合音乐老师的现成动作对照

**发现**：`Punch` 近景像普通拳击，并不符合音乐老师的身份。没有重新做复杂骨骼或逐帧手工动画，而是改用同一 GLB 中已有的 `Wave` 作为指挥/发令方向试验。在独立本地 QA HTTP overlay 下（临时端口 `18777`，测试结束已停止）真实进行同一套事件，**9/9 检查 PASS**，M01 事件触发实际播放 `Wave`、随后受击仍播放 `Hit reaction`，并在 M02 身上触发命中特效。截图中 M01 举手发出指令，比拳击更像教师的发令动作。

但 `Wave` 仍是普通挥手，未必足以代表真正优雅的音乐指挥；后续需在符合许可的成熟动作包中寻找 **conduct / cue / baton**，并将指挥棒、脸部表情、声音与音乐魔法特效一起复核。**此项是角色表演方向探索，并非美术签收。**

### 代码沉淀和回归手册

1. `r45-duel/qa/browser-m01-adult-real-motion.cjs`：实际事件/朝向/贴图蒙皮/出击/受击/命中场景回归。来源于已在 Z890 Chrome 实测 8/8 通过的脚本；可配置 `ASDC_QA_ORIGIN`（默认本机研究端口 8775）、`ASDC_QA_EVIDENCE_DIR`（推荐设在 H3_Studio）、`M01_ATTACK_EXPECTED=Wave|Punch`。
2. `r45-duel/qa/m01-adult-teacher-overlay-poc.py`：保持旧 R126 默认原样、仅 QA 参数 `?qa=1&m01Adult=on` 替换模型；新增 `--attack-clip Punch|Wave` 允许换角色表达而不手工绑定旧骨。
3. Z890 从该分支重新下载生成器，分别输出两种 QA 模块，已经与真实浏览器运行时使用的原始试验模块逐字节吻合：
   - `Punch`：SHA256 `7ea780a716491c277138874ffd7642e3a0ff67ecbf60cafd25bf183a60e6620c`。
   - `Wave`：SHA256 `ad576cf68a512bc6c3808da77468cf2000a666d0aa4ef04807e914173834915f`。
4. 原始 JSON 回执和真实 PNG 仍位于 `/mnt/disk1/H3_Studio/game-toolchain/evidence/ara-adult-teachers-20261114/`：
   - `m01-combat-clips-qa.json`（8/8 实际攻击/受击）
   - `m01-art-closeup/m01-combat-clips-qa.json`（9/9 近景出击/受击）
   - `m01-conduct-art/m01-combat-clips-qa.json`（9/9 Wave 角色变体）
   - `m01-art-closeup/m01-qa-real-stage-punch.png` 与 `m01-conduct-art/m01-qa-real-stage-punch.png`（后一文件名仍历史命名，但实际动画为 Wave，由 JSON 绑定确认）
   - `regression-real-m01-20261115/m01-combat-clips-qa.json`（复用测试脚本回归 8/8）

**生产隔离维持**：仅研究 QA，原 R133 并行工作树 37 项未提交变化没有被修改，原 M01 GLB 完全保留；两段实际动作只是 *game runtime under QA overlay* 的真实验证，尚未合并正式默认模型，更未发布到 PlayMoru 正式游戏。
