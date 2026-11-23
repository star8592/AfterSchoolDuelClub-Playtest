# R220｜16角色逐人动作审计 + 财富小镇 / 丹道 Blender 真实工程对照（美术NO-GO）

2026-11-21；《放学后决斗社》 **隔离角色重构实验**，基于 R216 已审计版 `eb60efc`。本轮工作只创建 `qa/r220-character-audition/`，**不替换正式游戏角色，不影响玩家的R198版本和main，不修改卡牌规则或现有魔法演出**。核心标准：**真实画面和连续动作不达标，就不能把某人宣称“修好了”。**

## 1. 用户提供的成功路线确实存在，已按原始工程核查

| 项目 | Z890源资产 | 骨骼 / 原生动画 | 已有可编辑工程与价值 |
|---|---|---|---|
| 财富小镇女厨师 | `/mnt/disk2/projects/WealthTown3D/web-v10-optimized/assets/chef_desktop.glb` | 24骨骼、6组，Idle_Breathe、Run、Walk、Make_Juice、Give_Cup、Receive_Cup | `art/source/v07/chef_woman_desktop_v07_service.blend`，完整NLA流程，模型可约2.83MB |
| 财富小镇小男孩 | 同目录 `teen_desktop.glb` | 24骨骼、同样6组 | `art/source/v07/teen_desktop_v07_service.blend`，模型约3.23MB |
| 丹道洛青荇 | `/home/master/projects/DanDao-V1-OnlinePG-20261119/art-lab/w49/assets/luoqingxing-animated-hanfu-v04.glb` | 24骨骼，Idle、Walk、Run、Talk、Examine 五组 | `w49/source/w49-luoqingxing-animated-hanfu-v04.blend`，独立衣袍网格、三组袖摆/裙摆微小形态键、可编辑Blender和WebGL实录 |
| 丹道W45女巫参考 | `art-lab/w45/assets/witch-rigged.glb` | 约15MB，女性角色参考 | 是西式女巫基础素材，仅供造型/绑定参考，**不是洛青荇完成品** |

财富小镇的动画制作脚本 `art/author_service_actions_v07.py`，不是虚构的“纯程序摆姿势”：原模型经Blender绑定和手工关键帧操作，NLA追踪与骨骼四元数输出到真实glTF动画。丹道W49同理，额外处理服装形变与材质。真实成熟的是**「可编辑骨骼 + 清晰动作命名 + 游戏里实际播放 + 原始工程和视频签收」**工序，并不是单靠换一个GLB就自然完美。

## 2. 完整16份角色源动画结构审计（仅源GLB/VRM，不混淆运行时）

原始机读JSON：`qa/r220-character-audition/evidence/r220-16-actor-source-animation-audit.json`。

| 角色 | 源文件事实 | 动作判断 / 优先级 |
|---|---|---|
| E03 Ellie、E04 Phil | R97含Idle/Attack/Hit，但全部只写Morph `weights`，**0骨骼旋转通道** | **必须真正重新绑定动作或换可靠的完整骨骼模型，优先级P0** |
| G02 Snow、G03 Jay、G04 Victoria | 同上，含高面数皮肤与大量嵌套节点，却无源骨骼旋转动画 | **P0**；本轮先对Jay做跨项目实机验证 |
| T03 Rain、T04 Rex | 同上，只有Morph源动画，没有真实源骨骼动作 | **P0** |
| M01音乐老师 | 原生Idle/Walk/Run三组骨骼动作；R126/R206运行时另叠加教师姿态 | **P0专项视觉检查**：仍有T字手、行为不像老师的用户反馈，不能因为有骨骼剪辑就视为通过 |
| M02食堂阿姨 | 原生10组独立动作，每组72通道，包含跺脚、挥手、跳舞、投掷和庆祝 | **保留为风格/动作参照**，用户认为最自然，但仍需在正式镜头里逐动作核验 |
| T01猫头鹰 | 原GLB无内置动作，由R127运行时控制羽毛/姿态 | **P1**：单独评估是否像木偶 |
| E02纸飞机、T02活菜单 | 含独立平移、旋转或特殊物体动画，非人形角色 | **P1**：检查物理趣味和受击逻辑，不宜强行套人类步态 |
| 两名源VRM（E01/G01）及两名台上主持VRM | 原源文件无glTF内嵌动画（但有可用骨架） | **P0**：需要独立的举牌、出牌、反击、成功/失败和闲聊动作，运行时R204/R134姿态不足以替代实际验收 |

**重要边界**：R119、R134、R135、R136以及R206在运行时还会为部分原始模型生成/驱动额外动作，因此“原始GLB没有骨骼旋转”**不能推出整个游戏里完全没有骨骼驱动**。但这些补丁曾多次通过代码级测试仍未被用户接受，证明以后**必须以实机连续表演而非动作代码数值**决定去留。

## 3. 第一人：G03 Jay 原模型 vs 财富小镇男孩重建

已真实执行Blender 5.2.3 LTS，基于财富小镇GLB经过再加工（不修改源项目），新建：

- `qa/r220-character-audition/source/jay-teen-duel-v01.blend` — 可编辑的原始角色、材质、24关节及动作轨道；
- `qa/r220-character-audition/author_jay_v01.py` — 完整、可重建动作的Blender程序；
- `qa/r220-character-audition/assets/jay-teen-duel-v01.glb` — 最新实际导出5.19MB，保留财富小镇6个动作，加上 **Duel_Idle_LookAround、Duel_DrawCard、Duel_ThrowCard、Duel_Recoil、Duel_Victory** 五个新的真正骨骼动作，共 **11个**；每个新动作覆盖24个真实骨骼旋转通道；
- `qa/r220-character-audition/check-jay-native-bone-actions.py` 验证骨骼命名、身体/双手/双腿的动画轨道和动作时长；**程序测试PASS不等于美术PASS**。

独立WebGL页面 `qa/r220-character-audition/index.html`，同场加载财富小镇女厨师、小男孩、丹道洛青荇、旧Jay、新Jay，共5份真实GLB；点击按钮可切换「Idle / Draw / Attack / Hit / Victory」，URL `?focus=jay` 专门放大旧/新Jay的对照。独立场景已接入与正式R97相同的 Meshopt 解码器，避免因旧Jay压缩方式错误而假称原模型无法加载。新Jay另外持有真正的游戏G03卡牌纹理，卡牌跟随右手骨骼移动，甩牌时沿路径投出；这**只是动作演示，不是已经接到60张卡牌的游戏玩法**。

### 真实Chrome核验

- 五人同场 / Jay同镜头近景全部加载，通过，JavaScript和HTTP请求错误0。
- 新Jay本轮 Idle 样本5骨骼出现可测角度改变，Draw 13、Throw 12、Hit 5、Victory 9根骨骼显著改变；原Jay的隔离Viewer场景树检出0个实际Bone对象，其原始动作仍基于Morph。这说明**技术动作链路确实不一样**，不意味着新姿态就自然。
- 真实浏览器对比图 `evidence/r220-jay-before-after-4-poses-real-chrome.jpg`，原型演示视频 `evidence/r220-jay-real-chrome-draw-throw-recoil-v01.mp4`，各动作原始PNG及JSON都存档。视频由实际Chrome/Playwright录屏，经ffmpeg转码，不是AI合成动画或静态画面假装动作。

**本轮视觉结论：未通过。** 财富小镇男孩本身精致、骨架确实会动，但蓝色运动T恤/短裤与原Jay的校园魔法人物身份和色彩不吻合；本轮手工骨骼动作部分摆动仍像舞蹈、脚部支撑和甩牌重心不够可信，喜剧表演也没有成熟到“用户一看就接受”的程度。禁止直接替换G03正式角色，继续保留旧版。

## 4. 专业动作库KayKit重定向也已实际实验并否决本轮实现

KayKit CC0原始动画库 `/mnt/disk2/projects/WealthTown3D/art/vendor/animation/Rig_Medium_General.glb` 自带Throw、Hit_A、Idle_A、Interact等，23骨骼且**无Mesh只有骨架和动作**。Two attempts:

1. `SkeletonUtils.retargetClip` 世界空间直接重定向：浏览器输出18等骨骼运动，但由于rest pose/骨架轴不一致，新Jay完整人物**偏离可见视野**（截图有证据），完全不合格。
2. 局部四元数delta重定向：保持人物在视野、17个骨骼可见动作，但在同镜头截图中抬手/甩牌/受击姿态不自然、对不上实际触点，也**不合格**。

两条只存在 QA viewer 的显式 `?motion=kaykit` 和 `?motion=kaykitLocal` 实验，默认不会运行，更不允许出现在游戏正式分支。成熟的下一步应该是真正统一rest pose、correct bind transforms、需要手脚IK和脚底接触约束，再在Blender做动作师级关键帧修整，**不能再因为源动画叫Throw就说人会正确出牌。**

## 5. 严格逐人验收合同

每个需要修改的人物按固定顺序交付：保留原模型原视频与美术身份 → 检查模型mesh/skin/bind pose/动画通道/材质 → 选择保留重绑或换模型 → 在Blender保存可编辑工程及实际骨骼动作 → 在独立浏览器录制 **真实 Idle / Walk / 出牌或攻击 / 受击 / 胜利 / 闲聊**，同焦距同角度对照 → 人工检查脸、衣服、手肘、膝盖、脚不滑、角色方向、动作节奏 → 接入原60卡牌真实规则后，再做长回合画面/音效/性能验收。正式角色需要**逐人真人视觉签收**，不能用“16/16加载”或“24骨骼绑定”证明自然流畅。

R220目前仅第一名**Jay试作**已完成上述前半段，**美术门槛NO-GO**；其他角色已完成资产级分类，**没有假称已经逐一修完**。

正式R198未动，R216性能基线不动；R220隔离Draft，不得合并main或自动开放给玩家。
