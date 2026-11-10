# R66 · 放学后决斗社｜七名角色的个性化喜剧待机表演

本分支从 R65 `e5e2cf4` 独立派生，修复“只会双臂直举、做完 T-pose 修复后又像木头一样”带来的缺乏人物性格问题。只在 R45 唯一中央体育馆主线修改源 GLB 骨骼演出：**不生成替代方块、不会替换已校准的人物网格、不会改变卡牌判定、服务器或网站其它项目的代码**。

## 角色表演映射（只发生在静止待机时）

| 牌 | 真实模型 | 喜剧表演 | 技术机制 |
|---|---|---|---|
| E03 加油队长 | Schoolkid | 得意地给自己加油 | 右肩抬肘和身体自然不对称，非横伸手 |
| E04 食堂接力员 | FoodCourier | 小心翼翼递出便当 | 实际双肩和前臂骨骼缓动 |
| G02 黑板密码专家 | ItEngineer | 挠头想答案 | 原生源 GLB `Scratch` 动画 |
| G03 实验学长 | WhiteCoatDoctor | 实验失败摊手 | 双肘内收的耸肩、摊手 |
| G04 社团计划总监 | OfficeManager | 一本正经讲计划 | 原生源 GLB `Explain` 动画 |
| T03 默契收发员 | DeliveryRider | 热情递出信封 | 单臂递出、另一手收在身体附近 |
| T04 活动室守门人 | SecurityGuard | 煞有介事敬礼 | 原生源 GLB `Salute` 动画 |

### 自然性与真实性边界

- **表演不是机械同步动作**：每名人物不同周期、起始偏移，短暂亮相后长时间恢复自然站姿；同阵营里不会每个人一起举手。
- **战斗优先**：真实攻击/受击消息中断待机演出，原生 Attack/Hit 及伤害数值由 R51/R64 机制处理，结束后回到 Idle。
- **骨骼原生性**：使用 R65 已确认的胸→肩→肘真实骨骼，利用局部四元数控制有起止 envelope 的动作。G02/G04/T04 优先用 GLB 自带 Scratch/Explain/Salute，无假装的替身。
- **真正站稳**：经实际 GPU 场景检测发现部分 GLB 的 Idle/gesture 原生根运动会使角色浮起 0.1–0.2 世界单位。对人形骨骼按每帧真实 SkinnedMesh AABB 自动校正落地高度；源动作的横向偏移仅在原生喜剧动作期间校准，处理时转换阵营旋转到本地坐标。避免漂浮、穿地和换边错乱。
- **复用动画生命周期**：出牌后回收重召时复位原来的源网格场地校正、动作冷却和 Mixer，避免“第二次出牌又突然 T-pose”。

## 实际 Web 审查入口

启动此分支根目录服务 `python3 -m http.server 10996 --bind 127.0.0.1` 后：

- **R66 原生游戏**：`http://127.0.0.1:10996/r45-duel/?qa=1&seed=1`
- **四角色正式骨骼表演（静态关键帧）**：`http://127.0.0.1:10996/r45-duel/qa/r66-character-acting-gallery.html?mode=acting&group=0`
- **其余三角色表演**：`http://127.0.0.1:10996/r45-duel/qa/r66-character-acting-gallery.html?mode=acting&group=1`
- `mode=relaxed` 查看相同真实资源、相同摄影机的正常待机姿态，供对比。

截图位于 `qa/evidence/r66/gallery-{relaxed,acting}-{0,1}.png` 和 `qa/evidence/r66/{wide,portrait}-acting-moment-batch{0,1}.png`，仅为本次 GPU 浏览器验收的输出，非外部随意生成的模型图像。

## 已建立的质量闸门

- `qa/browser-r66-acting-gallery.mjs` 验证 7 个角色的画廊实际渲染与姿态；原生动画必须真的进入指定 clip，程序骨骼手势必须具有显著非零权重。
- `qa/browser-r66-acting-arena.mjs` 在 1600×900 和 430×900 下，各两批双方真实召唤实体上检查动作发生、正面朝向、完整入镜、脚底离地、动态尺寸；不把单纯数学定义的正面向量当作视觉最终美术许可。
- `qa/browser-r66-gesture-combat-interrupt.mjs` 验证原生搞笑动作遭遇真实攻击事件会被覆盖并回到自然待机。
- `qa/browser-r66-performance.mjs` 在相同机器与 10 个实际 GLB 召唤物场景中 A/B 比较 R65/R66。Z890 RTX 5070 Ti 的两轮测得 R65 60 FPS、R66 60 FPS；此结果仅代表该硬件和这些测试场景，不代表低端设备。
- 沿用 `qa/browser-r65-natural-pose.mjs`, `qa/browser-r65-repeat-summon.mjs`, `qa/browser-r65-animation-return.mjs`, `qa/browser-r62-scale-audit.mjs`, `qa/browser-r51-combat.mjs`, `qa/r61-rule-all-cards.mjs` 等既有回归。

当前仍为**可玩性演出升级**；卡牌模型的最终高品质美术与商业可用性审核未完成，不能把动作通过归类为正式原画匹配或商用准入（原账本 0/12）。
