# R111 · 《放学后决斗社》魔法武器库扩充与开源研究

日期：2026-11-13。游戏继续保留60张牌（14人物、46事件），不增加卡组复杂度。

## 1. 原始问题与复用方案

- R110正式体育馆虽然有46张可发动的事件牌，却仍把绝大多数法术压成R81旧系统的六种形态：eraser/sonic/repair/pages/warmth/rally，造成魔法雷同。
- 本次在原项目历史R79分支查到本人原创的完整3D魔法元素模块 elemental-vfx.mjs：传送门、极光、陨石、晶体、符纹、潮汐、雷电；此前曾隔离完成Chrome验收但未进入现行主线。已复制并复测，不新建依赖。
- 用户已有公共研发武器库 star8592/GlobalGameFoundry；其 knowledge-atoms 原有四份相关研究：webgpu-vfx-mit-presets-2026、songsong-elemental-vfx-casting-2026、boom-bloom-deterministic-vfx-impact-2026、meep-vm-gpu-particles-oit-2026。不再另起一套无法复用的研究库。

## 2. GitHub/X原始出处与授权界限

| 链接 | 研究重点 | 使用结论 |
|---|---|---|
| https://github.com/tigerabrodi/webgpu-vfx | WebGPU粒子池、光束、魔法球、治疗光环、烟尘、爆炸、软粒子 | MIT、Three.js >=0.184 和WebGPU优先；当前正式站是WebGL2+Three r180，不能直接安装替换 |
| https://github.com/patch-gg/pixelfx | 244个特效和整套蓄力/命中停顿/目标受击/复位节奏 | MIT代码，但仓库字体例外；只学时序，不把像素图直接贴进3D电影感人物 |
| https://github.com/achrefelouafi/LinearAbiltyCastingThreeJS | Ice/Thunder/Meteor/Beam/Snare的GLSL、指向箭头、环形施法 | MIT程序，人物FBX/HDR/贴图需要另审，未复制其源码、角色和资源 |
| https://github.com/achrefelouafi/LinearAbilityExtThreeJS | 七种技能、五种施法指向、真实环形门/物理石构 | 技术研究，未引入新包 |
| https://x.com/songsong/status/2120325417525747767 | 宋宋在X介绍原作者的Elemental Sandbox技能设计 | 2026-11-12已有登录态研究证据，当前网页抓取X为403，不能声称本轮重放过原视频；原作者GitHub可独立核查 |
| https://discourse.threejs.org/t/boom-bloom-a-firework-chain-reaction-game-in-three-js-analytic-gpu-sparks-100-procedural-mobile/95840 | 确定性的规则触发与GPU解析式火花联动 | 游戏先结算命中，视觉使用相同事件回执；不复制原游戏、音频 |
| https://discourse.threejs.org/t/gpu-driven-particle-system/94233 | 多发射器共享计算Shader、GPU虚拟机、透明粒子排序 | meep不是可默认自由商用的MIT包，不引入源码或纹理 |

## 3. 本轮落地而不是单纯研究

- r45-duel/scene/elemental-vfx.mjs：从本人历史R79独立分支恢复真实WebGL2 ShaderMaterial、召唤门、极光、陨石等。正式对战的真正人物召唤会使用传送门，其他老特效在隔离试炼场验证过，但不重复叠加到正式Spell上造成性能过曝。
- r45-duel/scene/magic-arsenal.mjs：全部46张事件卡有自己的卡牌与32个原创视觉主题的对应表，包括茄子香蕉弯月、蛤蟆布丁、玉米葡萄、超声波、灯泡、体育球飞弧、粉笔结界、月亮、晶体、雷击、陨石、漩涡、时间钟盘、龙卷风、机器人和星云等。
- 32种视觉主题实际产生31种可区分的几何结构指纹，而不是同一个环换颜色。使用已有Three.js的Box/Sphere/Cylinder/Cone/Torus/Tube/Lines等真实3D对象。
- 继承R79自主研发的GLSL思路，增加每个法术48个软发光GPU点精灵（减动态效果偏好下降到16），一条GPU Points draw call，完全没有外部贴图、模型、声音依赖。
- 保留旧R81基础战斗冲击层，新R111叠加可辨认的校园魔法造型。依赖真实已结算ASDC_R81_SPELL_RESULT消息，永不修改生命、护盾、能量、抽牌、回合和AI。
- 每次画面最多4组新魔法、历史召唤效果最多7组，法术1.5-2.2秒后自动退出并释放临时几何与Shader材质，所有位置以绝对elapsed time运算，断帧没有累积偏移。
- 与R110高清插画、两边独立三维决斗者、全部16件GLB/VRM兼容。无需升级Three，不改WebGL2默认路线。

## 4. 独立证据与性能

- browser-r111-magic-arsenal.mjs：桌面与手机24/24。46/46覆盖、32造型、31种物理几何组合；非法消息拒绝、四组同时有效、帧重绘无漂移、到期释放。独立四法术场景约99 draw calls，非球馆总开销。
- browser-r111-real-duel.mjs：桌面与手机28/28。真实体育馆载入全部16件人物，茄子香蕉K01实际发动，对手HP 20→19；对应新魔法出现。换经典卡组，真实E01人物出牌召唤恢复R79传送门。VFX结束后没有残留节点，也没有重复下载人物模型。
- browser-r111-gallery.mjs：桌面手机18/18。46张真实法术可独立选择预览，32种可视主题，0浏览器/GLSL/HTTP报错。
- 新QA网页 r45-duel/qa/r111-magic-gallery.html 是轻量级魔法美术预览，不伪装成有生命结算的真实对局。
- 正式球馆绘制调用，桌面：基线445、K01施放时约500、E01召唤+R79门约629；手机：449/504/633。这是整个球馆加16名真实人物的总绘制开销，不应冒充独立法术GPU时长或优化收益。

## 5. 下一阶段美术目标

当前证明已从“六类光圈换色”提高到“32类不同立体主题”，但尚不等于电影级成熟法术：更精细的材质、GPU软粒子深度交互、独立命中目标、手部蓄力与人物硬直、冲击音效节奏、低端手机GPU的p95帧时仍要后续逐项验证。进一步 WebGPU高级版本只做可选增强，正式WebGL2继续兜底；不复制来源不明的游戏模型、FBX、HDR、视频或商业音效。
