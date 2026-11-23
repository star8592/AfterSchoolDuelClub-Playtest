# R226｜Jay 不是“手在前面”就合格：反关节外折纠错与视觉 NO-GO

日期：2026-11-23。用户明确指出 R225 的新 Jay **抓牌和甩牌时手腕整段朝错误关节方向弯折**。此前 R221–R225 只检验手腕位于肩部前方、骨骼角度变化、双脚位移，并错误地将这些验证结果等同于人物动作自然。**此判断失效**。本轮从现有 Draft 候选做独立 R226 骨骼纠错；不修改正式 `r45-duel/scene`、原项目其他模型或已发布 R198。正式人物替换仍严格 NO-GO。

## 真实失败与修复

R225 原始 Blender 导出 GLB `jay-teen-duel-v06-school.glb` 重新导入，检查实际肩 `Arm` → 肘 `ForeArm` → 腕 `Hand` 世界坐标。出牌释放关键帧时：

- **右腕**相对右肘往身体外侧偏移 **7.8cm**；**左腕**相对左肘往外偏移 **18.3cm**。从现有模型期望的前方抓牌/内收动作视角来看，这才是用户看到的“向后拗”。
- 仅规定 `肩膀→手腕` 朝前，不能证明肘腕弯曲合理；前述四个版本即使这项通过，仍可有严重外折。
- 左右骨骼局部轴与父子骨骼不同，不可把两只手简单同一轴取反。新 [Blender实际轴向测量程序](../qa/r220-character-audition/diagnostics/r226-calibrate-joint-anatomy.py) 实测各前臂local Z旋转，并同时检查实际腕相对肘的身体内侧方向、朝前距离与肘角。

**R226 修正后同一释放帧**：右腕相对右肘内收约 **4.7cm**；左腕相对左肘内收约 **2.2cm**；原始 Blender 出牌动作保留朝前伸手、落脚、身体重心与R225校服。新动作脚本 `author_jay_v07_anatomic.py` 重新生成 `assets/jay-teen-duel-v07-elbow-inward.glb` 和可编辑 `source/jay-teen-duel-v07-elbow-inward.blend`。

**关键限定**：本轮的“腕相对肘朝躯干内侧”是针对当前出牌、抽牌等定点姿势的**几何保护门槛**，并非所有人类动作都必须如此；真实关节骨折风险判断、手掌法向、人体运动学、持牌指尖接触和角色演技仍需独立视觉验收。不能仅凭这项把人物判为合格。

## 重导出后的逐帧审计和真实 Chrome

[全部原始BLENDER采样JSON](../qa/r220-character-audition/evidence/r226-full-24fps-joint-kinematics-old-vs-new.json)，由独立 `diagnostics/r226-full-24fps-anatomy-gate.py` **将两份已导出的 GLB 重新导入 Blender**，在四组动作（Draw、Throw、Recoil、Victory）的94个动作帧中分别测两手肘腕向内距离（共 188个手臂-帧记录）。旧版有96次记录明显向外超过2cm；**R226版本0次**。R226每组动作两手腕仍朝人物前方；肘夹角维持在24°–125°；角色左右脚在动作的世界坐标未因修改手臂曲线而移动。

验证细目：
- 新抽牌：右腕最小内收3.96cm，左腕最小内收2.54cm
- 新甩牌：右腕最小内收3.35cm，左腕最小内收1.93cm
- 受击：右腕最小内收4.39cm，左腕最小内收2.71cm
- 胜利：右腕最小内收7.66cm，左腕最小内收2.49cm

[真实 Chrome 四动作旧新同机位截图](../qa/r220-character-audition/evidence/r226-jay-elbow-wrist-before-after-four-actions-real-chrome.jpg)、[10.44秒 R226 全动作实时录屏](../qa/r220-character-audition/evidence/r226-jay-anatomical-elbow-five-actions-real-chrome.mp4)（真实 GLB 和 WebGL，非AI静态绘图）。

Chrome正面／侧面完整五动作均实机显示，JavaScript和HTTP错误0。浏览器在实际 `Bone.getWorldPosition()` 上分别检查两侧肘腕朝内、前伸与夹角，**真实两视角动作测试通过**。录制场景包含旧Jay、新Jay和财富小镇/丹道基准人物；后者仅供美术对照，不进入正式游戏。

同时曾经因R226新腕位置改变而再次引发 **卡牌在正面靠近面部**（0.90秒间距55.3px），该阶段测试失败、没有冒充PASS；调整隔离QA卡牌的离手前向偏侧轨迹后复测为0.90秒 **70.1px**，1.03秒 **159.7px**。这项修正只在 R226候选，不改变R225或正式卡牌飞行。JSON：[卡牌/人脸屏幕空间同机位对照](../qa/r220-character-audition/evidence/r226-card-face/r226-card-face-occlusion-real-chrome-ab.json)。

**终检**：`diagnostics/r226-integrity-gate.py` 一键检查24骨架与原11组动画不变、94帧两臂几何、脚部无回归、两种浏览器视角10张非空真实截图、卡牌脸部遮挡及10.44秒真实连贯录像。本轮实际执行 **PASS**。

## 对用户实际观感的诚实判定

用户反复指出“姿态像反关节、动作像僵尸”，之前开发以“骨骼在动”“手伸到前面”为PASS是错误的，已经纠正为逐骨骼方向和画面双门槛。当前R226**只通过了局部关节几何和Chrome显示技术验收**，图里仍可见举牌/抓牌缺少手指细节、真人连贯动作并不完全自然；新Jay也尚未达到原高精角色美术身份。因此结论是 **技术问题局部通过，整体角色视觉签收 NO-GO**。不得自动更换正式游戏中的任何一名角色。

本地可交互链接：
- R226新：`http://10.10.10.138:18720/r45-duel/qa/r220-character-audition/?focus=jay&revision=r226&camera=profile`
- R225原失败版：`http://10.10.10.138:18720/r45-duel/qa/r220-character-audition/?focus=jay&revision=r225&camera=profile`

下一阶段重点：从有真实指骨的高精人物源中建立简化可控的肩、肘、腕、掌指关节Rig，以及有表情与明确持牌、松指过程的完整动作。不能把没有手指骨骼的24骨架男孩强行认定为“真实抓牌”。真实游戏场景/交互/正式角色审批独立进行。
