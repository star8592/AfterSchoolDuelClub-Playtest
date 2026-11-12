/**
 * R107: 40 ORIGINAL campus absurdity event cards.
 * These are game rules, not claims of 40 new 3D humanoid models or VO files.
 * Five theme decks each combine existing real 3D summons with 8 new events.
 */
// R108: recent campus meme derivatives have documented evidence; original card
// text and effects remain independent works, not copies of video/audio/IP.
// Social post candidates are distinguished from corroborated news.
export const RECENT_MEMES=Object.freeze({
 K07:{date:'2026-10-19',source:'https://www.ccwb.cn/content/202610/19/c928718.html',strength:'媒体采访'},
 K08:{date:'2026-04-27',source:'https://m.thepaper.cn/newsDetail_forward_33048822',strength:'媒体实访'},
 Q02:{date:'2026-09-01',source:'https://www.toutiao.com/article/7680841272650629642/',strength:'开学季二创，传播数据待核'},
 Q04:{date:'2026-09-09',source:'https://www.douyin.com/video/7683374251287035496',strength:'原始校园短视频'},
 Q08:{date:'2026-11-10',source:'https://www.sina.cn/news/detail/5363798093332483.html',strength:'认证校园账号'},
 P01:{date:'2026-11-10',source:'https://www.sohu.com/a/1099549024_120914498',strength:'记者采访'},
 P05:{date:'2026-11-07',source:'https://video.sina.cn/finance/2026-11-07/detail-inixwxqa8248927.d.html',strength:'中国新闻社采访'},
 P07:{date:'2026-11-09',source:'https://www.sina.cn/media/2001658431',strength:'校园博主视频线索，待独立核对'}
});
const row=(id,theme,style,cost,effect,name,line,rule,power=undefined)=>Object.freeze({
 id,theme,style,cost,kind:'spell',effect,name,line,rule,
 ...(power===undefined?{}:{power}),
 ...(RECENT_MEMES[id]?{trend:RECENT_MEMES[id]}:{})
});
export const EXTRA_CARDS=Object.freeze([
 row('K01','黑暗食堂','tide',2,'stew','茄子炒香蕉','食堂阿姨宣布：这是一种主食，也是一种勇气。','己方人气 +2，对方人气 -1'),
 row('K02','黑暗食堂','grove',2,'shield','西瓜炖橡皮','西瓜负责好吃，橡皮负责弹回去。','前排护盾 +2；无前排则己方人气 +1'),
 row('K03','黑暗食堂','tide',2,'draw','玉米炒葡萄','食堂发明了新颜色：水果玉米的二次方。','抽 2 张牌'),
 row('K04','黑暗食堂','ember',3,'splash','辣椒炒月饼','中秋节剩下的月饼宣布挑战火锅。','敌方所有角色受到 1 点伤害'),
 row('K05','黑暗食堂','tide',1,'heal','校长秘制空气汤','只有汤匙是真的，其他都靠想象。','己方人气 +3'),
 row('K06','黑暗食堂','ember',4,'blast','火山辣椒奶茶','喝一口，整个操场都在喷火。','对手人气 -4',4),
 row('K07','黑暗食堂','grove',3,'chaos','蛤蟆布丁警报','新甜点看着像青蛙，叫起来却像全校警铃。','敌方全体攻击 -1'),
 row('K08','黑暗食堂','tide',3,'banquet','披甲巧克力香蕉','它披着厚厚的巧克力盔甲，誓要保护全班的甜品。','己方人气 +2；友方角色各回复 1 点'),
 row('Q01','教室怪谈','grove',1,'repair','会写检讨的橡皮','写到最后，它把自己也擦掉了。','己方所有角色生命 +2'),
 row('Q02','教室怪谈','ember',3,'chaos','神兽返校通知书','开学铃响，全班神兽被收进书包，作业自动列队。','敌方全体攻击 -1'),
 row('Q03','教室怪谈','tide',2,'insight','会做梦的黑板','梦见自己考了满分，老师没来。','抽 1 张牌；能量 +1'),
 row('Q04','教室怪谈','grove',2,'draw','全寝室公开播放','深夜语音突然外放，室友的眼神能印成八张表情包。','抽 2 张牌'),
 row('Q05','教室怪谈','ember',2,'blast','粉笔开记者会','它说粉尘不是粉尘，是奋斗的痕迹。','对手人气 -2',2),
 row('Q06','教室怪谈','grove',2,'shield','要按三次才亮的台灯','不按三次不开工：这是台灯的劳动合同。','前排护盾 +2；无前排则己方人气 +1'),
 row('Q07','教室怪谈','tide',4,'eclipse','教室里的第二个月亮','校长要求课表增加一节天文学。','敌方前排生命 -2；己方人气 +1'),
 row('Q08','教室怪谈','tide',2,'updraft','粉笔画地为牢','值日生给自己画了一个圈，谁也没想到它真的成了护盾。','己方前排攻击 +1、护盾 +1'),
 row('S01','社团实验','tide',2,'insight','时间倒流的闹钟','迟到一分钟，倒回去再迟到一次。','抽 1 张牌；能量 +1'),
 row('S02','社团实验','grove',2,'reroute','只能装一根笔的文具盒','里面的笔太孤单，自动生出两张计划书。','抽 2 张牌，己方人气 -1'),
 row('S03','社团实验','ember',2,'updraft','反重力大扫把','扫到最后，走廊飞上了天。','己方前排攻击 +1、护盾 +1'),
 row('S04','社团实验','grove',3,'splash','错误答案发电机','错得越离谱，电灯越亮。','敌方所有角色受到 1 点伤害'),
 row('S05','社团实验','tide',2,'shield','乌龙机器人班长','它把全班的姓名叫成了电器型号。','前排护盾 +2；无前排则己方人气 +1'),
 row('S06','社团实验','grove',2,'boomerang','量子橡皮筋','弹出去以后，老师先回来了。','敌方前排 -1、己方前排 +1 生命'),
 row('S07','社团实验','ember',3,'eclipse','放学铃声虫洞','响过三遍之后大家回到星期一。','敌方前排生命 -2；己方人气 +1'),
 row('S08','社团实验','ember',2,'blast','会生气的自动售货机','没投币就对饮料进行了答辩。','对手人气 -2',2),
 row('P01','体育荒诞','ember',2,'buff','狂风炸毛超人','刚出宿舍，头发已经在操场提前集合。','己方前排攻击 +2'),
 row('P02','体育荒诞','tide',2,'shield','一百年没进球的墙球赛','比赛没有结束，球还在墙角讨论人生。','前排护盾 +2；无前排则己方人气 +1'),
 row('P03','体育荒诞','ember',2,'splash','纸箱恐龙运动员','开幕式刚走过，恐龙已经踩乱了跑道。','敌方所有角色受到 1 点伤害'),
 row('P04','体育荒诞','ember',3,'chaos','体育老师超级口哨','一吹哨，全校的风向都变了。','敌方全体攻击 -1'),
 row('P05','体育荒诞','grove',3,'trick','排球误入篮筐','本来踢回排球场，结果隔壁篮筐说这分我收了。','敌方前排 -3；无前排则对方人气 -1'),
 row('P06','体育荒诞','tide',2,'boomerang','反向跑步机','人没动，操场已经绕了十圈。','敌方前排 -1、己方前排 +1 生命'),
 row('P07','体育荒诞','grove',2,'chaos','黑天鹅冰面慢动作','校宠宣布今日练习滑步，裁判给所有人减速。','敌方全体攻击 -1'),
 row('P08','体育荒诞','ember',4,'blast','运动会掉下的流星','这可能不是第一名，是第一颗。','对手人气 -4',4),
 row('X01','时空校园','tide',2,'draw','倒退一小时的校钟','倒着走一圈，想把周一退回星期天。','抽 2 张牌'),
 row('X02','时空校园','grove',2,'shield','能穿墙的校服','衣服先到教室，主人还在墙里。','前排护盾 +2；无前排则己方人气 +1'),
 row('X03','时空校园','ember',3,'blast','屋顶违停的教务车','屋顶多出一个停车位，校警无法开罚单。','对手人气 -3'),
 row('X04','时空校园','tide',2,'insight','会预言的午休枕头','它说下一节课又要提问。','抽 1 张牌；能量 +1'),
 row('X05','时空校园','grove',3,'splash','作业本宇宙大战','每一页都是平行世界的满分试卷。','敌方所有角色受到 1 点伤害'),
 row('X06','时空校园','grove',2,'repair','早读时间复制器','读一遍，听起来像读了四遍。','己方所有角色生命 +2'),
 row('X07','时空校园','tide',2,'reroute','消失的最后一节课','大家欢呼后发现多了一张试卷。','抽 2 张牌，己方人气 -1'),
 row('X08','时空校园','ember',4,'eclipse','校门口时空保安','迟到的人一律送回昨天下午。','敌方前排生命 -2；己方人气 +1')
]);
export const DECK_PRESETS=Object.freeze({
 classic:{name:'经典社团',story:'原版 20 种卡，每种 2 张。',cards:[
  'E01','E02','E03','E04','G01','G02','G03','G04',
  'M01','M02','T01','T02','T03','T04','E05','E06','G05','G06','T05','T06']},
 ...Object.fromEntries([
  ['kitchen','黑暗食堂','K'],
  ['classroom','教室怪谈','Q'],
  ['science','社团实验','S'],
  ['sports','体育荒诞','P'],
  ['cosmos','时空校园','X']
 ].map(([key,name,prefix],i)=>[key,{name,story:'12 张人物与 8 张荒诞事件各两份。',
  cards:['E01','E02','E03','E04','G01','G02','G03','G04','M01','M02','T01','T02',
    ...Array.from({length:8},(_,j)=>prefix+String(j+1).padStart(2,'0'))]}]))
});
