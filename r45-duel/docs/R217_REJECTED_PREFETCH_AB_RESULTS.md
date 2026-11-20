# R217：提前预取六个GLB的负面A/B结论（拒绝合并）

日期：2026-11-21。由R216基线 `95bdad3` 在独立worktree `feature/duel-r217-glb-prefetch-20261121` 上进行，不改变正式R198、R215和R216生产行为。

## 实验机制

- 在QA开关 `r217Prefetch=on` 下，只针对原本使用R124压缩传输的12个GLB，最多同时展开6个网络下载+流式gzip解压任务，仍由原来的4个加载槽完成 `GLTFLoader.parseAsync`。
- 保留全部16/16真实角色、R213原始高精VRM与缩略图优化、R212静态场景、R211火水雷；旧角色原始资产和玩法权威规则不变。
- 这项实验可能暂存更多解压Buffer，存在设备峰值内存风险；未在普通用户会话启用。源码改动已作为**不执行的隔离补丁**保存于 `docs/R217_REJECTED_PREFETCH_EXPERIMENT.patch`。**该补丁不被应用到R216正式运行代码中。**

## Z890 / 原生Chrome GPU：ABBA四轮

| 顺序 | 方案 | sceneReady | 16模型就绪 | 首次renderer.render CPU |
|---|---|---:|---:|---:|
| 1 | 原有 | 2797ms | 1454ms | 695.7ms |
| 2 | 预取6 | 2555ms | 1383ms | 607.2ms |
| 3 | 预取6 | 2399ms | 1412ms | 580.8ms |
| 4 | 原有 | 2361ms | 1386ms | 628.6ms |

全部PASS，始终16/16、8名真实观众、649基础draw calls、70,447,094字节，无JS/HTTP错误。开关之间存在冷/热和驱动历史差异，没有稳定且显著的收益，**不能把毫秒级变化当生产提速**。

原始机读回执与真实Chrome画面：`qa/evidence/r217-prefetch-negative/r217-z890-abba-real-chrome.json` 以及两张 `r217-*-real-chrome.png`。

## XPS / 原生CDP / Intel UHD630（不是GTX1650）

| | 原有方案 | 预取6 |
|---|---:|---:|
| 首次sceneReady | **46.59s** | **56.39s** |
| 16素材加载完成 | 36.307s | 49.858s |
| 首帧完成 | 41.162s | 54.631s |
| 首次render CPU调用 | 4649.8ms | 4597.8ms |
| drawCalls | 649 | 649 |
| wireBytes | 70,447,094 | 70,447,094 |

真实Renderer为 `ANGLE Intel Mesa UHD630`。两组均成功加载完整16模型，质量/贴图和模型身份未变化。24帧rAF样本不支持FPS提速判断；该次预取反而晚约9.8秒进入场景。

原始机读回执：`qa/evidence/r217-prefetch-negative/asdc-r217-xps-prefetch-ab.json`，真实浏览器截图 `asdc-xps-native-r217-baseline.jpg` / `asdc-xps-native-r217-prefetch.jpg`。XPS实验驱动 `r217-xps-prefetch-ab-driver.py`，仅作审计存档。

**决定：R217 不合并，不调整生产默认加载流水线，不推送该被否决的优化代码。** 独立源码补丁仅供后续研究时复现，不作为正式执行入口。继续针对首帧GPU/Shader/纹理上传，保持低配真实验收。

