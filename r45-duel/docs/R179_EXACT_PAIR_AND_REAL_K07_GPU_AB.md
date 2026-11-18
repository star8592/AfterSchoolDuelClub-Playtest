# R179｜首次施法 GPU 资源分离诊断与真 3D 青蛙布丁

2026-11-18，放学后决斗社独立 QA 分支。**Draft / NO-GO / 不合并玩家 main，不部署**。

## 核心发现：首次使用存在两条独立 GPU 阻塞链路

1. **真 3D 召唤单位**：JS/GLB 加载完成不等于首次 SkinnedMesh/PBR shader 与 GPU 资源初始化完成。R179 新增 r179PrimeTwo=on，仅 QA 时对 T01/E03 两个指定原始模型实际在场景中渲染3帧，并归还原池；不使用任何低精代理。
2. **高精真实法术道具**：新增 K07 真 Blender GLB，角色预热后仍存在约 166.6ms 首发长帧。新增 r179PrimeFrog=on，在已有加载遮罩阶段实际绘制 K07 源 GLB 三帧；不是只调用 compileAsync，不关 Shader 校验、不改 HP/回合。
3. 两条链路互不替代：只预热 K07，T01/E03 首发仍出现366.6ms；只预热真实 T01/E03，K07 首次出现仍有166ms；两者一起，在本次桌面样本降为33.4ms。

## Chrome 实战性能证据

测试硬件：Z890、RTX5070Ti、Chrome WebGL2/Vulkan。桌面1280×720 CPU×2，手机视口430×900 DPR2 CPU×3。每组首法术 + 46 张首轮 + 46 张重复，共93次真实施法。13组基础A/B共1209次动作事件均通过，全部16个原始人物、60卡、46法术以及原人物下载75,569,762字节完整，浏览器 JS/HTTP 错误0。

**桌面最坏 rAF 帧间隔及首次就绪时间：**

| 首法术 | 召唤预热 | 实体 K07 预热 | 就绪 | 最坏 rAF |
|---|---|---|---:|---:|
| K01（旧双模型候选） | 无 | 无 | 4331ms | 366.6ms |
| K01（旧双模型候选） | 2人 | 无 | 5459ms | 33.4ms |
| K01（旧双模型候选） | 初始手牌7人 | 无 | 5961ms | 33.4ms |
| K01（旧双模型候选） | 全14人 | 无 | 6821ms | 33.4ms |
| K07 | 无 | 无 | 4590ms | 333.4ms |
| K07 | 2人 | 无 | 5588ms | 166.6ms |
| K07（复测） | 2人 | 无 | 5788ms | 166.7ms |
| K07 | 无 | 有 | 6006ms | 366.6ms |
| K07 | 2人 | 有 | **5949ms** | **33.4ms** |
| K01 | 无 | 仅预热K07 | 5339ms | 33.4ms（但主线程longtask**340ms**！） |

特别注意：rAF 可因测量相位漏过此前的阻塞，最后一行长任务340ms说明不应仅凭较小rAF断言修复。两项指标必须联合验收。上述都是少量单次样本，不能当成不同设备的性能分布。

**后续代码精确核验**：在修复真实 GLB Mesh 数计数后，独立再跑第14组 T01/E03 + 真 K07 双预热、93次施法：实际原始 Mesh 数18、首施法最坏33.4ms、首次ready6184ms、0错误；见 r179-final-recheck-18-mesh-desktop.json。两次单轮的ready差异本身说明启动时间有噪声，不能宣称准确节省多少毫秒。\n\n**手机视口模拟、非真 Android GPU**：T01/E03 + K07，只预热2人首次最坏133.3ms、就绪8355ms；再预热实际K07后最坏83.3ms、就绪8221ms。83.3ms仍明显不达标。Android Agent 当前离线，未有真正 Android GPU 验收回执。

## K07「会尖叫的青蛙布丁」实体建模

使用 Blender 5.2.3 生成真正可编辑 .blend、可复现 Python、GLB 和实际 Eevee 图片。青蛙的果冻曲面、立体褶线、眼睛/舌头、脚趾、立体陶瓷托盘、铰接餐罩与独立学校铜铃都有真正几何结构；无靠色块/几何环冒充实体。
- 首轮 Blender 渲染曾因 parent_group 的 stale matrix_world 错误，导致小糖粒被放大成夸张球体并遮住角色；已复查真实渲染图、改为保留本地变换后重新导出。
- 先有77独立网格，按同角色、同材质做不减面的真实合批，降到18个 Mesh，保留31,708三角形；GLB702,104B、16个GLB材质、3个独立演出节点。
- 游戏内真实Chrome演出验证三个节点分别动：青蛙跳动、学校铃铛摇摆、餐罩独立运动。三件真GLB E06/K01/K07 同时加载；K07命中表演正常，浏览器0错误。
- Blender 源里的程序Noise Bump未自动烘焙到GLB；实体形体凹凸来自真实几何，不能虚报浏览器已有相同程序法线。
- 目前只能视作视觉候选，不能宣传为动画电影级正式美术。**46个法术中真可编辑Blender候选3，程序粗模仍43，最终视觉验收通过0**。发布门禁 --release 仍按预期拒绝发布。

## 剩余工作及边界

- 额外加载时间：桌面基线 K07 首发ready4590ms → 双精确预热5949ms，增加约1.36秒。并非免费优化。正式版不能预知玩家首选的角色/法术，按需调度尚未实现，所有新 QA 开关默认关闭。
- 已用真实 Chrome Vulkan 原始完整体育馆做了逐根场景统计：**renderer 每帧 drawCalls=734**；正确排除不可见父节点后 **可见 Mesh=758**。其中体育馆根节点可见473 Mesh（包括10 skinned、14 Instanced），两名永久决斗者 G01=131 SkinnedMesh、E01=124 SkinnedMesh；后排观众道具27 Mesh（4 Instanced）。这些是显式渲染负载，尤其是静态馆景与两个多材质人物。统计来自浏览器中的 qa/evidence/r179-sculpted-props/r179-render-inventory.json，而不是猜测模型体积。
- 当前 734 调用远高于手机游戏应该争取的水平，**下一轮必须优先做零减模的静态场馆合批、VRM网格/材质安全合并可行性调查及真实GPU A/B**；不能直接砍演员、关闭观众、把贴图降成灰模。先找能无视觉损失地减少调用的原始组件，再做独立回退开关与截图差异验收。
- 实测只覆盖 Chrome Vulkan 及模拟手机视口，没做实际 Android GPU；不允许将此独立研究分支对玩家默认开启。
- 46条法术台词脚本不是46条已经录制的 Qwen3 人声；音频验收另行隔离。

## 原始可复核材料

- 模型源：art/hero-props/build_k07_frog_pudding.py、K07_Sculpted_Frog_Pudding_Bell.blend 和 .glb。
- 真正3D图：art/hero-props/qa/K07_Sculpted_Frog_Pudding_Bell.png。
- 游戏内截图和独立节点运动：qa/evidence/r179-sculpted-props/K07-real-stadium-focal.png 及 K07-in-stadium.json。
- 真实GPU性能和第一帧采样：qa/evidence/r179-selective/r179-13-case-gpu-and-3d-art-summary.json，及同目录13份完整原始 JSON。
- 逐组真实Chrome测试：qa/browser-r179-selective-first-use.mjs。
- 真实独立演出、渲染静态网格审计：qa/browser-r179-k07-stadium-snapshot.mjs 与 qa/browser-r179-render-inventory.mjs。
- 模型质量门禁：qa/verify-r178-true-sculpt-glb.py、qa/r177-audit-46-real-art.mjs。

**R179 尚不满足正式视觉与移动性能要求，维持 Draft / NO-GO。**
