# R149 候选评估：Ara 3D Gen 统一骨架与七段真实动作（技术 PASS／美术 NO-GO）

日期：2026-11-14。项目唯一发布入口保持 `/r45-duel/`，**这不是已经发布的正式 R149 游戏版本**。主线人物/游戏/镜头/食堂阿姨/音效全部保持原状。

## 为什么做

用户已明确否决继续靠高复杂度原作者 DEF 骨逐项硬修 329–1887 关节、动作生硬、T-pose 与灰扑扑脸的路线。食堂阿姨让人满意的关键是**完整骨架＋已有动作＋正确蒙皮＋材质＋性格演出配套**。本次检验新的、成熟标准骨架＋现成动作系统是否值得进入人物更换工序，绝不能单看测试分数说角色升级完成。

## 真实试验

在 Z890 本机隔离环境 `/mnt/disk1/H3_Studio/game-toolchain/external/ara-3d-gen-evaluation/`，已检出并固定上游 `olatunde85/3d-gen@fc0cf3fdc8f845420b01674e9bbbd61f460255c9`。源代码 MIT、MakeHuman 数据 CC0、CMU 动作数据允许游戏嵌入但不得独立转售；旧食堂阿姨 MakeHuman CC0 ZIP 直接复用并 SHA 验证。构建 MakeHuman 库 20 skins / 1037 morph targets / 97 texture files，TypeScript typecheck PASS。

通过 `buildHuman()` + `planExport()` + `runExport()`，而非人工改旧骨骼：
- E03 对比候选：`PlayMoru-Ellie-Standalone-Study.glb` 120,544 tris、69 bones、17 materials、15 embedded images、12,509,800 bytes。
- T04 对比候选：`PlayMoru-Rex-Standalone-Study.glb` 122,206 tris、69 bones、16 materials、15 embedded images、12,873,180 bytes。
- 两人各有**实际内嵌七种可播放动作**：Idle、Walk、Run、Punch、Hit reaction、Cheer、Wave；现有 AI3D `glb_rig_inspector.py` 读取真实 GLB，均 1 skin、69 joints、7 clips，结构无错误。
- Chrome WebGL + Playwright 真机双人展示：7 个独立按钮，6 张动作截图、7 条运行检查通过，JS/HTTP 异常 0，16.84s、1200×800、25fps 的真实连续录屏；`acceptance.json` 有证据回执，Walk/Attack/Hit/Cheer/Wave 与待机帧均有明显像素差异。这里证明确实有动作且浏览器能跑，不代表动作艺术优秀。

本地证据：`/mnt/disk1/H3_Studio/game-toolchain/evidence/ara-character-pilot-20261114/`。
- `manifest.json` 和 `rig-inventory.json` 包含可追溯 GLB hash；
- `browser-proof.json`、`acceptance.json` 是实验记录；
- `qa-*.png` 与 `ellie-rex-animation-review.mp4` 是真实画面；
- Z890 本机 `http://127.0.0.1:8773/pilot.html` 为受管隔离只读预览（HTTP 200、非公网、非 PlayMoru 正式页）。`browser-pilot.cjs` 已在证据目录中，不修改现有 game runtime。

## 美术裁决：不使用这两名生成形象替换正式 Ellie / Rex

我查看过实际 Chrome 同角度 Idle 和 Punch 截图：人体贴图颜色正常、四肢可以动，并未静态 T-pose；但脸、五官年龄感、发型、服装造型仍偏写实成人、通用感强，**不符合既定高品质动画电影风校园喜剧**，也没有与现有角色艺术身份达到一致。即使技术可播放，**正式角色选型 NO-GO**。未对脸部夸张表情、头发衣服动画、道具握持、与食堂阿姨同场视觉效果以及连续动作导演节奏取得独立美术签收，不具备发布资格。**绝对不能像过去一样因为技术通过就将低质人物上线。**

## 真正后续工作

1. 以优秀预览实物为先：找成熟的高品质校园学生/老师整套人物，具有真实可商用 GLB/FBX、PBR 贴图、对应骨骼和 Idle/Attack/Hit/Walk/Cheer 等动作（或可合法配套的专业动捕库）。排除低模、无贴图、只有封面而无动作、仅卖家营销图的候选。
2. 用 Ara 成功验证的标准骨架＋现成动作 **作为可选技术方法**：仅当它与真正高质量艺术人物相容、不会重定向僵硬/失真时使用。优先整套原生动画模型，不强行移植旧 DEF 骨架。
3. 两名首批角色只做独立 10–15 秒真人物近景：脸、动态表情、衣服鞋子、攻击蓄力、受击反馈、胜负庆祝、对手反应；和既有食堂阿姨放在同一舞台对比，用户看到了觉得好才推广其他角色。
4. 要保留正式 `R147` 安全回退；任何新模型在完成艺术验收、正式卡牌链真实跑通前不开放默认。不要让性能、声音、镜头被新形象影响。
5. 不能自动购买 Fab/ActorCore 付费资产或未授权下载。Mixamo 需遵守 Adobe ID 地区限制和授权。每件资产权利信息与来源要有原始文档。

## 技术沉淀

可复制、真实运行的 Ara 适配样例保存在 GlobalGameFoundry `tools/ai3d_factory/adapters/ara/playmoru-character-pilot.ts`，详细研究在 `docs/research/2026-11-14-ara-3d-gen-animation-ready-pilot.md`，对应技术雷达也标注 `TECHNICAL_PASS_PRODUCTION_ART_NO_GO`。不能单独拿本文件代替对真实人物品质的检查。

参照前次 `docs/2026-11-14-ANIMATION-FIRST-CHARACTER-ASSET-STRATEGY.md`。没有增设管理平台，没有更动正式玩法、现有资产和线上部署，也没有再次对 R133 工作区未提交内容进行更改。
