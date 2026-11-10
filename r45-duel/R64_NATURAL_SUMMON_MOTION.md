# R64 — 召唤实体自然动作与骨骼动画平滑过渡

日期：2026-11-11。基于 R63 `024e5bd`，仅修改表现层，不修改规则引擎、卡牌数据、伤害结算、资源网格、场景配置或正面轴校准表。正式美术仍 0/12 完成，不将临时模型冒充最终产品资产。

## 实际代码

- `scene/summon-models.mjs`：所有自带动画的 GLB 用 0.18 秒平滑 crossfade 替代 `stopAllAction()` 硬切换；保留源模型原生 Idle、Attack、Hit；离场/返回待机后清除已渐隐的旧 Action，避免循环对战积累动作处理资源。
- `scene/summon-presence.mjs`：E02 纸飞机无源动画轨道，采用低幅值、低频率悬浮，战斗中用有起止区间的冲刺、俯仰与受击后坐表现，保持模型源数据不变；重算当前帧相对初始位置的所有位移，防止越战越漂。动画与摄像机角度解耦。
- 新增仅 QA 可见的 `motion` 只读指标：pitch/bank/lift、原生动画片段、crossfades、仍在退场中的动作数，不影响 UI 或对局状态。

## 真实回归（Z890 RTX 5070 Ti，ANGLE OpenGL GPU）

- `qa/browser-r64-natural-motion.mjs`：1600×900 桌面与 430×900 竖屏，连续实测 E02 纸飞机攻击/受击、G02 原生动画的 Attack/Hit/Idle 过渡、退场动画清理、恢复待机、两边朝向及完整入镜。两端 **2/2 PASS**；持续 53 个时点采样，截图 `evidence/r64/{wide,portrait}-{strike,final}.png`。
- `qa/r61-rule-all-cards.mjs`：18 张卡规则 **18/18 PASS**（12 unit, 6 spell）。
- `qa/r62-facing-contract.mjs`：12 卡 × 双方 **24/24 PASS**。
- `qa/browser-r62-scale-audit.mjs`：两种尺寸、四种机位，12 批、实际 120 个召唤实例，**12/12 批 PASS**，其中需满足 `withinFrame===true`。
- `qa/browser-r51-combat.mjs`：4 组真实出牌/攻击/伤害结算/战斗后同步 **4/4 PASS**。

## 启动和复现

在工作区根目录 HTTP 服务监听 127.0.0.1:10994 后：

```bash
ASDC_QA_ORIGIN=http://127.0.0.1:10994 node r45-duel/qa/browser-r64-natural-motion.mjs
ASDC_QA_ORIGIN=http://127.0.0.1:10994 node r45-duel/qa/browser-r62-scale-audit.mjs
ASDC_QA_ORIGIN=http://127.0.0.1:10994 node r45-duel/qa/browser-r51-combat.mjs
node r45-duel/qa/r61-rule-all-cards.mjs
node r45-duel/qa/r62-facing-contract.mjs
```

**上线条件**：本分支为可玩性/表现升级，需与 R63 统一合并后再上线。美术资产质量、动作风格统一性及商用授权仍需独立完成，不可从运行测试通过推导商业发布已就绪。
