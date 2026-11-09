# R34 · 音乐老师本地 Pixal3D 真实三维候选

## 实际交付
- 全部三维生成在 Z890 本地完成，没有调用付费云模型。
- reference/M01_r32_single_character_reference.webp 是 R32 页面的音乐老师单张立绘，569×940，SHA256 517ea0f2e80021ace903d5176e320730fba7210124ef59b699fbfc934f43ba5d。它不是先前 1448×1086 原始设定集或准确多视图。
- input/M01_isolated_birefnet_rgba.png 使用本机 BiRefNet-General-Lite CPU 抠图，人工检查比 U2NET 前景完整；不是创造新的高分辨率人物细节。
- model/M01_candidate.glb 使用本机 Pixal3D Q8_0 SV CUDA 1024 推理生成，真实 GLB v2，共 41026032 字节，SHA256 337c3b990ba4be0e292169a296a4667fb4cbb8904a8a572bcca25f74f5b1b291。
- 实际三维结构为 934492 三角面，1 Mesh，2 张贴图，0 骨骼，0 蒙皮，0 动画。这是静态3D模型，不是2.5D平面立绘，也还不是可完整表演的战斗角色。
- index.html 是可 360° 旋转、缩放、视角切换的真 WebGL GLB 验收页，所有 Three.js 依赖本地随目录提供。
- qa/evidence/R34_REAL_4VIEW_CONTACT.jpg 来自 Blender 5.2.3 Cycles CPU 对真实 GLB 的四个角度渲染。
- qa/evidence/r34-*.jpg 来自单独 Chromium+SwiftShader 的真实 WebGL 浏览器截图，GLB 加载通过且 JS 异常0。不能据此宣称 NVIDIA Vulkan 硬件浏览器已通过：系统Chrome无头进程曾在跳转时退出。
- 记录了 Pixal3D 生成与 H3 Asset Factory 的实际回执；Godot 导入已核验，自动缩略图首次失败，由独立 Blender 与 WebGL QA 补充。

## 质量边界
- ART_APPROVED=false，rigged=false，rulesIntegrated=false。
- 需继续完成：原始设定集精确校对、背面与衣摆审美检查、减面、骨骼蒙皮、指挥棒独立施法动作、脚接触、技能动画、18卡玩法集成与平衡。
- DINOv3 与图片权利还需核查，right_to_sell_output=NOT_VERIFIED。
- 独立候选版不改变 R25 可玩主页、原18卡或 PlayMoru 正式网站。
