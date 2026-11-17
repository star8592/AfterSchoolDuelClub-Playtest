# R154 Web 性能专项：真实基线、隔离试验、回退

状态：实验分支、无公众发布、不会修改正式游戏的默认行为。

## Z890 真机正式站点基线（2026-11-18）

- URL：`https://star8592.github.io/AfterSchoolDuelClub-Playtest/r45-duel/`
- Chrome Headless + Vulkan，1366×768，RTX 5070 Ti，设备像素比 1。
- 真实场景 `__ASDC_LOAD_METRICS`：16/16 模型、全部模型就绪 6633ms、首帧就绪 8635ms；GLB/VRM 已接收字节 75,569,762。
- `__r45SceneQA.drawCalls` 约 734；采样约 60FPS，样本是当前高性能 Z890，不可推广到低端手机。
- 最初浏览器基线错误地等待了父页面 `__r45QA.sceneReady`，因这项 QA 接口仅在 `?qa=1` 下暴露而超时；**这不是游戏正式页面加载 150 秒的证据**。iframe 内真实模型与首帧仍按原指标独立报告。后续用 `?qa=1` 测试正式主页面就绪与动作。
- 记录路径：`/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/public-baseline.json`。

## 性能根因候选

1. 首次进入要验证 4 个 VRM + 12 个召唤 GLB 才解除 loading。虽然 R124 已有 12 GLB 无损 gzip 和限流并发 4，初始 75.6 MB 仍对移动网络不友好；未取得允许降低 12/12 角色身份门槛的验收。
2. R124 额外英雄人像 inset 在动作/语音高频场景会在同一 WebGL context 内第二次 `renderer.render()`，意味着在主场景外重复绘制几何。R147 虽已禁用 R145 侵入性镜头，但没有自然禁用这一独立 inset。
3. 高 DPR 及 2048 阴影，尤其在弱 GPU 下增加像素填充与阴影贴图频率。体育馆座椅本身已有 InstancedMesh，不能虚称通过“新增座椅实例化”再获得巨大优化。
4. 仍需要用慢网络、CPU 限速、真实中低端手机的 Chrome trace 确认主线程、GPU 和带宽占比，不根据单台旗舰显卡数值承诺提升倍率。

## 本分支 R154 最小可回退变更

- 仅显式 `?r154Perf=on` 时启用（优先 scene URL，或者同源父页面查询字符串）；普通玩家默认全部维持原策略。
- 保持主场馆镜头、角色 / 动作 / 规则、60 张卡牌、所有 12 召唤模型、音效和语音不变。
- 关闭 R124 *额外*英雄 inset 的第二次场景渲染，**不关闭主竞技场，也不改变 R147 的动作特写安全禁令**。
- DPR 高密度手机上由 1.2 降至 1.0，高 DPI 桌面最多由 1.5 降至 1.25；DPR 1 的普通桌面不变。
- 阴影更新从战斗 30Hz/闲置 20Hz 降至 20Hz/10Hz，实际主场景动画仍正常 rAF 更新。
- QA `renderPerformance.profile` 显示 `r154-perf-lab`，用 `?r154Perf=off` 显式回退。
- 所有修改只存在研究分支，合并/默认开启必须进一步做低性能设备视效对照、QA、战斗/观众/音效/语音回归。

## 后续优先级

P0：区分 QA 专用接口不可用和真正场景未就绪；在 `?qa=1` 下复核主页面与 iframe 的真实加载状态。

P1：优化模型的**首次必要集**与按需解码，不可把“先展示静态画面”冒充可玩；必须保留真实人物安全行为和逐模型加载失败反馈。

P2：真实 GPU/CPU profile 中的 draw calls 归因，针对非座椅实例合批、动画远距节流、粒子池复用、资源销毁建立可重复测试。

参考官方文档：
- https://threejs.org/manual/pages/responsive.html
- https://threejs.org/docs/pages/InstancedMesh.html
- https://threejs.org/manual/pages/how-to-dispose-of-objects.html
- https://web.dev/articles/optimize-long-tasks

## R154 手机视口 A/B 双顺序实验（Z890 Chromium Vulkan；仅实验，非真实手机）

- viewport 430×900，DPR=2，CPU 限速4倍，正式 GitHub Pages 页面内容，Playwright 只在测试浏览器里替换 scene.mjs，不更改真实用户页面。
- 常规 vs R154 资源量均为 75,569,762 字节，模型均 16/16，绘制调用均约 732；脚本未减少模型下载量或几何数，**不能宣传网络加载速度优化**。
- 顺序 A（baseline → R154）：baseline rAF median 33.3ms、p95 33.4ms，R154 median 16.8ms、p95 33.4ms；由于第二轮缓存/预热收益，**不解释为性能翻倍**。
- 顺序 B（R154 → baseline）：R154 median 33.3ms、p95 33.4ms，baseline median 33.2ms、p95 33.4ms；此顺序未证明稳定的 FPS 提升。
- 采样的 >33.3ms 帧数：顺序 A，62/150→39/150；顺序 B，34/150（R154） vs 40/150（baseline）；具噪声，仅能说明低频卡帧有一定改善可能，需 GPU trace + 更多重复与真机确认。
- DPR 1.2→1.0，即每像素片元目标面积理论减少 1-(1/1.2)^2=30.6%，**不是整体帧时间提升幅度**。
- 同类阶段阴影申请计数约 80-87→38-40，属于预期代码行为，与实际 GPU 耗时不等价。
- 完整回执：`/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r154-perf-ab.json` 及 `r154-perf-ab-reverse.json`。
- 审美代价：低 DPR 有细节变软风险、取消额外人像会减少独立脸部演出；正式用户默认不启用，直至过审。
