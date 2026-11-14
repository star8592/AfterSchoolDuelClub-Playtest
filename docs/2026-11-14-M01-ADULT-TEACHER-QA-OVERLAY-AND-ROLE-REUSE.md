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