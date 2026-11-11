# R80 | 用户认可优先替换高精度人物基底

用户接受 Jay/Rex 优于旧低模，决定优先让高精度模型进入**真实可玩的角色召唤**，不以未到最终影视品质为由继续阻断。

- G03 实验学长：Jay（Blender Studio, Blender Foundation, CC BY 4.0）
- T04 活动室守门人：Rex（Blender Studio, Blender Foundation, CC BY 4.0）
- 原始工程、SHA256、转换审计保留于 Z890 `/mnt/data/game-assets/after-school-duel/film-character-rigs-20261111/R79-source-audit.json`。
- 本版加载的可用 GLB 为 Blender 漫反射材质兼容转换，不是原电影程序材质烘焙；不含骨骼动作，游戏中使用清楚标记的临时根节点动作待机/攻击/受击。
- 保留 12 份卡牌独立 GLB 与完整 20 卡玩法。其余旧模后续按相同路线逐一替换。
- 不能把当前 GLB 的 0 个动画片段说成原生 21/55 个动作已可用；那些动作仅存在于源 .blend 工程。
- 角色比例、朝向、加载、双阵营及真人大小视角必须过 QA。

## R80 完成的自动化实测

- Chrome Vulkan WebGL2：`qa/browser-r61-all-summons.mjs` 全 12 召唤 GLB、三类窗口、重复召唤、退场清理全部通过，运行错误 0。
- `qa/browser-r62-scale-audit.mjs` 两类窗口、0°/45°/90°/180°/双阵营比例、朝向、落地、在镜头范围均通过；Jay/Rex 高度约 2.08 场馆单位。
- `qa/browser-r80-film-character-combat.mjs` 在 1440px、430px 真实三维场馆中进行 G03 攻击 T04 的交换战斗；两个角色的 `R80_static_attack` 与 `R80_static_hit` 均真实触发，截图 `qa/evidence/r80/R80-1440-{idle,combat}.jpg`。
- 完整动作骨架和电影源材质尚未转化；当前用户明确同意先比旧模更好即可，不声称最终形象达标。
