# R140 原高精角色面部情绪与真正 Qwen 配音联动

基线：唯一 `main` 的 R139 `8470695`。本轮修改**只在显式 `r136Cast=on` 的原始高精人物实验路径触发面部变形**；不新增第二款游戏，不改正式无参数 R97 默认，不替换任何原 GLB，也不做假的贴图表情或浏览器合成配音。

## 逐源审计

直接读取 E04/G02/G04/T03 Blender Studio GLB 的原始 glTF mesh `extras.targetNames` 和 `DEF-Jaw`。实际可用能力不同：

| 角色 | 原面部源能力 | R140 动作 |
|---|---|---|
| E04 Phil | 原双眼 `iris_narrow/iris_wide/iris_grow` 和原 `DEF-Jaw` | 施法专注眼神、受击睁眼、胜利惊喜、真实下颌运动 |
| G02 Snow | 原头部 `Smile.L/R`、`Bothbrows_Up/Down`、`RIG-snow-JawOpen` 等 49 个形态目标；原眼部 8 个 | 黑板施法紧眉、受击惊讶张嘴、得胜笑容；真实头部 Morph Target 随录音发声 |
| G04 Victoria | 原双眼四种瞳孔形态、`DEF-Jaw` | 指挥凝视、受击惊讶、得胜反应，保持原高精衣装/靴底 |
| T03 Rain | 原头部 `Smile.L/R`、`EyelidsClose.L/R`、`EyebrowsTogether/Down` 等，`DEF-Jaw` | 真实眼皮眨动、接力式笑容、受击皱眉、急促配音嘴部运动 |

`scene/r140-source-face-acting.mjs` 只写入原作者 GLB 的实际 morph target 权重或真实源骨下颌四元数。通过 `r136Controller.getCurrentClip()` 读取已经正在播放的动作状态，在源骨动画更新之后执行，不另外创作假模型。每个实例分别保存 neutral 基线，情绪/配音停止后恢复自然状态。

## 声音与对口型

游戏原来已经拥有实际预录 Qwen3-voice 的 `enter/attack/hurt` 及其变体。R140 **不生成语音**，只扩展已验证的 `HTMLAudioElement` `playing/pause/ended` 回执线路：
`game.mjs` → `ASDC_R122_VOICE_START/STOP` → `scene.mjs` → `summonPresence` 的可见原源人物 → 原头部 morph/jaw 控制器。

口型函数沿用现有 `speechMouthAt` 音节估计，**不是音素强制对齐，不冒充每一字真正精准匹配**。只有录音确实开始播放才收到事件；静音、播放失败、纯文字字幕均不引起正在讲话的口型。重复同名卡牌在场时，仅一张真实角色模型获得该次发言状态，避免双演员一起假说话。

## 目前真实 GPU 验收

Z890 独立原模型工作树、RTX GPU Chrome、正式体育馆镜头下：

- 四位演员分别测试 Idle/Attack/Hit/Celebrate 原生表情、朝向及脚底支撑；桌面 1440px + 竖屏 430px，**170/170**。
- 四个真实 Qwen 配音逐一开始、持续驱动原面部、静音立即停止，重复同名角色只出现一位说话；桌面+竖屏，最终 **54/54**。
- 原 R136 高精四角色实机全身动作复测已 **83/83**。
- 其余旧版回归和主线合并仍须完成，不得用单个通过结果冒充全部或正式公网部署。

独立的 7 位原高精召唤者和两名永久发牌主持人的整体美术签收仍未结束；低端移动 GPU、全员表情/配音节奏、导演 85/100 主观美术验收尚待完成，`artApproved=false`。默认生产版仍保留 R97。
