# R212 · 静态体育馆几何合批｜真正 GPU/双机验收（Draft/NO-GO）

**日期：2026-11-20**。从 R211 Draft commit `cf7387d` 创建全新隔离分支，不更改正式 R198 或旧 R210/R211 默认表现。

## 根因审计（不是凭猜测“特效很耗”）

在 Z890 正版 Chrome WebGL 场景、未出牌、广角镜头中，R212 新增 QA-only `__r45SceneQA.auditRenderTree()`：
- 实际 `renderer.info.render.calls`：733。
- 可见 Mesh 数 757，计算潜在三角面约 662,690；**Mesh 数不能和 Draw Call 严格等同**。
- 体育馆主场景：472 可见 Mesh，其中真正原始 GLB 八位观众 260，静态 R46 美术区 82，其余静态建构/座椅等约 130。
- 双方常驻高精演员分别 131 和 124 个 Mesh；看台独立道具 27；现场大屏3。
- 真正座椅已经 InstancedMesh：前排 198、反面 198，不能把它们误认为396个 draw calls。
- 真实加载 `__ASDC_LOAD_METRICS.downloadedBytes=75,569,762` 字节（约75.6MB）；启动要验证的素材 16 个。加载量大才是下一轮更大的冷启动问题。

QA 审计脚本：`qa/browser-r212-render-tree-audit.mjs`；原始JSON：`qa/evidence/r212-perf-audit/r212-real-scene-render-tree.json`。

## 本轮真实优化：只合批没有动作的建筑，不牺牲角色品质

新模块：`scene/r212-stadium-static-batch.mjs`。从物理体育馆里精确按 **同材质、同几何属性布局、相同接收阴影/投射阴影及渲染顺序** 合并静态网格，拷贝并烘焙原始局部矩阵到同一个 BufferGeometry。复用了当前代码仓库里 R172 成熟的 `mergeGeometries` 思路，但单独列白名单，防止碰角色或动态组件。

- 仅选择屋顶纵梁/横梁、25个静态灯罩、静态窗户、侧看台固定阶梯、金属地面刻度及部分固定标志悬挂件。
- 原楼梯、看台反面可视性管理、球场大屏、动态灯强、人物 GLB 和骨骼、人物动画、观众受击、特效及声音逻辑 **不纳入合并**。
- 原25个天花板灯罩统一使用1个完全同色的发光 PBR 材质；5面高窗统一使用相同玻璃材质。不开启合批时视觉参数也完全相同。
- **严格三级实验开关** `r199PhysicalMagic=on&r210Elements=on&r212StadiumBatch=on`。缺少任一参数不启用；本次没有变更任何正式默认开关。
- 11组批次合并 122个静态小 Mesh → 11个合并 Mesh；理论减少111绘制候选，实际场景减少84次 Draw Call（遮挡和视锥裁剪使理论与实际有差异）。
- 在Z890测得该批处理本身 CPU 构建约 **3.3ms**；它不是每帧运行，而是在创建体育馆时执行一次。此数不能直接外推XPS。
- 未改变权威规则、卡牌数量、出牌序列、真实 VRM 骨骼及角色播放方式。

## Z890 原生 Chrome GPU 双视角前后对照

| 验证 | 未启用批处理 | 启用 R212 | 结果 |
|---|---:|---:|---|
| 正面 `drawCalls` | 733 | **649** | 少84（约11.46%） |
| 180度反面 `drawCalls` | 675 | **608** | 少67（约9.93%） |
| 正面可见 Mesh | 757 | 646 | 静态建筑重组成11组 |
| 真实看台观众 | 8 | 8 | 全部保留 |
| 双方演员 Mesh | 131/124 | 131/124 | 未改变 |
| 前后看台各自座椅数 | 198/198 | 198/198 | 未改变 |
| 正面79个rAF间隔 P95 | 16.8ms | 16.7ms | 接近显示器刷新上限，不能宣称FPS改善 |

使用独立 Chrome session、相同视角和窗口、无假图、无截图替代模拟。

像素直接计算（两个真实Chrome截图）：
- 正面 RGB 平均绝对像素误差约 0.0105/255；超过25通道差异的像素占 0.014%。
- 180度反面 RGB MAE 约0.0258/255；超过25通道差异像素占0.044%。
- 这些指标包括正常动画时序差；不是绝对逐帧一致性的数学证明，但说明建筑合并后无大范围视觉删减。

- 证据截图：`r212-before-after-real-chrome-contact-sheet.jpg`、`r212-180-reverse-before-after-real-gpu.jpg`。
- 运行报告：`r212-z890-real-chrome-static-batch-ab.json`、`r212-reverse-camera-regression.json`。
- 原生测试脚本：`qa/browser-r212-static-batch-ab.mjs` 与 `qa/browser-r212-reverse-camera.mjs`。

## 真实权威规则与角色反应

在 R212 开关下，`qa/browser-r212-three-real-rule-cards.mjs` 再次通过三次真正手牌出牌：
- E06：第2回合、3费、真实造成3伤害；
- T05：第1回合、1费、heal类，满血实际回复0，绝不伪造受击；
- S08：第1回合、2费、真实造成2伤害。
三张均保留原 R199 GLB、真实碰撞、广角不自动特写，无重复 R210 旧效果；JS/HTTP报错0。
回执：`r212-three-real-cards-rules-chrome.json`。

R210原46卡/15元素和R211火水电核心单元回归均通过。

## XPS 15 7590 低配 Intel 核显实测（重要限制）

实际浏览器 GPU 字符串为 **ANGLE Intel Mesa UHD Graphics 630 / OpenGL ES 3.2**。机器虽然有 GTX1650 4GB，**这次没有在NVIDIA GPU上测试**。使用 Chrome155 原生CDP、隔离headless临时profile，1280×720画面，`--use-angle=gl` 并允许图形驱动fallback；测量的是 rAF 间隔，不是GPU timer query。

| 验证 | R211静态未合批 | R212静态合批 |
|---|---:|---:|
| 原始场景绘制调用 | 733 | **649** |
| 三卡QA样本末绘制调用 | 743 | **659** |
| 24帧平均rAF间隔 | 44.44ms | 43.05ms |
| 24帧P95间隔 | 50.0ms | 50.1ms |
| 本次单次冷sceneReady | 65.4秒 | 84.05秒 |

解释：**可以确认GPU提交的绘制调用下降；不能确认低配真实帧率提升**。三卡QA末有2个特效仍然活跃，短样本易受动画与浏览器状态影响。冷加载两次结果都严重超时，且R212本次反而更慢，不能声称加载优化成功或归因为单独的合批 CPU；必须采集更多真实启动时序并拆分网络、GLB解码、VRM贴图上传与GPU初始化。

- 原始XPS报告：`asdc-r212-xps-static-batch-ab.json`，实机截图 `asdc-xps-native-r211-unbatched.jpg` / `asdc-xps-native-r212-batched.jpg`；另有合成图 `r212-xps-intel-original-cdp-before-after.jpg`。

## 发布边界与下一方向

**R212 仍为实验 Draft / NO-GO**。可供局域网或独立 PR 美术、性能验收；不开启开关不改变正式 R198 用户体验，不准自动合并。

下一轮真正关键：以 75.6MB /16素材为根因，对照**原始 GLB/VRM 的体积、纹理尺寸、解码成本与 XPS网络**做资源优化。重点在减少模型网络/CPU/GPU初始化负担，而非把精美角色换成粗糙Q版、假模或移除观众动作。保留现有回滚与每个人物原始高精资产，先做单角色格式/压缩可验证对照，再批量推广。

