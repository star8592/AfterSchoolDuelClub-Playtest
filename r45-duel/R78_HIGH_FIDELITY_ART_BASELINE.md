# R78：淘汰低品质 Q 版，转向电影级精细风格化人物基底

版本：基于 R77 `833ab698` 创建独立 `feature/duel-r78-high-fidelity-casting-20261111` 开发工作树。现有 R76 20 张卡、14 类召唤物、配音与摄像机完整保留，**不修改生产代码和战斗资产**。

## 用户明确纠正的艺术方向

此前 Gobkit `Schoolkid / ItEngineer / DeliveryRider` 属于方头、粗手、短肢、粗劣塑料感的低精度 Q 版。**R78 起不允许再把这类作品作为最终美术模板**；保留它们仅为了旧卡在过渡期间可以召唤。即使 Blender 有很多插件，错误的基础模型也不值得进一步修补。

新人物标准：**动画电影式精细风格化**，非纯真人，也非方块 Q 版。正常而带喜剧夸张的比例（约 5–7 头身，按角色差异可调）；面部结构、发型、服饰厚度、五指掌骨、鞋子与腿部完整真实；光滑高品质材质、自然静止手势；眼神、嘴形、笑怒惊疑至少多表情可控。专业形象靠服装与道具区分，但不能拿通用职业者替换缺少对应职业身份的角色。**技术指标不能代替像素级造型审查**。

初筛目标为每个主角原始高品质网格 40k–120k triangles、有可绑定骨架、独立手指及自然表情；动画镜头先保留高细节，不因用户不是为老手机优化就急于粗糙降模。运行时再按真实同时出场角色数做合理 LOD 与贴图预算。只是初筛的技术范围，不卡死其他优秀艺术资产。

## 这次完成了什么

**真正完成：** 官方公开 API 验证来源、作者、三角面、商业许可与可下载状态；保存四条签名来源元数据，下载并校验原作者的 4 张官方封面缩略图；创建一个可切换三位主候选的 Z890 本机 Web 评审页面，默认展示作者高清原图，用户点击才载入 **Sketchfab 官方 3D Viewer**；也可直接打开源站。**官方 iframe 的 HTTP 200 并不代表 GPU 实际完成渲染**：在本轮 headless Nvidia Vulkan Chrome 中 17 秒后出现第三方 `uReflection` Shader 报错和 Viewer「model too heavy」提示，因此不能说已完成真实旋转/蒙皮验证。已采取清晰原图优先、官方 Viewer 按需加载、随时退回静态图的方案。

**严格未完成：** Sketchfab 官方 Download API 因缺少用户 OAuth 授权直接返回 **HTTP 401**。所以没有取到 3 个模型的 FBX/GLB 源，未把这些角色放进 Blender 或战斗系统；没有验证实际骨架、作者描述的“100+ 面部 Blendshape”、动作或源纹理质量。任何 `artApproved=true` 均不成立。绝不绕过付费/登录/下载接口，不从网页查看器缓存反抓源模型。官方开发文档：https://sketchfab.com/developers/download-api/downloading-models 。

### 主视觉基线（同一作者 Canino3d，Sketchfab 官方元数据）

| 高品质候选 | 面数 | 对应身份与注意事项 | 署名/来源 |
|---|---:|---|---|
| Free Stylized Cartoon Girl Rigged Character | **57,345** | 适合校园女角色、女性搭档；**不是**原 E03 男性队长的直接替代 | https://sketchfab.com/3d-models/free-stylized-cartoon-girl-rigged-character-dcaa822909ae4e04ad7eb85bc371a8c4 |
| Free Stylized Cartoon Game Boy Character Rigged | **66,130** | 适合男少年美术基底；可分别研究 E03/G02，但还欠角色身份、服装、黑板与眼镜 | https://sketchfab.com/3d-models/free-stylized-cartoon-game-boy-character-rigged-92b4b22d14194be191c0df00f6e62b3d |
| Free Cartoon Game Man Character (Rigged) | **105,357** | 成年老师/家长等的统一艺术与表情基底；不冒充小学生 | https://sketchfab.com/3d-models/free-cartoon-game-man-character-rigged-a69c8962f4a14ea89bf623d716a81411 |

这些官方模型元数据全部确认 `isDownloadable=true`，`license.slug=by`，Creative Commons Attribution 4.0，需按作者要求署名。作者在源页面写了“Rigged, 100+ Face Blendshape”，但**只验证了描述，尚未验证实际源 GLB**。作者来源各自与 GitHub 无关，不能把其作品当成我们原创。若从 Fab 单独获取，则单独核对 Fab 许可证，不擅自把 Sketchfab 的 CC BY 许可证套用到另一平台下载包。

### 技术上的替补与排除

- 同步核查另一作者 Eduardo Lira 的 Cartoon Teacher：27,760 triangles、CC BY 许可、可下载；**与 Canino3d 的人物皮肤、头身和面部风格不一致，故只作职业服装参考，不加入统一套件**。
- 还核查 `giyas3dartist` 的《cartoon Asian Boy》，62,434 triangles、CC BY、可下载，年龄/面型更接近小学男孩，但与主同源角色画风差异较大；先留候补，不直接合并角色。
- 更高面数的非商业授权 CC BY-NC，以及标记禁止 AI 输入、不可下载、缺失可验证许可的资产，全部不作为本轮可商用正式模型来源。

## 下一步单一工作链

1. **锁定一套真正和原作风格相近的高品质模型体系**，不要并行扩十几套不相关风格；优先男孩、女孩、成年男性/女性四个基础体型，统一肤质、头身、服装与动画表情。
2. 正规通过 Sketchfab 或 Fab 账号下载完整已授权 GLB/FBX/纹理（必须由用户实际账户授权，不能代猜 OAuth）；保存 SHA256、作者署名与许可文本；用 Blender 检查真实骨架、表情形态键、手部 IK、衣物厚度。
3. 只在这一步通过后，才把 E03/G02/T03 进入隔离体育馆实战测试，检验自然摆 pose、双阵营朝向、出牌攻击、双人默契动作、光影和完整 20 张卡的回归。若原角色身份或风格仍不相配，就继续选模，**不精修不合适的低模**。

## Z890 实际入口

- 新精品角色高清图及可选官方 3D 查看器：`http://127.0.0.1:11009/r45-duel/qa/r78-high-fidelity-casting.html`。
- 上版可玩主页面不受影响：`http://127.0.0.1:11009/r45-duel/`。

免责声明：本轮真实交付是选角与授权审计、官方互动 3D 在线查看，并不是“下载了高品质模型”或“已经替换游戏”。未经实际二进制取得和验收的模型一律不得声称有产品级完整动画/骨骼。
