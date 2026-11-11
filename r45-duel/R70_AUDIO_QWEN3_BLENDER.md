# R70 · 游戏原创音乐、音效、人物 Qwen3-TTS、Blender 模型工厂

本分支从 R69 的独立模型库试镜分支 `8ac1994` 派生，与此前 R68 动画姿态、R69 M01 音乐老师候选兼容，独立演示端口 11000。**本轮不改变卡牌规则与生命值、不修改生产站、不对其他项目执行模型卸载和目录删除。**

## 技术决策：游戏配音正式改为 Qwen3-TTS

用户明确退役旧 IndexTTS 路线。当前所有新配音脚本仅导入 `qwen_tts`，不导入或调用 IndexTTS。不删除历史模型/语音，以免影响其他项目。官方项目 https://github.com/QwenLM/Qwen3-TTS （Apache 2.0）：

- `Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign`：适合设计独特角色的人物语气和原始音色。
- `Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice`：使用中文内置音色及自然语言情绪指令，先做多角色对白。
- `Qwen/Qwen3-TTS-12Hz-1.7B-Base`：后续基于已设计声音进行稳定音色复用（有合法参考素材才启用，不克隆真实人物未经授权的声音）。
- Z890 四个模型权重已在 Hugging Face 本地缓存：1.7B VoiceDesign、CustomVoice、Base 以及 0.6B CustomVoice；17 GB 显存卡实际约 16 GB 可用。生产语音从不在用户浏览器端运行推理，而是 **离线预生成经验证音频 → 通过受控 manifest 播放**。
- 独立 Python 3.12 环境位于 `/mnt/disk1/H3_Studio/tools/qwen3tts-r70/.venv`，不复用旧 IndexTTS 环境；实际 GPU 推理使用 bf16 + PyTorch SDPA，不强行依赖 flash-attn 编译。
- 角色台词、说话人、情绪脚本：`qa/r70-qwen3-voice-lines.json`。生成命令：
  ```bash
  CUDA_VISIBLE_DEVICES=0 HF_HUB_OFFLINE=1 /mnt/disk1/H3_Studio/tools/qwen3tts-r70/.venv/bin/python \
    r45-duel/qa/r70-generate-qwen3-voices.py E01 G01 T01 M01
  ```
- 生成成功时每条保存 24 kHz Opus/Ogg，文件 SHA256、时长、来源、文本、说话人写入 `assets/audio/voice-manifest.json`。缺失或未通过生成的声音 **自动保持静音**，不会回退到浏览器 TTS、旧 IndexTTS 或冒充已完成的文件。音频技术完整性不代表最终语音表演已由人工试听验收。

## 音频系统（已接入）

`audio-engine.mjs` 是与规则独立的表现层，不接触 HP/伤害/获胜逻辑。`game.mjs` 将游戏真实事件接入音效：选牌、召唤、敌方出牌、回合切换、攻击、命中、事件回复、胜负。页面上方新增明确的「开启声音」按钮；首次交互后按浏览器音频规范解锁 AudioContext，关闭时立即停音乐与语音。声音默认不自播，以免触发浏览器自动播放策略。

- **原创音乐**：`school_duel_theme.ogg`（校园轻快旋律）和 `duel_tension.ogg`（低血量加强节奏）；均由 `qa/make-original-game-audio.py` 使用 Python/Numpy 自行合成，不使用已有流行音乐、影视配乐或未核实版权音频。
- **9 项原创音效**：`select/cast/enemy_cast/turn/attack/hit/heal/win/lose.ogg`，48 kHz PCM 原创合成后编码 Ogg Opus，Web Audio 预解码以控制延迟；同一时刻过多短音会衰减而不是无限叠加。
- **三路混音**：音乐、音效、人物语音独立控制，用户音量保存在本地；播角色语音时自动压低背景音乐，语音播完恢复；角色语音通过 manifest 白名单文件名加载，阻止加载不可信路径。
- **可复现浏览器测试**：`qa/browser-r70-audio.mjs`，宽屏 1600×900 与竖屏 430×900：音频初始禁用、点击后解锁、9 项音效解码、背景音乐开始、三个滑块、真实选牌/出牌触发音效、静音全部通过，证据在 `qa/evidence/r70/audio-browser-results.json` 及截图。此测试只判定 Web 音频行为，不替代实际的耳朵试听。
- **GPU 场景现状**：该批 Chromium 测试期间 Z890 上 headless ANGLE 报 `BindToCurrentSequence failed: Error creating WebGL context`，因此 R70 音频测试已改为独立于 3D 场景就绪进行；不能据此宣称 R70 已通过所有 3D 回归。场馆渲染仍保留此前版本源代码，待 GPU 资源允许需单独复核。

## Blender 插件与模型增强

机器实际运行 Blender **5.2.3 LTS**。内置/可见 addon 模块 **14 个**，已启用 **9 个**（包括 BlenderMCP、FBX/glTF 导入输出、Pose Library、Cycles），不是声称“本机已安装 1000 多个”。官方在线扩展库有更多选项，但应按场景需要逐项审查兼容、许可、维护与性能。

- **第一梯队：Rigify、Pose Library、动画重定向**。导入 VRM/GLB 后先做肩—肘—腕与腿部权重检测，建立每角色出场/待机/攻击资产，再烘焙到现有骨架；避免数学上“手腕到了但肘部反折”的姿势。Rigify 模块可发现但默认未启用。
- **第二梯队：Node Wrangler / 材质检查**。对服装、皮肤、布料、边缘粗糙度做统一 PBR 艺术风格，避免脸和衣服同材质的塑料感。Node Wrangler 可发现但未启用。
- **第三梯队：Retarget**。Blender 官方扩展 https://extensions.blender.org/add-ons/retarget/ 2026-08 发布的 5.2.0 兼容 Blender 5+，适用于混合多种骨骼来源迁移动画。此次在 Z890 通过 Blender CLI 安装受系统偏好 “Online access required” 拦截，**未声称安装成功**，保留既有在线权限设置。
- **程序化审计**：`qa/r70-blender-asset-audit.py` 使用 Blender glTF 导入 3 个真实模型（M01、T01、新旧 E03），提取网格、三角面、变形骨数、蒙皮、顶点权重、材质、动画与边界拓扑证据，`qa/evidence/r70/blender-assets.json`。测试的 M01：31 变形骨、3 动画、10 个蒙皮网格；T01：21 变形骨、4 动画；E03：13 变形骨、7 动画。三者的蒙皮网格未发现完全没有权重的顶点。注意 glTF 导入后独立网格开放边界较多，`non_manifold_edges` 需美术分层辨认，不作为自动淘汰标准。
- **禁止自动批量细分/乱光滑**：盲目增加面数不会提升实际艺术品质，反而可能破坏面部、服装、UV、变形和渲染性能。任何替换都需要与原画比对、法律署名、骨骼动作/手型、比例/源正面轴、Chromium GPU 画面及 R62/R51 回归。

## 发布边界

本分支的原创音乐/音效已可在网页直接试听，已用 Qwen3-TTS 1.7B CustomVoice 真正生成 12 个角色共 14 条语音（含 E01/G01 两条攻击语音），源 Ogg/Opus 校验值和时长均写入 manifest；还未做完整人工艺术试听，标记为 pending-human-listening。R69 M01、T01 仍为候选、现有 12 张正式卡牌规则不变；12 个角色最终商业美术审核仍 0/12。本分支先用 PR 验收，**不覆盖线上主页**。

## 2026-11-11 R70 最终补验

- 已实际在 Z890 RTX 5070 Ti GPU 上完成 `Qwen3-TTS-12Hz-1.7B-CustomVoice` 推理，12 款角色、14 条声音，包含 T02 活菜单及 M01 音乐老师候选；模型和权重缓存保留，旧 IndexTTS 已按用户指令从 Z890 清理。
- `qa/browser-r70-qwen3-voice.mjs`：宽屏/竖屏 2/2 PASS，真正加载 Qwen3 Ogg、播放、音乐 ducking 自动衰减与恢复、无播放错误。修复原 `lastVoiceAt=0` 导致页面加载后头 500ms 语音无法播放的缺陷。
- `qa/r70-validate-audio-assets.mjs`：校验所有语音 SHA256、音乐/音效 Ogg Opus 编码及源信息。
- `audio-engine.mjs` 的 Web Audio 事件增加双方不同声像：我方偏左，对手偏右；不修改场景 3D 位置或战斗结算逻辑。
- 使用 MiniMax Music 3 前须审查独立 MiniMax-Music3 Community License：商业产品需要展示 MiniMax-Music3 署名，超过 2000 万美元关联年度营业额则需书面授权。当前该模型本机权重已就绪，ComfyUI 服务未启动，R70 游戏暂使用原创音效与本地合成主题，不将别的项目生成的曲目冒充本作配乐。
- 此次 IndexTTS 本机清理操作记录保存在 `/mnt/disk1/H3_Studio/operations/index-tts-retirement-20261111.log`；H3 `run_tts.sh` 改为独立 Qwen3-TTS 环境，不再调用 IndexTTS，成片/历史语音只作为历史作品保留。
