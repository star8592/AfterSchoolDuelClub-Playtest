# R193｜校园法术文字纹理生命周期与 Morph Target 半精度实 GPU A/B

**2026-11-19 · 隔离性能分支 · Draft / NO-GO；不修改正式 R147 或 main。**

## 一、6 回合临时纹理归因

R192 末尾活动场景树外出现的普通二维纹理，通过 R193 WebGL 底层 `activeTexture/bindTexture/texStorage2D/texSubImage2D` 追踪确认：

- 对战 seed6 实际进行 **6 回合**，游戏正常结束，真实场景缓存 **7** 个校园法术文字标签；
- 同一时间场景图外存活的 **8** 个二维纹理，分别为 **7 个 768×184** 的 `CanvasTexture` 标签和 **1 个 1×1** 的 Three.js 引擎后备纹理；
- `campus-school-magic.mjs` 的 `labels: Map` 以标签文字作 key，标签材质复用 `labelMaterials`，舞台 `dispose()` 时会调用 `texture.dispose()` 和清空 Map；生命周期一致。
- **不是已证实泄漏，不按回合强制清空缓存**。相同文字再次施法不应为了减少计数重复创建/上传纹理。
- 半精度 93 次施法覆盖 **46 个身份**，舞台唯一文字牌匾缓存为 **42** 个。该缓存可能贡献移动端常驻内存，应在后续考虑无损的 RGB 纹理格式、图集/批处理，而不是缩小字样或加大模糊。

证据：`qa/evidence/r193-texture-lifetime/r193-2d-owners-six-turns.json`。

## 二、真正的 RGBA16F Morph Target GPU A/B：不是理论推算

上一轮对 69 个额外分配已归因为 Three.js `WebGLMorphtargets` 的 `DataArrayTexture`。**R193 在 Playwright 单独浏览器会话里拦截这一份 Three.js 模块的网络请求，只对同一函数里的形态目标 `Float32Array` 作半精度转换，`texture.type=HalfFloatType`。**

对照过程不修改仓库 `assets/three/build/three.module.js` 本体，也不修改源 GLB、几何骨骼、UV、法术表现、原始贴图或者卡牌规则。已用实际 WebGL2 `texStorage3D` 内部格式确认：

- 32 位：`RGBA32F=34836`，真实上传量经典 **64.537 MiB**、食堂 **66.233 MiB**；
- 16 位：`RGBA16F=34842`，真实上传量经典 **32.268 MiB**、食堂 **33.116 MiB**；
- **69 个原有 Morph Target 纹理对象数完全不变**，仅精度/单纹素存储位宽改变；两者差约 **50% 的实际 API 上传数据字节量**；
- 经典桌面、食堂桌面、经典模拟移动三个 32/16 A/B 配对，**6/6 个真实 Chrome 渲染均成功**；相应实际原始 GLB 6/3/6，0 JS / HTTP 错误；
- 数值并非驱动级显存计量，不能保证对所有 GPU 实现都有相同 VRAM 节约或 FPS 收益。

| 场景 | 正常 RGBA32F 上传 | 实验 RGBA16F 上传 | A/B |
|---|---:|---:|---|
| 经典桌面 | 64.537 MiB | 32.268 MiB | PASS |
| 食堂桌面 | 66.233 MiB | 33.116 MiB | PASS |
| 经典模拟移动视口 | 64.537 MiB | 32.268 MiB | PASS |

真实对照截图：`qa/evidence/r193-texture-lifetime/r193-six-real-chrome-float32-vs-float16.jpg`。每格使用真实原始游戏人物和真正渲染画面，绝非概念图或灰模。

## 三、精度实际测量与截图像素回归

对真实活动场景中的几何形变 BufferAttributes 执行 **IEEE754 半精度往返数值核验**，不写回任何顶点：

- 经典场景形态目标**位置分量** 11,947,272 个：软件半精度最大绝对误差 **0.000488**、RMSE **0.000006**，误差大于 **0.001** 的分量 **0**；
- **法线分量** 11,947,272 个：最大绝对误差 **0.000976**、RMSE **0.000015**，大于 **0.001** 的分量 **0**；超出半精度范围的数值 **0**；
- 食堂场景位置/法线各 12,114,000 分量，最大误差保持在同一量级；
- 逐个转换 `DataUtils.toHalfFloat` 与 Chrome 原生 `Float16Array` 并非逐位总相同：250,000 个实测抽样中 **18,867 个编码不同**，**17,427 个原生结果更接近原始浮点数，0 个更差**；原生抽样最大误差 **0.000455**，大于0.001为0。这是针对已采样数据的结论，不是所有浮点值的数学保证。
- 独立截图比较 `ImageMagick compare -metric AE`：经典桌面 1446 像素（**0.157%**）、食堂桌面 1098（**0.119%**）、经典模拟移动 280（**0.072%**）。**这是分别启动的实时画面截图，不是精确锁定同一动画时间戳，不能把全部像素差异归因于量化。** 当前未显示大范围视觉偏差，仍须人工审看表情动画。

## 四、186 次真实魔法回归及性能约束

原始 3D 人物 T01（猫头鹰）与 E04，仍使用高精真实源 GLB、原骨骼/材质，P01 校园法术角色：
- `browser-r193-half-93-spells.mjs` 实测 **桌面93 + 模拟移动93 =186次**，每套覆盖46种不同法术身份，全部PASS，错误为0；输出 `r193-186-half-spells.json`。
- 半精度移动模拟 `p99` 帧间隔 **50ms**、最大 **66.7ms**；不认为已经消除了手机卡顿。
- 额外的 CPU float32→float16 转换可拖慢初始化。一次条件相同的 CPU×2 样本：32F=2900ms，16F软件循环=3015ms，16F原生转换=2957ms；CPU×4 样本：32F=5487ms，16F软件循环=5722ms，16F原生转换=5405ms。样本小，有自然抖动，不能宣称原生方案一定更快，**但已证明软件逐分量转换可能抵消 GPU 内存收益，必须采用可控转换路径和启动时间门槛**。
- 三维纹理节省 ≠ GPU 渲染调用数下降：经典仍 153 个纹理对象；R191 原有无减面索引合并保持不变。

## 五、实现及安全隔离

| 文件 | 作用 |
|---|---|
| `scene/texture-gpu-lifecycle.mjs` | QA 专用 WebGL 2D/3D 绑定、分配/上传、释放追踪，精准标记待归属纹理 |
| `scene/morph-half-error-audit.mjs` | 真实 Morph Attribute 数值精度审计，**只读** |
| `qa/r193-half-morph-overlay.mjs` | **只供浏览器自动化的临时网络模块替换**；支持软件及原生 `Float16Array` 两条转换路径 |
| `qa/browser-r193-qa-half-morph.mjs` | 真实 Chrome 32F/16F GPU格式、位置/法线精度、截图、CPU×2/×4测量 |
| `qa/browser-r193-half-93-spells.mjs` | 半精度下的完整真实魔法演出回归 |
| `qa/browser-r193-2d-texture-lifetime.mjs` | 真实卡牌、AI回合、文字纹理跨回合缓存追踪 |
| `qa/unit-r193-half-overlay-and-2d.mjs` | 保证未修改真正 Three.js vendor；验证二维缓存对象与 WebGL 绘制解绑/销毁追踪 |

验证命令示例（Z890 隔离本地 QA 服务器 `127.0.0.1:18687`）：

```sh
node r45-duel/qa/unit-r193-half-overlay-and-2d.mjs
R193_DECK=classic R193_HALF=off node r45-duel/qa/browser-r193-qa-half-morph.mjs
R193_DECK=classic R193_HALF=on R193_NATIVE=on node r45-duel/qa/browser-r193-qa-half-morph.mjs
R193_TURNS=12 node r45-duel/qa/browser-r193-2d-texture-lifetime.mjs
```

## 发布判断

**R193 = Draft / NO-GO**。HalfFloat 实验是强候选，**尚未进入正常玩家的游戏代码**。原因：

1. **真正 Android GPU / Chromium 版本、RGBA16F采样兼容、GPU context-lost恢复与OOM仍未过验收**。USB 接入 S21 目前正在运行闲鱼业务，避免干扰电商自动化，未擅自启动内存压力测试。
2. 尚无真实手机上的显存峰值、热机长局表现数据；截图肉眼和数值误差小，不等于所有动态表情都通过。
3. 若要进入真实游戏，应先解决 CPU 转换峰值、改为安全 Feature Flag、旧设备回退，完成 `RGBA32F↔RGBA16F` 可逆 A/B 与发布回退，再由真人验收。
4. 保留所有真实模型、丰富动作、荒诞校园魔法演出、音频，不用削减表情数量或低精贴图换取虚假“优化”。

因此，在本阶段 **只提交诊断代码、QA 实验和证据，不上线，也不合并到主线**。
