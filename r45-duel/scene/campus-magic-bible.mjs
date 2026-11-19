/**
 * R169 · Campus Absurdist Spell Identity Bible.
 * THE AUTHORITATIVE REPLACEMENT PLAN FOR ALL 46 EXISTING SPELL CARDS.
 *
 * All lines below are original *text scripts* for future Qwen3 recordings.
 * They are NOT pre-recorded or voiced until matching audio files/manifest
 * exist. Rules/costs/HP/targeting are preserved by the game engine.
 */
import {CARDS} from '../engine.mjs';
const row=(id,family,prop,gesture,flight,impact,s1,s2,cast,hit,crowd,screen)=>Object.freeze({
 id,family,prop,gesture,flight,impact,
 foley:Object.freeze([s1,s2]),
 lines:Object.freeze({
  cast,hit,miss:'等等！这东西还没考过飞行执照！',
  audience:crowd
 }),
 screen,
 // A spell only stages, NEVER changes canonical effects or HP.
 originalName:CARDS.find(c=>c.id===id)?.name
});
const I=[
 row('E05','体育呐喊','megaphone','双手拢嘴、踮脚大喊','扩音器跳动并喷出校旗','队友被鼓舞得原地蹦起','r102_comedy_whistle','r102_score_trumpet','全校注意！加速冲啊！','这嗓门把我鞋带都吓松了！','这谁开的运动会？','施法者和蹦跳队友'),
 row('E06','教具投掷','eraser','跨步甩臂掷黑板擦','厚重板擦翻滚抛物线','脸上白灰、头向侧偏、拍灰','r102_chalk_swoosh','r102_chalk_snap','黑板擦，请精准降落！','我刚洗的校服啊！','别扔啦！老师在后面！','板擦击中瞬间及对手护头'),
 row('G05','校舍维修','desk','蹲下扶桌腿、猛拧螺丝','木制课桌自动伸展桌腿','队友桌边拍手、桌子站稳','r102_erase_scribble','r102_shield_chime','报告校工！桌腿抢修！','这桌子终于不摇了！','维修费记谁账上？','桌腿自动修好'),
 row('G06','作业文具','flipbook','把计划书猛地翻页','立体纸张啪啦翻飞','队友眼前出现新方案','r102_paper_flap','r102_stamp_pop','第二页！才是真正的计划！','第一页不是已经写满了吗？','计划又改？','翻页与新卡特写'),
 row('T05','食堂灾难','soup','阿姨双手捧大汤碗','热汤随勺子温柔晃动','队友捧碗、暖心欢呼','r102_music_gliss','r102_hearts_pulse','来，先喝口热汤！','这汤比社团经费还暖！','我也要加一勺！','暖汤和队友笑脸'),
 row('T06','广播事故','speaker','手忙脚乱按广播按钮','喇叭张嘴、校内通知牌乱闪','对方捂耳、左右张望','r102_radio_tune','r102_radio_glitch','放学啦……不对，重播！','我到底该回家还是留下？','广播室又串台啦！','广播喇叭、受扰乱的对手'),
 row('K01','黑暗食堂','eggplant-banana','高举炒锅猛颠勺','茄子和香蕉在锅中打架','对手嫌弃后退、捂嘴','r102_music_gliss','r102_rubber_squeak','茄子炒香蕉！今日特供！','这是水果还是主食啊？','食堂今日开始冒险！','炒锅与茄子香蕉'),
 row('K02','黑暗食堂','watermelon-eraser','挥勺往西瓜里塞橡皮','西瓜果肉与橡皮弹开','队友撑起弹力护盾','r102_rubber_squeak','r102_shield_chime','橡皮炖西瓜，弹性十足！','这汤怎么会弹我？','别拿西瓜写作业！','西瓜弹跳慢镜'),
 row('K03','黑暗食堂','corn-grapes','把玉米粒和葡萄倒进锅','葡萄跟玉米粒跳交谊舞','队友捡起新增的牌','r102_confetti_pop','r102_paper_flap','玉米炒葡萄，数学满分！','这个配色太会考试了！','水果居然开会了！','锅里跳舞的小食材'),
 row('K04','黑暗食堂','pepper-mooncake','拿辣椒当指挥棒','月饼翻身喷出辣椒屑','对手被辣得蹦脚','r102_chalk_snap','r102_crowd_gasp','剩月饼配辣椒，开火！','辣！我眼泪都交作业了！','快给他喝水！','月饼与辣椒的碰撞'),
 row('K05','黑暗食堂','invisible-soup','端着空锅认真撒盐','巨大透明汤勺舀空气','队友一脸困惑又鼓掌','r102_music_gliss','r102_hearts_pulse','空气汤，今天免费续碗！','我到底吃了什么呀？','碗是空的，怎么这么香？','空碗与惊讶脸'),
 row('K06','黑暗食堂','volcano-tea','用力摇巨大奶茶杯','奶茶吸管喷出辣椒泡沫','对手被辣得原地弹跳','r102_radio_glitch','r102_chalk_snap','火山辣椒奶茶！热的！','这不是饮料，是体育课！','谁点的全辣奶茶？','奶茶火山喷发'),
 row('K07','黑暗食堂','frog-pudding','小心掀开布丁罩','果冻蛤蟆蹦起拉响警铃','对手缩肩转头找来源','r102_rubber_squeak','r102_school_bell','布丁别叫！全校听到了！','它居然还会报时？','青蛙怎么混进食堂！','布丁蛤蟆特写'),
 row('K08','黑暗食堂','armored-banana','给香蕉披上巧克力甲','巧克力盔甲咔咔合拢','队友庆祝甜品存活','r102_shield_chime','r102_confetti_pop','香蕉战甲，启动！','连水果都穿铠甲啦！','保卫最后一根香蕉！','香蕉盔甲英姿'),
 row('Q01','教室怪谈','essay-eraser','小橡皮趴桌奋笔疾书','检讨纸自动写满又被擦除','队友揉揉眼睛、书本恢复','r102_erase_scribble','r102_paper_flap','检讨我来写，字别太多！','它把自己名字擦了！','检讨也能自动生成？','橡皮写字的手部动作'),
 row('Q02','教室怪谈','beast-notice','班长敲桌宣读通知','纸通知折出神兽脑袋','对手抱书包退后','r102_poster_unfurl','r102_crowd_gasp','神兽们！统统返校！','书包怎么在咆哮？','开学铃一响全都回来了！','神兽头探出通知书'),
 row('Q03','教室怪谈','dream-board','黑板闭眼做美梦','粉笔在黑板上自写满分','队友看答案恍然大悟','r102_erase_scribble','r102_magic_tingle','黑板做梦，答案全会！','黑板比我还会考试！','老师也在做梦吗？','黑板满分梦境'),
 row('Q04','教室怪谈','loud-phone','手机突然朝天外放','宿舍音箱震得水杯跳舞','对手捂脸、尴尬逃开','r102_radio_tune','r102_radio_glitch','全寝室公开播放！','快关掉啊，我还在睡觉！','这段语音能别外放吗！','音箱和尴尬脸'),
 row('Q05','教室怪谈','press-chalk','粉笔站上记者会讲台','粉笔话筒噗地喷出白粉','对手脸沾白灰、打喷嚏','r102_chalk_swoosh','r102_chalk_snap','下面由粉笔回答提问！','采访结束，我脸白了！','粉尘不是粉尘，是奋斗！','粉笔记者会特写'),
 row('Q06','教室怪谈','three-click-lamp','连续三次拍按钮','台灯前两次不亮第三次爆亮','队友眯眼后获得保护','r102_stamp_pop','r102_shield_chime','一！二！三！你倒是亮啊！','这灯要交三次作业！','台灯还有考勤吗？','三连按键的喜剧节奏'),
 row('Q07','教室怪谈','second-moon','手举纸月亮贴在黑板旁','两个月亮一左一右转动','对手抬头发懵','r102_music_gliss','r102_crowd_gasp','今天加一节月球地理！','窗外怎么有两个月亮？','晚自习延长到月球？','双月和对手仰头'),
 row('Q08','教室怪谈','chalk-prison','俯身用粉笔划地面','粉笔线围出歪歪扭扭的方框','对手被线框困住跺脚','r102_erase_scribble','r102_shield_chime','不许出圈！这是课堂纪律！','线怎么真的挡住我了！','值日生画得也太直了！','粉笔方框的边界'),
 row('S01','社团实验','reverse-alarm','追着闹钟拨回指针','闹钟指针疯狂逆转','队友重复迟到动作','r102_school_bell','r102_rubber_squeak','倒回一分钟！再迟到一次！','你又迟到了两个昨天！','时间也要交检讨！','逆转闹钟秒针'),
 row('S02','社团实验','pencil-case','两手掰开窄文具盒','文具盒只吐出一支铅笔','队友捡起新的方案纸','r102_paper_flap','r102_rubber_squeak','文具盒，给我一根就好！','笔都住单间啦？','文具盒比宿舍还小！','狭窄笔盒惊喜'),
 row('S03','社团实验','anti-grav-broom','像跳高一样挥大扫把','扫把托着灰尘倒飞','对手在扫帚风中眯眼','r102_chalk_swoosh','r102_spring_boing','走廊！给我飞起来！','我怎么开始扫天花板了！','值日生升空啦！','扫把飞行路线'),
 row('S04','社团实验','wrong-answer-generator','拼命往机器里塞错卷','红叉卷子给机器充电','对手被闪电吓得抖肩','r102_radio_glitch','r102_chalk_snap','错得越离谱，电越多！','答错也能发电？','这错题本能上电网！','错误答案发电机'),
 row('S05','社团实验','robot-monitor','机器人举着班长名册','机器人嘴里吐出电器铭牌','队友对着名册立正','r102_radio_tune','r102_stamp_pop','编号001，全班集合！','我怎么叫电饭锅？','班长你认错人啦！','机器人报错名字'),
 row('S06','社团实验','quantum-band','双手猛拉超长橡皮筋','橡皮筋折回来弹飞老师帽','对手吓得缩脖子','r102_rubber_squeak','r102_spring_boing','橡皮筋，别弹老师啊！','为什么老师先飞过来了？','物理课要开新课题！','橡皮筋夸张拉伸'),
 row('S07','社团实验','bell-wormhole','连按三次放学铃','校门铃铛折成螺旋门','对手被送回起点','r102_school_bell','r102_radio_glitch','放学铃响了！又是星期一！','我们怎么又上第一节课？','今天上了三遍周一！','校铃折叠空间'),
 row('S08','社团实验','angry-vending','对售货机投空气硬币','售货机怒吐汽水罐','对手被易拉罐追着跑','r102_stamp_pop','r102_rubber_squeak','别生气！我这就投币！','售货机怎么会追人？','饮料打起来啦！','售货机表情与罐子'),
 row('P01','体育荒诞','wind-hair','吹起夸张的假发','发丝根根竖起冲向操场','队友甩头摆跑姿','r102_chalk_swoosh','r102_comedy_whistle','头发集合！跑起来！','发型比我先到终点！','理发师今天要加班！','炸毛头顶特写'),
 row('P02','体育荒诞','lost-ball','反复踢皮球撞墙','球在墙角蹲着思考人生','队友用球撑护盾','r102_rubber_squeak','r102_shield_chime','这球一百年也该进了吧！','球已经不想上场了！','裁判都退休了！','皮球蹲墙角'),
 row('P03','体育荒诞','box-dinosaur','纸箱恐龙踩着操场跑','巨型纸箱腿哐哐落地','对手被恐龙吓得蹦跳','r102_school_steps','r102_crowd_gasp','纸箱霸王龙！冲刺！','鞋都被你踩飞了！','恐龙还要考体育？','恐龙纸箱腿'),
 row('P04','体育荒诞','mega-whistle','体育老师吸足一口气吹哨','超大哨子震得队旗歪斜','对手双手捂耳弯腰','r102_comedy_whistle','r102_radio_glitch','全体集合！哨响即停！','耳朵在抗议啊！','裁判吹得太卖力啦！','哨子与观众捂耳'),
 row('P05','体育荒诞','volleyball-hoop','一脚踢飞排球','排球误转弯钻进篮球筐','对手扑空、球架震动','r102_rubber_squeak','r102_score_trumpet','这是排球！别进篮筐啊！','这分究竟算谁的？','裁判！这球违规跨项目！','错误进球回放'),
 row('P06','体育荒诞','reverse-treadmill','原地反方向狂踩跑步机','跑步机带着操场倒转','对手看晕转圈','r102_school_steps','r102_rubber_squeak','我跑十圈，操场别跑！','我的体育成绩怎么倒退了？','操场也要休息啊！','倒转履带与脚步'),
 row('P07','体育荒诞','black-swan','校宠黑天鹅滑冰','黑天鹅脚下一整块冰滑走','对手趔趄左右找平衡','r102_music_gliss','r102_rubber_squeak','天鹅选手，请表演慢动作！','为什么冰面跑到体育馆？','给校宠打十分！','天鹅慢动作转圈'),
 row('P08','体育荒诞','sports-meteor','举起运动会发令枪','领奖台上掉下一颗流星奖牌','对手被巨大奖牌震得蹲下','r102_score_trumpet','r102_chalk_snap','第一名！从天而降！','这奖牌比我整个人还大！','这冠军哪里报名？','巨型奖牌落地'),
 row('X01','时空校园','rewind-clock','抓着钟表大幅倒拨','钟针逆转带走放学铃','队友重新翻到上一页','r102_school_bell','r102_music_gliss','周一倒回星期天！','我又要交昨天的作业？','时钟被抓去补课！','大钟倒转'),
 row('X02','时空校园','wall-uniform','把校服往墙上轻扔','校服没穿人就穿过墙','队友穿墙后愣住','r102_poster_unfurl','r102_rubber_squeak','校服先去教室占座！','校服进去了，人还没来！','谁帮校服点了名？','校服穿墙'),
 row('X03','时空校园','roof-car','教务车司机打方向盘','微缩教务车啪地停到屋顶','对手仰头差点掉下书包','r102_school_steps','r102_stamp_pop','教务车，屋顶有停车位！','违停罚单写在哪儿？','校警被难住了！','教务车悬在屋顶'),
 row('X04','时空校园','prophecy-pillow','午休枕头轻轻弹跳','枕头吐出下一节课的试题','队友惊讶睁眼','r102_music_gliss','r102_paper_flap','枕头，提前告诉我提问！','连午睡都要预习？','这枕头比老师会押题！','枕头的梦泡'),
 row('X05','时空校园','homework-cosmos','把作业本当飞盘抛出','作业本展开成长长的试卷行星','对手被纸片淹没','r102_paper_flap','r102_crowd_gasp','全宇宙的作业！起飞！','作业怎么比银河还大！','这要写到毕业啊！','作业本宇宙'),
 row('X06','时空校园','reading-cloner','早读同学指着书读四遍','四张一样的书嘴一起朗读','队友不由自主跟读','r102_radio_tune','r102_paper_flap','早读一次，复制四遍！','班里怎么有四张嘴？','这音量吵醒了校长！','四本书同声朗读'),
 row('X07','时空校园','vanishing-period','抓住课表最后一栏撕开','最后一节课变一张考卷','对手高兴后愣住','r102_school_bell','r102_paper_flap','最后一节课消失啦！','怎么还剩一张试卷？','放学欢呼得太早啦！','课表变试卷'),
 row('X08','时空校园','time-guard','校门保安举起迟到登记簿','迟到登记簿变成回卷门','对手被送回昨日队伍','r102_stamp_pop','r102_school_bell','迟到了？送你回昨天！','老师，我昨天已经请假了！','保安管到时空啦！','保安登记簿回放')
];
const ids=I.map(s=>s.id);
const playable=CARDS.filter(c=>c.kind==='spell');
if(playable.length!==46||ids.length!==46||new Set(ids).size!==46||
 playable.some(c=>!ids.includes(c.id)))
 throw new Error('R169 Campus magic bible must cover exactly 46 authoritative spell IDs');
for(const s of I){
 if(s.foley.length!==2||s.lines.cast.length<6||s.lines.hit.length<6||
  !s.prop||!s.screen||!s.gesture||!s.flight||!s.impact||!s.lines.audience)
  throw new Error('Incomplete seven-layer spell identity '+s.id);
}
export const SCHOOL_MAGIC_IDENTITIES=Object.freeze(Object.fromEntries(I.map(s=>[s.id,s])));
export const SCHOOL_MAGIC_COUNT=I.length;
export const SCHOOL_MAGIC_FAMILIES=Object.freeze([...new Set(I.map(s=>s.family))]);
export function schoolSpellIdentity(id){return SCHOOL_MAGIC_IDENTITIES[id]||null}
