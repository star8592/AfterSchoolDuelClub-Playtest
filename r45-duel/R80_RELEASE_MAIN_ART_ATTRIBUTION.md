# R80 发布主线移植

仅把本轮已审核的 Blender Studio 两套高精度模型导入现行 main 的 G03/T04，不覆盖并行团队已开发的 R63/R67 T02 动作及场景。两套新 GLB 均为静态蒙皮的 WEB-COLOR-STUDY，临时根节点动作不冒充源工程原生骨骼动画。

官方源：Jay https://studio.blender.org/characters/jay/v1/；Rex https://studio.blender.org/characters/rex/v1/；作者 Blender Foundation，CC BY 4.0 署名。原始 .blend 和哈希证据保存在 Z890 `/mnt/data/game-assets/after-school-duel/film-character-rigs-20261111/`。

R80 源游戏开发分支 `feature/duel-r80-film-native` 的完整 Chrome QA（14 卡、对战攻防、画面比例与朝向）已通过。正式 main 的兼容性仍须针对主线 10 GLB 独立检查，不应误写为与开发分支完全相同的验收。
