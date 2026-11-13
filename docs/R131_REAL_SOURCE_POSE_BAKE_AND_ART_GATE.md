# R131：真正消除来源骨骼 T 字手，而不是继续制造更强的“木棍动画”

2026-11-14，基线 main R130 3501f6c。所有研究仍在隔离 worktree，正式唯一游戏版本、卡牌规则、主角发牌、食堂阿姨 M02 均不改。

## 根因：R119 的网格静止姿态不是 R97 自然姿态

真实 Chrome 七人 360 度单人近景、四段连续动作审核显示：R119 研究版即使有真实皮肤权重，仍存在 T/A 臂、肘部形变和局部鞋底穿地。R119 36/36 技术回执仅能证明骨骼驱动，不能当作艺术放行。

原 E04 Phil 有 2,182 顶点手臂网格。旧 R119 真皮肤原静止网格左右跨度 1.702591 模型单位；正式艺术批准 R97 同源自然站姿只有 0.648954；比例 2.62。两者原眼睛/头部几何 +Z 正面轴一致；无法靠旋转正面轴修 T Pose，该不成立的改向实验已撤销。

## 两个反例与真正工程修复

1. 改 Blender glTF 导出参数 export_current_frame=True、export_reset_pose_bones=False 不能解决，导出文件与旧 R119 的 SHA-256 完全相同，跨度仍 1.703。
2. 运行 skeleton.calculateInverses() 重新计算逆绑定，真实截图前后没有可见差异，不能解决 T 手，已只保留 QA-only 实验。
3. 修复法：从 Blender Studio Phil CC BY 4.0 的原始 .blend 打开只在内存中编辑的副本（Blender 5.2.3，--disable-autoexec），使用原作者 FK 控件设置自然姿态，取评估网格的真实顶点位置，将原骨架 Pose as Rest Pose，同时把评估网格坐标烘焙到基底/shape key，保留源骨骼 ID、顶点权重、来源材质以及原始网格顶点。作者原 .blend 永不覆盖。
4. Blender 输出 r45-duel/assets/summons/E04-Phil-Skinned-R131-BakedRest-PILOT.glb，约 2.85MB，导出脚本 r45-duel/qa/r131-export-baked-rest-skin.py。源证据同名 .proof.json。新源跨度 0.648954，与 R97 0.648954 完全一致；三者手臂网格均为 2,182 顶点。新版仍有 23 个可见 source SkinnedMesh、263 joints、真实 JOINTS_0/WEIGHTS_0，不是低模替身。
5. qa/r131-baked-rest-audit.py 独立验证三者源 mesh，真实 Chrome 裸旧源/裸烘焙源/烘焙加骨骼动作三套近景，对 E04 桌面、竖屏待机、攻击、受击、庆祝、复位 22/22 技术验证通过。手臂从 T 字真正在画面落下。

## 为什么仍不直接切默认

- 地面最低点仍有约 -0.03 原场景单位的穿插偏差。衣服、发丝、手指抓卡、个性/声音、全套表情、卡牌远景表现，还需要近景美术签收。
- QA 安全边界：只有明确同时设置 qa=1&r119Rig=E04&r131BakedRest=on 才加载新 PILOT；再加 r128Body=on&r131Arms=on 才开启真实下肢/上肢动态研究。默认 R97 完全不受影响。
- R131 源骨骼补全仍研究开关 r131Arms=on；此前 R128、R129、R130 独立回退均保留。所有 QA 自检/录像摄像头只在 qa=1 下开启。
- 其他六名角色的 .blend、FK/IK、父子骨架以及拇指源关节不同，必须逐个采样、烘焙和对照。禁止自动套一个 Phil 参数为所有人强行重建。每人至少审核五种状态及桌面+竖屏，在真实用户入口取得无 T 手、无鞋底穿透、无动作累积变形证据，才逐个切换默认。
- 作者及许可：Blender Foundation / Blender Studio，CC BY 4.0（详情 docs/R119_SOURCE_AND_CC_BY_7_CAST.md）；正式默认前需落实用户可见署名及改编说明。

## 可追溯路径

- 真人特写：r45-duel/qa/browser-r131-closeup-art-audit.mjs，evidence/r131/baked-qa。
- 正面真实对照：r45-duel/qa/browser-r131-seven-front-atlas.mjs、browser-r131-actor-turntable.mjs。
- 源骨骼链：r45-duel/scene/r131-real-source-upper-arms.mjs。
- 美术重烘焙：r45-duel/qa/r131-export-baked-rest-skin.py。
- 源几何一致性：r45-duel/qa/r131-baked-rest-audit.py。
