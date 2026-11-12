# 放学后决斗社 — 3D 卡牌对战统一主线

游戏唯一公开入口为 [r45-duel/](./r45-duel/)。

**R100 真三维连携导演：**粉笔、广播、招新海报分别使用三维道具和真实命中反馈；规则引擎事件驱动、动作关键帧音效同步、跳过和换关防残留、减少动画模式、自由对战同源。详见 [R100 三维连携验收](r45-duel/qa/R100_REAL_3D_COMBO_FILMS.md)。

**R99 玩家截图专项修复：**三关结束后底部金色按钮直接进入下一关；人物面向对手并向观众呈现部分正面；食堂阿姨的原始骨骼增加厨师帽、锅铲；98 条 Qwen3 语音重新平衡响度。详见 [R99 真实问题修复记录](r45-duel/qa/R99_PLAYER_FEEDBACK_FIXES.md)。

**R98 三关真实连携教学：**游戏内点「玩三关剧情教学」即可进入粉笔弹射、广播串台、招新海报的连续两步可玩任务。三关共享三维体育馆，胜负数值和连携结果来自正式规则。见 [R98 实战验收](r45-duel/qa/R98_THREE_REAL_COMBO_LESSONS.md)。

**两条聊天/两个仓库的历史成果收敛：**[多聊天统一来源与后续开发待办](docs/DUEL_PARALLEL_CHATS_CONVERGENCE_20261112.md)。V0.5 三关与 V0.6 短剧演出保留为研究资产；新 3D 主线不回退到旧三线 UI。

**R96.1 加载故障恢复：**只有真实 GLB/VRM 全部就绪才解锁出牌；失败时场景给出明确错误与一键重新加载入口，恢复后继续原牌局，详见 [R96.1 故障注入实测](r45-duel/qa/R96_1_SCENE_LOADING_RECOVERY.md)。

**R96 最新角色演出：**两侧永久出牌者使用原始 VRM 两骨骼 IK、真实面部 morph 与自动眨眼；抽牌、亮牌、施法、受击动作来自真实出牌事件，继承 R95 的比赛特效和结算，详见 [R96 验收说明](r45-duel/qa/R96_PERMANENT_DUELIST_NATIVE_ACTING.md)。

**2026-11-12 统一研发总账：**[docs/DUEL_CONVERGENCE_20261112.md](docs/DUEL_CONVERGENCE_20261112.md)，完整 Git 分支/旧 PR 清单：[docs/DUEL_BRANCH_INVENTORY_20261112.json](docs/DUEL_BRANCH_INVENTORY_20261112.json)。

从 R93 三维角色脚步/攻击演出继续升级，融合 R84–R85 的 20 张可玩卡、7 曲原创音乐、98 条 Qwen3-TTS 配音（默认有声）、M01 音乐老师/M02 食堂阿姨，并保留 R91 结算重赛、R92 旧模型兼容。正式发布以 GitHub main + 公网 QA 为准，旧 PR/worktree 为来源证据，不直接覆盖主线。

本分支清理了所有旧游戏、旧演出、旧页面及旧三战线工程的可部署文件，不是只把旧内容隐藏。
当前所有运行代码、三维场馆、已实现的两套人物骨骼网格、Three.js 依赖和测试都在 r45-duel/ 中。

历史版本完整仓库状态永久留在 Git 分支：
[archive/duel-legacy-before-r45-20261110](https://github.com/star8592/AfterSchoolDuelClub-Playtest/tree/archive/duel-legacy-before-r45-20261110)。

注意：删除旧网页路径将导致旧的公开试玩链接失效，这是本轮刻意的隔离措施；归档分支不作为 Pages 主站发布。

规则现在只有一个中央竞技场。R45 是新的开发主线，不是所有卡牌角色已经完成 3D 的正式商业成品。
