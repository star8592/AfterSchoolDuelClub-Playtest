# R218：首次成功在XPS真实GTX1650上运行完整竞技场｜OpenGL对比Vulkan

日期：2026-11-21。基于R216隔离实验版真实Chrome155 CDP，不更改XPS系统默认显卡、用户日常浏览器/Chrome配置或正式R198部署。两组均独立Chrome临时profile，使用PRIME Offload `__NV_PRIME_RENDER_OFFLOAD=1` / `__GLX_VENDOR_LIBRARY_NAME=nvidia`，并显式 `--disable-software-rasterizer`；Vulkan另加 `__VK_LAYER_NV_optimus=NVIDIA_only`。WebGL debug renderer真实返回NVIDIA，而不是仅因机器存在该显卡便宣称NVIDIA性能。

## GTX硬件实际识别

- XPS15-7590 原生NVIDIA驱动580.178.04，`nvidia-smi` 识别 **GeForce GTX 1650 4096MiB**。
- OpenGL: `ANGLE (NVIDIA Corporation, NVIDIA GeForce GTX 1650/PCIe/SSE2, OpenGL ES 3.2)`。
- Vulkan: `ANGLE (NVIDIA, Vulkan 1.4.312 (NVIDIA NVIDIA GeForce GTX 1650...), NVIDIA)`。
- 尝试`--use-gl=desktop`的独立Headless WebGL失败，未当作可用路径。
- 原生烟测脚本 `qa/r218-nvidia-gpu-smoke.py`，完整真实场景脚本 `qa/r218-gtx1650-real-game-cdp.py` 和双后端240帧 `qa/r218-gtx1650-longrun-cdp.py`。

## 真实完整竞技场加载与画面

两种后端均真实16/16素材、真实R211场景与R212 649基础drawCalls、R213缩略图优化后70,447,094字节加载、无软件渲染回退。测试是浏览器Headless资源负载和rAF帧间隔，不是GPU timer query，也**没有覆盖整局合法出牌长时间魔法峰值**。

| XPS GTX1650 | OpenGL（240帧） | Vulkan（240帧） |
|---|---:|---:|
| 首次完整场景ready | 51.38s | 46.04s |
| 模型验证完成 | 46.992s | 38.734s |
| 首张完整画面 | 49.902s | 44.752s |
| 首次 `renderer.render` CPU耗时 | 2775.5ms | 5680.5ms |
| rAF间隔平均 | **16.87ms** | **34.58ms** |
| rAF中位 | **16.7ms** | **33.3ms** |
| rAF P95 | **16.7ms** | **50.0ms** |
| rAF P99 | 16.8ms | 50.1ms |
| 240帧中间隔>50ms | 1 | 7 |

另有一轮独立GTX1650 OpenGL只测24帧：sceneReady 61.11s、首次render CPU6399.2ms、P95 16.7ms。**首帧CPU调用耗时在OpenGL样本间差异也很大**；不能用较优的2775.5ms声称已经根治首次Shader/纹理上传阻塞。

证据：
- `qa/evidence/r218-gtx1650-hardware/asdc-r218-gtx1650-real-scene.json`
- `qa/evidence/r218-gtx1650-hardware/asdc-r218-gtx1650-gl-vulkan-longrun.json`
- `qa/evidence/r218-gtx1650-hardware/asdc-xps-native-r218-gtx1650-gl.jpg`
- `qa/evidence/r218-gtx1650-hardware/asdc-xps-native-r218-gtx1650-vulkan.jpg`

说明：两份JSON中的 `original_note_inherited_from_prior_template` 是旧Intel CDP测试脚本的不准确描述，仅为了保留测试原始来源；`note` 和 `method_note_corrected_after_capture=true` 是**仅修正文案的测试方法说明**，没有更改任何测量字段。

## 结论与下一步

1. 这个特定XPS Chrome155 Headless / GTX1650 环境，**OpenGL持续帧间隔明显优于Vulkan**；现阶段不改动用户图形后端默认选择，不主推Vulkan。
2. 首次资源等待46–61秒仍远超合格水平，GPU首次完整draw会出现2.8–6.4秒CPU阻塞。必须继续拆解Shader首次编译与纹理上传、网络流式读取与浏览器事件循环争用，不是只靠启用独显。
3. 240帧中魔法QA预览会逐渐消散，**非整段240帧连续高负载对战**；需真实长回合合法出牌与不同窗口分辨率压力测试后才允许宣称FPS合格。
4. 仍 **Draft / NO-GO**，完整高精角色和火水雷原创表现、8名观众与所有法术规则均不可为了追求FPS直接删减；正式R198及main不动。

