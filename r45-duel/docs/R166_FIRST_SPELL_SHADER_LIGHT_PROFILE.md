# R166｜首次施法 WebGL Shader 程序变化原因分析

2026-11-18；**本地 Z890 研究工作区，不合并、不发布。** 不涉及 Unreal。

## 测试机制

在原R147原始三维战斗页面仅注入QA可读的 `r166ShaderInfo` 和 `r166PrewarmPointLightVariants`，保留全部16个真实模型、60张卡、75,569,762字节原模型资源、原始魔法与镜头门控。Chrome/Vulkan，桌面1280×720 CPU 限速2倍，真实 E06 魔法首发与第二次施放，先跑基线→预热4，再反序跑预热2→基线。每个用例新浏览器context，记录rAF p95/p99、PerformanceObserver的长任务和WebGLRenderer shader program count。该试验**不能代表移动端GPU真机**。

## 实际发现

- 静止场景有4个 `PointLight`（另外2 SpotLight、3 DirectionalLight、1 HemisphereLight）。
- 首次E06魔法时点光源数从 **4→6**，WebGL已编译程序数由48增至110，第一次出现约62个新Shader程序与100-234ms级长任务；第二次同类施放通常不再触发同等级阻塞。
- QA临时加入4个零强度点光源并调用 `renderer.compile(scene,camera)` 时，需前置57.4ms同步阻塞；预热前程序总数约48，预热后约92，真实施法时仍新增约62个程序，**多编译了不匹配的光源变体**。
- QA临时加入**准确额外2个**点光源，调用 `renderer.compile(scene,camera)` 约58.5ms同步阻塞；真实施法时新增程序从约62降至32。确实节省了一部分首发Shader编译，但并未消除全部。
- 首发 rAF p99：基线正序233.4ms、反序133.3ms；预热4为116.7ms、预热2为216.7ms。顺序和后台噪声影响明显，**不能宣称稳定改善**。预热2的首发最长任务98ms、反序基线129ms；预热4最长任务119ms、正序基线234ms。
- 预热本身约58ms是同步主线程工作，会改变加载速度。不可把它隐藏在加载过程并宣称“施法不卡”。全量预热不同组合不仅慢，还可能增加GPU程序缓存占用。

## 下一步与发布决定

**NO-GO：不自动启用预热、不合并。** 当前证据说明动态点光源数量变化是Shader组合增长的贡献因素之一，但还有原始动态魔法材质和其他特效程序。推荐下一个小步工程是固定少量点光源槽位并精确复用，让原材质与动画保持不变；必须做主/手机GPU计时、首发长帧、待机成本、内存和视觉对照，不能以过多永久光源换一时顺畅。当前四个法术模块均会动态加入点光源（magic-arsenal/spell-impact/elemental-vfx/spell-contact-fx），解决时必须按实际触发场景和并发上限计数。

本地机器原始回执：`qa/evidence/r166-shaders/r166-baseline-prewarm4.json`、`r166-prewarm2-baseline.json`；综合摘要：`r166-final-local-diagnostics.json`。测试脚本：`qa/browser-r166-shader-probe.mjs`。
