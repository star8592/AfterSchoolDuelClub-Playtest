# R156｜程序化贴图性能实验：猫头鹰羽毛法线图

**状态：仅 QA / PR Draft，不合并、不发布、不改变默认 R147。**

## 适用范围与原则

- **适合程序化的内容**：木纹与小尺度地面划痕、墙面微噪声、规则布纹、羽毛局部细微法线高频纹路、材质粗糙度变化。
- **不宜替代的内容**：角色脸部、虹膜、服装图案、校徽、羽毛分区颜色、真实方向性层次和需要精确 UV 对齐的手工美术；无须为了“程序化”强行给当前纯色地板/椅子增加 shader/贴图。
- R156 选择 **混合程序化法线贴图、离线生成**：保留 T01 原始 2048 法线的大尺度形态，LANCZOS 缩至 1024 / 512 后，对原始 tangent-space 法线单位化、叠加非常低幅的两频率解析波纹、再次单位化，以 WebP 写入原 GLB。这避免逐帧 GLSL 噪声计算和新开浏览器下载；与运行时像素着色器程序化图案不同，需明确区分。
- T01 原始 R84 的 baseColor、羽毛图案、眼睛、身体结构全部保留；仅两张确实被 glTF `normalTexture` 绑定的 WebP 法线纹理由程序重建。

## 真实文件体积（HTTP 模型字节口径）

| 模式 | 单个猫头鹰 .glb.gz | 较 R84 减少 | 16 模型总下载 |
|---|---:|---:|---:|
| T01 原始两张 2048² 法线 | 11,755,466 B | — | 75,569,762 B |
| R156 1024² 混合程序化法线 | 5,703,714 B | **6,051,752 B (51.5%)** | **69,518,010 B** |
| R156 512² 混合程序化法线 | 5,317,516 B | 6,437,950 B (54.8%) | 69,131,812 B |
| **R155 轻量 VRM + R156 1024** | 5,703,714 B | 6,051,752 B | **64,344,738 B** |

最后一行对比原版总量减少 11,225,024 B（**14.85%**），来自 Chrome `__ASDC_LOAD_METRICS.downloadedBytes` 实测；**并不意味着帧率或加载秒数改善同等百分比**。

在 Three.js 常规 RGBA 解压纹理估算下，这两张法线的像素占用从约 32 MiB 降至 8 MiB（1024）或 2 MiB（512），**不包括 mipmaps、驱动实现与其他贴图**。需用 GPU 工具进一步确认实际显存。

## 技术处理与修复过的错误

- 原 GLB 两个缓冲区：**buffer 0** 是打包物理字节（含 WebP 和 Meshopt 压缩数据）；**buffer 1** 是 `EXT_meshopt_compression` 虚拟解码目标空间。
- 初版错误地把两个 buffer 的 `bufferView` 当作同一个 BIN 字节区搬迁，Chrome 实际报 `Malformed buffer data: -1`，无法进入游戏；**这版已废弃，未发布**。
- 修复版只对 buffer 0 的两张经过验证、非重叠 WebP 图片区域做精确字节替换，并同步平移所有物理 `bufferView.byteOffset` 和 `EXT_meshopt_compression.byteOffset`。buffer 1 虚拟空间偏移、mesh/skin/material/animation/accessor、其余纹理与所有 Meshopt 压缩原字节保持不变。
- Python 脚本严格验证所有非目标 bufferView 内容、Meshopt compressed payloads、材质引用以及输出 gzip 解码回读。
- R124 的 `DecompressionStream('gzip')` 正常读取新包；缺失原生解码功能仍可用独立原始 `.glb` 文件。
- URL 必须同时带 **`?qa=1&r156OwlNormal=1024`** 或 **`?qa=1&r156OwlNormal=512`**；默认使用 `T01-Owl-Innerscene-R84.glb`。QA 外无法通过该参数切换。
- R125 SW 指纹同时记录原始和两组实验 .glb.gz，但每次回填只选当前模式的 **4 VRM + 12 GLB = 16 个**，不一次回填三个 T01。
- R147 原始镜头、R97 安全演员及 60 卡牌规则完全不改动；R154、R155、R156 可以保持独立开关。

## 实际 QA 结果

2026-11-18，Z890 RTX 5070 Ti Chrome/Vulkan，1280×720，同源本地 overlay 测试：默认 → 1024 → 512、反向 512 → 1024 → 默认，另单独测试 `r155VrmLite=on&r156OwlNormal=1024`。

- 全部 **16/16 真实模型**加载、12/12 召唤物、R22 原始人物身份、60 卡牌、T01+E03 双实体入场和真实战斗事件检查通过。
- 两张 T01 `normalMap` 在 WebGL 场景读取到 **2048/1024/512** 对应尺寸；模型绘制调用均约734，**未减少几何 draw calls**。
- 每个浏览器 context 回填 **16/16**，并且 **只选当前一种 T01**；无 JS/HTTP 错误。
- Chrome 帧内首次完成时间在本地缓存和 GPU 环境有噪声，不承诺“提升 X 倍”。本轮证明的是**网络字节、贴图像素和画面基础兼容性**。
- QA 专用同角度场景截图：`r45-duel/qa/evidence/r156-owl-hybrid/real-chrome-owl-normal-closeups.jpg`（真实 Chrome 左原版 / 中1024 / 右512）。目前实机截图未发现灰图、破面、色彩异常；但完成正式美术验收前仍保持 **ART REVIEW REQUIRED**，不基于截图压缩比或全屏像素误差直接宣布“视觉无损”。

建议：下一轮优先专门对 R156 **1024** 做更近的 3D 羽毛视觉审核与真实手机测试，512 仅作为低配候选。后续研究 **KTX2 / BasisU** 纹理 GPU 压缩与 WebGPU 支持，其可能同时降低 GPU 占用，但需要解码工具/格式和艺术对比验证。

## 证据和源码

- 生成器 `r45-duel/qa/build-r156-procedural-owl-normals.py`。
- 公网基线：`docs/R154_WEB_PERFORMANCE_FIRST_PASS.md`；R155：`docs/R155_RUNTIME_VRM_LIGHTWEIGHT.md`。
- 原始测试 JSON：Z890 `/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r156-{owl-hybrid-normals,browser-ab,browser-ab-reverse,r155-combined}.json`（实际文件完整名称以项目证据目录为准）。
- 官方技术依据：`https://threejs.org/manual/pages/canvas-textures.html`、`https://threejs.org/manual/pages/textures.html`、`https://threejs.org/docs/pages/KTX2Loader.html`。

**严禁默认发布前省略角色近景视觉检查、低端设备回归与场景稳定性测试。**
