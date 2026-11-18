# R168｜首次施法 WebGL 驱动阻塞：Chrome CPU 函数级证据

2026-11-18，《放学后决斗社》Web 版。**QA 研究，NO-GO，不合并、不上线**。实验只针对首次魔法施放卡顿，完全保留原始16角色、60卡牌、全部魔法造型与命中反馈。

## 原始R147不加实验代码的基线

Z890 / RTX5070Ti / Chrome157 WebGL2 Vulkan，CPU限速2倍。全量加载75,569,762字节原始模型。从真正的E06黑板擦魔法首次和二次施放分别启动CDP `Profiler` 采样，另用 `PerformanceObserver` 记录长任务。

- 首次施放浏览器最长任务 **346ms**，rAF p99 **233.3ms**；同类魔法第二次最长任务0、p99约33.4ms。
- CPU 采样窗口中`getProgramInfoLog`归因约 **500.9ms 累积采样耗时**，`shaderSource`约45.7ms，`getShaderInfoLog`约44.9ms，另有`replaceLightNums`等。
- 采样的累计时间**不是**单次长任务墙钟时间，不能混用。总体说明浏览器/驱动同步查询与首次Shader编译链接是关键因素，而不只是创建魔法粒子。

该项目的 Three.js `assets/three/build/three.module.js` 约第6494-6507行在首次使用 Shader 程序时进行`getProgramInfoLog`、`getShaderInfoLog`和`LINK_STATUS`查询。即使关闭日志，其他WebGL参数和链接查询也可能触发同样的GPU同步等待。

## 三种试验全部不合格

| 实验 | 额外准备时间 | 首次真实施法最大长任务 | 首次rAF p99 |
|---|---:|---:|---:|
| 原R147完全无改动 | 0 | **346ms** | 233.3ms |
| 仅QA关闭Three.js Shader日志检查 | 0 | 308ms | 216.7ms |
| 提前`renderer.compile`两层真实E06特效 | 62.8ms | 323ms | 233.3ms |
| 隐藏4×4 RenderTarget中真实渲染E06 | **792.7ms** | **388ms** | 216.7ms |

关闭日志检查后`getProgramInfoLog`热点消失，但`getProgramParameter`归因约 **497.8ms 累积采样耗时**，首发长任务仍在；不是可以安全默认开启的加速。显式WebGL链接审计分别验证了170、184、208个程序**全部LINK_STATUS通过**，不靠忽略失效Shader掩盖问题。

提前`renderer.compile`只覆盖部分实际程序变体。4×4离屏渲染把近0.8秒堵塞移到游戏准备阶段，首次真实出招仍有388ms长任务；**不仅无收益，还使加载更慢**。

## 质量和回退

- QA 参数：`?qa=1&r168ShaderDiagnostics=off`。非QA/正式R147 **checkShaderErrors仍为true**。
- `r168WarmupActualE06('compile'|'draw')`只在QA调用，构建E06实际外观、完成预热后将临时组从场上移除。不改变真实回合伤害，不用于正式用户。
- 原模型和贴图不裁剪、不压缩、不降DPR；不删除任何点光源、特效或动作。
- 原R147正式版无改动；QA工作区所有变更可删除/回退。
- 原始DevTools可加载CPU profile、原始Chrome JSON及机读对照报告在`qa/evidence/r168-cpu-profile/`。

## 研究决策

**NO-GO：上述三种简单捷径均不能发布。** 首发Shader创建/驱动同步仍需进一步研究更少的动态灯光变体、材质Shader键稳定化、异步编译可用性和目标手机GPU性能；但不能以降低动画质量、删特效或粗糙贴图换帧数。单次Chrome测试有采样扰动，不应宣布量产性能收益。

下轮优先用Chrome trace追踪`WebGLProgram`创建的实际源材质集合和光源组合，限定真实新增变体数量，修复引起同步阻塞的调用路径，之后再在Android真机做双向A/B。
