# R174–R176｜首次施法卡顿：完整战局分离诊断及零降质预热

2026-11-18，Z890 RTX 5070 Ti，Chrome Vulkan/WebGL2。**Draft / NO-GO / 不合并、不部署**。

## 最关键结论
- 黑板擦自身几何构建 3.6–4.6ms、静态合批 5.4–5.5ms，远小于 100ms 级长帧。采样到的 getProgramInfoLog 和 texSubImage2D 统计是窗口累计，**不能误报为单次函数耗时**。
- **旧观众误伤光效是独立阻塞链路**：在没有首次上场召唤单位的受控测试里，原旧特效首发 +35 Shader 程序、4 次最坏帧 116.6–216.8ms。真实校园道具飞向观众的新效果只新增 +2 Shader 程序，4 次最坏帧均 50ms，且每次都真实命中观众、保留观众反应。**此隔离测试不是完整战局，不能据此宣称所有施法顺畅**。
- **真正的第一次召唤单位上场是另一大阻塞源**：在真实 T01/E03 放上对战棋盘时观察到 366.7ms 最坏间隔；等待其首次 GPU 真正渲染完成，再首次施法黑板擦为 49.9ms。
- R168 已反证编译日志关闭、简单 renderer.compile 和遮挡离屏预热。R176 不用这类捷径，只在已有游戏加载遮罩期间，把 T01/E03 的真实高精模型、真实材质、原场景先真正渲染三帧，移除到已有召唤池后，再让游戏正式准备好。仅 QA 开关 qa=1&r169SchoolMagic=on&r176PrimeBoard=on。默认正式 R147 不变。

## 完整战局对照：真实16人物、60卡、46法术、93次施法

| 指标 | 原版未预热 | 加载期完整单位预热 |
|---|---:|---:|
| 桌面 CPU×2 初次主线程最大 longtask | 362ms | 0ms |
| 桌面 CPU×2 rAF 对齐测试第1轮 | rAF 最大366.6ms | 最大50.1ms，longtask 0 |
| 桌面 CPU×2 第2轮 | longtask 最大333ms（rAF相位漏记） | 最大50.1ms，longtask 0 |
| 首次可见场景 ready（同一次 A/B） | 4471ms | 5656ms |
| 手机视口430×900 DPR2 CPU×3 | 最大 rAF 483.2ms | 最大 rAF 83.4ms |
| 真 Android GPU | 未测试 | 未测试 |

全部真实源人物16/16、GLB/VRM总下载75,569,762字节、60卡、46魔法、93次演出、镜头安全、浏览器零JS/HTTP错误。模型、贴图和演员动画未降质。预热动作本身某一轮 CPU×2 耗时1842ms、新增43个Shader；首屏较基线多1185ms，**卡顿部分转成等待，不是无代价加速**。另一轮预热1579.9ms，首次场景ready4312→5389ms。手机单次预热2373.6ms，首屏7820→7710ms，不能用单次结论推断手机加载普适加速。

## 不能误读的性能统计
- rAF 采样和 PerformanceObserver longtask 有不同边界。曾经有基线 RAF max49.9ms，但同一次 longtask 333ms，不能凭一个数据宣称基线流畅。
- 编写了 browser-r176-raf-aligned-firstcast.mjs 将出牌发送与采样同一帧对齐，继续采集两类证据。截图或浏览器无错误 ≠ 首次 GPU 性能已彻底达标。
- R174 的 prepareGpuMaterial/compileAsync 在单轮实验曾残留 116.7–200ms 长帧，不能当成有效解决方案。
- 预热当前只覆盖 T01/E03，不包含12种所有可能的召唤组合；不能据这一种组合断言46种法术/其它GPU都不会再卡顿。
- R175 高精 E06 是独立美术分支，其首次施法未预热时仍出现383.3ms；还没有做组合双变更的完整性能验证。
- 手机是 Z890 Chrome 手机视口模拟、CPU3限速，不是真实安卓机。

## 发布门槛
1. 预热12种全部实际召唤角色和46法术在不同灯光、不同GPU组合下的首发及重复施法。
2. 实际Android真机和桌面冷热启动多次正反序采样，对齐 p95、p99、最坏帧及加载增量。
3. 和真实高精道具GLB合并隔离测试，保留全部出招/受击/观众互动。
4. 严禁降低纹理分辨率、替身低模、牺牲动画动作换性能数据。
5. 完成视觉质量独立验收前，R147正式玩法保持原样。

## 可重跑证据
- qa/evidence/r176-firstcast/r176-audit-summary.json
- qa/evidence/r176-firstcast/primed-desktop-93-casts.json 及 baseline-desktop-93-casts.json
- qa/evidence/r176-firstcast/primed-mobile-93-casts.json 及 baseline-mobile-93-casts.json
- qa/evidence/r176-firstcast/r174-spectator-12-case-ab.json
- qa/browser-r176-raf-aligned-firstcast.mjs
- qa/browser-r174-first-cast-webgl-trace.mjs
- qa/browser-r174-board-then-cast.mjs

**这轮完成了明确根因分离与有效QA预热，尚未达到商业发布标准。**
