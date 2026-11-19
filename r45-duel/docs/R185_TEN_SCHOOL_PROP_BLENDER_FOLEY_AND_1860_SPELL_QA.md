# R185｜十件教室/食堂/社团原创Blender三维魔法＋十种专用声音＋1860次法术

2026-11-19 Z890原始实机。**隔离Draft / NO-GO**。GitHub main和玩家正式R147不变；没有完成Android GPU与最终审美验收。

## 十件真3D原生Blender工程

| 道具 | 可辨识的独立几何和特色演出 |
|---|---|
| G06 翻到第二页的方案 | 真皮面书、几十层页边、弯曲第二页、弹出的课桌和答题计划；翻页跃出 |
| T05 食堂暖心加餐 | 深瓷碗/实体汤面/胡萝卜、青菜、豆腐/钢勺；汤翻勺搅热气升 |
| K05 校长秘制空气汤 | 明显空心碗、空勺与无食材菜单；舀空、空气冒动 |
| Q03 会做梦的黑板 | 老木框绿板/物理眼睑/自己写字的粉笔和100分成绩；眼睑做梦 |
| Q04 全寝室公开播放 | 实体手机/双喇叭锥盆/杯子与杯中水；手机震动让水杯跳 |
| Q07 教室第二个月亮 | 真立体陨坑月亮和假纸板月亮支架；两月反向转动 |
| Q08 粉笔画地为牢 | 歪曲真粉笔线和实体粗砖地面/铜锁/破碎粉笔；牢界收缩 |
| S02 一根笔的笔盒 | 带铁合页和磁扣的窄文具盒，真的只有一支六棱铅笔；盒盖打开笔弹出 |
| S05 乌龙机器人班长 | 班长机/人脸屏/金属肘/花名册；机器人乱点名，挥臂举名单 |
| S07 放学铃声虫洞 | 铜铃、铃舌与层层扭曲木校门/倒飞星期一课表；重复周一 |

各件均拥有独立可编辑Blender .blend、独立.glb、可复跑源码、真正的Eevee模型渲染、Chrome WebGL实际体育馆演出截图、可独立控制的物理动画Empty。由 art/hero-props/build_r185_ten_school_comedy.py 建造。十件共**307,668个实际GLB索引三角面、7,692,744字节GLB、6,059,895字节原生Blender工程**。源二进制签名、真实拓扑索引一致性、材质、真实源渲染及动画节点全部由 qa/verify-r185-ten-true-sculpt-glb.py实测通过。

### 真实可视化证据

- qa/evidence/r185-sculpted-props/r185-ten-actual-blender-models-gallery.png：真Blender Eevee十个模型源渲染。
- qa/evidence/r185-sculpted-props/r185-ten-actual-gameplay-gallery.png：真Chrome WebGL场内十张原始截图合成，不用模型离线图冒充游戏。
- qa/evidence/r185-sculpted-props/ID/ID-in-stadium.png：每件现场截图与时间采样；对应R185-3D-in-stadium-qa.json记录两时刻真实部件位姿。
- 其中G06翻页方案、Q07双月、Q08粉笔牢笼外形仍偏简洁，实质美术需要继续加强。技术真实不代表已达到动画电影级视觉；当前37件候选最终美术验收全部为未通过。

## 10种不同的实物声音

全新离线声音源码 qa/generate-r185-original-school-foley.py，实际输出十个Ogg Vorbis，共128,840字节，SHA256完整记录在 assets/audio/r185_original_foley_sha256_manifest.json。

G06真翻页声；T05碗和汤勺；K05空碗回响与冷场；Q03涩粉笔和睡梦气声；Q04手机提示/低音扬声器与水杯；Q07纸板和物理教具；Q08粉笔和铜锁；S02小拉链与铅笔；S05点名机器人伺服电音；S07铜铃与倒飞课表。每个魔法拥有自己的三层时序，46张法术Foley契约仍全部互异。

**准确标记：这是原创数字合成Foley，不是真实麦克风录制，也没有新增角色对白/真人配音。** 十段已经通过真正Chrome WebAudio decodeAudioData，非静音无解码或HTTP错误；报告 qa/evidence/r185-sound/r185-10-original-foley-chrome-web-audio.json。

## 真正20组浏览器完整战斗

硬件Z890 RTX5070Ti Chrome Vulkan WebGL2、CPU限速2倍、桌面1280x720。每件作为首次法术，先后执行46种魔法两轮，每组93次；十件分别对比冷启动/精确预热当前一件真GLB与双方两位真角色。

**20/20功能PASS，实际1860次法术执行，46种身份每组覆盖，46种音效结构通过，十款新Foley对应正确，0新增JS/HTTP错误。** 维持源16位原始角色、75,569,762字节原3D资源与60张卡牌，不降低原角色精度。

| 实测指标 | 冷启动 | 精确GPU预热 |
|---|---:|---:|
| 首次可交互 | 4,053–4,405ms | 5,227–5,601ms |
| 首发最大requestAnimationFrame间隔 | 33.3–366.7ms | 33.3–33.4ms |
| 首发最长观测LongTask | 0–377ms | 0ms |
| 完整93次演出 | 10/10PASS | 10/10PASS |

特别说明：LongTask和rAF不是同一指标。例如G06、K05有350/366.7ms首发长帧，但LongTask捕捉为0，不等于没有卡顿。预热把部分成本转移到更慢的首次加载，测试仅单次桌面GPU，没有随机化多轮或Android真机实测，不能宣传稳定60FPS或“已彻底消除卡顿”。原始20组JSON以及完整性能摘要存于 qa/evidence/r185-full-spell/r185-ten-20x93-ab-summary.json。

## 资产审计和发布禁令

截至本轮，**37/46件是独立可编辑Blender三维开发候选；仍有9件程序化粗模；0/46最终视觉批准**。剩余9件P01狂风炸毛超人、P02百年没进球的皮球、P06反向跑步机、P08运动会流星、X01倒退校钟、X04预言午休枕头、X06早读复制器、X07消失的最后一课、X08校门时空保安。

所有R185新模型在qa=1&r169SchoolMagic=on&r185Hero=ID的隔离状态下一次只加载1个GLB，不跟旧R182-R184候选同时叠加。r185PrimeSelected=on是默认关闭的试验选项。此前三星S21真Android出现过LOW_MEMORY杀死渲染进程，本轮未重验真Android，也未达视觉品质签收，**GitHub main及玩家R147坚决保持不动**。release硬门禁验证仍拒绝退出码2。
