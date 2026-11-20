# R216：16角色加载阻塞分段审计｜Z890 + XPS真实Chrome（Draft）

日期 2026-11-21，基于R215提交 `00cf209`，分支 `feature/duel-r216-load-stage-trace-20261121`。只增加 **QA诊断**，正式R198不更改；不削减模型精度、不关闭观众、也不修改规则、音效或特效。

## 诊断范围与精度限制

`preloadSummonModels` 的每个原始GZIP压缩GLB文件记录 `queueWaitMs`、`fetchHeadersMs`、`firstChunkMs`、`transferPlusInflateMs`、`gltfParseMs`、`validateMs`、`activeMs`、`wireBytes`、`decodedBytes`。`GLTFLoader.loadAsync`的非GZIP回退路径继续不改，QA会标识 `raw+GLTFLoader.loadAsync`。

`scene.__r45SceneQA.r216LoadStages` 仅在 `qa=1` 导出这些记录和Chrome `PerformanceResourceTiming` 请求时序，同时记录 **首次渲染期 `renderer.render` 的CPU调用耗时**。它不是 GPU timer query、也不是用户实际显示器上的帧时。 `transferPlusInflateMs` 是**流式网络传输与解压重叠阶段**，不能当作单独网络耗时，也不能通过减去网络时间无条件推算解压时间。队列等待和模型处理可重叠，不能把所有模型耗时求和当作总加载时间。

## Z890 原生Chrome真实GPU（R211+R212+R213+R214同时启动）

- 16/16真实模型、8/8真观众、70,447,094字节传输、649 draw calls、JS/HTTP错误0。
- 首次 `renderer.render(scene,camera)` CPU耗时 **929.3ms**，后续6帧 **4.5–6.0ms**。
- 12个真实压缩GLB全部记录分阶段时序；G02 Snow的 `gltfParseMs=654.5ms`、M02食堂阿姨 **582.6ms**、E02纸飞机 **309.4ms**，不能凭 GLB 体积预估解析时间。
- T01猫头鹰的传输+流式解压阶段 **584ms**（11.76MB压缩），占用了明显启动资源。
- 全部16素材身份校验完成1.433秒，网页sceneReady约2.76秒（一次浏览器环境样本，不是长期性能保证）。
- 原始证据 `qa/evidence/r216-load-stages/r216-z890-real-chrome-stage-trace.json` 和真实截图 `r216-z890-all-actors-real-gpu.png`。

## XPS15 / Chrome155 / Intel UHD630 原生CDP 实测

- WebGL2字符串 `ANGLE (Intel, Mesa Intel(R) UHD Graphics 630 (CFL GT2), OpenGL ES 3.2)`，**不是GTX1650真实性能测试**。
- 16/16加载成功、649 base draws、70.45MB，场景ready **45.38秒**，全部模型验证约36.708秒、第一张完整画面约43.723秒。
- 首次 `renderer.render` CPU耗时 **6800.3ms**，后续6次单次约 **15.8–22.6ms**。该首次开销可能包含shader编译、纹理上传、驱动同步等多种工作；不能独立定性为“全部是Shader”。
- 猫头鹰T01请求时序29.64秒（11.76MB），G02请求8.08秒（7.43MB），仅0.15MB的音乐老师M01也花4.70秒。12个GLB `gltfParseMs` 总和约 **1324ms**，其余多个请求高延迟；这里的解析等待可能与GPU/主线程和流读取争用重叠。
- 用同一XPS、同一Z890局域网端口 `requests` 进行独立连续下载：M01 **0.02s/0.15MB**，T01 **0.23s/11.76MB**，G02 **0.16s/7.43MB**。说明**局域网物理传输能力至少在单请求条件下不是45秒耗时的唯一或主要原因**。并发负载不同，不能仅凭单独下载速度将Chrome延迟全部归因于JavaScript阻塞。
- 原始CDP证明 `qa/evidence/r216-load-stages/asdc-r216-xps-load-stages.json`、实机截图 `asdc-xps-native-r216-stages.jpg`、测试脚本 `qa/r216-xps-native-cdp.py`。

## 后续有效方案 / R217实验边界

1. **按阶段分离网络预取与GLTF解析**：对原GZIP文件提前受限并发地取回/解压，解析仍在原有有界队列中进行；预取不得绕开16/16模型验证，也不得更改游戏默认行为，必须以QA开关单独对照。注意内存峰值与流式缓存回收。
2. **可控的GPU shader预编译试验**：尝试Three.js `renderer.compileAsync` 提前编译，看首次`renderer.render` CPU调用峰值是否下降，以及从页面打开到可见完整场景的总耗时是否反而上升。不可以只把卡顿隐藏在加载遮罩下就声称提速。
3. 独立测量真实GTX1650、长期战斗P95/P99、重复≥5轮冷启动/缓存热启动并记录内存/CPU/GPU负载；无证据不合入正式版。

**R216只提供可复现诊断，保持Draft/NO-GO**。后续R217的实验性管线必须有独立开关、独立基线和自动回退，不能覆盖正式R198。

