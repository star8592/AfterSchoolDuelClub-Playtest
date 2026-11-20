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



## R211 第二轮：真实美术错误修复与低配测试边界（2026-11-20）

- **已复现实质根因**：图集生成器中的 clamp() 是 0–1 归一化，但旧代码把 RGB 的 0–255 通道也传给它，造成火焰纯红剪影、水花青色层次被压坏。第二轮明确只对 alpha 应用 0–1 clamp，RGB 使用 np.clip(channel,0,255)。
- 已重新绘制可重复生成的 16帧 fire/water WebP：火焰有黄白焰心、橘色多火舌、透明边缘；水花采用蓝绿弧线、分离碎滴、柔和边缘，增厚水面泡沫。文件分别86,872与73,502字节（合计约157 KB）。没有额外网络下载或额外Shader。
- S08电弧由原跨大范围紫色弧缩小为命中点附近的三束分叉蓝白电弧，减少遮挡对手。原GLB触碰以及R209音频流程不变。
- 新增 qa/unit-r211-flipbook-colors.py：逐帧校验16帧RGBA像素、alpha边缘不出现硬矩形、红/绿/蓝通道不被截断、各帧非重复、纹理体积限制；16/16火+16/16水PASS。
- QA端口切换为实际开放的 Z890 10.10.10.138:18692，录像宽度 1364px 以确保可编码 H.264；重新运行原生Chrome GPU录像、三素材QA和三张真实手牌测试。重新截图及更新对比拼图，均在 qa/evidence/r211-cinematic-vfx/。
- 三素材QA真实Chrome：3/3新效果，旧R210 0重复，新纹理2/2加载、JS/HTTP错误0；旧circle/new全屏pass/规则篡改均为0。
- 三张真正手牌回归：E06 第2回合真实3伤害、T05 heal类型但满血实际回复0、S08真实2伤害；GLB飞行接触、能量与广角均保留，JS/HTTP错误0。
- Z890同配置55帧rAF小样本：R210 平均17.27ms、P95 16.7ms、P99 50.1ms；R211 平均16.97ms、P95 16.7ms、P99 33.3ms。**只测帧间隔，不是GPU帧时；R211结束时电弧已经消失，仅剩2个活动特效，不可据此推导更快或者低配合格。**三效果瞬时Chrome旧733→新748 draw calls。
- XPS15-7590 GTX1650 4GB可连接游戏局域网且装有Chrome 155。但是自带ChromeDriver仅支持149，失败；换用Chrome原生CDP后，测试进程在 --use-angle=vulkan、关闭软件回退的Headless配置下报“Error creating WebGL context”，无法进入3D场景。确认这是测试浏览器WebGL问题，不能记作游戏帧率失败，也不能说已测过GTX1650。另对 --enable-unsafe-swiftshader / angle-gl 做了WebGL smoke test（可创建上下文），但软件回退不等于硬件性能通过。
- 本轮尚未做XPS真正GPU全回合性能，未取得完整YouTube字幕，**仍Draft/NO-GO，不合并main、不动R198**。此后需在实际有GPU WebGL的XPS浏览器环境补测真实帧时/冷载和更长对局。


### XPS最终补充：真正成功的低端显卡同配置 A/B（取代上段“无有效XPS数据”）

- 先前的 --use-angle=vulkan + 禁止软件回退 Chrome155 Headless 确实无法创建 WebGL；ChromeDriver 149/Chrome155 不匹配。**这只是原测试路径受阻，后续已用原生CDP与 --use-angle=gl 成功启动并完成实机测试**。没有改变机器安装的 Chrome，也没有使用用户日常浏览器配置。
- Chrome WebGL debug renderer 原始返回：`ANGLE (Intel, Mesa Intel(R) UHD Graphics 630 (CFL GT2), OpenGL ES 3.2)`；测试在 **Intel UHD 630 集显** 上完成，**不是 NVIDIA GTX1650 测试**。虽然启动标志允许软件后备，实际返回的是 Intel Mesa，不应称作GeForce硬件基准。
- 每次新建独立Chrome profile，24帧短期 rAF 帧间隔采样、相同 1280×720、相同卡牌 QA预览、相同 Z890 局域网服务：
  - **R210**：首次 sceneReady 32.65秒；平均45.14ms、P95 50.1ms、P99 50.1ms；样本末R210旧特效3个活动，drawCalls 739。
  - **R211**：首次 sceneReady 40.94秒；平均42.36ms、P95 50.1ms、P99 50.1ms；样本末R211新特效2个活动（0.84s电弧正常过期），drawCalls 743。**测试时刻的活动数不同，不构成严格三效果对等对照；不能从均值较低宣称提速。**
- 更长的单次R211 100帧rAF样本：平均44.83ms、P95 66.6ms；样本末全部效果消散，仍有基础场景卡顿。说明问题根源不仅是特效，整场约733基础drawCalls，需单独优化3D场景负载/冷开。
- 正式原始证据：`qa/evidence/r211-cinematic-vfx/r211-xps15-intel-uhd630-r210-vs-r211-24frame.json`（从XPS机原始CDP JSON同步归档，不是伪造的GPU帧时间）。**发布仍NO-GO**：需长对局、真实GTX1650、极低配集显分场景分析与加载速度优化。

