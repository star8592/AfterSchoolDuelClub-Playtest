# R67 · 两名 VRM 主角真实面部表情、人格化动作、反向正面轴修复

版本基线：R66 `687542e1d7b1bacc0f864fe6f839d4c118132d6a`。仅修改 R45 唯一体育馆中 E01/G01 两个 VRM 的表现与精确朝向。不修改任何卡牌规则、数值、网络、主站正式部署、10 个 Gobkit GLB 模型以及场馆构造。

## A. 重新发现并修复一项 R62 遗留的真实朝向错误

- 从已授权的原始 `Shino-original-CC0.vrm` (E01) 与 `Fumiriya-original-CC0.vrm` (G01) 加载源网格，分别用 +Z 和 -Z 位置正对拍摄。GPU 四张证据：`qa/evidence/r67/axis-{E01,G01}-{front,back}.png`。
- 实际可见：**+Z 是两名原始 VRM 的后脑勺，-Z 才是脸**。原 R62 的 `SOURCE_FRONT_YAW` 错把全部资源统一为 0，`frontDot` 对该假设进行自洽计算，故即使实际背对对手也可以输出 1.0。模型自身的方向验证和页面视觉检测必须结合，不能只看 dot。
- `scene/summon-orientation.mjs` 将 E01、G01 改成 `Math.PI` 正面偏移。`faceOpponentYaw` 用正确的源轴调整阵营朝向；`faceOpponentDot` 按传入卡牌 ID 的真实源正面矢量再计算世界方向，防止新模型换源时再次出现“检测过但脸朝反方向”。十个 Gobkit GLB 维持现有 +Z 源轴，不擅自变更。

## B. 原生脸部表情与角色小动作

- `scene/vrm-character-acting.mjs` 从 `GLTFLoader` 解析后的源 `VRM.blendShapeMaster.blendShapeGroups` 中动态读取表情绑定。使用各个 Face.baked 的 `morphTargetInfluences` 原位控制，源脸各有 10 个面部 primitive，**没有贴假脸、替换原始模型或改动共享材质**。
- E01「铃声追不上」：发现迟到、短暂挥手；脸部 `joy` 轻量表达，定期自然眨眼；周期约 8.4 秒，不持续机械挥手。
- G01「橡皮筋建筑师」：偏头琢磨、灵机一动；脸部 `fun` 轻量表达、独立眨眼；周期约 9.7 秒。注意当前骨骼实际表现是偏头与手臂姿态变化，**还不应声称已经实现完全手掌触碰眼镜的特写级动作**。
- 正常待机无 T-pose，角色短暂表演后恢复正常；R51 真实攻击/受击直接覆盖喜剧动作，战后恢复。镜头正面轴不随相机旋转改变。
- 副本对象及双方阵营分别控制自身 morph weights、关节矩阵、手势/眨眼时序。重复召唤通过控制器 revive 清除面部权重，不出现“前一个角色的表情残留”。

## C. 直接观看 HTML5/WebGL 实际演示

- 完整实战 `http://127.0.0.1:10997/r45-duel/`
- E01 全身动作 `http://127.0.0.1:10997/r45-duel/qa/r67-vrm-acting-gallery.html?id=E01&view=full`
- E01 面部特写 `http://127.0.0.1:10997/r45-duel/qa/r67-vrm-acting-gallery.html?id=E01&view=face`
- G01 全身动作 `http://127.0.0.1:10997/r45-duel/qa/r67-vrm-acting-gallery.html?id=G01&view=full`
- G01 面部特写 `http://127.0.0.1:10997/r45-duel/qa/r67-vrm-acting-gallery.html?id=G01&view=face`

浏览器内左右使用同一款真实 VRM 源模型做自然站姿/喜剧动作对照，实际使用 NVIDIA RTX 5070 Ti 的 ANGLE OpenGL GPU，镜头面向源模型真实 -Z 正面。`?axis=back` 是源轴复核模式，不是正式交互。

## D. Z890 RTX 5070 Ti 实测结果

| 检验项 | 实际结果 |
|---|---|
| E01/G01 +Z 背面和 -Z 正面证据截图 | 4/4 完成 |
| E01/G01 各自正面/脸部对比画廊 | 4/4 PASS，动画与形变权重确实写进源网格 |
| 桌面+竖屏，8 个 VRM 召唤实例 | 16/16 PASS；真实脸部 10 primitive/角色、眨眼/joy/fun 均观察到非零影响，姿态/朝向/入镜正常 |
| 喜剧动作被攻击/受击覆盖，战后再次召唤 | 2/2 PASS |
| R62 正面方向合同 | 24/24 PASS（现按实际每卡源朝向，E01/G01 为 `Math.PI`） |
| R62 体育馆尺度/入镜/落地回归 | 12 批 × 10 个 = 120/120 PASS |
| R51 实战出牌及伤害同步 | 4/4 PASS |
| 18 张卡牌规则 | 18/18 PASS |
| VRM 主体与复用角色姿态 | 8/8 PASS |
| 8 VRM 同时召唤 A/B | 旧 R66 两轮 60.2 FPS；R67 60.0 / 60.1 FPS；中位代表约 60.1，ratio ~0.998 |

复现：在当前独立工作区根目录用 `python3 -m http.server 10997 --bind 127.0.0.1`，使用 `ASDC_QA_ORIGIN=http://127.0.0.1:10997 node r45-duel/qa/browser-r67-*.mjs` 分别跑面部/正面/复用/战斗。性能基准还需 R66 10996 同时可用。

## E. 未完成的正式美术工作

- 两个 VRM 的表现风格与十个 Gobkit 源 GLB 的卡通材质/体型仍有明显差异；**不能声称已匹配完整原画、封面或统一人设**。
- 目前仅为技术可玩性和表现验收，最终美术审批仍是 **0/12**。下一步应按完整统一的角色原画设计，批量重新制作或替换角色资产并重新做源轴/骨骼/比例/动画/授权四重审核，而非继续单独微调某一个临时模型。
