# R84 音乐语言与电影风人物审计（2026-11-12）

## 完成：七首独立配乐
原有 school_duel_theme、duel_tension 两首，新增五首本人编曲制作的 Ogg/Opus 立体声音乐：
campus_parade（136 BPM 校园开赛）、mischief_shuffle（112 BPM 幽默摇摆）、tactical_pulse（94 BPM 战术思考）、heroic_comeback（148 BPM 逆转）、final_overtime（166 BPM 决胜）。
源码 qa/generate-r84-music.py，真实文件及 SHA 在 assets/audio/r84-music-provenance.json。
音频引擎增加 setOpeningMusic 和 musicForBattle 按开赛/回合/血量/局势换曲，约1.4秒交叉淡化，人物说话时动态压低背景音乐。原生合成音色仍须人工试听审批。

## 完成：98条原创Qwen3-TTS配音和无重复调度
14名召唤人物各3条enter和3条attack=84；两名出牌者各4条cast与3条hurt=14，总计98条。
新增66条真实声音 Ogg/Opus，原始中文台词在 qa/r70-qwen3-voice-lines.json，声源/时长/真实SHA在 assets/audio/voice-manifest.json。
audio-engine.mjs 对同一角色同一情境采取 shuffle-bag 并排除最近两条，避免重复上场说同一句。
game.mjs 每回合站台出牌者台词仅报一次，随后排队召唤者登场，避免旧版立刻截断角色自我介绍。
校验 R84_AUDIO_ASSETS_PASS：98 voiceClips、16 roles、17 cues、7 songs、98 pending-human-listening。全部已制作文件，但演技/语速/声线仍需人耳听审。
真实 Chrome 测试：qa/browser-r84-music-voice.mjs；桌面1600x900、手机430x900都 PASS，音乐切换与连续3次不同配音已实播，音频 HTTP/JS errors 0。

## 低模审计结果：仍有五名旧人物在实际游戏里
由 qa/audit-r84-runtime-models.py 读取真实 GLB 三角面并与当前 scene/summon-models.mjs 运行时文件对应：
E03 加油队长 Gobkit 1700面；E04 食堂接力员 2886面；
G02 黑板密码专家 2858面；G04 社团计划总监 2726面；
T03 默契收发员 2918面。这五个仍为早期玩法占位，不应再宣称全部美术换完。
M01 音乐老师3777面，尽管角色骨骼完整，仍须重点审查风格；G03 Jay R80 72314、T04 Rex R80 89626已有高精度几何，M02 食堂阿姨31139面需对比原画。
详细清单与原始证据见 qa/evidence/r84/r84-runtime-model-audit.json。
注意：单纯加细分不会让旧低模成为高质量角色；不可以拿不合剧情的人物直接换模，也不可以隐藏或删掉五张卡以消除低模。

## 三个真正的高精度美术候选已获取并在浏览器展示
从与R80相同的 Blender Studio 动画电影角色体系取得公开原始Blend，并利用Blender 5.2 --disable-autoexec安全抽取真实艺术家几何，生成如下静态试装 GLB：
Phil 45698三角面、Victoria 58422、Ellie 88331；各模型有真正三维纹理材质结构，均非旧模型细分。
源出处及SHA记录于 art-lab/r84-film-recast/R84_ARTIST_SOURCE_PROVENANCE.json。
原始来源页面：https://studio.blender.org/characters/phil/v1/
https://studio.blender.org/characters/victoria/v1/
https://studio.blender.org/characters/ellie/v1/
授权为CC-BY；若未来正式采用须保留美术作者与来源信息。
源码 qa/r84-export-film-source.py 和 3个audition GLB可复现；本地Blend源仅保留在单独隔离工作区，不纳入普通网页游戏包。
真实Web展厅 http://127.0.0.1:11024/r45-duel/qa/r84-film-casting-gallery.html
页面可旋转看正/侧视角，截图 qa/evidence/r84/r84-film-artist-candidates-front.png 和 ...angle.png；真实Chrome已加载3个GLB，QA PASSED。
注意：已利用原生Blender动画骨骼IK给三个候选制作自然垂臂的静态美术验收姿势；该GLB尚无实际战斗动作clips，原画校园身份、服装、发型与真实战斗动画仍未做完，故尚未把它们替换进入正式游戏。不能以候选模型已下载冒充卡牌人物美术已完成。

## 正在进行的下一步（不假称已完成）
给 E03/E04/G02/G04/T03 选择符合原作身份的不同高级人形、改造服装/体态/面部、绑定动作并逐卡在真游戏里替换。每张卡验收正面朝向、大小比例、落地、出牌、攻防、骨骼动作、声音、镜头和实时HP。仍保持每张牌可召唤不破坏游戏规则。

## 工作区与验收
R84独立Git分支 feature/duel-r84-music-dialogue-art-audit-20261112，后续以独立PR审核。
可玩实验 http://127.0.0.1:11024/r45-duel/
多角色选模实验 http://127.0.0.1:11024/r45-duel/qa/r84-film-casting-gallery.html
二者都是 Z890 环回本机测试服务，不是公网发布，当前游戏仍保留所述五张旧低模卡的可玩占位。
