# R219：Three.js Shader compileAsync 提前编译 —— 实机A/B否决默认启用

日期：2026-11-21。基线为R216 `3dce1ad`，实验worktree `feature/duel-r219-shader-precompile-audit-20261121`，**仅 QA 条件 `qa=1&r219ShaderPrewarm=on` 才运行**。通过在第一张完整画面绘制前调用 `await renderer.compileAsync(scene,camera)`，观察首次 `renderer.render(scene,camera)` 的同步CPU尖峰及玩家真正进入场景的等待时间。所有模型、蒙皮、动画、法术和物理接触保持原版本。**R219运行时实验修改未合并至R216，生产默认OFF。**

## Z890 Chrome/RTX5070Ti 实测（单次正反，非多轮稳定数据）

| 指标 | 原方案 | 异步Shader预编译 |
|---|---:|---:|
| 16模型验证完成 | 1391ms | 1429ms |
| 单次sceneReady | **2536ms** | 2654ms |
| 预编译CPU墙上耗时 | — | 50.5ms |
| 首次renderer.render CPU耗时 | 685.8ms | **598.2ms** |
| 首帧显示完成时间 | 2241ms | 2341ms |
| draw calls | 649 | 649 |

此处 `renderer.render` 是CPU侧调用墙上时间，非GPU timer query。提前编译减少约87.6ms首次绘制集中尖峰，但预编译成本和环境波动也存在，单次完整可玩时间反而更长。**不足以启用生产默认**。

## XPS 15-7590/Chrome155/真正NVIDIA GTX1650 4GB/OpenGL（240帧测试）

独立CDP Headless会话、PRIME GPU Offload 和 `--disable-software-rasterizer`，WebGL debug renderer 明示 `ANGLE (NVIDIA Corporation, NVIDIA GeForce GTX 1650/PCIe/SSE2, OpenGL ES 3.2)`，不是此前Intel集显，也不是软件回退。两组16/16源模型及8名观众真实加载，R212静态合批为649 draw calls，R213 70.45 MB传输，R211原创火水电逻辑未修改。

| 指标 | 原方案 | 预编译 |
|---|---:|---:|
| 首次sceneReady | **57.69s** | 67.96s |
| 16模型全部验证时间 | 52.461s | 62.492s |
| 预编译CPU墙上耗时 | — | 1593.3ms |
| 首次renderer.render CPU耗时 | 3480.4ms | **1944.1ms** |
| 240帧rAF中位 | 16.7ms | 16.7ms |
| 240帧rAF P95 | 16.8ms | 16.7ms |
| 240帧>50ms | 1 | 1 |

第一次render CPU峰值降低约1536ms，但单独预编译用了1593ms，**就这两段CPU耗时并未产生净节约**。sceneReady预编译组本次晚10.27s，但其模型验证阶段也晚10.03s，模型传输波动很大；不能将10秒差距全部归因为预编译。也不能声称已经让游戏启动变快。240帧样本含特效消散后的基础场景，**非240帧全程施法/真实长回合压力**。

## 真实证据和复现

所有文件都存 `qa/evidence/r219-shader-prewarm-negative/`：
- `r219-z890-baseline-real-chrome-stage-trace.json`、`r219-z890-optin-real-chrome-stage-trace.json`：Z890阶段CPU性能记录
- `r219-z890-baseline-all-actors-real-gpu.png`、`r219-z890-optin-all-actors-real-gpu.png`：真实Chrome画面
- `asdc-r219-gtx1650-prewarm-ab.json`：XPS原始NVIDIA实机完整CDP对照（测量字段未篡改）
- `asdc-xps-native-r219-gl-baseline.jpg`、`asdc-xps-native-r219-gl-prewarm.jpg`：XPS真实浏览器截图
- `browser-r219-shader-baseline.mjs`、`browser-r219-shader-prewarm.mjs`、`r219-xps-gtx1650-prewarm-driver.py`：只用于复现实验的独立脚本
- `docs/R219_REJECTED_SHADER_PREWARM_IMPLEMENTATION.patch`：**未经应用的实验源码diff，仅供审计，不是生产代码或启动插件**。

## 最终判定

**R219暂不采用默认开启**。对于GTX1650可以看到首次 `renderer.render` CPU时间被分摊，但没有证明玩家从页面打开到真正可玩总体时间减少，加入代码还会增加设备/浏览器兼容性与潜在着色器编译差异风险。保持R216 Draft/NO-GO、R198正式版不动。后续应重点解决浏览器多模型并发下载/资源消费、CPU事件循环和驱动首帧同步，而不是只挪动Shader等待。

注意：这是**拒绝采用这一具体调用位置和默认预编译方案**，不是证明所有设备上 `compileAsync` 永远没有价值。

