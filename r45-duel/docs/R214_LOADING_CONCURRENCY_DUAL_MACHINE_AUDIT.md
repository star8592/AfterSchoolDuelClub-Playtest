# R214：16角色逐一加载审计 + 并发 2/4/6 真实双机对照（Draft）

2026-11-20。与 R213 的 VRM 元数据优化**并行隔离开发**；共同基线 R212 b645996，不直接改变 R198/main，也不偷偷减少模型数量或动作。

## 先核对：旧架构是12个召唤GLB+4个VRM，已有压缩

- R124早已经用原始 GLB + `.glb.gz` 模式，4 VRM仍正常VRM源文件，不应该再建议“全部转GZIP”作为第一次优化。
- 现有召唤队列有限并发、默认4；加载后仍必须16/16角色全部完成，GLB source和角色蒙皮身份逐项检查。R214保留全部检查、不变更生产默认4。
- **本轮真实增量：** QA专用 `r214Concurrency=1..6`，仅在 `qa=1` 下可设，不影响正常游戏；逐个记录4VRM fetch+decode和验证耗时、12GLB从排队到验证耗时、首次16/16 ready及第一帧渲染时长，便于定点优化，而非猜“越并发越快”。源代码：`scene/scene.mjs`, `scene/summon-models.mjs`。
- 该埋点放在加载入口而不是渲染循环；没有新增常驻粒子、几何或材质，不增加新的远程依赖。

## Z890 / RTX5070Ti / Chrome WebGL 实测（每组独立浏览器上下文，单轮观察）

| 召唤GLB并发数 | 完整16/16模型ready | 首次画面 | 网页等待sceneReady |
|---|---:|---:|---:|
| 2 | 1517ms | 2525ms | 2816ms |
| **4（原默认）** | **1448ms** | **2303ms** | **2429ms** |
| 6 | 1424ms | 2288ms | 2420ms |

6对4只有几毫秒/几十毫秒的微小差距，在单次试验误差范围内；**没有依据将默认4提高到6**。

原始报告 `qa/evidence/r214-loader-concurrency/r214-z890-2-4-6-concurrency.json`。

## XPS 15-7590 / Chrome155原生CDP / Intel UHD630 WebGL 实测

真实Renderer字符串 `ANGLE (Intel, Mesa Intel(R) UHD Graphics 630 (CFL GT2), OpenGL ES 3.2)`。机器也有GTX1650，但**本测试未运行在NVIDIA显卡**。

| 召唤GLB并发数 | 完整16/16模型ready | 首帧 | 页面sceneReady |
|---|---:|---:|---:|
| 2 | 53,970ms | 58,227ms | 59.77s |
| **4（原默认）** | **42,906ms** | **47,602ms** | **50.62s** |

两组实际均16/16加载、R211火水电QA均可显示、原角色正常。**并发2在这个样本里更慢，不能把“低配减半并发”当普适优化**。XPS 24帧rAF样本P95两组均约50.1ms，无法据此称改善了帧率。

逐资源记录揭示：4个VRM的检索和解析在XPS上通常需要17–34s，一些召唤GLB全流程在队列末持续约42–53s；**这里的单模型totalMs包含等待队列时间，不等于单模型独立解码耗时**。需要下一轮进一步拆分缓存命中、下载TTFB、解压、GLTF解析、纹理上传和GPU编译。

原始报告 `qa/evidence/r214-loader-concurrency/r214-xps-native-cdp-concurrency2-4.json`；测试脚本 `qa/r214-xps-native-cdp.py` 与 `qa/browser-r214-concurrency-profile.mjs`。

## 功能回归与边界

- 复跑 `qa/browser-r214-three-real-rule-cards.mjs`：真实E06火3伤害、T05 heal满血回复0、S08电2伤害；仍是官方GLB物理接触，脚本/HTTP错误0。回执 `qa/evidence/r214-loader-concurrency/r214-three-real-cards-rules-chrome.json`。
- 不改变默认4的选择、不创建自适应“猜测”机制，也不降低原先16/16模型就绪门槛。
- 这条并发诊断工具可与R213单独合入新的隔离R215集成测试分支，先复测冷加载和真实游戏，再决定是否推广。
- **严格Draft / NO-GO**。正式版仍R198；未完成多轮冷启动稳定性、GTX1650/弱CPU真实帧时间和所有人物动作美术签收。

