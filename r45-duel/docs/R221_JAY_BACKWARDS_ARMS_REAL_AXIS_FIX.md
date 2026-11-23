# R221：Jay 手部动作方向全反 → Blender 实测轴向纠正（隔离美术试验）

2026-11-23。基于 `feature/duel-r220-real-blender-actors-audition-20261121` 与 PR #197。用户指出 R220 的 Jay 所有手部动作**向身体后方运动**，而不是向前。这是成立的实机视觉缺陷，不是“姿势还可以”的主观争议。**本轮只修隔离候选，正式决斗社游戏 / R198 / main 不改变。**

## 一、找到的是可复现的轴向错误

R220 的 `author_jay_v01.py` 把 Blender `Euler(X,Y,Z)` 的负 X 用于原角色的 RightArm、RightForeArm、LeftArm、LeftForeArm，但真实财富小镇 GLB 肩肘骨架的本地方向与假设相反。Blender 项目坐标中，角色正前方为 **-Y**，导出 glTF 后对应 **+Z**。

已做逐轴 ±30/60/90° 试验：右上臂 local X = -60° 时手腕在肩后约31cm，+60° 时前伸约39cm。左右臂同理。臀部、腿部、躯干和头颈的轴不可跟着一起镜像，否则会引入变形。

**修正**：只反转四段上臂、前臂动作曲线的本地 X 分量，并由 Blender 5.2.3 重新导出模型。保留老 V01 作为反向失败证据；不把 JS 里 Three.js 模型简单旋转 180°，也不翻转整个角色。

源码：`qa/r220-character-audition/author_jay_v02_forward.py`。
新模型：`assets/jay-teen-duel-v02-forward.glb`（24真实骨骼、11套动作）。
可编辑工程：`source/jay-teen-duel-v02-forward.blend`。

## 二、Blender 将原 GLB 和新 GLB **再次导入**的同关键帧骨骼测量

单位：米。正数表示朝人物胸前/出牌目标方向，负数表示伸到**人物背后**。

| Blender原生动作关键姿势 | R220右手/肩深度 | R221右手/肩深度 |
|---|---:|---:|
| Draw帧17 | **-0.3374** | **+0.3409** |
| Throw帧20 | **-0.4158** | **+0.3066** |
| Recoil帧8 | **-0.3879** | **+0.3500** |
| Victory帧16 | **-0.3852** | **+0.2254** |

左臂同样由后伸改为前伸。两份原生 GLB 都真正重新导入 Blender 并选定 NLA 动作独立测试（特别清除导入器默认活动动作，避免掩盖其他轨道），不是只检查修正脚本里的角度符号。证据脚本 `diagnostics/r221-exported-fwd-gate.py`。

## 三、真实Chrome/WebGL第二层实测

在独立播放场中加载真实 GLB 后，用 `Bone.getWorldPosition()` 取右/左肩、肘、腕三维世界坐标并比较前向 **+Z**，还在旧/新版使用同镜头的侧面与正面截图；测试中 **JS异常0，HTTP失败0，所有5种动作加载成功**。

以下按现场三维展示的统一人物缩放比例计算，不能与原生Blender的米数直接混为同一尺度：

| Chrome侧面动作样本 | R220右手在肩后 | R221右手在肩前 |
|---|---:|---:|
| 抽牌 | -0.497m | +0.502m |
| 甩牌 | -0.614m | +0.484m |
| 受击 | -0.486m | +0.427m |
| 庆祝 | -0.615m | +0.444m |

R221 在四种动作里，左右手腕均向前超过0.14m、左右肘部都前移超过0.04m，正面和侧面独立Chrome脚本硬断言PASS。独立浏览器还显示出真实绑定的现有G03卡牌插画随右手动作移动。证据：
- `evidence/r221-jay-reversed-vs-forward-4-poses-real-chrome.jpg`：**四种动作旧/新同镜头真实浏览器对照图**；
- `evidence/r221-jay-forward-side-real-chrome.mp4`：**6.2秒侧面真实Chrome录屏**，不是重新AI画图；
- `evidence/r221-jay-bad-axis-profile-real-chrome-motion.json`：错误版真实三维深度；
- `evidence/r221-jay-profile-real-chrome-motion.json`：R221修正版真实三维深度；
- `evidence/r221-jay-front-real-chrome-motion.json`：正面校验；
- `browser-jay-r221-bad-axis-baseline.mjs` / `browser-jay-r221-forward.mjs` / `browser-jay-r221-profile.mjs` 为可复现实验程序。

## 四、整段动作逐帧检查，而非挑一帧骗人

`diagnostics/r221-24fps-full-motion-gate.py` 真实将 V01 与 V02 GLB 加载回 Blender，逐帧采样四种完整动作的全部 **146帧**（Draw 35 + Throw 38 + Recoil 31 + Victory 42），另外采样待机144帧；对左右肩到肘、腕的前向深度分别检查。

旧版四段动作内，在几十个关键帧出现肩后10cm以上运动；新版四段动作的每一采样帧中**左右手腕从未落到肩后10cm**，并且这四段动作内左右手腕深度最小值仍为 +0.0727m（约7.3cm向前），肘部也未出现后退>10cm的运动。原始每个动作的最大最小值及违反帧数在 `evidence/r221-blender-true-24fps-forward-sweep.json`。

## 五、试玩入口与安全状态

- R221侧面：`http://10.10.10.138:18720/r45-duel/qa/r220-character-audition/?focus=jay&revision=r221&camera=profile`
- R220错误版侧面：`http://10.10.10.138:18720/r45-duel/qa/r220-character-audition/?focus=jay&revision=r220&camera=profile`
- R221正面：`http://10.10.10.138:18720/r45-duel/qa/r220-character-audition/?focus=jay&revision=r221`

`index.html` 已提供三个切换入口。局域网端口仅用作隔离测试，不代表互联网公网上线。

**验收结论严格分层**：反方向错误**方向性技术PASS**。但角色美术身份、真实重心、足底防滑、手腕动作的惯性节奏、出牌路径对接实际对手、面对正式镜头的整段表演**仍未完成视觉签收**。因此 **R221仍是隔离QA / Draft / NO-GO，不合并正式游戏**。禁止再次用“骨骼角度变化了”代替自然度审美验收。
