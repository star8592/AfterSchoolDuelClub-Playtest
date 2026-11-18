# R181｜原生 VRM 发丝索引合并及真实 Android 内存验收

2026-11-18。《放学后决斗社》隔离性能实验，正式 R147 不修改、GitHub main 不合并、玩家版本不部署。发布状态：**Draft / NO-GO**。

## 技术突破：不再按 Skeleton UUID 直接判定不可合并

R180 的保守扫描记录了 E01=124、G01=131 个独立 SkinnedMesh。本轮读取 Bone 对象引用、完整逆绑定矩阵、BindMatrix、Mesh 本地矩阵、Material 对象、UV、skinIndex、skinWeight TypedArray，确认：
- E01 的 124 个蒙皮网格骨骼顺序及全部逆绑定矩阵一致，真正只有14个不同材质对象；可安全合并的头发两组分别为106和2个原始 SkinnedMesh。
- G01 的 131 个蒙皮网格也共享骨骼顺序与逆绑定，只有14个不同材质对象；可安全合并的发丝主组共114个原始 SkinnedMesh。
- 三组都使用同一份顶点属性数组但不同索引分段，材质为原版 MeshBasicMaterial 贴图、非透明 alphaTest=.5，且没有 MorphTarget。
- 新增 scene/skinned-index-union.mjs：严格检查相同父节点、同骨骼对象与逆绑定、同绑定矩阵、同原材质对象、同层与阴影配置、同属性数组和同局部矩阵。仅把原 Index 数组按顺序拼接并逐整数校验。不会将100多份10,028或7,775顶点缓冲复制成巨型对象，不改权重、UV、法线、贴图、表情和人物原 GLB/VRM 文件。

**实际结果：222个发丝网格 → 3个；减少219次 Draw Calls；索引数64,740→64,740，真实面部20个形态目标网格全部保留。** 只有显式 QA 参数 qa=1&r181HairBatch=on 才启用；正常玩家默认关闭。

## Chrome Vulkan 真实场景 A/B

Z890 RTX5070Ti、相同浏览器/同种子：

| 摄像机方向 | R180原始调用 | R181合并后 | 节省 |
|---|---:|---:|---:|
| 0° 正面 | 634 | **415** | 219 |
| 90° 侧面 | 624 | **405** | 219 |
| 180° 背面 | 618 | **399** | 219 |

三镜头及遮挡复原、20个MorphTarget网格数量均检查通过。实际对照截屏全画面RGB绝对平均差：正面0.0449/255、侧面0.1226/255、背面0.1999/255；常规同屏静态截图差0.0026/255。动画和采样时间会造成小幅差异，不能替代全动作人工目视验收。

完整战局 A/B：继续用 R179 的真实T01/E03初始GPU预热与真实K07首次材质预热；仅开关发丝索引合并。两组均保留原16模型、75,569,762B源角色资源、60卡、46校园法术与真实E06/K01/K07 GLB，**两组均93/93次施法、46/46种法术全部PASS，浏览器0错误**。首发最大rAF 33.4ms vs33.3ms；这不是严格随机化的整体加载速度证明。

Z890桌面显卡模拟手机尺寸430×900、DPR2、CPU×3的Draw Calls为636→417，完整源模型16/16。注意这不是实际Android测试。

## 真 Android S21 验证：资源加载仍不稳定

USB ADB 连接的 Samsung SM-G9910（Galaxy S21，Android15，Chrome157，Qualcomm Adreno660）。原生Chrome WebGL2预检PASS，证实是OpenGL ES 3.2真实GPU，不是软件模拟。仅检查本项目创建的QA浏览器标签，没有访问其他浏览器标签内容。

- 真机核心场景未启用发丝合并时曾成功：636 Draw Calls、原16/16源模型，页面到就绪约11.55秒，JS错误0。
- 真机核心场景启用发丝合并时也曾成功：417 Draw Calls、原16/16源模型，页面到就绪约10.756秒，JS错误0；成功事实见托管进程140101的原始日志。此后同位置的report.json被新一次失败测试覆盖，不能误把最终文件称为首次成功回执。
- 后续重复核心测试以及加载全部校园法术和三件真实精细GLB的完整版曾出现 Target crashed，故**手机性能和可靠性没有通过**。Android系统历史退出证据记录多次沙箱渲染进程因 LOW_MEMORY 被终止，其中一条17:09记录RSS约869MB。
- 可以确认是真实系统内存压力，尚不能证明全由某一件GLB或某一个 Shader 造成。真实设备上没有完成稳定的46法术完整对战，也不能宣称已经解决手机端卡顿。当前必须避免反复压测同一设备。
- 下一轮优先研发手机资源驻留预算与峰值诊断：只为当前实际对局加载与渲染真正要使用的角色和法术，做异步按需加载/纹理复用/失败回退，而不是简单降低人物清晰度。

## 核验与发布门禁

- scene/skinned-index-union.mjs 负责严格骨骼、材质、属性、索引和可见状态验证。
- qa/unit-r181-skinned-index-union.mjs 实测可合并正例、UV属性不一致、骨骼逆矩阵不一致、透明材质、不同父节点等拒绝案例；全部通过。
- qa/browser-r181-hair-union-ab.mjs：真实Chrome渲染开关对照；qa/browser-r181-hair-orbit-ab.mjs：0/90/180°镜头；qa/browser-r181-hair-full-spells-ab.mjs：93施法对照。
- qa/browser-r181-real-android-preflight.mjs 与 qa/browser-r181-real-android-ab.mjs：真正 Android 浏览器测试。
- qa/evidence/r181-final-summary.json：统一结构化验收；qa/evidence/r181-real-android：系统LOW_MEMORY原始回执、首次成功进程日志、实机截图；qa/evidence/r181-forensics-compact.json：骨骼和底层材质调查摘要。
- 冗长的完整逐网格调查原始 JSON 留存在Z890的数据盘：/mnt/disk1/H3_Studio/game-toolchain/evidence/asdc-web-performance-20261118/r181-forensics-raw，避免在GitHub重复储存数万份一致的骨骼逆矩阵。
- 仍只有3/46真实可编辑Blender道具候选，43件法术仍是程序粗糙原型，最终美术验收0件。真正Android完整战局没通过。

**结论：R181发丝无减面索引合并已具备可复测的桌面技术证据，但正式玩家发布标准仍不满足。严格Draft / NO-GO。**
