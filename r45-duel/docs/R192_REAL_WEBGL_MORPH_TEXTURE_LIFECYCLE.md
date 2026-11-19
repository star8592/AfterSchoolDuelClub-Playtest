# R192｜真实 WebGL 纹理生命周期与 Morph Target 显存预算归因

2026-11-19，Z890 RTX5070Ti / Chrome Vulkan WebGL2。**Draft / NO-GO，隔离在 R191 之上；R147 正式游戏和 main 均未修改或部署。**

## 结论

R191 留下的经典、食堂场景 **69 个未归属纹理对象**不是可以直接删除的闲置图片贴图。R192在真正WebGL上下文创建前安装只读生命周期追踪（仅 `qa=1&r192TraceGpu=on`），追踪 `gl.createTexture` / `gl.deleteTexture` 与 `texStorage3D` / `texSubImage3D`，核对项目 Three.js 源码 `WebGLMorphtargets`：**69/69 对应 Morph Target 的 RGBA32F DataArrayTexture 分配**。

同一时刻WebGL追踪共有 157（经典）或145（食堂）个存活纹理对象；Three.js `renderer.info.memory.textures` 分别为153和141，精确相差4个。这4个来自 Three.js `WebGLState` 初始化的缺省备用纹理，并非本项目角色泄漏。

69份 Morph Target 贴图是面部表情/形态动画的真实GPU数据。**绝不能简单调用 `dispose` 删除。**

## 四组真实 Chrome 交叉验证

开启R190按需GLB、R191无减面发丝索引合并、R192只读追踪。每场是真实Chrome +真实原始人物，不是代理灰模。移动视口仍使用Z890 RTX显卡而非Android GPU。

| 场景 / 视口 | GPU对象 | 其中3D-array分配 | WebGL 3D纹理上传字节量 | 实际召唤源GLB |
| --- | ---: | ---: | ---: | ---: |
| 经典 / 桌面 | 153 | 69 | 64.537MiB | 6 |
| 食堂 / 桌面 | 141 | 69 | 66.233MiB | 3 |
| 经典 / 模拟移动 | 153 | 69 | 64.537MiB | 6 |
| 食堂 / 模拟移动 | 141 | 69 | 66.233MiB | 3 |

这些数据属于 **WebGL API可观察的浮点纹理上传数据字节量**，不是GPU驱动报告的显存峰值；不能将64.537MiB直接当作实际显存占用，也不能仅凭上传数据估算手机OOM阈值。Three.js使用 `RGBA32F` 的 `DataArrayTexture`；`texStorage3D` 的69次分配，与此前69个未归属GPU对象精确对应。调用栈来自真实浏览器，不是静态代码猜测。

## 为什么不强行合并这些脸部数据

真实场景中有89份带 Morph Attribute 的几何体，其中并非全部已经发生GPU数组纹理分配；若干 `Facebaked` 形态目标规格完全相同，同规格组的理论浮点纹素可达数十MiB。

本轮对同尺寸候选执行**完整 TypedArray 逐字节等价验证**，还核对顶点、法线、UV、索引、骨骼权重、所有 Morph Target 数据、绘制分组与范围。当前真实场景 **严格字节相等的可共享几何体组为0**。相同分辨率不代表可替换，因此没有擅自合并不同脸部几何体，没有修改骨骼、表情动画、UV或源模型。具体核验程序见 `scene/morph-texture-budget.mjs` 及独立单元测试。

## 后续抽牌、长局、特效与回归

- 教室 seed6 按需连续真实对战，测试上限12回合，**第6回合正常结束**，真实资源从最初5种累计到9种，5次按需补载，全程未出现空GLB或JS/HTTP错误。
- 这一局GPU纹理对象从122增长到162，逐回合观测为128、130、130、134、142、162。增长与实际角色加入及演出相关，**不应被自动认定为泄漏**。
- 第6回合时活动场景图外的对象数56，其中52次是3D数组纹理分配；另有4个在活动树之外的普通2D纹理对象，需要进一步核对是否存在对局级缓存或正确的生命周期释放，暂不释放。
- R190按需加载保证仍通过；未启用R192新追踪时，R191基线仍为经典372、食堂360，已有R191发丝合并仍为经典153。
- R192新增单元测试检查 WebGL 创建/删除跟踪及“字节相等才能合并”的判定；PASS。
- R192无追踪默认路径的P01完整魔法回归：桌面93次、模拟移动93次，两场46种法术身份均通过，0 JS/HTTP异常。移动视口仍观察到约66.6ms最大帧间隔，绝不宣称稳定60FPS。

## 代码和可复现证据

- `scene/texture-gpu-lifecycle.mjs`：WebGL2底层纹理创建/释放栈与API纹理上传观测；仅R192显式QA启用。
- `scene/morph-texture-budget.mjs`：Float32 RGBA数组纹素预算和保守的逐字节完整几何对比；不会修改几何。
- `scene/texture-gpu-audit.mjs`：R191场景贴图审计补充GPU追踪ID，用来和底层WebGL分配闭环。
- `qa/browser-r192-webgl-texture-trace.mjs`：真实Chrome桌面和模拟移动纹理分解、模型身份、无错误截图。
- `qa/browser-r192-five-turn-gpu-lifecycle.mjs`：可设置 `R192_TURNS=12` 的真实引擎长局逐回合对照（名字沿用最初5回合测试，支持更长测试）。
- `qa/unit-r192-texture-lifecycle.mjs`：不依赖浏览器的跟踪器和重复合并安全单测。
- `qa/evidence/r192-gpu-lifecycle/r192-four-scenes-summary.json`：四组核心GPU对象/上传证据聚合；原始逐对象大日志保留Z890工作区。
- `qa/evidence/r192-gpu-lifecycle/r192-six-turns-summary.json`：6回合真实补载/纹理变化。
- `qa/evidence/r192-gpu-lifecycle/r192-four-real-chrome-screens.jpg`：四张真正浏览器游戏画面并排。

验收命令示例（Z890隔离工作区提供本地静态服务）：

```sh
node r45-duel/qa/unit-r192-texture-lifecycle.mjs
R192_TRACE=on R192_HAIR=on R192_DECK=classic R192_SEED=173 node r45-duel/qa/browser-r192-webgl-texture-trace.mjs
R192_TURNS=12 node r45-duel/qa/browser-r192-five-turn-gpu-lifecycle.mjs
```

## 安全边界及后续工作

1. **本轮只诊断，不改渲染器内核或角色精度；没有任何真实玩家性能开关被默认打开。**
2. Android真机仍未完成 R192 纹理/实际显存峰值、context-lost、OOM及完整战局验证；模拟移动视口不代替真机。历史S21低内存崩溃证据仍构成发布阻断。
3. 目前发现的四个活动场景图外普通2D对象，还需要结合其生命期及缓存引用判断是否值得显式释放。不能用按回合简单清空缓存导致素材反复上传、再次卡顿。
4. 后续若研究R192的RGBA32F→RGBA16F形态纹理压缩，必须**另外隔离做顶点/表情数值误差、动画A/B截图、不同GPU格式兼容性与手机真机测试**，不能直接替换正常Three.js实现。
5. 当前R190 PR #170、R191 PR #171均为隔离Draft，本轮R192继续Draft；**主分支、R147玩家版本均不触碰。**

**Release：NO-GO。当前确定的是69份资源真正用途与64.5～66.2MiB真实WebGL API上传量，而不是GPU显存或手机版性能已经优化完成。**
