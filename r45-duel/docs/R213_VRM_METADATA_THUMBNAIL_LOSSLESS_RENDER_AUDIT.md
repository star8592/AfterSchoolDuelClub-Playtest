# R213｜高精VRM元数据缩略图瘦身（4角色 / 5.12MB）｜Draft/NO-GO

日期：2026-11-20；基于R212静态馆体合批b645996。与并行R214加载并发研究**独立分支**，不自动发布。

## 关键发现

R124已有12份默认召唤GLB的无损gzip传输，不能误称没有做过压缩。4份VRM使用嵌入的WEBP贴图，普通gzip仅能减少6–8%体积，不能根治XPS漫长冷启动。进一步解剖真正GLB2/EXT_meshopt_compression结构发现：

- 每个VRM附带一个 **2048×2048、1.2–1.4MB 的『Thumbnail』元数据预览图**，VRM.meta.texture指向该图；不是战斗角色的PBR皮肤图。
- 我们只把该元数据预览图缩到256×256 WebP，角色本身的材质、几何、动画、蒙皮及骨骼 **不需要重建**。保留原始VRM不变，新建 `-R213-ThumbLite.vrm` 用作并行A/B试验。
- 由于实际VRM带有meshopt逻辑后备缓冲区，重写时单独处理`bufferViews.buffer=1`（虚拟解压buffer不在GLB BIN内），不能错误地把它当成真实二进制重定位。构建器保持所有非缩略图bufferView的实际二进制切片哈希一致。

## 实际优化和严格二进制一致性

| VRM | 原始字节 | 优化字节 | 节约字节 |
|---|---:|---:|---:|
| Fumiriya | 8,469,128 | 7,074,648 | 1,394,480 |
| Host-Female | 7,665,836 | 6,421,300 | 1,244,536 |
| Host-Male | 7,918,884 | 6,704,432 | 1,214,452 |
| Shino | 6,613,012 | 5,343,812 | 1,269,200 |
| **合计** | **30,666,860** | **25,544,192** | **5,122,668（16.70%）** |

- 生成器 `qa/pack-r213-metadata-thumbnails.py`；清单 `assets/model/r213-thumblite-manifest.json`，包括原始/优化SHA256与二进制一致性证明。
- 检查脚本 `qa/check-r213-thumblite-binary-identity.mjs`，比对四模型全部glTF语义关键结构（skins、mesh、animations、materials、textures、nodes、scenes等），并逐个验证**原始物理buffer=0的每段非Thumbnail视图哈希保持不变**；分别验证128、145、152、89段有效视图。
- 保留原始4 VRM和现有R124 GZIP GLB；R125 asset fingerprints新增4条新模型hash并更新审计到20条（4原始VRM+4优化VRM+12召唤GZIP），生产仍通过fingerprint准入。

## 实机与发布限制

- 开关 `r213ThumbLite=on`，默认关闭；只改变4份VRM实际传输文件地址，演员元信息仍为原始 source，**不降低R22身份校验的bones、skins、vertices门槛**。
- Z890 真实Chrome GPU同机A/B：首次sceneReady原始3622ms，R213 2967ms；此为**单次独立浏览器context小样本，不可宣称稳定提速**。
- 16/16角色真实加载就绪；原始角色与优化角色骨骼/蒙皮数字完全一致：E01 148/67、G01 107/102、Host-Female 119/124、Host-Male 91/131。8名观众原样存在，竞技场drawCalls均为649。
- 真实Z890 Chrome前后截图像素MAE：**0.004319/255**；像素通道变化大于25的占比约0.00488%。说明未发生明显画面差异，仍需终端美术签收。
- `qa/browser-r213-three-real-rule-cards.mjs` 真正从手牌执行E06（3伤害）、T05（满血实际回复0）、S08（2伤害），同样保留真实GLB、规则、声音导演与广角；JavaScript/HTTP错误0。
- 审计证据保存于 `qa/evidence/r213-metadata-asset/`：原版/优化前后截图、实机对比和三卡规则JSON。
- **待办**：XPS Intel/GTX1650的真正冷启动A/B，以及长回合GPU压力测试。Z890单轮收益不代表所有玩家得益。

## 开发边界

严格Draft/NO-GO，不合并main、不更改正式R198，也不直接替换原4份模型。发现纹理/骨骼/动作异常时，关闭开关即时回退原始资产。并行R214只研究不同并发度、资源时间线，不在此分支更改其调度算法。


## XPS Intel UHD 630 原生 Chrome/CDP 补验（单次 AB，不应当当成稳定加速结论）

- 操作系统 XPS 15-7590 Ubuntu，Chrome155 WebGL2 `ANGLE (Intel, Mesa Intel(R) UHD Graphics 630 (CFL GT2), OpenGL ES 3.2)`；这**不是GTX1650的GPU验收**。
- 使用独立 Chrome Headless profile、相同1280×720视角、同一 Z890 LAN 18694 静态服务、16/16模型原样完成身份验证；取帧方式为rAF时间间隔，不是GPU duration。
- 原始：网络接收累计 **75,569,762字节**，首次场景就绪 **66.12秒**；优化后：**70,447,094字节**，首次场景就绪 **53.84秒**。相差12.28秒但仅一组冷启动，波动很大，**不能证明可重复地快12秒或直接把差额归因于缩略图**。
- 两组短样本平均帧间隔均约48.61ms、P95 50.1ms；R213只缩启动资源，不降低运行时基础DrawCalls（同为733）及正式出牌绘制调用（同为743）。
- 两张实际Chrome CDP截图平均像素差0.1675/255，明显像素差约0.0349%；包含动态时间差。实际两名决斗者、4套源骨骼、所有观众模型不变。
- 可复现XPS独立CDP脚本 `qa/r213-xps-native-cdp.py`、XPS原始报告 `qa/evidence/r213-metadata-asset/asdc-r213-xps-thumb-original-ab.json`、XPS画面对照 `r213-xps-4vrm-original-vs-optimized.jpg`。
- **仍Draft/NO-GO**：这只解决元数据缩略图冗余，无法单独把50秒级冷加载降到合格水平。主线优先继续审查12个GLB的有效可见材质与纹理，以及弱GPU初始化瓶颈。

