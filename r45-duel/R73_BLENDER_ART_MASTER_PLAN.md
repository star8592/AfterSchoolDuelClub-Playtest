# R73 · 角色美术由可玩原型升级为 Blender 可编辑制作流水线

状态：本轮已落地首个角色 Blender 改造，而非仅展示一个插件列表。R70/R71 的 Qwen3-TTS 和游戏声音仍正常运行；R72 已有 19 张可玩卡牌、13 种可召唤实体。本分支从 R72 `311c075` 派生，不修改战斗结算数值。

## 一、Blender 资源和插件是候选库，不是自动质量保证

本机 Blender 5.2.3 LTS，工作盘 `/mnt/disk1/H3_Studio/` 与 `/mnt/data/toolchains/`；已检索插件沙箱、资产生态系统、ModelVault 和已有游戏资产。

- Blender 官方扩展库的**五个已下载、已校验 SHA256、许可初审通过的候选**仍在 `/mnt/disk1/H3_Studio/blender-plugin-lab/20261111/sandbox-scripts`，并非已安装在日常生产配置里。
- 2026-11-11 在独立 `BLENDER_USER_SCRIPTS` 沙箱用 Blender 5.2.3 实测：`antlandscape`、`PlaceHelper`、`mat_baker` **3/5 成功启用**；`sapling_tree_gen` 和 `texel_density_checker` **2/5 未能启用**，分别因扩展包命名空间和偏好配置上下文不兼容。日志 `/tmp/r73-blender-plugin-smoke.log`，正式用户插件未被改动。
- `Mat-Baker` 可作为后续有具体纹理/材质需要时的候选；`Rigify` 是 Blender 自带模块；复杂角色必须逐个检查骨架，不强制给所有来源互不兼容的模型重做骨骼。
- `/mnt/disk1/H3_Studio/asset-ecosystem/20261111/` 已有目录库/GLB 索引；资源数与独立可用完成品数不能混为一谈。个别库中有程序化地形试验件，不迁入自然地貌正式作品。

## 二、首件实际升级：T01 猫头鹰播音员

现有运行场景旧源 Gobkit BarnOwl 浏览器约 520 triangles，Blender 导入后约 600；模型库的 Polyfork Owl 原始 GLB 约 3502 triangles、21 根可变形骨、Idle/Walk/Run/Fly 4 个动作。只替换原始 Owl 会失去播音员身份。

因此本轮不是单纯换高面数，而是在 Blender 5.2.3 中为真实 Polyfork Owl 骨架增加 **15 个布线和网格配件**：头梁、双耳机、奶油色耳垫、金色装饰件、麦克风收音杆、泡沫话筒、录音指示灯及胸前徽章。配件按原始 `Head` 和 `Chest` 骨骼设置顶点权重/Armature modifier，不脱离原始骨骼运动。保留 Owl 原身、21 骨骼和四个源动作。

- 原始精确来源：`https://polyfork.dev/asset/owl-base`，CC BY 4.0；保留完整署名和改动说明，不宣称原创模型完全由本项目创造。原始 GLB SHA256 `43932e56a0e4f4755b68253006ab9ca37a838bde552d7a3f2f6f3e19167a7cc9`。
- Blender 母版：`assets/summons/T01-BroadcastOwl-PolyforkRadio-R73.blend`。
- 游戏 GLB：`assets/summons/T01-BroadcastOwl-PolyforkRadio-R73.glb`，源码在 `art-lab/r73-blender/build_t01_broadcaster.py`，导出结果 / 新旧 SHA256 在同名 `.build.json`。
- 网格：Blender 重新导入约 16,222 triangles，浏览器实际 glTF 渲染统计 15,982 triangles；19 个网格、6 种材质、16 个蒙皮网格、21 变形骨、4 个动画、权重全覆盖。两套数字来自不同计算方式，不把三角面数量当成美术通过。
- `summon-models.mjs` 的 T01 运行映射已切换新 GLB；动画选择同时兼容不同 exporter 的 `Idle.001` 形式，避免新资源拿到 `Fly` 当默认待机。所有 T01 旧模型仍保留作回退。
- `runtime-assets.json` 更新模型源、版权、哈希、尺寸和 `art_approved:false`；帮助页面同步保留 Polyfork 来源署名。

## 三、游戏实际试镜回归（不伪造像素）

- `qa/r73-owl-audition.html` 三栏实时 WebGL2 试镜：旧 Gobkit、原始 Polyfork 和经过 Blender 改造的 Polyfork 广播员。支持 0°/45°/90°/180°，桌面 1600×900 与竖屏 430×900。
- `qa/browser-r73-owl-audition.mjs` 八场真实硬件 Vulkan 试镜，8/8 通过（模型三角面、动画、实际蒙皮数量、无 JS 错误）。
- 因 Chrome 首次 Vulkan headless 启动偶发全白页面 / 纯黑 WebGL 像素，本轮追加 `qa/r73-pixel-gate.py`，从 WebGL canvas 直接保存像素、对图片真实均值与方差进行 8/8 验收；首帧失效时只给沙箱试镜页一次重新加载机会，不改变游戏规则，也不拿白图冒充成功。证据在 `qa/evidence/r73/`。
- `qa/browser-r62-scale-audit.mjs` 实机 Nvidia Vulkan：新 T01 在双方阵营、桌面/竖屏、相机 0/45/90/180 度，实际 `frontDot=1`、高度约 1.14–1.16、脚底在地面附近、完整进入画面。新角色没有因耳机长大到挡住其他单位。
- 13 角色的 `qa/browser-r61-all-summons.mjs`：三种视口均通过分批双阵营召唤、重复角色和清空，11 个实际 GLB + E01/G01 原始 VRM 均保留；真实战斗 `qa/browser-r51-combat.mjs` 4/4 通过；语音 `qa/browser-r70-qwen3-voice.mjs` 宽/竖 2/2 通过。

## 四、下一批角色美术优先级（有实际数据支持）

`qa/r73-cast-art-inventory.py` 直接读取 13 个源 GLB/VRM 的三角面数、蒙皮、材质、动画及哈希，生成 `qa/evidence/r73/cast-art-inventory.json` 与 `cast-art-review.md`。

1. **P0 E03 加油队长**：现有普通学生底模约 1700 三角面，队长服装、喜剧神态和自然双手不成立。先对照人设找合适头身比例与正版授权模型，再用 Blender 制作有鲜明身份的队长角色。
2. **P0 G02 黑板密码专家**：通用工程师错配学校黑板角色。优先换适配人物，之后骨骼/材质/黑板道具联动。
3. **P0 T03 默契收发员**：当前仅单个配送员，不能表演“默契收发”；设计两人互动再编辑已授权源模。
4. P1 M01 音乐老师 / E01 / G01 / E04 / G03 / G04 / T01 / T02：逐个改角色独立身份、手部动作、PBR 材质、服装和叙事物件；不把暴力细分当成高模。
5. P2 E02 纸飞机 / T04 守门人：保留已经合理的模型尺寸和出场逻辑，后续加强造型、材质和动作。

所有模型 `approved_final_art=false`，符合用户先全游戏可玩、再集中升美术的分阶段开发路线。下一阶段每个角色均按「原画锁定→授权底模→Blender `.blend` 母版→动作/材质/UV→导出 GLB→双阵营和多视角实测→美术审核」交付，不再让旧原型悄悄替换新版。

## 开发体验

Z890 本机独立 HTTP 演示（需要该端口仍在运行）：
- 主游戏：`http://127.0.0.1:11003/r45-duel/`
- 三栏猫头鹰对比：`http://127.0.0.1:11003/r45-duel/qa/r73-owl-audition.html?angle=45`

这些均是本地开发演示，**不是对外主站**。正式主站不覆盖，直到完成实际视觉审批。
