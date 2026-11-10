# R59 · G01 橡皮筋建筑师职业造型实验

## 已做成的实际三维资产

- 原始 Fumiriya CC0 VRM 的人体、脸、服饰、蒙皮与源贴图保持不变，避免重新导出引起脸部细节丢失。
- 使用可审计的 Python 原生 glTF 导出器 export_architect_glb.py，单独生成30个真实三维配件网格、8套PBR材质。
- 职业配件包括测绘护目镜、建筑尺及刻度、蓝图卷筒、工程胸牌、弹力几何环与背负工具。
- 每个网格的 metadata 指定 attachBone，浏览器挂接到原VRM头、胸与两手的真实骨骼。不会修改正式游戏人物路径。
- 独立审查网页新旧版本对比，可点击规划和弹力尺攻击动作，依赖原 VRM 骨骼带动配件。

## 浏览器与品质判定

- browser-r59-g01.mjs 真实 Chrome 桌面1440×900及竖屏430×900，两组通过。
- 原始VRM含102个渲染网格分件，新版为132个，新增30个配件全部正确挂接。右臂攻击骨骼四元数变化非零；保存0、45、90、180度实测截图。
- 本次是独立技术原型，非最终高品质美术。原脸部与原服装尚未改成专属建筑师形象，原画三视图、真实角色动画与正式战斗验收仍缺。
- 状态 p1=true、p2=false、p3=false、production_approved=false，不能作为正式商用成品替换。

## 文件与链接

- 独立预览入口：/r45-duel/art-lab/r55-audition/?study=G01-R59
- 实际三维配件：G01-ElasticArchitect-R59-PropsSTUDY.glb
- 可重建导出器：export_architect_glb.py
- 来源与目标SHA256：G01-ElasticArchitect-R59-PropsSTUDY.provenance.json
- 浏览器脚本与真实截图：browser-r59-g01.mjs、evidence/
