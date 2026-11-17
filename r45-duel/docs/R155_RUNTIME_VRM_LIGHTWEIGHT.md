# R155 Web 角色模型数据瘦身：剔除不参与渲染的 VRM 封面缩略图

状态：Draft 分支，需美术视觉验收及各类手机真机测量后才可能进入正式默认配置。

## 实测问题与处理

R147 Web 首屏等待 4 个 VRM + 12 个召唤 GLB，全量角色模型第一次网络传输 75,569,762 bytes。角色 VRM 原始文件在 glTF BIN 末端内嵌独立 Thumbnail（用于模型文件预览/元数据），不参与任何 glTF material texture；其尺寸约 1.2–1.4MB/人，随下载和解析带入 Web。

R155 生成完整、可直接由 GLTFLoader 读取的另一个 `*-R155-Runtime.vrm`，**原文件仍保留**。离线构建器（`qa/build-r155-runtime-vrm.py`）仅删除最后的 Thumbnail Image / BufferView / BIN尾端缩略图数据与对应 VRM.meta.texture 元字段。绝不改动全部 mesh、skin、node、accessor、material、texture、animation、blendShapeMaster、几何二进制和已存在的非缩略图纹理资源。

| 资源 | 剔除的真实字节 |
| --- | ---: |
| Shino E01 | 1,282,456 |
| Fumiriya G01 | 1,408,456 |
| Female 主持人 | 1,255,928 |
| Male 主持人 | 1,226,432 |
| **合计** | **5,173,272** |

运行时完整模型下载量：**75,569,762 → 70,396,490 bytes，减少 6.85%**。上述减少量由 Chrome 真实 `__ASDC_LOAD_METRICS.downloadedBytes` 验证；包括12个 GLB，GLB未改动。

## 安全使用方式

- 正式入口默认依然使用未经修改的 4 个源 VRM，不改变 R147 安全回退、演员姿势、卡牌、配音或美术。
- 只有加 `?r155VrmLite=on` 才使用 R155 运行时副本；`?r155VrmLite=off` 立即恢复默认。
- 新旧 VRM 的 `r125` 资产指纹独立绑定真实 SHA256；不能因为文件名相近而使用旧素材缓存。
- Service Worker 只有每种模式的 **4 个 VRM + 同一 12 个 .glb.gz** 参与回填。不会因为仓库提供 20 种文件而一次缓存两套 VRM。
- SW 缓存回填等待激活完成才发送，防止 worker activate 的清理动作与回填竞态。无缓存空间时沿用既有 fail-closed 策略。
- 代码不修改任何游戏规则、点击或战斗消息协议；验证不会把部分模型假装成加载成功。

## 真实浏览器验证

Z890 Chrome/Vulkan，Playwright 浏览器分别加载原版、优化版，测试顺序基线→R155 和 R155→基线，独立隔离 Chrome contexts：

- 两个顺序所有测试均16/16模型已验证、12/12召唤 GLB，E01/G01 骨骼与源身份校验通过、无 HTTP/JS 报错。
- 基线模型 75,569,762 bytes，优化模型 70,396,490 bytes，差值在两个顺序均完全一致。
- 与 CDN/磁盘缓存有关，首次场景就绪秒数在两种顺序中差异很大；**不声称 5MB=速度翻倍**，也不以仅 Z890 高性能机器代表普通手机。
- 真正的 Service Worker QA 使用本地同源静态叠加服务器，分别测试默认和 Lite 模式、缓存数量与角色选择；初版曾观察到回填/激活时序竞态，已通过等待 `navigator.serviceWorker.ready` 修正。
- 严格素材验收：全部纹理与材质引用字节保持不变；删除的只是不参与 glTF material 的封面图。最终视觉仍需人工近景核对。
- 原始回执：`/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r155-vrm-manifest.json`、`r155-vrm-browser.json`、`r155-vrm-browser-reverse.json`、`r155-cache-variant.json`。

## 下一步

真正提升进入速度的下一阶段：合法的纹理/几何有损压缩必须逐素材画面对照；研究以所有可能的出牌为约束的分批加载，并在用户可能出牌前确保实际目标 GLB 完整，否则就不能将准备画面等同于可玩画面。低端 Android 真机与网络条件需独立校准，GPU draw calls、texture upload、主线程 parse、3D动画等分别记录。

**禁止不做视觉或性能回归直接默认开启。**
