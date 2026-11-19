# R194｜Morph Target 半精度 GPU 能力预检与 32F 故障回退

**2026-11-19｜Z890 RTX 5070 Ti｜隔离测试分支｜Draft / NO-GO**

本轮接续 R193：此前真实 Chrome GPU 已证明 69 份 Morph Target `RGBA32F` → `RGBA16F` 可把 WebGL 3D 数组纹理上传字节量从经典场景 **64.537 MiB** 降到 **32.268 MiB**，食堂场景从 **66.233 MiB** 降到 **33.116 MiB**。但之前未验证设备在接受半精度之前的真实能力、设备不支持时的保守选择、上下文丢失后怎样回退。

本轮**不改正常玩家的 Three.js/源GLB/材质/骨骼/法术/规则，也没有开启半精度默认开关**。完成的所有逻辑都属于 `r45-duel/qa` 中的浏览器 QA 控制器及独立能力预检。

## 1. 真正的 GPU 能力预检

`r194-float16-capability.mjs` 在**独立的一次性 WebGL2 Canvas**中实际执行：

1. `getContext('webgl2')`，读取 `MAX_TEXTURE_SIZE` 与 `MAX_ARRAY_TEXTURE_LAYERS`；
2. `texStorage3D(TEXTURE_2D_ARRAY, RGBA16F)` 创建格式正确的 2D array；
3. `texSubImage3D` 真实上传 IEEE754 half float 测试样本；
4. 编译/链接 GLSL 300 ES `sampler2DArray` 着色器，`texelFetch` 读取 0.5；
5. 将其渲染到 RGBA8 帧缓冲，用 `readPixels` 验证红通道约 127–128/255，同时检查 GL 错误；
6. 对任何探针失败、无法取得 WebGL2、保守硬件界限不足或被 QA 强制拒绝的情况，**选择原始 RGBA32F**。

**实际硬件：** Z890 NVIDIA RTX 5070 Ti，`MAX_TEXTURE_SIZE=32768`，`MAX_ARRAY_TEXTURE_LAYERS=2048`。在 Chrome Vulkan/ANGLE-NVIDIA 和 Chrome OpenGL ES 3.2/ANGLE-NVIDIA 两种真实 GPU 后端上，`RGBA16F` 创建、上传及着色器采样均成功；这仍然是同一显卡，不是第二台独立硬件/真 Android。

Vulkan 与 OpenGL 后端单次探针执行耗时可超过约 250–300ms（包括独立GPU上下文创建/编译，具体受运行环境影响），**不能不经成本验收就对所有玩家每次开局运行**。真实手机仍需评估探针开销和硬件差异。

## 2. 13 组真实 Chrome 选择与故障回退

13/13 组结果为测试控制器自身通过，**并非13个独立设备或移动机型**：

| 情形 | 真正的分配 | 结果 |
|---|---|---|
| Vulkan经典：探针通过，选择半精度 | RGBA16F，32.268 MiB | PASS |
| Vulkan经典：强制设备不支持 | RGBA32F，64.537 MiB | PASS |
| Vulkan经典：用户未请求优化 | RGBA32F，64.537 MiB | PASS |
| Vulkan经典：严格恢复能力模式 | 检查未通过，选择RGBA32F | PASS（保守回退） |
| Vulkan经典：运行16F后故意使游戏WebGL上下文丢失 | QA控制器重新加载为RGBA32F，32.268→64.537 MiB | PASS（测试控制器回退） |
| Vulkan食堂：能力通过/拒绝 | 16F=33.116 / 32F=66.233 MiB | 2/2 PASS |
| Vulkan模拟手机视口：能力通过/拒绝 | 16F=32.268 / 32F=64.537 MiB | 2/2 PASS |
| Vulkan模拟手机：真实游戏上下文丢失 | QA控制器重新加载原始32F | PASS |
| ANGLE OpenGL ES 3.2经典：通过/拒绝 | 16F/32F分别32.268/64.537 MiB | 2/2 PASS |
| ANGLE OpenGL ES 3.2：严格恢复能力 | 检查未通过，选择原始32F | PASS（保守回退） |

- **真实游戏 Canvas 的 `WEBGL_lose_context.loseContext()` 已触发 `webglcontextlost` 事件**，不是口头模拟失败；
- QA控制器移除半精度网络模块覆盖，重新加载真实游戏。原始人物可重新被加载，`RGBA32F=34836` 分配回来，没有出现残留 `RGBA16F=34842`；无脚本/HTTP异常；
- 在独立探针的人工上下文丢失测试中，Vulkan 和 OpenGL 的 `webglcontextlost` 能触发，但 **`webglcontextrestored` 没能在本轮的等待窗口内确认**。这是对这些人工失效测试的观测，不能简单外推成 NVIDIA 驱动或所有手机都不能恢复；
- **R194 是 Playwright QA 控制器执行的重启回退；正式游戏仍没有自动回退**。重新加载游戏页面会重置正在进行的对局，尚无战斗状态持久化/恢复；**因此绝不允许以当前机制直接发布给玩家**。

## 3. 单元测试与隔离安全

`unit-r194-gpu-selection.mjs` 覆盖10组策略条件：禁用开关、探针完全缺失、探针拒绝、尺寸/层数下限、严格恢复未测试、严格恢复失败、严格恢复成功、半精度通过；确认未对磁盘的 Three.js 原始模块作修改。

`browser-r194-guarded-gpu-failover.mjs` 是使用独立 Playwright 浏览器的测试控制器。只有探针决定16F时才使用 R193 的模块请求覆盖；拒绝或回退时使用未经修改的 `three.module.js`。所有截图都是真实 Chrome 对战网页，可见原始角色与竞技场，非概念图或灰模。

直接证据：

- `qa/evidence/r194-gpu-fallback/r194-thirteen-scenarios-summary.json`：13组 GPU 后端、选择模式、原始源模型数量、GPU纹理对象、错误/故障回退数据；
- `qa/evidence/r194-gpu-fallback/r194-six-real-webgl-guarded-scenes.jpg`：6张真实浏览器画面，包括经典与食堂、半精度/32F拒绝、移动模拟及故障后重载；
- 对应原始单场 `*-before.png`、`*-after.png` 和 `*.json` 仍保留在 Z890 隔离工作区，不将大型重复日志全部推上 GitHub。

本轮命令（Z890隔离服务 `127.0.0.1:18687`）：

```sh
node r45-duel/qa/unit-r194-gpu-selection.mjs
R194_SCENARIO=guarded-half node r45-duel/qa/browser-r194-guarded-gpu-failover.mjs
R194_SCENARIO=forced-reject node r45-duel/qa/browser-r194-guarded-gpu-failover.mjs
R194_SCENARIO=context-loss-failover node r45-duel/qa/browser-r194-guarded-gpu-failover.mjs
R194_SCENARIO=restore-strict R194_GPU=gl node r45-duel/qa/browser-r194-guarded-gpu-failover.mjs
```

## 4. 发布门槛与下一步

**Release: NO-GO**，R193 的 half float 仍仅是 QA 候选，播放器无任何默认行为改变。

必须先完成：
1. **真实 Android GPU（历史 S21 手机）**：WebGL2 RGBA16F数组采样、素材真机载入、30–60分钟真实对局或等效可复现压力测试、系统内存/上下文恢复与温度/耗电证据。S21 目前有闲鱼相关任务在运行；本轮没有擅自唤起它的 Chrome 压力测试。
2. **不丢正在进行的牌局的恢复机制**：故障后保留真实规则状态、抽牌、AI回合、法术和计分，才允许称作玩家端可用的自动回退。
3. **更轻量的能力检测与硬件配置缓存**：防止每次开场额外创建 WebGL 上下文、编译着色器造成新的卡顿。
4. **真实图像/动画人工验收与稳定帧时间**：目前仅证明半精度 GPU 上传数据量下降约50%，不证明手机帧率提高50%。

**R194 PR 保持 Draft，不合并到 main，不部署或改变R147正式版。**
