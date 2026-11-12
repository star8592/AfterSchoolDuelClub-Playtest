# 放学后决斗社 — 3D 卡牌对战统一主线

游戏唯一公开入口为 [r45-duel/](./r45-duel/)。

**R96 最新角色演出：**两侧永久出牌者使用原始 VRM 两骨骼 IK、真实面部 morph 与自动眨眼；抽牌、亮牌、施法、受击动作来自真实出牌事件，继承 R95 的比赛特效和结算，详见 [R96 验收说明](r45-duel/qa/R96_PERMANENT_DUELIST_NATIVE_ACTING.md)。

**2026-11-12 统一研发总账：**[docs/DUEL_CONVERGENCE_20261112.md](docs/DUEL_CONVERGENCE_20261112.md)，完整 Git 分支/旧 PR 清单：[docs/DUEL_BRANCH_INVENTORY_20261112.json](docs/DUEL_BRANCH_INVENTORY_20261112.json)。

从 R93 三维角色脚步/攻击演出继续升级，融合 R84–R85 的 20 张可玩卡、7 曲原创音乐、98 条 Qwen3-TTS 配音（默认有声）、M01 音乐老师/M02 食堂阿姨，并保留 R91 结算重赛、R92 旧模型兼容。正式发布以 GitHub main + 公网 QA 为准，旧 PR/worktree 为来源证据，不直接覆盖主线。

本分支清理了所有旧游戏、旧演出、旧页面及旧三战线工程的可部署文件，不是只把旧内容隐藏。
当前所有运行代码、三维场馆、已实现的两套人物骨骼网格、Three.js 依赖和测试都在 r45-duel/ 中。

历史版本完整仓库状态永久留在 Git 分支：
[archive/duel-legacy-before-r45-20261110](https://github.com/star8592/AfterSchoolDuelClub-Playtest/tree/archive/duel-legacy-before-r45-20261110)。

注意：删除旧网页路径将导致旧的公开试玩链接失效，这是本轮刻意的隔离措施；归档分支不作为 Pages 主站发布。

规则现在只有一个中央竞技场。R45 是新的开发主线，不是所有卡牌角色已经完成 3D 的正式商业成品。
