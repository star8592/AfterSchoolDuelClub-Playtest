# R177｜高精真实GLB道具与首次施法防卡联合实战

2026-11-18；合并 R175 原始 Blender 真雕塑 E06 与 R176 仅 QA 可用的真实单位 GPU 预热。**全部 4 组功能回归通过；玩家正式发布 NO-GO。**

## 真正联合在同一场景验收
原始游戏、16/16真实角色VRM/GLB、60张卡、全部46张校园魔法不替换成低模；仅黑板擦 E06 使用全新 .blend 导出的真实立体 GLB（541,512 字节、8 Mesh、18,844 三角面/材质细节），其余45仍为程序组合的粗原型。

每组均执行 E06 首次施法＋46种全部法术＋46种全部复发，共93次，浏览器运行错误0、加载原始人物资源75,569,762字节不变。E06使用新 GLB 的注册断言通过，静态几何缓存40项且没有随重复施法增长。R147正式默认关闭，画质、人物、演出、台词和数值都不为测试降低。

| Z890 Chrome Vulkan | 未预热首发最差 rAF | 加载期预热首发最差 rAF | 两组功能 |
|---|---:|---:|---|
| 桌面1280×720 CPU×2 | 366.7ms | 50.0ms | 93/93 场景演出通过 |
| 手机模拟430×900 DPR2 CPU×3 | 483.3ms | 50.0ms | 93/93 场景演出通过 |

桌面该轮首次就绪时间 4412ms → 5834ms（**增加1.42秒**），预热真实 T01/E03 两名召唤角色耗时1793.2ms、新编译43 Shader。新版 E06 首发仍会新增若干 PBR Shader（桌面和手机各+4），但没有观测到以前的350–500ms长帧。所有 GPU、所有角色与真手机环境尚未通过，不能将单轮 Z890 对照视为完全解决。

注意手机版只是桌面 Z890 的 Chrome 手机视口和 CPU 限速，**不是实际 Android GPU**。也不得用“前台渲染 50ms”掩盖“额外等待1.42秒”，要继续对齐整体端到端启动和卡牌操作体验。

## 真实道具发布质量仍不合格
自动盘点46张校园魔法后：真 Blender 可编辑雕塑候选 1、程序化原型仍45、最终审美验收通过 0。模型本身的真实布/木/金属质感、轮廓创意、光照和角色互动还需设计师审查；R175 的样件不等于已经达到动画电影级品质。运行 node qa/r177-audit-46-real-art.mjs 可生成全46张真实资产状态；加 --release 会拒绝没有完整精模的发布。

## 下一步最小必要项
1. 以角色对局/出牌实际预见的召唤模型作为预热对象，把首屏额外等待控制在合理范围；验证全部12原始召唤组合与不同显卡。
2. 46张法术由独立真3D资产替换占位几何；每件含源文件、真实 GLB、三视图/材质、实际游戏截屏、性能和声音/受击归档。
3. 真实 Android 和桌面多次冷、热启动、不同 Shader 缓存状态，检查首发与重复发牌 rAF / longtask / GPU timer、p95/p99，并确定可回退发布门槛。
4. 不合格保留独立工作分支，不合并 main、不覆盖已发布 R147。

## 原始证据
- qa/evidence/r177-combined/r177-sculpt-and-performance-final-summary.json
- qa/evidence/r177-combined/r177-baseline-desktop-93-casts.json
- qa/evidence/r177-combined/r177-primed-desktop-93-casts.json
- qa/evidence/r177-combined/r177-baseline-mobile-93-casts.json
- qa/evidence/r177-combined/r177-primed-mobile-93-casts.json
- qa/evidence/r177-combined/r177-46-prop-art-status.json
- qa/browser-r177-sculpt-perf-ab.mjs
- qa/r177-audit-46-real-art.mjs

**结论：首发卡顿的主要阻塞可在完整原始模型 + 真实新GLB中被移到加载阶段，已可复现，但正式玩家发布仍不合格。**
