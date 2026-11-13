# R134 双主角 VRM 全身待机演出升级

2026-11-14；唯一 main G03 pilot 基线 2f25ea8。正式入口仍为 /r45-duel/。保留 E01/G01 两名独立的 CC0 真实 VRM 发牌主角，卡牌规则、主角握牌流程、配音口形和食堂阿姨 M02 均不替换。

## 修复范围

双方常驻站台主角原来的 idle 只有轻微 0.01-0.03 弧度变化，远景常像两个木棍。本次新增 r45-duel/scene/r134-host-idle-stage.mjs：
- E01 粉裙女主角，每8.6秒焦急张望、检查手牌、变换站姿、迎战挑衅，原生头胸脊柱、腿部与握牌手腕协调联动。
- G01 蓝衣男主角，每10.1秒独立分析牌面、侧身换重心、观察对手、冷静挑衅，肢体节奏与女主角不同。
- 只驱动真正的 J_Bip_C_Spine、J_Bip_C_Chest、J_Bip_C_Head、左右 J_Bip_UpperLeg/LowerLeg 等原 VRM 关节，以及现有双腕 IK 的目标位置；不会增添假人、假手或新三维引擎。
- 剧情意图为 ready、check_hand、challenge_opponent，作为 source Choreography 独立读出。
- 出牌、展示、蓄力攻击、受击、胜负表演一旦启动，新 idle 权重按 (1-actionStrength)^2 降低，完整关键动作优先；busy=1时 idle 独立贡献为零。系统减弱动作设置下，新 idle 的幅度为18%，不是强制移动。
- 普通运行启用新版本；有问题即时加 r134Hosts=off 回退老 R133 双主角运动，不增加第二套部署。

## 原始测试与边界

- r45-duel/qa/browser-r134-two-host-idle.mjs：真实 Chrome 1440px与430px，每端15秒启用与回退分开实测，38/38检查通过。两个主角全部仍有双手来源 IK、原 VRM 骨骼和独立原始高精网格，原十五指抓牌保持可用；女主角采样识别出至少2种人格节拍，男主角至少3种；回退时完全移除新来源状态。
- r45-duel/qa/browser-r124-full-chain-benchmark.mjs：真实规则 K01 出牌，15真指握牌，元素命中和敌方受击语音、贴合手牌和不重复扣血，desktop+portrait合计18/18通过。
- 两端15秒源录像采样与日志存 r45-duel/qa/evidence/r134/duelist-hosts/，正式游戏回归保留原始结果。
- 人工导演美术评分>=85、最终远景/竖屏肉眼表现、多机型真实低端 GPU 表现依然未完成，不把 38 次技术通过冒充整体艺术签收。

作者和授权：两个主角均为原 CC0 VRM 来源，详见正式游戏 credits。不存在额外引入第三方商用模型。
