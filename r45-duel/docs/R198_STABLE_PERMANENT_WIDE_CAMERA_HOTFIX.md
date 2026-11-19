# R198 Stable Hotfix｜任何自动放大特写一律关闭

**2026-11-19｜《放学后决斗社》｜独立生产稳定分支，直接针对 main**

## 用户明确要求

**不要放大特写！** 对战必须始终看见双方真实人物、攻击路线、中央竞技场和对手的受击反馈。不要突然拉近一个人的脸、突然切去观众、在画面上覆盖大头像、放大的出牌图片。卡牌真实的3D出手投影、法术、音效和人物动作应照常演出。玩家手动点「选牌大图」或图鉴里的单张卡片查看高清图画，是显式用户操作，非自动特写，因此保留。

此前 R147 只让 `r145ActionCamera` 默认关，但源码保留了 `r147ArtLab=on&r145ActionCamera=on` 双标志开启、`r123Closeup` 观众反应切镜、R131 QA脸部微距、R121二维画中画的额外 WebGL 绘制，以及R110自动弹出的出牌放大图片。这些都与“始终看见对手反馈”冲突。

## 本轮真实修改

在当前 `origin/main` 之上的**独立热修复**中：
1. R145人物攻击镜头强制 `enabled=false`，原双标志不能重新启用；
2. R123观众误伤保留在观众坐席内原位演出，移除自动将主相机移到观众/音乐老师面前的镜头；
3. 删掉所有自动战斗推进（`push=0`）和自动轨道漂移（`arc=0`）。仍可用用户手动左右45°相机按钮调节视角；
4. 移除R121/R124第二台近景相机、第二次WebGL portrait绘制、画中画 DOM/CSS；
5. R131 仅用测试标志也不允许再贴近真人脸部/身体；
6. 移除R110自动弹出的卡牌放大图及其 DOM/CSS，同时**保留**真实3D站台卡牌、独立60张原画和手动「选牌大图」；
7. 原始真实GLB/VRM、材质、骨骼、表情、原有法术/喜剧表演/音效以及卡牌规则均不修改；仅删自动镜头与自动遮挡层，反而减少一轮额外WebGL绘制。

缓存更新：主对战场景 `r198Wide=1`，场景模块同样采用 `r198Wide=1`；客户端对战 `game.mjs?r198Wide=1`，避免旧Pages缓存继续运行已删除的放大演出。

## 实际Chrome QA证据

在RTX5070Ti真实Chrome/Vulkan WebGL2中启动本分支当前网页，**故意携带**
`qa=1&r147ArtLab=on&r145ActionCamera=on&r123Closeup=on&r131QaCloseup=E04` 旧特写开启参数。不是靠忘记传参数让测试侥幸通过。

| 情形 | 核验 |
|---|---|
| 经典牌组 seed 173 | PASS：12个真实原始GLB、首回合出牌+AI、第二回合、全程不放大 |
| 黑暗食堂 seed 2 | PASS：12个真实原始GLB、首回合出牌+AI、第二回合、全程不放大 |

两组都确认：
- `r145ActionShot.enabled=false`，`active=null`；
- `heroLens.visible=false`、`heroInsetDraws=0`、第二摄像机不存在；
- `r123Camera.cuts=0`、`weight=0`、`frontFacingCloseup=false`；
- 页面完全没有自动特写画中画和自动卡牌放大 DOM；
- 手动查看卡牌高清图可操作；
- 真实人物3D Canvas存在，默认声音开启，真实卡牌与AI决斗成功；
- 脚本及资源HTTP错误数组为空。

证据：
- `qa/evidence/r198-stable-wide/r198-four-actual-chrome-wide-arena.jpg`：4张真实Chrome对战前后场景；
- `qa/evidence/r198-stable-wide/stable-classic-seed173.json`；
- `qa/evidence/r198-stable-wide/stable-kitchen-seed2.json`；
- `qa/browser-r198-stable-wide-no-closeup.mjs`：以上所有不变量的可重复验收脚本。

## 发布与回退

这份热修复与 R198 其他仍失败的「极简开局快速模型加载」实验**完全隔离**。只修改 main 的镜头与遮挡，不合并任何未经验证的精度/模型加载/动画实验。发布后使用原 GitHub Pages 网页入口验收静态资源签名及场景视角，出现异常则回退本次热修复提交。PC优先，Android压力测试不作为此无特写热修复发布门槛。
