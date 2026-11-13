# R113 体育馆真实 Qwen3-TTS 广播与小声互动

## 合并前审计

本模块在独立的 `feat/duel-r113-voice-dynamic-20261113` 工作树开发。
正式服务器不实时运行 TTS 推理、无需新增后端 API，也不需要浏览器语音朗读。
9 条真实录音完全离线在 Z890 上用已缓存的 Qwen3-TTS 12Hz 1.7B CustomVoice 模型推理，
转换为 Opus 48kbps，含实际文件哈希、说话人、字幕原文和时长。

| 类型 | 片段 | 说话人 | 用途 |
| --- | --- | --- | --- |
| 场馆开场 | start | ryan | 正式场景就绪且音频获准后尝试一次 |
| 氛围升温 | pressure | ryan | 真实对战达到第 4 回合且没有播过时 |
| 冠军广播 | win_player / win_ai | ryan | 仅引擎实际判定一方获胜 |
| 平局广播 | draw | ryan | 仅引擎实际判定平局 |
| 场边耳语 | whisper_player / whisper_ai | vivian / dylan | 与导演文本精确一致才播放 |
| 场边挑衅 | challenge_player / challenge_ai | vivian / dylan | 与导演文本精确一致才播放 |

所有声音由项目自行生成，但**人工试听与商业授权终审尚未完成**；
请勿在来源文档中将其冒充真人主持，也勿把任意字幕当做已经录制的声轨。

## 设计不变量

1. 规则引擎 `engine.mjs` 不受播报影响。胜负以真实 `g.phase='ended'` 与 `g.winner` 为准。
2. 结算时，延迟的最后一击受伤配音必须让位于体育馆广播，启用 `finaleVoiceGuard`；
   使用新的主题卡组或进入新的教程关卡时撤销门禁，避免一直静音。
3. 声音默认尝试开启，但严格尊重用户静音、音量调节和浏览器自动播放政策。
   语音和配乐自动 duck/mix，保持场馆广播清晰；播放失败则显示明确标注的文字播报。
4. 不覆盖原有的 98 条真实 Qwen3 人物配音。新增 9 条在
   `r45-duel/assets/audio/pa/`，与旧的 `assets/audio/voices/` 分开。
5. 每条录音必须先有 `announcer-manifest.json` 的真实文件、SHA-256、准确文字，
   否则不进入正常播放。播报字幕由**实际成功播放的音频文件元数据**触发，
   不是单纯收到事件时伪造配音字幕。
6. 全部素材源代码在 `qa/generate-r113-qwen-pa.py` 与
   `qa/r113-qwen-announcer-pilot.py`，官方模型
   `Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice`，推理过程从 Z890 本地快照加载。
   模型仓库的当前版权或训练素材使用边界需要独立核验，音频经过响度统一处理。

## QA

- `node r45-duel/qa/check-r113-qwen-pa.mjs` 逐条核对真 Opus 编码、实际时长、
  SHA-256、固定身份与原 98 条角色配音不变。
- `node r45-duel/qa/browser-r113-qwen-pa.mjs` 在 Chrome WebGL2 桌面/手机验证
  真实播放、真正字幕、角色声音归属、用户静音、浏览器无缺失资源。
- `node r45-duel/qa/browser-r113-real-outcome-pa.mjs`
  通过正式卡牌规则自动完成一局后核查胜利广播，避免把“按测试键播放”当成
  真实胜负接入；新卡组会重置广播状态与胜负窗口。
- 与 R111 魔法效果、R112 自然角色、R113 全队舞和体育馆座椅分别做回归。
- 证据存 `r45-duel/qa/evidence/r113-voice/`，原配音完整性仍参照 R102。
