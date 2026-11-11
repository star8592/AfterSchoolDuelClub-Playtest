# R77 · 真正选角而不是给低模做表面精修

基于独立 R76 `dd26d94` 分支；研发版本测试入口 `http://127.0.0.1:11008/r45-duel/qa/r77-cast-comparison.html`。**没有覆盖正式网站，没有更改 R76 已有 20 卡牌游戏，也没有对旧临时低模继续细分、改几何或强行贴材质。**

## 这次已经执行

- 对 E03 加油队长、G02 黑板密码专家、T03 默契收发员三张最严重错配卡，分别建立**真实旧模与新高质量候选同场试镜**，不是模型库条目清单。
- 实际从 MIT 许可的 [CodeLove 3D](https://models.codelove.in/) 原生 GLB 下载并验证 8 件新候选/已有来源：女性儿童 2、男性儿童 2、现代男快递 1、成年女性 2、男性运动员 1。全部保留源 SHA256 和 GLB 内嵌 Microsoft MIT License 正文；来源路径见 `art-lab/r77-targeted-cast/sources/inventory.json`。其中 4 份复用 R74/R75 已校验文件，避免无意义重复存 2.1MB 二进制。
- 真正的现代男配送员原 GLB `delivery-male-01`：6,800 triangles、81 根骨骼，内含 4 张贴图，不含动画；借用此前已保留的 MIT 骨骼动作数据，完成 m_idle/m_wave/m_talk/m_cheer 与女孩/儿童的 `Bip01/Bip02` 轨道匹配。原始源模保留不改，禁止以“下载了骨骼”冒充“原来就自带动画”。
- `qa/r77-cast-comparison.html` 可切换角色、0/45/90/180°、待机/挥手/说话/欢呼、独立试镜与真实 3D 体育馆。每个目标可以在「单人放大」中单独查看旧模、新模或 T03 两人协作组合。**T03 双人组合确实是男、女两个独立真实骨架和动画实例，而不是把一个单人骑手变成两个名字**。
- `qa/browser-r77-comparison.mjs` 在真实 Nvidia Vulkan 禁止软件光栅化的 Chrome 环境下跑 10 组场景（含宽屏、竖屏、体育馆、不同角度），**10/10 技术通过**；`qa/browser-r77-closeup.mjs` 另外完成旧与新人物单独放大的 **10/10** 浏览器检查，每件真实 mesh 均有物理三维材质、真实骨骼与动画/美术可见证据，截图保存在 `qa/evidence/r77`。

## 真实视觉判断，不再靠三角面数说谎

| 目标 | 原本旧模 | 新候选 | 决定 |
|---|---|---|---|
| E03 加油队长 | chibi 学生、短身大头，手握校园文具；实际是男生造型 | Rocketbox 女孩 01（粉色上衣）/女孩 02（绿色围巾）；两份有真实动画，分别 7,102/6,870 triangles | **不替换**：新模为朴素写实人物，年龄和卡通头身比例与旧战斗美术不一致；并非“拿到女生就算角色正确” |
| G02 黑板密码专家 | chibi 大眼镜蓝衣电脑少年，虽然精度低但有独立辨识度 | Rocketbox 普通男孩 01/02（6,660/7,310 triangles）；完整真骨骼且有说话动作 | **不替换**：新人物没有眼镜、黑板和解题身份，换上去会从“有个性”退化为普通男子 |
| T03 默契收发员 | 独特卡通快递头盔，手持信件，但只有一个人 | Rocketbox 男配送员（6,800 triangles）+成年女同事（8,308 triangles），合计 162 根独立骨骼；双人原生骨骼动画可以同步播放 | **不替换**：技术双人组合已验证，但男配送员红衬衣与女同事黑色商务装不统一，也仍是写实普通人，缺少原作品夸张且幽默的动画风格 |

**重要**：不把 R77 技术可加载的模型自动标为 `art_approved=true`。R76 的 20 卡、14 场上角色、其中 M02 食堂阿姨的高模与 Qwen3-TTS 语音保持完整，旧 3 名角色仍可用于研发玩法。未来真正有贴合造型的源模型时，才替换旧低模；不在错误底模上浪费 Blender 工作量。

## 下一批更接近需求的外部高精度基板（严格标记未下载）

- [Sketchfab · Free Stylized Cartoon Girl Rigged Character](https://sketchfab.com/3d-models/free-stylized-cartoon-girl-rigged-character-dcaa822909ae4e04ad7eb85bc371a8c4)：标注 CC BY 4.0，57,300 triangles，100 多个面部 blendshape，**更可能满足 E03 动画表情需求**；需官方模型源文件及作者授权正文实际下载后验收，不是可直接使用的当前资产。
- [Sketchfab · School Anime Girl (rigged)](https://sketchfab.com/3d-models/school-anime-girl-rigged-6eaf44ff6ef7461583a5eccc301b88fc)：CC BY，66,600 triangles；可作为校园美术路线比较，**但其偏二次元的头身比例可能和现有 Q 版不一致**。
- [Sketchfab · Cartoon Teacher Model](https://sketchfab.com/3d-models/cartoon-teacher-model-2e824e4c1d224fb8824937f134f1592f)：CC BY，27,800 triangles；更适合职业教师的美术候选而不是拿去冒充小学生黑板专家。
- [Innerscene · Owen courier CC0](https://www.innerscene.com/tools/library/3d-parts/owen-3d-person-delivery-courier-with-parcel-22ad9a9a)：标明 18.2MB、真实配送员、CC0；外观偏写实，需要先筛选视觉，不在未检验之前下载入游戏。

当前没有获取 B 站原视频的可靠逐帧原画来源（R76 B 站视频请求返回 412）。不擅自用影视画面/角色模型作为商业资产。**先锁定真正可授权、同风格的优质基础模型，再经 Blender 必要细化；低模永远只作为可玩回退。**

## 本机直接看实际画面

- 三卡新旧对照：`http://127.0.0.1:11008/r45-duel/qa/r77-cast-comparison.html?role=E03&motion=cheer&angle=45&venue=gym`
- E03 角色近景：`http://127.0.0.1:11008/r45-duel/qa/r77-cast-comparison.html?role=E03&focus=female-child-01&motion=cheer&angle=0&venue=studio`
- G02 角色近景：`http://127.0.0.1:11008/r45-duel/qa/r77-cast-comparison.html?role=G02&motion=talk&angle=0&venue=studio`
- T03 两人协作真实动作：`http://127.0.0.1:11008/r45-duel/qa/r77-cast-comparison.html?role=T03&focus=duo&motion=wave&angle=0&venue=studio`
- 原 20 卡全部保留：`http://127.0.0.1:11008/r45-duel/`

三个模块没有引入旧画面混进新游戏、没有修改 Engine 战斗与音频正式流程。未改源声轨和正版授权。
