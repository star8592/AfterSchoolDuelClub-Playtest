# R215｜R213 元数据瘦身 + R214 加载诊断并发集成验收（Draft）

2026-11-20。独立隔离分支 `feature/duel-r215-integrated-load-performance-20261120`，从R213 9425c03出发，拣选R214 7edad26并解决 scene.mjs 3处实际冲突，整合提交62c16d7；基线仍是已完成的R211精致法术+R212馆体合批。

## 冲突决议（实际代码）

- `loadActor()` 同时保留 R213 `r213ThumbLite=on` 时的高精元数据瘦身VRM传输路径和 R214逐VRM加载计时。新增 `transportFile` 是实际传输文件名，`source` 仍为原VRM正式身份；新增 `originalFile` 用于区分记录。
- 角色对象内同时保存 `transportFile` 和真实骨骼、肌肉、蒙皮验证；不得省略R22身份阈值或用占位角色代替。
- 公开QA时同时存在 `r213ThumbLite` 与 `r214LoadProfile` 两个只读getter；R212、R211开关保持原逻辑，互不覆盖。R214并发强制覆盖仍仅QA模式生效，普通游戏默认4。

## Z890真正Chrome/WebGL四线同时启用

测试URL为本工作区 18696 的 `?qa=1&r199PhysicalMagic=on&r210Elements=on&r211CinematicVfx=on&r212StadiumBatch=on&r213ThumbLite=on&r214Concurrency=4`。

- **PASS**：源16/16，模型4/4 slim VRM，真实观众8位，原材质和骨骼数据完全验证；场景 drawCalls **649**，三特效同时QA预览后 drawCalls **664**，旧R210重复特效0；新资源传输 **70,447,094** 字节，R214诊断16条真实时序。
- 16/16真正就绪约1.474s、首画2.486s、浏览器端ready3.170s（该次示例，不承诺稳定冷启动）。
- 改动后的正常画面与R213已通过真实Chrome截图，同尺寸像素差RGB MAE约 **0.001/255**，变化大于25单通道的像素约0.0011%；没有删掉角色。
- 真实E06/T05/S08 从正式手牌打出3/0/2真实伤害（T05 heal满血实际恢复0，无虚假受击），保留广角和原始GLB，JS/HTTP错误0。无全屏光环。

### 机读回执和实机截图

- `qa/browser-r215-integrated-asset-scene.mjs` + `qa/evidence/r215-integration/r215-real-chrome-integrated-receipt.json`
- `qa/evidence/r215-integration/r215-real-chrome-16-models-no-fx.png` 和 `r215-real-chrome-all-flags-three-fx.png`
- `qa/browser-r215-three-real-rule-cards.mjs` + `qa/evidence/r215-integration/r215-three-real-cards-rules-chrome.json`

## 发布规则及未解决问题

- R213新资源仅在开关为on时生效，R214默认4不变；所有 R211/R212 实验功能也必须独立开关，不能直接交给正式R198玩家。
- XPS低配集显**依然很慢**：原来R213单次A/B 66.12→53.84s；R214加载并发2/4单次 59.77/50.62s。系统负载明显波动，不能宣称稳定的秒数改善。
- 本轮完整R215集成需在 XPS **同时打开R212静态合批** 再验证；曾有一轮测试脚本遗漏该开关，drawCalls仍为733，不作为有效四线集成证明，也不将该数字掩盖。
- 缺少真正GTX1650长时间战斗、重复冷启动、弱GPU帧时和用户对精致火水雷的美术签收；继续 **Draft / NO-GO**，不自动合并R213/R214/215到main，不更新正式R198。


## R215低配集成复验（Chrome155 / Intel UHD630，全部四线真实启用）

完整复验使用 `qa/r215-xps-native-cdp.py`，明确加了 `r212StadiumBatch=on`，同时启用R211火水电、R213元数据瘦身及R214的QA加载分析（并发4）。第一次XPS复验遗漏静态合批开关，得到733drawCalls；此为脚本缺漏，**不算四线集成通过的证据**，随后已纠正并重新运行。

- **修正后PASS**：WebGL renderer 原始信息 `ANGLE (Intel, Mesa Intel(R) UHD Graphics 630 (CFL GT2), OpenGL ES 3.2)`，R212静态合批 `enabled=true`，drawCalls **649**，R213四高精VRM实际 slim 资源4/4，R214性能诊断可读取16/16模型就绪时序，累计传输 **70,447,094字节**。触发QA视觉预览后drawCalls **659**，旧R210特效不重复。
- 本次首次完整场景ready **24.00秒**、模型验证结束17.564秒、首帧22.602秒；24帧rAF样本平均46.53ms、P95 50.1ms（**绝非60FPS合格**）。
- **反证性的巨大波动**：同一XPS前一轮（未正确加R212旗标）首次就绪82.64秒，修正旗标本轮24.00秒。不能把波动直接归因于该开关或R213瘦身，不能宣称已将冷加载稳定压到24秒。需要重复至少5轮、记录缓存状态和CPU/GPU资源争用后才可计算稳定收益。
- 原始XPS CDP文件 `qa/evidence/r215-integration/asdc-r215-xps-integrated-batched.json`，XPS真实截图 `asdc-xps-native-r215-combined.jpg`。此实验不代表独立GTX1650设备性能验收。

**仍Draft/NO-GO**：用户美术视觉签收、GTX1650长时间战斗和稳定冷加载未完成。

