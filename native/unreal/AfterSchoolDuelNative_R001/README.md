# 放学后决斗社 / Unreal 原生竞技场 R001

项目性质：基于 Unreal Engine 5.8.1 的 **独立原生游戏竖切**，不是 WebGL 包装或虚拟截图。原有 PlayMoru 游戏版本未变。

## 完成内容

- M01 酒红音乐老师：真实 Skeletal Mesh、9 内嵌动作、34 面部 Morph Targets。
- M02 食堂阿姨：完整厨师帽和勺子 13 子网格合并单体 Skeletal Mesh，保留 24 根骨骼、10 段内嵌动作。
- 原生 C++ 游戏模式：初始 20 HP，卡牌 1 音律攻击 3，卡牌 2 书本攻击 5，卡牌 3 舞台护盾 4；AI 反击、护盾抵消、回合推进、胜负判定。
- 原生 HUD、卡牌点击/数字键 1/2/3、竞技场镜头与灯光。
- 使用 UE5.8 C++ UnrealBuildTool 编译成功，NullRHI 自动战斗完成 8 回合，音乐老师以 6 HP : 0 HP 获胜。

**NullRHI 不是 GPU FPS 或视觉验收**。当前仍缺原生 Vulkan 画面与发行包。

## Z890 实际工作工程

  /mnt/disk1/H3_Studio/ue5_projects/AfterSchoolDuelNative_R001/

这里已有 Unreal 可编译代码和导入后 92+ 个 .uasset。GitHub 此目录只同步项目描述、源代码、转换工具和 QA 回执，不提交本地大体积的 Unreal 缓存/导入二进制。要在新机器复现，先按下节导入素材。

## 资产转换与导入

源自当前仓库 r45-duel/assets/summons：

- M01-Maestro-Burgundy-Coat-STUDY.glb
- M02-CafeteriaAunt-ChefHat-Ladle-R114.glb

M02 先通过 asset-pipeline/convert-m02.cjs 解码 EXT_meshopt_compression，然后用 asset-pipeline/merge_m02_shared_skin_glb.py 将 13 个 Mesh 节点合并成一个共享 24 骨蒙皮的 Mesh、保留 13 个材质分区和全部十段动作。二进制顶点数据、原骨骼和动画不重写。最后 Unreal Python Import，生成一个 Skeletal Mesh + 一个 Skeleton + 十个 Animation Sequence。

M01 Unreal asset prefix:
  /Game/ASDCCharacterQA/MusicTeacher/M01-Maestro-Burgundy-Coat-STUDY/SkeletalMeshes/

M02 merged prefix:
  /Game/ASDCNativeMerged/M02/M02-CafeteriaAunt-ONE-SKIN-ALL-DETAILS/SkeletalMeshes/

同目录 asset-pipeline 内的 H3 生产脚本记录已验收的固定 Z890 路径，转移到其他主机前需参数化。导入原始收据保留在本机工程 QA 目录。

## 编译及逻辑回归

    UE=/mnt/disk1/H3_Studio/UnrealEngine
    P=/mnt/disk1/H3_Studio/ue5_projects/AfterSchoolDuelNative_R001

    "$UE/Engine/Build/BatchFiles/Linux/Build.sh" AfterSchoolDuelNativeEditor Linux Development "-Project=$P/AfterSchoolDuelNative.uproject" -WaitMutex -NoHotReload

    timeout -s INT 30s "$UE/Engine/Binaries/Linux/UnrealEditor" "$P/AfterSchoolDuelNative.uproject" /Engine/Maps/Entry -game -NullRHI -ASDCSmoke -NoSound -unattended -stdout -FullStdOutLogOutput

8 回合真实自动测试收据：qa/native-r001-merged-single-skeleton.json；通过的实际游戏日志位于 Z890 本地 QA 目录。

## 已知未完成与风险

1. Vulkan GPU 渲染/截图和 FPS：首次在 H3 机械硬盘随机读取时，UE 着色器初始化严重卡顿；当前无有效 Vulkan 图形性能收据。
2. 食堂阿姨 13 子网格原样骨骼跟随曾导致 NullRHI 第一帧停顿，不要恢复 12 个 LeaderPose 附件写法；已通过单 SkeletalMesh 改进并复测。
3. 游戏内面部/衣物穿模、道具持握、角色站位、视线、动画混合和正式美术，需要实拍截图/实测。
4. 原生项目当前属于简明纵切，不是已有网页的全部卡组、规则、音效、存档、人物阵容和 Steam 正式成品。
5. 后续在 NVMe 上建立完整隔离 Unreal 开发运行副本，持续优化 UE 首次着色器启动和 GPU 帧耗时，H3 原安装和项目保留。
