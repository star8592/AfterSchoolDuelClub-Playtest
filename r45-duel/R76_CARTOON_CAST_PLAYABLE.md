# R76 · 从低模补丁转向原生高质量角色基底，新增可玩的「食堂阿姨」

本次研发从 **R75 `bdfcf073`** 开独立工作树。基础玩法规则仍为原本单个三维体育馆、左右两个出牌者、中央召唤竞技场。本次交付新的一张可玩角色 M02，而不把原有 T02「食堂隐藏菜单」错叫成食堂阿姨，也不删除旧版本的回退资产。正式站点未覆盖。

## 一、四套高质量候选确实下载成功，不是资源目录数量

从 [vibeassets](https://vibeassets.io/browse?animated=1&category=3d&sort=recent) 的开放 CC0 目录实际下载并检查四种完整的卡通人体 GLB：

| 候选 | 类型 | 实际三角面 | 变形骨骼 | 原始动画 | 来源 |
|---|---|---:|---:|---:|---|
| `cafeteria_aunt` | 食堂阿姨（圆润，全身非独立大肚） | 31,139 | 24 | 10 | https://vibeassets.io/a/4yhw0ja37h |
| `sports_teacher` | 肌肉体育老师候选（漫画比例） | 31,251 | 24 | 10 | https://vibeassets.io/a/vr9ojdtnca |
| `elderly_dancer` | 年长舞者候选 | 31,180 | 24 | 10 | https://vibeassets.io/a/anpj9kswp2 |
| `school_announcer` | 人类舞台主持人候选 | 31,165 | 24 | 10 | https://vibeassets.io/a/tm1p0ui12r |

四款均原生 GLB、真实单个 skinned mesh、10 个作者绑定动画、1024 贴图；没有程序造人、低模细分、后期硬凹体形或把别人的完整模型拆开再拼。源文件名、SHA256、节点数、变形骨、动画片段及授权声明都存于 `art-lab/r76-cartoon-cast/sources/R76_SOURCE_INVENTORY.json`。

**明确授权边界：**提供方网页及 API 将其标为 CC0，但 GLB 自身未嵌入完整许可证；部分美术由 Meshy 图转三维自动生成，创作出处仍须进一步复核。因此这是研发候选资产，不能把“平台自称 CC0”写成“版权链完全核验”。所有候选 `art_approved=false`。原作《学渣决斗者》由罗罗汤马西光创作，Bilibili 原页视频注明“未经作者授权，禁止转载”。我们只做角色风格参考，不使用原作视频资产或人物三维模型。

## 二、实际镜头证据先于判断

- 新增 `qa/r76-cartoony-cast-audition.html`，四人同屏 WebGL2 模型试镜，可选自然待机、挥手、欢呼、舞蹈、生气、耸肩；可切换 0/45/90/180/270°；背景可切换干净工作室与原本三维体育馆。`focus=cafeteria_aunt` 可单人近景审视细节。
- `qa/browser-r76-cartoon-quality.mjs` 在 NVIDIA Vulkan 硬件 Chrome 禁用软件渲染下进行宽屏和竖屏共八种组合，**8/8**，每次 4 个真实 GLB，含真实 JPEG 贴图和 10 动画，收集错误/姿态/骨骼变化和 canvas 真图。并进行了食堂阿姨 0/90/180/270° 近景视觉实拍。
- 实际截图显示，来源文字声称的前方为 +Z 与原始渲染不一致。为 M02 设置单独 `sourceFrontYaw=π/2`，使游戏内模型在两侧确实面向对手；此校准基于来源实际渲染四视图，不是简单“frontDot=1”数学自证。

## 三、M02 作为真正可玩的第 20 张卡牌接入

- `engine.mjs`: 增加 `M02 食堂阿姨`，默契风格，费用 3、攻击 3、生命 4。原有 E04「食堂接力冠军」和 T02「食堂隐藏菜单」身份保持独立，不再让错误角色相互顶替。
- `assets/summons/M02-CafeteriaAunt-CartoonR76.glb`：原始完整 2,839,340 字节 GLB；无修改，**与源下载 SHA256 完全一致**。为了减少冗余，仓库只保留游戏文件一份，不二次保存相同的 2.8MB 字节文件。
- `summon-models.mjs`: 注册 M02 的真实源、尺寸与原生动画；自然 Idle 使用原生动作，攻击用原生 `Grip_and_Throw_Down`，受击用 `Angry_Stomp`，不是源代码加速摇摆胳膊代替动作。
- 同步了模型版权账本、14 角色清单、正面轴、全息出牌识别、测试合同与场馆提示。既有两名常驻 VRM 决斗者没有消失。所有尚未完成的美术审批字段为 `false`。

## 四、Qwen3-TTS 出场 + 攻击配音，两条都是新生成

使用既有离线 Qwen3-TTS 1.7B CustomVoice（Z890 GPU），没有恢复旧 IndexTTS 或复用别的角色音源：

- M02 出场音频：原创中文台词“都别挤，都别挤！热腾腾的加餐端上来啦！”；3.37 秒；`assets/audio/voices/M02-enter.ogg`。
- M02 攻击音频：原创台词“还想接着打？先把这一大碗饭吃完！”；3.61 秒；`assets/audio/voices/M02-attack.ogg`。

二者是 GPU 生成的 Opus 文件，有独立 SHA256、口播文本和完整 manifest，**仍需人耳艺术试听**。R76 浏览器实测两端 2/2 可正常播放出场/攻击两个文件、音乐 ducking 正常、无 JS 或音频网络错误。声音旧基线目前是 13 名有口播角色、16 条语音、9 个音效、2 首曲目；旧角色音频无删除或覆盖。

## 五、真实游戏回归记录

- `qa/r61-rule-all-cards.mjs`：20/20 卡牌真实规则，14 人物 + 6 事件。
- `qa/r62-facing-contract.mjs`：14 角色 × 双方阵营 = 28/28 朝向合同。
- `qa/browser-r76-cafeteria-playable.mjs`：玩家真实抽到 M02、支付能量出牌、实体进入场上。对面与我方均重复召唤两位，每阵营 64 帧实际落地和朝向检查，桌面/竖屏 **2/2**；脚底误差约 .014、角色高度约 2.25–2.32，真实源模型没有消失。
- `qa/browser-r76-cafeteria-attack.mjs`：第 3–4 回合内 M02 真实产生 `direct_hit`/`exchange` 战斗事件，**桌面/竖屏 2/2**，非凭空演出。
- `qa/browser-r61-all-summons.mjs`：14 名不同角色全体分批召唤、同阵营重复、对面镜像、清场回收，宽屏/常规/竖屏 **3/3**。
- `qa/browser-r51-combat.mjs`：历史旧测试固定随机种子在添加新卡牌后发生牌库洗牌变化；已改成实际寻找合法起始手牌种子后，四种真实战斗场景 **4/4**，没有改游戏算法来迁就测试。
- `qa/browser-r76-cafeteria-voice.mjs`：新 Qwen3-TTS 出场 + 攻击真人浏览器播放 2/2。
- `qa/r76-cast-art-inventory.py`：独立生成 14 名场上人物三角面数、蒙皮/材质/源 SHA256 和角色匹配风险，最终美术审批仍为 **0/14**。

## 入口（Z890 本机有效，不是公开主站）

- 游戏主页面：`http://127.0.0.1:11007/r45-duel/`。
- 四位卡通原生高模与原生动作：`http://127.0.0.1:11007/r45-duel/qa/r76-cartoony-cast-audition.html?motion=cheer&angle=45&venue=gym`。
- 食堂阿姨四视图：`http://127.0.0.1:11007/r45-duel/qa/r76-cartoony-cast-audition.html?motion=idle&angle=270&venue=studio&focus=cafeteria_aunt`。

## 尚未完成，下一轮严守角色艺术基线

1. 不声称所有模型与原作风格一致。已知 M02 服装是薄荷绿、原作中食堂阿姨常见红/黑职装，且原作视频帧尚未核实；若一开始基板不相似，应继续寻找更合适的完整授权人物，而不是大量改薄荷绿模型。
2. 游戏模型变多不代表每个低模值得继续加工；E03 加油队长、G02 黑板专家、T03 双人收发员仍为错配最高优先级。
3. 公开主站不覆盖；已验证的是 R76 独立研发 URL，不虚称正式发布。来源链/原作授权/最终美术一致性都需要单独确认。
