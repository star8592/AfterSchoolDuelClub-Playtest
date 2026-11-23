# R222–R224：Jay 真正的单手出牌、三维朝向与脚部防滑｜Blender × Chrome 实机审计

日期：2026-11-23。基线为 R221 `193737f`，本轮继续在隔离 `feature/duel-r220-real-blender-actors-audition-20261121` 上制作人物，**没有修改 `r45-duel/scene` 正式出牌逻辑、R198 或 `main`**。

## 先看实际画面与录像，而不是先看代码覆盖率

- **最新 10.48 秒真实连续 Chrome/WebGL 录屏**：`qa/r220-character-audition/evidence/r224-jay-draw-cast-hit-victory-full-real-chrome.mp4`。真实人形 GLB + Three.js AnimationMixer，不是图片拼接，不是AI生成视频；含完整抽牌、出牌、受击、胜利与待机。
- **R223 对照 R224 四动作截图**：`qa/r220-character-audition/evidence/r224-real-chrome-old-vs-footlock-four-actions.jpg`。
- **R222 对照 R223 6时刻、12张真实Chrome关键帧**：`qa/r220-character-audition/evidence/r223-6-keyframe-choreography-r222-vs-r223-real-chrome.jpg`。
- **可操作三维查看器**：`http://10.10.10.138:18720/r45-duel/qa/r220-character-audition/?focus=jay&revision=r224&camera=profile`，可切换 R220错误轴、R221纠正轴、R222分段、R223单手、R224防滑姿势；按按钮逐项对照五种动作。仅 Z890 局域网可访问。
- **机读浏览器原始数据**：`evidence/r224-keyframes/r224-footlock-browser-keyframe-ab.json` 和 `evidence/r224-jay-full-motion-real-chrome.json`。

## 实测与修复之间的因果链

| 独立迭代 | 真实缺陷 | 处理（所有修改仅发生在Blender候选模型或QA Viewer） | 本轮判定 |
|---|---|---|---|
| R221 | 肩与肘部局部X轴正负写反，手向后 | 真实逐轴校准，重新导出24骨架GLB；146动作帧前后向检测 | **方向技术PASS**；自然度不等于PASS |
| R222 | 两条手臂齐刷刷向前平举，像僵尸 | 抽牌→收臂蓄力→右手前掷→收势分段；限制大幅抬腿 | 姿势和脚部垂直波动改善，但**脚横向滑动** |
| R223 | 单手出牌不像单手，左臂始终伸直 | 左手守在胸前，右肘出牌后迅速弯曲回收；卡牌脱手沿人物真正前方 **+Z** 飞出，取代之前朝旁边飞的错误试演轨迹 | **动作结构技术PASS**，仍需真实观感签收 |
| R224 | 髋部 `Z` 旋转把腿连同脚在地面转移，实际脚滑 27.6cm | 骨盆减少无意义偏航，扭转主要移交到胸椎、肩膀；脚近地且左右落点稳定；保持右手伸向前方 | **整段动作防滑技术PASS**；外观仍Draft |

### R223 → R224：真实Chrome WebGL关键帧量测

在 Z890 Chrome 中读取真实右/左脚骨骼的 `getWorldPosition()`，对出牌动作按七个指定时刻固定画面采样（0.08、0.38、0.65、0.77、0.92、1.12、1.32 秒），并追踪持牌/投掷卡的三维位置。

| 指标 | R223 | R224 |
|---|---:|---:|
| 左右脚最大水平坐标跨度 | **0.276m** | **0.029m** |
| 左右脚最大垂直跨度 | 0.061m | 0.002m |
| t=0.92秒右腕比左腕更前 | 0.317m | 0.319m |
| 脱手卡牌在0.77→1.12秒期间前向Z距离增加 | 1.36m | 1.36m |
| 模型装入与JavaScript错误 | 0 | 0 |

这些位置属于**当前试演场景的世界坐标**，并非已对正式游戏玩家体型、舞台单位和移动游戏规则进行验证。该测试不应混为玩家真正走路的完整足底IK验收：R224通过的是「定点攻击动作中双足没有明显滑移」，没有为全部行走/跳跃编写IK。

### Blender完整动作逐帧检查（非少数照片）

`diagnostics/r224-footlock-full-motion-gate.py` 将实际导出的 R223 与 R224 GLB **重新导入 Blender**，隔离其 NLA 动作，按每帧检查五组完整运动曲线的左右脚世界坐标。

| 动作 | R223最大脚水平波动 | R224最大脚水平波动 | R224最大脚垂直波动 |
|---|---:|---:|---:|
| 抽牌 Draw | 5.2cm | 3.6cm | 0.3cm |
| 甩牌 Throw | **18.8cm** | **2.4cm** | 0.2cm |
| 受击 Recoil | 7.0cm | 4.2cm | 0.3cm |
| 胜利 Victory | 7.9cm | 2.4cm | 0.1cm |
| 待机 Idle | 10.2cm | 7.9cm | 0.6cm |

此表使用**Blender源人物真实坐标**，与 Chrome 中经过模型统一缩放的世界位置数值不能直接互换。五组动作中新GLB左右腕都没有落到肩后；五组脚水平摆动均小于12cm，技术自动验收PASS。完整每帧位置保存于 `evidence/r224-blender-v04-v05-full-motion-kinematics.json`。

## 防止下一次“测试通过但画面空白”

第一轮AB帧采集发生了首个Chrome上下文GPU合成器未稳定、截图画面是白色的事故。工具已加启动后预热和截图后的非空像素审计，**错误白图被独立重新采集并替换；首次不可信的JSON不作为正式通过回执**。

最终 `diagnostics/r224-evidence-integrity.py` 验收了21张非空Chrome截图、所有五种真实动作的连续视频、Chrome三维前向运动、两组真实脚位轨迹、以及Blender完整运动曲线；全部PASS。浏览器关键帧脚本 `browser-r224-footlock-ab.mjs`、连续真录像脚本 `browser-r224-full-motion-video.mjs`，不使用Mock图或模拟角色。

## 源模型与工程复现

- `author_jay_v03_staged.py` → `assets/jay-teen-duel-v03-staged.glb` + `source/jay-teen-duel-v03-staged.blend`（R222）。
- `author_jay_v04_onehand.py` → `assets/jay-teen-duel-v04-onehand.glb` + `source/jay-teen-duel-v04-onehand.blend`（R223）。
- `author_jay_v05_footlock.py` → `assets/jay-teen-duel-v05-footlock.glb` + `source/jay-teen-duel-v05-footlock.blend`（R224）。
- 三个版本都取自财富小镇 `teen_desktop.glb` 的真实 24 骨骼原模型，保留6组原有动作+5组专用对战动作，共11组；源资产只在该用户Z890可访问。基础源版权仍需在正式商用前独立核对。*保留可编辑 Blender 原始工程，不把AI生成抽象三视图冒称可用动画。*

## R224仍未达到最终人物美术门槛

本轮证实 **方向、左右手动作职责、卡牌释放方向、固定场景双足位置** 得到改善，但以下未通过或尚未完整测评：

1. 角色仍是财富小镇普通蓝色T恤/短裤男孩，**不是最终 Jay 的完整角色设定与服装**。
2. 肩、肘、腕的收势更有层次，但缺少真正的腕指动作、可读的表情、声画对应、真实足底接触IK与对手反馈；用户多次拒绝僵尸式动作，不能仅凭轨迹数字宣布表演自然。
3. 目前在独立几何场景中并排展示真实GLB，而不是已经接入《放学后决斗社》真实卡牌规则、对手反应、R211物理魔法与整局压力测试。
4. 尚需视觉人工签收、角色性格化动作调优；在这之前**维持 Draft / NO-GO，不合并 `main` 或正式R198**。

下一步应让 R224 新角色保持可切换候选，先针对脸、手腕、服饰及3秒完整出牌行为做真正看得见的质感升级，而不是继续堆相似的旋转表达式。
