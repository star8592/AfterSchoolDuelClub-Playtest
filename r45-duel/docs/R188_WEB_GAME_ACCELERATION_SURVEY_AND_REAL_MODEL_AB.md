# R188｜《放学后决斗社》Web 游戏整体加速：全网技术调查、方案筛选、真实猫头鹰替换 A/B

2026-11-19，目标：**先解决卡顿和Android显存，再考虑美术。** 用户认为46件魔法道具精度已足够，停止无效高清重制。全部实验隔离在性能开发分支，正式R147与GitHub主分支不改动。

## A. 权威官方调研与当前源代码对照

| 方案 | 公开资料 | 本项目优先级及真正用途 | 实际状态 |
| --- | --- | --- | --- |
| **直接替换单个异常昂贵的角色模型** | Three.js [优化大量对象](https://threejs.org/manual/pages/optimize-lots-of-objects.html) | **P0最有效、已测**：原T01猫头鹰12MB/129网格/12张2048贴图，使用已有91KB/1网格/4原生动作的BarnOwl即可，不必再次建模 | R188已有真实Chrome比较 |
| **贴图实际解码显存预算** | [MDN WebGL最佳实践](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) | **P0有效、已测**：PNG/WebP在下载时很小，但上传GPU一般变成大像素面，不能拿GLB磁盘MB当GPU显存MB | R187完成12原始模型贴图普查；T01理论RGBA8约192MiB，G02约45MiB，T03约27MiB |
| **KTX2/Basis Universal GPU压缩纹理** | [Khronos KTX指南](https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXDeveloperGuideWebGL.md)、[KHR_texture_basisu](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_basisu/README.md)、[Three.js KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html) | **P1条件有效**：在实际需要贴图的G02/T03测试ETC1S/UASTC，真正压缩显存与上传量；无贴图模型无须转码 | 尚未真机A/B，不能称已改善 |
| **只加载首屏和当前对战必要资源，余下按需加载** | [MDN Lazy loading](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Lazy_loading)、[web.dev Slow Roads游戏经验](https://web.dev/blog/slow-roads) | **P0下一阶段**：目前真实源码通过Promise.all等待四位真实VRM及12个召唤GLB即16/16全部加载，造成首屏长等候；后续可基于真实初始牌组、当前双方已上场角色加载，其他后台预取 | 还没落实，严禁假模型和未加载却宣称可玩 |
| **减少DrawCall，合并静态网格与相同材质实例化** | [Three InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)、[BatchedMesh](https://threejs.org/docs/pages/BatchedMesh)、[Optimize Lots of Objects](https://threejs.org/manual/pages/optimize-lots-of-objects.html) | **P1适用场景/观众席**；不能把不同骨骼模型硬合一 | 项目原有R172/R180静态批处理、R181蒙皮资源优化已存在；先核实指标，不重复造轮子 |
| **动态分辨率、像素填充和阴影开销** | [PlayCanvas性能指引](https://developer.playcanvas.com/user-manual/optimization/guidelines/)、[MDN WebGL最佳实践](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) | **P1需以实际GPU片元耗时为依据**：移动DPR高影响渲染像素，阴影太密导致掉帧，但对首次纹理上传长任务帮助有限 | 源码已经设置移动DPR约1.2、移动阴影1024和20/30Hz更新策略 |
| **缓存材质几何、场内对象池、无动态无谓光源** | [Three WebGLRenderer指标](https://threejs.org/docs/pages/WebGLRenderer) | **P1** 适合持续出牌帧时；避免每次施法新建纹理、逐帧编译 | 原来魔法池和缓存已实现，不能随便删除 |
| **Meshopt几何和动画流压缩** | [meshoptimizer官方](https://github.com/zeux/meshoptimizer/blob/master/gltf/README.md) | **已有但不能解决WebP解压成巨大GPU纹理**，保留已有压缩字节，不继续反复优化它 | 已用EXT_meshopt_compression，R187重新编码图像时验证几何、动画bufferView逐字节不变 |
| **Chrome GPU真实测量+卡顿归因** | [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/overview)、[GPU timer](https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query) | **P0必需**，同时统计首次可玩、第一张卡rAF、LongTask、纹理预算、shader、DrawCall、GPU timer、内存峰值 | 已有真实Chrome 93次法术×多组A/B；驱动层GPU实际VRAM尚未直接读取 |
| **JS任务切片与Worker** | [web.dev Optimize Long Tasks](https://web.dev/articles/optimize-long-tasks)、[Chrome scheduler.yield](https://developer.chrome.com/blog/use-scheduler-yield) | **P2条件使用**：JS CPU真卡才切任务；驱动侧texImage纹理上传不可凭JS yield解决 | 未证实是本轮主要根因 |
| **资源LRU回收、WebGL上下文丢失恢复** | [MDN WebGL最佳实践与context lost](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) | **P0移动稳定性**：所有16+46素材永远常驻显存风险大。真机需要OOM及恢复演练 | S21曾低内存被杀；S22 Android设备当前离线，不声称验收 |
| **WebGPU直接替换WebGL** | [Three WebGPURenderer](https://threejs.org/manual/pages/webgpurenderer)、[2026实际WebGPU与WebGL反例](https://games.encrypted-cat.com/devlog/destruction-cars-why-we-stayed-on-webgl/) | **P3**，个别浏览器性能可能更差、首帧更慢，绝非不用分析就迁移的万能药 | 保留现有WebGL2基线，未来仅AB测试 |

### 明确判为无效、低优先或当前不值得做

- **提高显卡、后端服务器/CDN就能解决首次卡牌停顿**：网速只能解决传输，不能解决手机GPU上传巨幅纹理和主线程LongTask。
- **全量预热16人、所有46魔法**：R187测得长任务下降的代价是首次可玩多延迟0.3–1.2秒；这是转移卡顿而非消除成本，不能默认开启。
- **全套46道具都减面数**：R187确定异常点主要是T01大型纹理，盲减新道具面数破坏演出却不能保证修正根因。
- **只给GLB做gzip、WebP或Meshopt就声称显存降了**：磁盘大小和真正GPU解码后资源不是同一种指标。
- **更换全站游戏引擎或直接切WebGPU**：收益没有对应实测，极易破坏已经验证的真实人物和规则。
- **限制FPS到30就声称不卡**：稳定30FPS可以是低端机选项，但100ms以上长帧仍能感觉明显顿挫；不能以低FPS掩饰。
- **无意义复用不存在的GPU缓存、关闭shader错误检查、制造假的加载进度**：不解决玩家真正看到的长帧。
- **无验证地把全站纹理一刀切缩到极低**：只对像素占比小的物件做有证据的贴图降级；细节、UI、脸部不能靠粗暴模糊。

## B. R188：使用已存在的真正高效鸟模型，不再继续雕刻

项目历史里本来有两只更轻且带原生动作的真3D猫头鹰。用户同意换模型，实际源码现在支持QA选择，不需新建美术资产：

| T01同一身份四种源 | 原始GLB字节 | 网格 | 真实图片 | 自带源动作 |
|---|---:|---:|---|---|
| R84原版（最重） | 12,317,072 | 129 | 12×2048 | 0 clips；原R127另行按照129羽毛做动作 |
| R187压缩贴图 | 2,528,604 | 129 | 12×512 | 保留原R127羽毛动作 |
| R73校园电台猫头鹰 | 1,610,700 | 16 | 0 | 原生4 clips：Fly, Idle, Run, Walk |
| **BarnOwl卡通猫头鹰** | **91,784** | **1个SkinnedMesh** | **1×512** | **原生4 clips：idle, attack, dead, walk** |

R188做了源驱动适配：原R127特有129片羽毛算法只对R84/512运行，不会尝试驱动不兼容骨骼；R73/BarnOwl使用自己原生骨骼动画Mixer和各自的idle/walk/attack/hit/celebrate映射。在真实Chrome体育馆中，BarnOwl为1个真网格、4个原生clips且正在运行idle，R73为16真网格、4个原生clips正在运行Idle，未出现此前的错误rig报错。

对照截图 qa/evidence/r188-light-owl/r188-four-authentic-chrome-stadium-owl-options.jpg：4张真实Chrome WebGL体育馆画面并排，不是AI生成的概念图。高细节原版不再是默认追求；对玩家而言没有卡顿比不必要的纹理复杂度重要。

## C. R188实际性能A/B

原始每组Chrome浏览器内部进行真正的同一套93次魔法施法，原16个角色身份/60卡/46法术/所有专用音效及游戏规则保持完整。跑了**16组真实Chrome完整战斗，合计1488个成功的法术演出，0 Javascript / HTTP错误。** 桌面是1280×720 CPU×2；移动视口430×900 CPU×4；均为Z890 RTX5070Ti的Chrome Vulkan WebGL，不是真手机。

| 模型 | 桌面首次可玩（ms，两次回归） | 桌面被观测最长LongTask | 模拟移动首次可玩（ms，两次回归） | 模拟移动最大rAF |
|---|---|---:|---|---:|
| 原2048 R84 | 3995–4075 | 318ms（一次为0） | 7766–7773 | 616.6ms（另一次66.7） |
| 原512 R187 | 3679–3736 | 0 | 7115–7226 | 150.0ms |
| R73电台猫头鹰 | 3664–3678 | 0 | 7166–7385 | 100.0ms |
| **BarnOwl 92KB轻量鸟** | **3748–3749** | **0** | **7148–7172** | **83.3ms** |

这证明一个更低成本的、真正具有完整原生动画的替代模型可以在不额外增加预热时改善性能。并非保证所有机器都必然同样提升：浏览器LongTask与rAF不是同一种度量，测量存在波动；BarnOwl只是现阶段优先的替换候选。真实Android平台尚未测过，仍不允许发布为全平台不卡。

原始机器可复现回执 qa/evidence/r188-light-owl/r188-real-animated-owl-source-ab-summary.json 和 real-browser-runs目录；原模型未删，SHA256和旧动画保留。

运行时QA开关：
- qa=1&r188Owl=barn：BarnOwl，91,784字节，1网格+原生四动画。
- qa=1&r188Owl=radio：R73电台猫头鹰，1.61MB，16网格+原生四动画。
- qa=1&r187OwlTex=512：原129网格，但缩小贴图。
- 无QA参数：依然使用原R84，正式玩家版和R147主线不变。

## D. 下一阶段实施路线（只做性能）

**P0-1 已完成研发验证：** 选择BarnOwl为最轻的替换候选，R73作为对照，停止重做复杂猫头鹰。

**P0-2 待推进：** 解除全部16份真实人物资源都先下载才可玩的架构堵点，采用初始对战/当前牌组优先载入、后台分批、对即将召唤的卡先预取的设计；不能引入“角色灰模占位”“交战时身份错乱”。

**P0-3 阻断上线：** 等三星Android设备在线，在真实Chromium手机GPU上比较首次可玩、首发真实rAF、LongTask、OOM/context lost、完整战斗帧率；模拟手机视口不算。

**P1-4 有证据再做：** 对G02/T03贴图KTX2、不同画质方案、GPU解码时长与内存A/B。已有阴影频率、DPR限值和静态批处理则保留，不能重复投入研发时间。

**性能发布目标（只是目标，不是实际通过）**：真Android不掉上下文/OOM；首次出牌目标最大≤50ms；常态帧时p95依设备目标控制16.7ms（60fps）或33.3ms（30fps）；首次可玩不能因预热变慢；原游戏规则、角色、出牌、音效必须全部有效。

## E. 全网一手资料目录

1. [Three.js Optimize Lots of Objects](https://threejs.org/manual/pages/optimize-lots-of-objects.html)
2. [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)
3. [Three.js BatchedMesh](https://threejs.org/docs/pages/BatchedMesh)
4. [Three.js KTX2Loader](https://threejs.org/docs/pages/KTX2Loader.html)
5. [Khronos KTX2 WebGL GPU Compression](https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXDeveloperGuideWebGL.md)
6. [Khronos KHR_texture_basisu Standard](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_basisu/README.md)
7. [Khronos Texture Artist Guide](https://github.com/KhronosGroup/3D-Formats-Guidelines/blob/main/KTXArtistGuide.md)
8. [Khronos EXT_meshopt_compression](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_meshopt_compression/README.md)
9. [meshoptimizer](https://github.com/zeux/meshoptimizer/blob/master/gltf/README.md)
10. [glTF Transform Optimizations](https://gltf-transform.dev/)
11. [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
12. [MDN Lazy loading](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Lazy_loading)
13. [PlayCanvas performance guidelines](https://developer.playcanvas.com/user-manual/optimization/guidelines/)
14. [PlayCanvas texture compression](https://developer.playcanvas.com/user-manual/optimization/texture-compression/)
15. [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/overview)
16. [web.dev Optimize Long Tasks](https://web.dev/articles/optimize-long-tasks/)
17. [Chrome scheduler.yield](https://developer.chrome.com/blog/use-scheduler-yield)
18. [MDN WebGL GPU timer](https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query)
19. [Three.js WebGPURenderer](https://threejs.org/manual/pages/webgpurenderer)
20. [2026 WebGPU vs WebGL adverse benchmark](https://games.encrypted-cat.com/devlog/destruction-cars-why-we-stayed-on-webgl/)
