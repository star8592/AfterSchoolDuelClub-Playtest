# R159 · 质量优先：VRM 缩略图无画质损失优化

日期：2026-11-18。独立于含有低DPR及羽毛法线降采样实验的 R154–R156 分支。

## 质量硬要求

- 保留所有真正的角色网格、骨骼、蒙皮、材质贴图压缩原始字节、表情和动画。
- 只移除 VRM 0.x 中不被任何真实材质贴图引用的文件封面 Thumbnail 以及对应 VRM.meta.texture 预览索引。
- 原始四个 VRM 文件全部保留，新增四个 -R155-Runtime.vrm 作为可选资源。
- 默认仍是原 R147；必须显式通过 ?r155VrmLite=on 启用新资源，?r155VrmLite=off 可以回退。
- 不包含 R154 的像素倍率降低，也不包含 R156 羽毛纹理 2048→1024/512 的近似改变。

## 结构级别逐字节验证

qa/build-r155-runtime-vrm.py 在处理四个 VRM 时执行严格断言：
- 其 mesh / node / skin / accessor / material / texture / animation / sampler JSON 对象不变；
- 全部非 Thumbnail 图片和几何 BIN 内容逐字节一致；
- VRM 角色 blendShapeMaster 表情保持不变；
- 删除的是唯一位于文件末尾、且没有被 glTF.material 引用的 Thumbnail。
构建器、四个运行时 VRM 和 SHA256 清单都在 PR 内。

## 两项零美术质量损失的真实联合成果

| 组合 | 实际 16 模型网络字节 |
| --- | ---: |
| R147 原模型 | 75,569,762 B |
| R157 12 GLB gzip 字节完全无损重新编码 | 74,869,174 B |
| R157 + R159 剔除四个VRM封面缩略图 | 69,695,902 B |

共减少 5,873,860 B（7.77%）。

严格保留 60 张卡牌、12 个召唤角色、4 个实际 VRM 身份以及 R147 摄像机保护。
真实 Chrome Vulkan 同源浏览器加载 / 战斗回归结果：
- 默认与轻量模式均实际 16/16 模型加载和双角色战斗通过；
- 默认缓存 4原始VRM +12GLB =16；轻量缓存 4运行时VRM+12GLB=16；
- JavaScript/HTTP 错误均为 0；
- 20 项官方源/候选资产 SHA256 核验通过；
- R157 单独已有桌面/模拟手机共 8/8 浏览器回归，组合浏览器测试另行完成。

机器可读证据：
- qa/evidence/r159-strict-visual/browser-cache-variant.json
- qa/evidence/r159-strict-visual/vrm-structural-manifest.json
- qa/evidence/r157-strict-lossless/

## 缓存与发布安全

R125 的20种资产指纹不代表每次缓存20项。SW 按页面实际模式只回填16项，旧模型与新模型的 URL/哈希隔离，注册后等待 worker.ready 避免初始化与回填竞态。
正式发布必须有真实手机及人工视觉验收、GitHub发布复核；当前维持 Draft 和默认 R147。

注：缩减网络字节不等于首帧时间同比改善；实际秒数仍受缓存、网络、CPU、GPU 影响。KTX2/程序化绘制可能改变纹理采样，不能与严格画质无损混为一谈。R158 的大资源优先调度在桌面与手机结果不同，本阶段不强制改变默认。
