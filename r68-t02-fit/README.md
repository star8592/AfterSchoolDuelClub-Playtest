# R68 · T02 中年食堂阿姨服饰/发型与体型合适性研究

**状态：可交互 GPU 审查通过；美术 ART_NO_GO，商业上线 NO_GO。**

本目录从原来的 R67 手工固定尺寸围裙与帽子改为两条可复用技术路线，支持三方案同机位真实比较。

## 路线 A：Microsoft Rocketbox 已制成的人物套装

- 来源：Microsoft Rocketbox（官方 MIT）及实际原始女厨师 `chef-female-01.glb`（源码引用见下方）；完整已适配白色厨师服、帽子、头部/发型、靴子属于同一角色。原模型保留 80 根骨骼、7460 三角面。
- 源素材：`https://models.codelove.in/models/chef-female-01.glb`；源二进制 SHA256 `3cab3777e96523fbf3c87fc500653db465bb75ce2458bc29784db09273d3c91c`；模型自身 glTF asset.extras MIT 许可文本指向 Microsoft 2020。
- 原始模型需要 EXT_meshopt_compression；使用 glTF-Transform 转换为同形状 WebGL2 普通 GLB，SHA256 `66e9cb64ce15971f58ea1a6807d0de649911a4c6f8198ec2166da1e45241f57f`。
- 保留原网格及蒙皮，R68 仅对腹部和髋部 595 个原始顶点做平滑加宽，绝对不在衣服上拼接几何，避开不合身问题。
- Blender 输出引入 90° 正面轴偏差，R68 按真实网页四视角修正 glTF 根节点旋转；最终圆润版 `Rocketbox-FemaleChef-R68-Rounded-FrontAligned-STUDY.glb`（740,732 bytes），SHA256 `7c948a74c0c9bad2c42c52b056abd8084580e5aecb17dba043899dedb8567f55`。
- Microsoft 原 MIT 授权全文随此页 `LICENSE-Microsoft-Rocketbox-MIT.md` 保留。本研究仍须核实第三方镜像的下载来源/文件完整性，商业发行前必须对源仓库版本进一步审查。
- **限制**：这个女厨师依然偏写实，体型修改目前不是完整角色精修，也没有本次新加的女厨师动作轨道。完成角色喜剧演出之前不可冒充成品。

## 路线 B：MakeHuman / MPFB 官方参数化人物与服装自动适配

- 系统资产包 `makehuman_system_assets_cc0.zip`；真正 CC0 核心网格及系统资产由官方提供，工具 MPFB 的代码许可另计。
- 审查了源 API `HumanService.create_human(...,macro_detail_dict)` 与 `HumanService.refit(person)`、`ClothesService.fit_clothes_to_human`。正确制作顺序：宏体型参数 → 初始化骨骼 → 关联 MHCLO 衣服/头发 → **整体 refit** → 遮罩烘焙/剔除辅助网格 → GLB 导出。
- 创建 `round_workshirt`：体型 weight=0.94、age=0.67、短发 short04、官方 female_casualsuit01 完整上衣长裤、再用实际衣服腰围及真实头发边界自适配围裙工作帽。与原 R67 固定尺寸相比，头围/围裙尺寸依据人体数据，不手动靠感觉“挪位置”。
- `T02-R68-BodyFit-Uniform-STUDY.glb` 20,490,836 bytes，SHA256 `cb7c08d7c90fd2d283c419a5caffec0cc3d913e9df306662d341e03817a59412`。
- 被拒绝的两版：`female_sportsuit01` 是露腰运动服，即使贴合也不适合厨师；`female_casualsuit02` 带短裤。不再当成品候选。
- **限制**：贴合依赖资产质量，仍有帽子、前面围裙/骨骼交叉等需要人工审图；这条路线适合大量差异化人物生产，但美术一致性需要另行控制。

## 同镜头运行与浏览器验收

在本地仓库根目录开静态 HTTP 服务。访问 `/r68-t02-fit/`；URL 可选 `?model=round`（默认）、`?model=chef` 和 `?model=mpfb`。

真实 GPU 浏览器（Z890 RTX 5070 Ti / Chrome ANGLE Vulkan WebGL2）执行 `qa_r68.mjs`，桌面 1440×900 与竖屏 430×900、三模型合计 **6/6 PASS**；原始 PNG/JSON 在 `evidence/`。每个方案完整载入人体与 T02 既有活菜单，骨骼真实为 80/80/53，菜单 43 个网格与 5 套剪辑，零 JS/HTTP 错误；鼠标旋转/模型选择有真实控件。模型目前只有活菜单可播放动作，本页其他人物并不虚报新增动作。

## 交付原则

- 这是 **独立研究预览**，不是接入竞技馆默认召唤、无新血量/战斗判定，不替换已经上线的 R67 T02，也不碰其他并行 R64–R67 自然姿态分支。
- 后续优先：人体体型/面部再雕刻，统一菜单和人物的卡通风格，自然垂臂待机、端餐递物、面部表情、服装不穿帮，最后才入正式召唤。
