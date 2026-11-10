# R63：R60 纸飞机进入真实 R62 单竞技场

**技术测试阶段；美术未批准，正式游戏默认资产不变。**

新直看入口：/r45-duel/r63-e02-arena.html。真正加载现有 Three.js 单竞技场，自动显示双方 E02 纸飞机；支持切换 R62 基线、R60 新版，双方 1v1 或 3v3，以及 ±45/±90/180 度旋转。不构造假的游戏规则。

完整可玩游戏仍为 /r45-duel/。仅访问 /r45-duel/?seed=1&e02Study=r60 才启用 R60。删除参数直接回退到 R62 默认资产，其余十多张牌和规则不变。

## 模型与动作

- R60 GLB 文件 E02-R60-PhotoPaper-WingFlex-STUDY.glb，实际 1,116,092 字节，SHA-256 904ab9930af985af752095718966b265b1c96b1efc73fa74beadae722f135a90。
- 保留 R57 的真实 17 个网格，R59 五个真正 glTF2 原生动作：Idle_Glide、Bank_Left、Bank_Right、Attack_Dart、Hit_Recoil；R60 新增双侧 Morph 变形及三张真实纸面 PBR 贴图。
- 场景加载器只在严格匹配 e02Study=r60 时选择新资源。AnimationMixer 的攻击、受击与待机优先播放对应 R60 clips，绝不改变游戏的数值判定或卡牌规则。
- 来源诊断同时显示 baselineFile 与真正加载的 file；E02 Morph 和纹理状态只通过既有 QA 检查对象读取，不构造假的检验数据。

## 浏览器真实测试

在 Z890 RTX 5070 Ti / Chrome ANGLE Vulkan WebGL2 执行：

- qa/browser-r63-e02-r60-arena.mjs：1440×900 与 430×900，各测 R62 default / R60 opt-in。4/4 PASS；真模型 17 meshes，旧版 0 clip，新版 5 clip；玩家和 AI 的 frontDot 全部为 1，均可见、在画面内，底部 minY 约 0.47–0.51，保留了 R62 的合适比例与悬浮。
- R60 真正加载颜色、法线与粗糙度；两翼有独立 morph weights，Idle 过程中连续变化；不带可选参数时完全不加载研究模型。
- qa/browser-r63-showcase.mjs：桌面和竖屏 2/2 PASS；测试新专用网页切换版本、1v1→3v3、镜头90度、正常返回基线，页面错误 0。
- 所有实测日志与独立 Chrome GPU 截图留存在 qa/evidence/r63/；当前样本不能证明所有设备的性能或艺术质量。

## ART_NO_GO / 发布范围

此项仅有真实模型、动作与可交互 3D 体育馆技术验收，尚未经过正式原画审美批准。Paper001 纸张 CC0 不代替全模型版权审查。当前不能覆盖正式召唤角色，PlayMoru 正式游戏不变。

T02 仍缺食堂阿姨＋活体菜单双召唤；T01 猫头鹰与男播音员的身份冲突、G01 学生创客定位不得遗忘。
