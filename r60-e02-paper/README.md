# E02 · R60 真实扫描纸面 PBR + 折翼形变

**当前：3D/动作技术验证通过；ART_NO_GO，PRODUCTION_NO_GO。**

## 输入与第三方授权

- 唯一输入是 R59 E02 真正的原生动作 GLB，SHA-256: 013d39fa1172f987c6d93b9a87efbc666f5248de4918242cdeff3af241e58bb6。
- 真实扫描纸面来自 ambientCG Paper001: https://ambientcg.com/view?id=Paper001
- 官方许可证：https://docs.ambientcg.com/license/，**CC0-1.0**，可商用、改作。ZIP SHA-256: 5be094ffad8a6343ed96ec728e6eda3d84ae542cd2b16c32bc2ad67bb57a0013。
- 原始扫描纸张 ZIP 仅在 H3 Studio 原材料缓存；未重新分发原始 ZIP。缩放后的颜色、OpenGL 法线、粗糙度嵌入 GLB。
- CC0 纸张许可不自动证明来源模型的每个文件权利都完成法审，正式项目仍需逐件溯源。

## 实际新内容

- 保留 17 个原始网格、5 套原生运动、表情和既有折纸轮廓，不以新程序低模冒充原画。
- 新增 3 张 768×768 真实纸张 PBR 纹理及机翼/机身 UV；表面非金属，避免塑料感。
- 左右翼各增加 2 种 glTF2 原生 Morph Target（上抬与回弹），让五个动作各自具有独立的左右机翼变形通道。
- 网页支持同镜头 R59 原版 / R60 纹理+折翼对比、旋转缩放和五种动作；不依赖 FAL 或额外模型服务。
- 这仍是技术美术样板，并没有重画原创三视图、独立翼片骨架或完成全部高级角色材质。

## 构建

在本项目根目录使用：

~~~bash
python3 labs/patch-e02-paper-r60/build_r60_paper.py \
  --source labs/patch-e02-native-motion/E02-R59-NativeMotion-STUDY.glb \
  --paper-zip /mnt/disk1/H3_Studio/reference_materials/ambientcg/Paper001/Paper001_1K-JPG.zip \
  --out labs/patch-e02-paper-r60/E02-R60-PhotoPaper-WingFlex-STUDY.glb
~~~

脚本拒绝任何输入 SHA 不匹配，保留原版不覆盖。R60 实际输出约 1.12MB，并写入完整 provenance JSON。

## 真实 GPU 回归

本地运行 python3 -m http.server 11081 --bind 127.0.0.1；独立 E2E：

~~~bash
PLAYWRIGHT_MODULE=/home/master/projects/tidebound-ground-qa-20261109/node_modules/playwright \
node labs/patch-e02-paper-r60/browser_e2e_r60.mjs
~~~

2026-11-10 在 Z890 RTX5070Ti / Chrome WebGL2 / Vulkan/ANGLE 实测 desktop 1440x900 与 portrait 430x900，分别测试 R59/R60，共 4/4 PASS。R60 三类 PBR 贴图真实加载，左转时左右翼 morph 权重约 0.88 / 0.59，五套原生 GLB 动作正常。页面 HTTP/JavaScript/console 错误均为零。测试采样 p95 帧间隔约 16.7–16.8ms，仅限这台机器的小样本。

相关截图与真实结果 JSON 保留在 evidence 目录。

## 保留 NO-GO

正式美学审核尚未通过，纸翼的原画一致性、材质层次、独立折翼结构和正式竞技场表现需继续深化。未更改正式游戏内 E02、卡牌数值或 PlayMoru 生产。T02 仍缺阿姨+活菜单完整双召唤，T01 原设是矮个男播音员，G01 是女学生创客，不能用猫头鹰或成年建筑师偷换设定。
