# R141：Ellie / Jay / Rex 高精原生脸部表演与真实 Qwen 配音

## 目标与边界

在唯一正式游戏仓库和单一 `main` 上延续 R140，而不是生成新的游戏版本。源 GLB 保持 Blender Studio 作者授权与原版权记录，使用原生 SkinnedMesh、Morph Targets 与真正加权 `DEF-Jaw`。三个新演员在已有源骨导演上单独附加表情：E03 Ellie（R135）、G03 Jay（R134）、T04 Rex（R135）。

所有新功能仅在显式打开 `?r134Jay=on` 或 `?r135Pair=on` 的高精研究入口启用；无参数正式版仍使用原先 R97，R140 四人仍用 `r136Cast=on`。任何代码合并都不能充当正式公网部署或美术 85/100 签收。

## 三份原始模型审计

本轮使用 Z890 本地真实 GLB 二进制的 glTF JSON 读取结果：

| 演员 | 原资源 | 已核实的 Morph 与骨骼 | 表演处理 |
|---|---|---|---|
| E03 Ellie | `E03-Ellie-Skinned-R132-BakedRest-PILOT.glb` | 双眼各四种虹膜 Morph，`DEF-Jaw` 属于真实 skin joint | 受击眼睛瞪大、进攻眼神集中、庆祝欢呼大幅开口 |
| G03 Jay | `G03-Jay-Skinned-R132-BakedRest-PILOT.glb` | 双眼 iris grow/narrow/wide、源下颌骨；头部仅不明确的 `Key 1` | 专注实验、失手惊讶、理性庆祝；绝不猜 `Key 1` 是微笑 |
| T04 Rex | `T04-Rex-Skinned-R132-BakedRest-PILOT.glb` | 双眼虹膜四形态与 `DEF-Jaw` | 凝神防御、受击瞬间惊讶、胜利收势 |

特别注意：E03 右眼增长目标在原 GLB 中命名为 `iris_grow,R`（逗号而非小数点），不能伪称为 `iris_grow.R`；因此本轮没有使用该错误命名，保证原始资产保持不变。三人的脸部原 morph 比 G02 / T03 少很多，绝不虚构不存在的笑脸、哭脸或眉毛形态。

## 代码链路

`scene/r140-source-face-acting.mjs` 扩展到三名原角色且角色间采用完全不同的情绪与下颌参数。原 R134 / R135 Sequencer 只增加获取当前原片段名称的轻量 getter；原本的上下肢姿态、接地与 T 字手保护不重写。

`summon-models.mjs` 在同一份原高精角色模型且对应导演开启时才实例化面部控制器。`game.mjs` 只转递预录 Qwen3 声音真的开始/停止的回执，`scene.mjs` 经过实际语音序号审核转给 `summon-presence.mjs` 的同一角色。即使双方拥有同名卡牌，也只能有一个真实角色接收一次音频讲话，静音必须立即闭嘴。

口型采用 **实际播放状态 + 估算音节时间**，不是声学音素强制对齐；无音乐、语音文件重新生成，无浏览器实时合成音频。

## 第一轮 Z890 真 GPU Chrome 回执

`qa/browser-r141-three-source-face-voice.mjs` 在桌面 1440px、竖屏 430px，用本人原 GLB 逐个完成 Idle、Attack、Hit、Celebrate 与相应眼部 / 真下颌动作，随后播放真实 Qwen3 原声并做静音收口：**152/152** 项通过，无 JS/HTTP 资源报错。

| 演员 | 桌面实录嘴部开合峰值 | 竖屏实录嘴部开合峰值 |
|---|---:|---:|
| E03 | 0.8366 | 0.8383 |
| G03 | 0.7987 | 0.8176 |
| T04 | 0.7701 | 0.8108 |

这不是艺术导演眼睛验收。旧 R134/R135 以及 R140 四人、主游戏链接、口型回归须全部通过才允许并入 `main`。产品未实现全角色完成，`artApproved=false`。

## 下一阶段

将原七名高精召唤人物、两位永久主持人，以及其他场边演员统一放在同一个真实体育馆镜头内进行剧场总验收：全身发力、打击时间、随机台词、情绪匹配、观众误伤与喜剧反应，特别检查长时间站姿和角色轮换时的表情切换。保持错误优先重构，而不是用简单晃动充当真实表演。

## R141 最终收敛：858 项 Z890 真 GPU 通过

最终检查分组：R141 三角色脸部与逐人原声 `152/152`、R141 同卡双阵营防串音 `32/32`、R134 Jay 原骨骼 `22/22`、R135 双角色 `53/53`、15 秒同场 `16/16`、回退 `25/25`、R140 四人脸部/语音 `170/170 + 54/54`、R139 `36/36`、R138 `70/70`、R136 原动作 `83/83`、开关回退 `63/63`、同场 `36/36`、R124 正式卡牌链路 `18/18`、R122 双主角原声 `28/28`。

新增实际 QA `184/184`，回归 `674/674`，累计 **858/858**。严格收敛脚本 `qa/r141-acceptance-summary.py` 产生 `R141_858_REAL_GPU_CHECKS_PASS`。经脚本验证的 JSON 写入：
- `qa/evidence/r141/seven-source-faces/r141-convergence.json`
- `qa/evidence/r141/seven-source-faces/r141-three-original-faces-compact.json`
- `qa/evidence/r141/seven-source-faces/r141-double-card-voice-isolation.json`

美术仍不签收：`artApproved=false`。技术检查通过不等于真人审美打分 85/100、低端手机帧率稳定或正式网页已切换。下一轮优先补强 Rex 原靴/膝盖和 Jay 原腿骨，避免只有脸与手在动；其原蒙皮腿部移动实测仍小。
