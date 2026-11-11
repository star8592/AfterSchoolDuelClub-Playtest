# R80 发布主线移植

仅把本轮已审核的 Blender Studio 两套高精度模型导入现行 main 的 G03/T04，不覆盖并行团队已开发的 R63/R67 T02 动作及场景。两套新 GLB 均为静态蒙皮的 WEB-COLOR-STUDY，临时根节点动作不冒充源工程原生骨骼动画。

官方源：Jay https://studio.blender.org/characters/jay/v1/；Rex https://studio.blender.org/characters/rex/v1/；作者 Blender Foundation，CC BY 4.0 署名。原始 .blend 和哈希证据保存在 Z890 `/mnt/data/game-assets/after-school-duel/film-character-rigs-20261111/`。

R80 源游戏开发分支 `feature/duel-r80-film-native` 的完整 Chrome QA（14 卡、对战攻防、画面比例与朝向）已通过。本次已在完整 GitHub 主线 ZIP 快照中单独完成 R81 验收：主线 10 GLB 资源全部加载，桌面 1440px 与竖屏 430px 双方同时召唤、人物规模、朝向、落地、真实交换战斗事件均通过；浏览器脚本和游戏资源错误 0。Z890 证据 `/mnt/data/game-assets/after-school-duel/r80-mainport-qa/mainport-qa.json`，测试脚本随仓库保存。
