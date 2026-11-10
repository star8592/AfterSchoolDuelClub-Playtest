# E02 · R59 原生 GLB 动作实验

**状态：TECH VERIFIED / ART NO-GO / PRODUCTION NO-GO。** 只增加真正 glTF2 动作；没有重新生成模型几何、贴图、风格原画。

## 原始素材与可追溯性

- 输入：R57 真实纸飞机 `E02-PaperPlane-R57-Refined-STUDY.glb`；SHA-256 `39ea3edd5e365210e94530c7f1b23cf0d490417a9b5f655be2dbf33e0b7a5478`。
- 原始模型公开仓库固定提交：[Playtest@546edee](https://github.com/star8592/AfterSchoolDuelClub-Playtest/commit/546edeef73e95284e84316c80708b82588c8585f)，路径 `r45-duel/art-lab/r55-audition/batch1/character-studies/E02/E02-PaperPlane-R57-Refined-STUDY.glb`。
- 源 GLB 原有 17 meshes、0 skins、0 animations。本实验新 GLB 仍有 **17 meshes、0 skins**，新增真正的 5 套 glTF 2.0 animations：`Idle_Glide`、`Bank_Left`、`Bank_Right`、`Attack_Dart`、`Hit_Recoil`。
- 只写 root pose/flight channels（translation + quaternion rotation）。**不是折翼骨骼、软体动画或新的高品质模型。** 生成脚本只接受精确 R57 源文件 SHA，防止从其他并行分支读取不同模型版本。

## 构建方法

```bash
python3 labs/patch-e02-native-motion/build_native_e02.py \
 --source /path/to/E02-PaperPlane-R57-Refined-STUDY.glb \
 --output labs/patch-e02-native-motion/E02-R59-NativeMotion-STUDY.glb
```

构建后自动输出 SHA256 / 非最终美术状态到同名 `.provenance.json`。

## Web 可视化

私有研究分支独立页面 `labs/patch-e02-native-motion/index.html`，直接用 Three.js 的 GLTFLoader 和 AnimationMixer 播放真实模型动作。运行 `python3 -m http.server 11079 --bind 127.0.0.1`，本机打开：

http://127.0.0.1:11079/labs/patch-e02-native-motion/

页面允许旋转、缩放、切换五套动作；无 CSS 假动画。浏览器使用当前 Playtest 已部署的固定 Three.js JS 资源，不接入 FAL，不占用现有 Chrome 用户会话。

## 浏览器实测

可复现脚本：`labs/patch-e02-native-motion/browser_e2e_r59.mjs`，需提供已有 Playwright 模块目录：

```bash
PLAYWRIGHT_MODULE=/path/to/node_modules/playwright \
R59_E02_ORIGIN=http://127.0.0.1:11079 \
node labs/patch-e02-native-motion/browser_e2e_r59.mjs
```

实际 Z890 RTX 5070 Ti + Chrome WebGL2/ANGLE Vulkan，桌面 1440×900、竖屏 430×900 两视口通过。可测左转四元数 Z 分量约 `0.205`、攻击时模型 Z 位移约 `-0.418`，无页面 JS/HTTP 错误，保留实际截图与 `evidence/results.json`。

## 不可越过的边界

- 此版本的艺术身份、翼片动态、材质精细度与原画一致性都未批准；浏览器能播放不等于达到正式游戏美术品质。
- 当前 GLB 仍无独立翼片骨骼；T02、T01、G01 的质量与身份审查独立进行。
- 不能偷偷替换正式卡牌 E02、竞技场模型、PlayMoru 生产发布；后续另行提供正式场馆真实运行截图和人工审美批准。
