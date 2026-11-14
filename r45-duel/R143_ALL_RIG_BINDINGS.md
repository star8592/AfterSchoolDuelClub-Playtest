# R143：全角色骨骼绑定、蒙皮权重与层级重构审计

基线：`main` R142，提交 `55cbe87`。用户要求**检查并矫正所有绑定问题**，不能用增加空骨骼动画、整体根节点晃动或更换低模替代。此文档区分文件合法、骨骼结构正确、动态接地、审美合格与上线状态。

## 1. 87 份资源全量逐顶点审计

`qa/r143-audit-all-bindings.py --all` 在 Z890 扫描 `assets/summons` **83 份 GLB** 与 `assets/model` **4 份 VRM**，合计 **87 份、5,284,204 个带权重顶点数据项**。扫描内容：

- 每个渲染节点及每个几何 primitive 的 `JOINTS_0/WEIGHTS_0`，存在时继续验证 `JOINTS_1/WEIGHTS_1`；
- 骨骼索引范围、顶点权重的总和、非有限值、负权重、可见模型皮肤绑定与 source joint 的对应；
- skin `inverseBindMatrices` 与 source joints 数量和有限性；
- 顶点真实影响骨骼、骨骼直接影响顶点数，区分**有骨骼名字但没有任何可见皮肤权重**的节点；
- 原版和旧版本中有些资产仅使用形态目标动画，可能声明了 skin 但不包含 active weighted skinned meshes；属于具体导出方式，并非自动判定为模型损坏。

正式 R97、M01 音乐老师、M02 食堂阿姨和四位 VRM 文件包含 **`EXT_meshopt_compression`**。初版解析器把压缩 fallback buffer 当作外部文件误报坏数据。现已新增 `qa/r143-expand-vrm-meshopt.mjs`，使用仓库中游戏实际使用的 meshopt 解码器，仅生成审计用临时派生 GLB，不覆盖作者原始二进制。Rain 真实下肢骨名为 `DEF-Shin1.L`，不是某些其他角色的 `DEF-Knee1.L`；判定逻辑已纠正。

**第二次全量文件完整性检查为 87/87 通过**，未发现上述数据层的无效权重索引、反向绑定矩阵缓冲损坏或蒙皮权重数值坏值。该结果**不表示关节拓扑和动态艺术质量已全部过关**。

## 2. 发现的真实骨骼拓扑缺陷

E03 Ellie、E04 Phil、G03 Jay、G04 Victoria、T04 Rex 的高精原始 BakedRest GLB 中：
- `DEF-Spine`、`DEF-Chest`、`DEF-Neck`（若存在）、`DEF-Head` 和左右 `DEF-Shoulder` 多数挂在同一 `RIG-*` 根节点。
- 因为父子连接丢失，胸部和脊柱转动不自动传递给头部及肩膀/双臂；此前只修手臂和腿部会导致远景“像木棍”，动作相互脱节。
- E04 源模型没有标准命名的 `DEF-Neck`，不能伪造；将头直接连接到原 `DEF-Chest`。
- Snow G02 和 Rain T03 使用另一套作者原绑定方案。Snow `DEF-Hips` 有 **621 个直接受影响顶点**，Rain `DEF-Pelvis` 有 **3288 个直接受影响顶点**。这两套原结构不应强改成扁平模型的绑定方案。
- Rex T04 的 `DEF-Hips` **0 个直接受影响顶点、0 个子骨**。R142 已删除对它无效的第17条动作轨；R143 不重新引入空动画。若要求真正独立骨盆/臀部变形，需要从 Rex 的原 Blender 源文件上重建父子结构和权重后导出新 GLB，再做源资产审计。

## 3. 实际修复代码与原皮肤保护

`scene/r143-source-trunk-bind.mjs` 对上述五个 BakedRest 原角色，先验证原始扁平拓扑以及四个来自真实 SkinnedMesh 的有效权重顶点，再用 `Object3D.attach` 在**保留骨骼当前世界姿态**前提下修复：

`DEF-Spine → DEF-Chest → (DEF-Neck) → DEF-Head`

以及 `DEF-Chest → DEF-Shoulder.L / .R`，继承此前已经修复的真实臂链。每个角色 4～5 条本体链接，没有额外代理骨。GLB 文件、inverse bind matrices 和顶点权重**一律不修改**。改动可回退，不影响普通 R97。

首次 Z890 RTX Chrome（1440px/430px）、七演员 Idle / Attack / Hit / Celebrate 全身动态测试结果：**394/394** 通过，五位修复演员可见顶点源静止姿态最大偏差约 `3.17e-10` 到 `6.17e-9` 个场景单位；Snow 和 Rain 没有被错误重绑。见 `qa/browser-r143-seven-source-trunk.mjs`。G03 重连躯干后发现原鞋底下探曾比旧补偿上限深约 `0.00477`，因此 `scene/r133-source-shoe-contact.mjs` 只在明确激活 R143 原躯干修复的 Jay 上启用新的有界最高 `0.108` 修正；普通 R142 不变。新的 G03 配置已通过首次 394 项专项。

## 4. 开关、发布与剩余工作

- 已把修复设为只对**显式启用的 R134/R135/R136 原高精实验角色**默认生效；提供 `?r143Rig=off` 单独回退。普通无参数游戏仍用 R97。
- `qa/browser-r143-trunk-rollback-default.mjs` 专门检查旧正式资产完全不变以及五人局部回退。默认启用后的新版 394 项和完整 R142 944 项历史回归也是合并条件。
- Zoria 远程执行短暂中断后已恢复；最终代码重新完成七角色实际默认重绑 **394/394**、`r143Rig=off` 回退与普通 R97 隔离 **46/46**、R142 历史全部回归 **944/944**。Z890 严格汇总 `qa/r143-acceptance-summary.py` 返回 **`R143_1384_REAL_GPU_87_ASSETS_PASS`**。共 **1384/1384 项真实 GPU 检查通过，另有 87/87 份资源、5,284,204 个蒙皮顶点的文件级审计通过**。
- 最终证据写入 `qa/evidence/r143/source-trunk/r143-convergence.json`，逐资源完整摘要 `qa/evidence/r143/r143-compact-binding-report.json`，七角色 GPU 实测摘要 `qa/evidence/r143/source-trunk/r143-compact-trunk-gpu.json`。代码可以合入唯一 `main`，但**仍不得宣称普通玩家高精默认切换或正式公网部署**。
- 不可把 `artApproved=false` 改为 true。真实低端手机、导演85/100视觉评分、全部角色和看台观众戏剧化表演、Rex 独立有效骨盆权重的资产级重构，仍须单独证据。
