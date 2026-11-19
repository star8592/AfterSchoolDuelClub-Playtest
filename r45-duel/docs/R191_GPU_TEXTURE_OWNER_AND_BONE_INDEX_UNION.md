# R191｜GPU纹理资源归因：骨骼纹理，而非体育馆贴图，是对象数量的主要来源

2026-11-19；Z890 RTX 5070 Ti、Chrome Vulkan WebGL2。隔离性能实验，**Draft / NO-GO，未改 main 和正式 R147，未部署**。

## 核心技术事实

R190的360～372是Three.js `renderer.info.memory.textures` 中的GPU纹理对象计数，**不是显存字节数**。原R187只统计了图片图像，因此无法解释高数量。R191新增 `scene/texture-gpu-audit.mjs`，通过真实Three.js场景树递归追踪材质贴图、ShaderMaterial uniforms、`SkinnedMesh.skeleton.boneTexture`、阴影贴图与WebGL分配属性。

真实Chrome经典场景基线：372个GPU纹理对象；活动场景可追踪到303个已经分配的纹理，其中**265个是骨骼动画纹理**，其余包括VRM材质、体育馆地板PBR贴图、场边布景、巨幕、阴影贴图。另有**69个对象不能由当前场景图完全归属**，可能包含不在活动树中的缓存、内部render targets或已预热但仍存活的资源；无证据时**绝不判为泄漏，更不释放**。

既有R181安全合并方法保留人物真实原始UV、权重、法线、骨架、动画和纹理，验证等价后只把共用顶点缓冲的发丝Index分段合并。R191联合R190真实按需加载路径复测，证明该优化额外减少**219个BoneTexture以及219个Draw Calls**。

## 八组同条件真实Chrome A/B（每组单次，不能外推跨设备）

| 牌局 | 视口 | 原版GPU纹理 | R191 GPU纹理 | 原版Draw Calls | R191 Draw Calls | 原版→R191骨骼纹理 |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 经典 seed173 | 桌面 | 372 | **153** | 491 | **272** | 265→46 |
| 经典 seed173 | 模拟移动 | 372 | **153** | 493 | **274** | 265→46 |
| 食堂 seed2 | 桌面 | 360 | **141** | 414 | **195** | 255→36 |
| 食堂 seed2 | 模拟移动 | 360 | **141** | 416 | **197** | 255→36 |

所有8次PASS；同一对比的差异仅为 `r181HairBatch=off/on`。仍按R190只加载当前真实卡组需要的GLB：经典6、食堂3。真实角色和法术未降模，阴影贴图随视口保留原尺寸策略。Chrome 视觉并排图已保存，经典和食堂画面两次非逐帧锁定RGB平均绝对差约0.042/255；只可用作可视回归参考，不可代替动作的完整人工目视验收。

**严格区分数量与字节：**219个减少的是WebGL资源对象，下降约59%（经典）或61%（食堂）；BoneTexture是浮点RGBA，按16 byte/texel估算仅节省约 **1.62 MiB纹素数据**。该估算不包括真实driver分配、对齐、mipmap或显存管理；**绝不可宣称整机VRAM下降59%**。另一方面，219次Draw Calls减少是真实的场景渲染调用差值，可能改善CPU/GPU提交压力，但没有成对测得稳定帧率提升，更不可宣称Android OOM已解决。

## 真实46法术完整安全回归

启用R190按需加载与R191发丝合并，用本局真实就绪的T01/E04角色对战，不伪造没有加载的E03：

| 真实Chrome | 主展示道具 | 实际施法 | 不同魔法 | 完成 | 首发最大rAF间隔 |
| --- | --- | ---: | ---: | --- | ---: |
| 桌面 CPU×2 | P01 | 93 | 46 | PASS | 33.4ms |
| 桌面 CPU×2 | X08 | 93 | 46 | PASS | 33.4ms |
| 模拟移动 CPU×4 | P01 | 93 | 46 | PASS | 83.3ms |
| 模拟移动 CPU×4 | X08 | 93 | 46 | PASS | 83.3ms |

4组共**372次真实Chrome法术演出全部通过，0 JS/HTTP错误**；原版校园喜剧法术资源、角色骨骼与受击互动保留。移动视口p99在这两组为50ms，仍有长帧，不应描述为60fps稳定。

首次用旧测试夹具强行放入R190尚未请求的E03，产生`R61 missing actual 3D asset E03`，属于测试牌局前置条件错误及正确的fail-closed行为；更换为真实起手包含且已完成GLB校验的E04后4组PASS，未修改引擎安全约束。

## 隔离门控、原始回执与运行

- `qa=1&r189Stream=on&r190Demand=on&r191GpuBudget=on&r191TextureAudit=on`：R191一键安全实验；`r191GpuBudget`只是既有R181无减面骨骼发丝合并的QA别名。
- 未设置 `qa=1` 时R191 GPU开关完全失效；正常玩家保持R147既有行为。
- `qa=1&r189Stream=on&r190Demand=on&r181HairBatch=off&r191TextureAudit=on` 为R190基线对照。
- 源码：`scene/texture-gpu-audit.mjs`，独立浏览器回归：`qa/browser-r191-texture-owner-audit.mjs`。
- 8组Chrome原始完整快照在Z890 `qa/evidence/r191-gpu-textures/*hair*.json`，GitHub保存聚合回执`r191-eight-a-b-summary.json`。
- 真Chrome四张场景并排：`r191-four-real-chrome-visual-comparisons.jpg`。
- 4组法术原始输出保存在Z890 `/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r190-demand-93/` 相应`r191hairv2`目录，GitHub保存`r191-four-real-93-casts.json`。
- 可重跑（Z890工作区HTTP服务端口18687）：`R191_HAIR_BATCH=on R191_DECK=classic R191_SEED=173 R191_VIEW=desktop node r45-duel/qa/browser-r191-texture-owner-audit.mjs`。

## 未达标与下一阶段

1. 目前有69个GPU对象未归属活动场景树；继续通过GPU创建时间、缓存/离屏材质/骨骼引用链追溯，不允许凭数量盲删。
2. 没有拿到Chrome GPU真实纹理分配字节数或Android系统显存峰值，因此不应将对象数、CPU JS堆或者纹素理论值当作VRAM。
3. Z890接有Samsung S21，但Android Chrome CDP当前未就绪，系统可用内存约2.3GB，历史有系统`LOW_MEMORY`杀掉渲染进程的证据。本轮没有扰动手机浏览器，也没有冒险反复启动重压测试；**真Android未通过、保持NO-GO**。
4. R191已在Z890桌面浏览器与模拟移动视口对全46魔法回归，但需要真实Android一次轻量启动、GPU memory/context-lost、长局连续抽牌和帧时间A/B后才能考虑开启给玩家。
5. 原R190仍Draft，不合并、不部署；本分支只用于可验证QA复现，不改人物外观、不升级美术或下载大量无关GLB。

**结论：真正定位了GPU对象大户——骨骼纹理；R191复用了R181无损索引合并，将WebGL纹理对象减少219并同步减少219次Draw Calls。对象优化成立，但显存危机和手机流畅性尚未证明解决。**
