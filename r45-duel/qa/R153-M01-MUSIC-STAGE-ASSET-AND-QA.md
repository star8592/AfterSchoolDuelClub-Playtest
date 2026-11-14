# R153 · M01 音乐老师舞台服装（仅 QA 试演）

日期：2026-11-15。主线始终是同一个《放学后决斗社》；不另设人物管理后台。用户指出白上衣加蓝裙过于普通、不像音乐老师。

## 两款真实服装

A · Midnight：午夜蓝外套、象牙衬衫、深紫长裙、金色饰品，143,696 triangles，69 bones，9 clips。A 只保留 Z890 研究库，不入游戏仓库。

B · Burgundy：酒红长外套、香槟真丝衬衫、深色修身西裤、珍珠项链、漆皮高跟鞋，165,666 triangles，69 bones，9 clips，21 materials，15 images，14,783,460 bytes，SHA-256 为 9ff6b8d88d5337c76b285996619e0eec1c7b1e5de0f17fb57a53d43cef3e3d55。B 入仓为唯一主候选。

两款模型基于 Ara 3D Gen 现成 MakeHuman 成熟人体/服装/69 骨骼和九段内嵌动作。MIT 源代码、MakeHuman CC0 system pack；部分 CMU mocap 可用于游戏内，但不能把原动作资产独立转售；具体授权记录留在此前 AI3D 研究报告。

## 已验收

两款在真实 Chrome/WebGL 完整场景分别通过 13/13 互动检查：新 GLB 实际选用、待机、右手 WeaponR 挂指挥棒、面部形变、音乐音符、Wave 发令、受击反应、两次游戏内命中与镜头切换，无浏览器 JS/HTTP 错误。

随后在 GitHub R147 最新主线 b1e631da102b540307af90ba31165d2440f128e7 的完整独立克隆中集成酒红款，重新进行真实 Chrome 交互测试，13/13 通过。未使用落后 R133 本地工作树覆盖 R134–R147 的修复。

QA 选择开关：仅显式 qa=1&m01Wardrobe=on 的场景启用；所有其他游戏入口使用原 M01 和 R126 既有动作。新增独立实机体验页：r45-duel/m01-music-teacher-preview.html，页面具备角色出场、发令攻击、受击、近景/全场切换。回归测试：r45-duel/qa/browser-r153-m01-music-stage.cjs。

Z890 原始证据在 /mnt/disk1/H3_Studio/game-toolchain/evidence/ara-m01-music-wardrobe-r153-20261115/，包括 manifest、真实 GLB、Chrome 截图和浏览器 QA JSON。

## 美术与发布边界

我已查看近景。酒红款整体比办公室装束更有舞台辨识度，但这仍是选型候选，不是用户最终美术验收，也不能将自动化测试数字当作衣物完全不穿模的证据。真实的专属音乐指挥动作、胸针细节、鞋底、近景表情、音频和长期加载性能仍需打磨。

本次模型文件不替换原 M01 二进制、不修改存档/棋盘/出牌/战斗规则、不触及食堂阿姨。合并 GitHub 不是 PlayMoru 线上发布；在线真实访问必须有独立部署回执。删除或关闭 QA 参数即可回退原装。
