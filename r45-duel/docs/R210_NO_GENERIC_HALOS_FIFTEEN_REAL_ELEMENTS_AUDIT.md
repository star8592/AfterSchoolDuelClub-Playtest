# R210｜从重复光环改成真正有物质感的校园元素魔法

**2026-11-20 · 《放学后决斗社》 · 在R209基础上独立Draft · NO-GO**

## 1. 找到重复光环的具体源码，而不是盲目叠加新特效

实机和源码确认：原来的R199校内真实GLB道具施法替换了旧spell-impact和magic-arsenal，但几个通用环状系统仍然并存：

- R46 duel-effects：两侧人物常驻的水平与竖直发光圆圈和一些通用光柱；
- R79 elemental-vfx：每个召唤单位落地又叠两层地面圈与一个立体拱环；
- R102 comedy-spectacle：每次召唤和某些组合都多放两层冲击圆环；
- R100 combo-director：广播、粉笔、护盾连招拥有多个通用Torus视觉层；
- 体育馆地面还有一条额外的Conjuration_Aura_Ring（保留真实竞技场的场线，关闭多余的魔法地圈）。

这造成用户看到的虽然是原版角色、原版校园道具，却仍然不停出现相似的圆圈。

## 2. R210实验开关下的实际整改

只有同时明确开启 r199PhysicalMagic=on 和 r210Elements=on 时：

1. 禁用旧人物常驻光环根层，停止每帧更新其通用圆圈、通用撞击闪圈；原高精VRM演员不隐藏。
2. 召唤依旧播放原始高精GLB、当前演员动作、R102 InstancedMesh 3D喜剧粒子，但不再叠R79三层召唤圈和R102双冲击环。
3. R100连招里只有泛化Torus层被隐藏，真实道具、3D广播台和组合规则仍保留；竞技场地面多余的魔法标记圈隐藏，比赛场线依旧存在。
4. 新版独立模块 campus-r210-material-elements.mjs 直接挂在**R199源GLB发出contact事件、且权威规则结果映射已验证**的时点；不能因为点击卡牌就提前假装命中。
5. 15类元素有15种完全不同的实体形状、运动规律与材料：火焰锥体+火星上升，水滴+水柱溅落，土石块+粉尘重力散落，闪电碎片闪烁、冰晶生长碎裂、风的弯曲旋动、木藤萌发、金属碎块、光芒棱晶、暗影团块、精神晶簇、声波振幅条、时间刻度碎片、空间断裂片和荒诞弹跳物。
6. **不做新的廉价平面光环。** 新模块源代码不创建TorusGeometry、RingGeometry、PointLight、ShaderMaterial或Sprite。主/辅两组共享几何及材料，单个效果2次InstancedMesh绘制、29个3D实例；最多同时3个效果，即增量最多6次绘制调用；无每帧TTS、无改卡牌规则。
7. 火、水、土持续时间延长到约1.8～1.95秒，避免在实机中刚看清形状就消失。对手命中位置稍向宽镜头开放一侧错开，减少人物/真实道具遮挡；不做自动特写、不遮住对手反应。
8. 非伤害卡牌的元素演出位于施法者/增益处，**不会为了好看生成不存在的伤害或受伤尖叫**。

## 3. 真实Chrome/WebGL2原始画面和权威卡牌验证

- 单元：60张原规则卡中46张魔法，15/15元素全部有对应不同运动，无任何新环状几何/点光/运行时着色器；共用几何、最多3组粒子、最多6 draw calls，严格不改HP、能量、卡牌。
- 真实GPU浏览器：先对比R209旧圈和R210新画面；再使用仅在qa=1可调用的三元素美术预览分五组展示全部15类。**预览不是实际出牌、不产生规则事件、不影响HP和能量。**
- 正式规则路径另用真正玩家手牌及原R199 3D道具：S08雷电和Q05风各造成对方2点伤害；T05水是回复型、不假装攻击；E06真实第二回合3费火焰打击造成3点伤害；K06真实第三回合4费土石魔法造成4点伤害。
- R210与R209真实音频导演共存：S08原真实GLB只命中一次、原规则伤害2点、玩家施法原声自然结束、男对手即时惊叫和完整受击原声，广角不切镜，无JS/HTTP异常。
- 浏览器采集真实截图/录制的无声GPU视频，全部为真正Chrome Three.js渲染，未拿网图或AI生成图片冒充效果。
- 曾观测旧版页面渲染约732 draw calls，新版三组元素QA实景约737，不能据此推断低配FPS改善，但能证明没有因15元素配置导致绘制调用数量爆炸。

## 4. 实际证据

- 旧圈与新净版体育馆对照：qa/evidence/r210-physical-elements/r210-before-after-no-halo-real-chrome.jpg
- 五组15元素真实Chrome截图合辑：qa/evidence/r210-physical-elements/r210-15-elements-real-chrome-contact-sheet.jpg（明确标明QA视觉预览，不伪装成真实战斗伤害）。
- 真正R2火焰击中：qa/evidence/r210-physical-elements/r210-real-E06-fire-genuine-card.png
- 真正R3土石击中：qa/evidence/r210-physical-elements/r210-real-K06-earth-genuine-card.png
- 真正水元素T05卡牌：qa/evidence/r210-physical-elements/r210-real-T05-water.png
- 真正S08雷电与Q05风：qa/evidence/r210-physical-elements/r210-real-S08-electric.png、r210-real-Q05-wind.png
- 15元素Chrome实机录像：qa/evidence/r210-physical-elements/r210-15-elements-original-chrome-gpu-and-real-S08-silent.mp4（无声，五组QA美术实景最后带真正S08出牌，不是音乐演出）。
- 验证回执：r210-real-gpu-and-all-elements-report.json、r210-actual-turn2-fire-turn3-earth-report.json、r210-original-full-audio-electric-card-S08-cast-and-hit-voice.json。

## 5. 发布限制

**R210独立Draft/NO-GO，不直接合并main，不发布正式R198。** 15种物质形态已摆脱无意义通用环，但真正达到高品质动画电影级材质、火舌、水花和岩石的美术品控还需用户实机观看与针对性细化。不能把本轮称为已完成整套电影级魔法库；也没有宣称解决旧XPS的约58秒首次冷加载问题。
