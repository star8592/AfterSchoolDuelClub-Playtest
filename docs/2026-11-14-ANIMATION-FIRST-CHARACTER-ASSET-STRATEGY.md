# 2026-11-14：人物制作改为「成熟资产＋动作库优先」，停止逐骨骼手工动画主线

> 本文是技术与美术路线更正，不是 R147 正式游戏发布，不改变正式角色选择/URL/玩法。研发方向由用户明确决定：放弃长时间纠结大量原始复杂骨骼的低质量试验，优先采购/合法采用一整套有角色、绑定、动作、PBR 材质的成熟资源；现有食堂阿姨（T02）以及被用户认可的 M02 动作必须保留。高精度、动画电影风格，拒绝方块/Q 版低模和灰色僵尸感。此规范应优先于旧的逐骨修补思路。

## 真正审过的事实

2026-11-14 通过已授权 Z890 Zoria，读取 /home/master/projects/after-school-duel-r133-shoe-contact-20261114 的真实 GLB JSON、来源回执及游戏程序，不基于猜测：

- T02 Canteen Aunt + Living Menu: 一个 GLB、53 个人体骨骼、9 个动画，但 **4 个属于阿姨**（Idle_Aunt_Breath / Serve_Menu / Wave_Welcome / Hit_Recoil），**另外 5 个是菜单**；并非“阿姨有 9 个身体动作”。来源在 `r45-duel/qa/R67-T02-FULL-DUO.md`、`r67-t02-duo/T02-CanteenAunt-LivingMenu-Duo-STUDY.provenance.json`。人体模型采用 MPFB 2.0.18 / MakeHuman game_engine 53 骨与 CC0 system pack，以及 Blender 制作的厨装/动作；菜单既有来源仍需逐资产权属检查。状态明确为 STUDY_ONLY、ART_NO_GO、COMMERCIAL_NO_GO。
- E03 Ellie R119 / R132: 329 个 skin joints、28 个 mesh、内嵌动画 0；R132 静态原始朝向五视图比 R119 放下胳膊，但不能证明动作自然。约 55 个加权 mesh primitive。原始骨名大部分为复杂 `DEF-*`；R135 运行时 JS `createR119TrueSkinClips` 在运行中驱动动作，故“0 内嵌动画”不等于“游戏里 0 动作”。
- G02 Snow 293 关节、G03 Jay 295、G04 Victoria 311、T03 Rain 392、T04 Rex 299；同类 R119/R132 试验 GLB 内没有现成动作。R133 浏览器真实操作在 E03 下 11/11 技术检查通过，**但美术表现由用户明确否决，测试不等于质量合格**。
- 通过本机 GLB JSON 遍历 `r45-duel/assets`：83 个 GLB、其中 52 个内嵌动画。旧有 `E03-CheerCaptain-Schoolkid.glb` 7 条动作、13 关节、单 mesh/贴图，`T04-ClubGuardian-SecurityGuard.glb` 29 条动作、13 关节，也不能仅凭动作数选用；清晰高质量及来源/版权尚待现场验收。
- 实机预实验：Z890 Chrome 在隔离 `/tmp` 加载真实食堂阿姨与 Ellie R132，通过官方 Three.js `SkeletonUtils.retargetClip` 试着映射 Idle_Aunt_Breath / Wave_Welcome / Hit_Recoil。首次实际只匹配 4 个目标骨，输出各 5 条动画轨，浏览器截图中 Ellie 手臂基本无有效运动。**结论：证明了转换 API 可以运行，未证明可以直接跨这两套骨架产生自然动作；本实验 NO-GO。** 原始 `retarget-probe.json` 和 PNG 仅存 Z890：`/mnt/disk1/H3_Studio/game-toolchain/evidence/gamefactory3a-animation-retarget-r03-20261114/`。不继续沉溺于纠正 329+ 个旧骨骼的方向。
- 截图、GLB 结构和外部素材数据都不能替代完整 30 秒真人工质感审核；禁止用测试数字代替用户实际视觉体验。

## 新基线：完整成熟角色动作包优先

优先级按以下顺序依次执行，满足一条就不用下条：

1. **完整角色＋兼容骨架＋≥7 个可播放动作＋PBR 材质**，直接在 Three.js 原版 GLB/FBX→GLB 播放，来源合法且风格符合《放学后决斗社》；优先完整动画电影风格高中/初中校园人物，保持人物各自身份特征。
2. 角色质量优秀但动作缺少的，**优先统一骨架／批量采用专业现成 Mocap**，通过 Mixamo、ActorCore、Rokoko、受权 Fab/Sketchfab 原作者包；只调整骨架适配的映射，不逐帧人工摆动作。
3. 相同 MakeHuman 53 骨架体系可直接复用 T02 的人物四个动作和相关已授权模板，谨记原 T02 人物与菜单的动画、权利、素材来源分别审查；若面貌达不到高精质量，停止该样板而不是降低艺术标准。
4. 若对既有原作者 329 骨模型仅能映射少量骨、手臂固定、动作变形或材质灰黑：直接 **NO-GO**，不再堆新的独立关节修复 R 版本；原档存档且可回退。

## 现成来源（2026-11-14 已核对官方/原始页面；没有采购/下载/本地测评）

- Adobe Mixamo：https://www.mixamo.com/ / https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html ，Adobe 官方称免费、可商用游戏；对中国国家代码 Adobe ID 有访问限制，双足人形；适合低成本动作测试，需保存每次下载动作来源和授权。**不是所有高质量人形都能自动绑定成功。**
- ActorCore：https://actorcore.reallusion.com/ ，专业 rigged cartoon/realistic 人物和 mocap，支持重定向。订阅 https://actorcore.reallusion.com/motion-subscription （2026-11 页面声称 $29/月 20 个动作）。最新官方许可 https://www.reallusion.com/license/content.html ：游戏可用与裸素材转卖/服务内二次分发是不同用途，具体 SKU 和 EULA 单独审核；不自动订购。
- Rokoko：https://support.rokoko.com/hc/en-us/articles/4410463481489-Retarget-an-animation-in-Blender ，Blender retarget 功能可用且免费； https://support.rokoko.com/hc/en-us/articles/4410021327121-Getting-Started-Rokoko-Studio-Motion-Library ，动作库免费/付费混合。Blender/FBX 导入不是免去动作质量检查。
- Fab 学校角色候选（均仅卖家自述，不得按宣传视为测过）：https://www.fab.com/listings/55a3b81d-7ec5-4784-87f4-8ce38263c4d8 （高质量校服女生，声称 Mixamo 兼容、Idle/Walk/Run/Jump/Talk/Sit、PBR）；https://www.fab.com/bundles/58442404-0bab-4c7e-9aff-e1544386f6a6 （男女学生两角色和五动作，卖家自述）；https://www.fab.com/listings/8eafc279-7d76-43f5-8b5f-72b4bf9f196a （优质角色包，但明确不含动作，不满足本次首选）；购买前看实际可下载格式中的 clip 是否存在，查看近景及授权，不购买无试用质量依据的低模包。
- 官方 Three.js 重定向：https://threejs.org/docs/pages/module-SkeletonUtils ，有 `retargetClip`，但使用前需映射一致骨名/绑定姿态和骨骼旋转/比例；API 返回成功不代表动作自然。实际裁决以可见运动和用户审美为准。

## 真实执行路径（极简，不新增一套角色管理后台）

**P0 立刻**：基于完整成熟角色，先找“女生 E03 + 男生 T04 或 G02”两名校园形象，找到至少一个允许本机合法下载的完整动作包；对照食堂阿姨拍 10–15 秒含 Idle→Attack→Hit→Celebrate 的真实动画，不用旧 R119/R132 作为默认模板。不需要一口气替 7 人生成。
**P1**：只有两名角色具备实际播放、原生颜色、形象匹配、动作连贯、脚底接地、手持道具正确之后，复用相同 Rig/动作库给其余学生与老师，允许差异动作保持个性。
**P2**：通过正式高精美术复核才将新模型与动画作为单一可回退小范围版本上线；保留已认可的食堂阿姨和完整卡牌玩法、原本 Audio/Voice/魔法反馈不退步。网页不应长期挂 QA-only flag 作为成品。

## 不再消耗研发资源的事

- 不再“扩大 329→1887 骨骼／修改几十个细骨 quaternion”作为产品路线。
- 不为证明 200/200 浏览器检查通过却用户说像僵尸的演出反复追加毫无意义的门禁。
- 不为了新模型而自动新建商城账户、付费 API、采购或未经许可下载受限资源。
- 不新建重复的 AelOS/GlobalGameFoundry/DevControl 管理站；沿用原项目和已接入的 QA/资产台账。
- 不碰其他进行中的 GitHub/本地工作树；若存有未提交画面和验证资料，只读观察，隔离新试验。
