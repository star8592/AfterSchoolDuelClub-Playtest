# R211｜视频研修驱动的三张法术接触特效升级（独立 Draft）

2026-11-20；基线 R210 Draft 8478c79。正式 R198 完全不受影响。

## 来源与实事求是的证据边界

用户提供的影片：https://www.youtube.com/watch?v=waaAXPt7RG8
研修记录：https://github.com/star8592/AfterSchoolDuelClub-Playtest/pull/190#issuecomment-7037549918

YouTube 拦截了网页、下载器及自动字幕访问，未获取完整字幕；这次不冒称逐字转录或逐帧看完。根据可验证的公开视频资料，将 AI 视频转 Flipbook、AI 图集和 AI 生成程序化特效的思路落成了可复现的 WebGL 实验。实际贴图由本地 Python 原创程序离线生成，不是从该视频下载的画面。

## 实施

- 三张样板：E06 fire、T05 water、S08 electric。使用独立开关 r199PhysicalMagic=on & r210Elements=on & r211CinematicVfx=on，默认全部关闭。
- 新模块 scene/campus-r211-cinematic-vfx.mjs；双层 Fire/Water 16帧 RGBA WebP flipbook + 少量3D火星/水珠，电系为真实生成的分叉几何带与细电花。
- 原R199真实GLB飞行与接触、R121权威结算、R204角色动作、R209声音导演保留。这里只负责命中点附近的物质感、反应和消散，不在点击卡牌时制造假伤害。
- 替换而不叠加：这三牌仅R211渲染，其他43张魔法由R210原有元素系统控制；没有新增泛化光环、全屏Bloom、PointLight或自定义shader。
- 图集压缩大小：fire 81,838字节，water 129,892字节；总计约207KB。资源生成器 tools/build-r211-vfx-atlas.py 可复现。
- 三个并发特效上限，每个特效最多3个新增 draw calls，按事件过期释放网格和材质，纹理为场景内共享。纹理加载失败回退到R210。

## 真实Chrome / Z890 WebGL2-Vulkan 验收

**美术预览（不是实际对局）：**
- qa/browser-r211-hero-fx-real-chrome.mjs
- E06、T05、S08 三种纹理全部加载；3/3产生效果，R210同时产生0个旧效果，JS与HTTP错误0；真实Chrome截图 r211-real-chrome-hero-fire-water-electric-qa.png；原生GPU无声录像 r211-original-chrome-three-hero-vfx-qa-silent.mp4。
- 录像没有声音，也不是AI生成的视频，不代表完整战斗演出。

**正式规则路径（从玩家真实手牌出牌、原始3D道具碰撞）：**
- qa/browser-r211-three-real-rule-cards.mjs：全部PASS。
- E06：经典卡组 seed5，第2回合3费，实际3伤害；画面 r211-real-E06-fire-actual-gameplay.png。
- T05：经典卡组 seed4，第1回合1费，结算heal，满血状态实际 healed=0，不可冒充治疗了生命；画面 r211-real-T05-water-actual-gameplay.png。
- S08：科学卡组 seed1，第1回合2费，实际2伤害；画面 r211-real-S08-electric-actual-gameplay.png。
- 三次均保留原GLB、合法费用扣除、广角/无第二相机、不改规则、无重复R210，错误0；回执 r211-three-real-cards-rules-chrome.json。
- R210与R211真实截图对比 r211-real-3card-r210-vs-r211-contact-sheet.jpg；注意不是严格相同动画时间点。

**单机性能观察（非正式基准）：**
- qa/browser-r211-r210-ab-frame-interval.mjs；同样Chrome/Vulkan、1280×720，分别采55个requestAnimationFrame样本。
- R210平均帧间隔17.58ms，P95 16.8ms，P99 66.6ms；R211平均17.27ms，P95 16.8ms，P99 50ms。
- R211样本测量末电弧已按0.84秒自然消失，活动效果仅剩2个；三效果初始截图调用约733→748。不同瞬间不能当严格基准，不能宣称提速。
- 未测试XPS低配冷加载、全回合显存占用、长期音效自然度；这些依然是发布阻碍。

**自动化：**
- qa/unit-r211-cinematic-vfx.mjs：三牌映射、WebP容量、事件生命周期、资源回收及禁用光环等PASS。
- qa/unit-r210-no-halo-15-elements.mjs：R210的46卡15种运动回归PASS。

## 后续与发布边界

这次解决的是“原来只有多面体造型，缺少流动火水与电弧”的关键缺口，但程序化原始图集的自然度还需用户观看实机画面签收。尚未达到电影级真实流体，也没有完整字幕可逐句引用。

严格保持 Draft / NO-GO：不合并main，不更新正式R198，不默认启用。先修具体美术问题，再测XPS冷开及长回合性能，不提前扩张46张特效。

