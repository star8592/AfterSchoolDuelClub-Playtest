/**
 * R102 schoolyard ensemble comedy dialogue (TEXT-ONLY asides).
 * Spoken voice subtitles are presented separately and must match the actual
 * Qwen3-TTS manifest clip, never pretend these captions are synthetic speech.
 *
 * Lines here react only to the CANONICAL already-committed engine events.
 * We never describe nonexistent target deaths, phantom shields or fake draws.
 */
import {BY_ID} from './engine.mjs';
export const COMIC_ASIDE_LINES=Object.freeze({
 E01:['铃声：我只是响一下，你别跑啊！','迟到的速度不是问题，问题是体育馆有多远。','最后一个冲进来的，居然先把牌拍上了。','他说是路过，校门口的监控不这么想。'],
 E02:['纸飞机的飞行计划：有去无回。','导航显示：已偏航三圈。','这不是迟到的纸条，这是长途运输。','纸飞机申请了半天航线许可。'],
 E03:['队长喊了一声，隔壁的运动会提前开始。','这嗓门，不用扩音器也能开大会。','加油声太响，对手以为是裁判宣判。','比速度更快的是队长的口号。'],
 E04:['食堂排队也要接力，这是校园速度之王。','最后一棒跑去抢到了最后一份红烧肉。','接力棒呢？被当成筷子拿走了。','她的加速区从食堂门口开始。'],
 G01:['橡皮筋弯了一下，整个教室开始自我保护。','别笑，今天的建筑材料就这一根。','科学课上没教这个，校工师傅也愣住了。','大家都说它弹得太离谱，建筑师说刚刚好。'],
 G02:['密码破解成功：答案居然写在黑板背面。','他擦掉了错误答案，错误答案先认输了。','只要写成公式，迟到也像学术研究。','黑板上七个步骤，最后写着：快跑。'],
 G03:['实验室红按钮：今天请勿按，尤其是我。','这个实验没有失败，只是结果跑反了。','科学家沉默了三秒，纸飞机鼓起了掌。','实验报告第一行：千万别让老师看到。'],
 G04:['社团计划的第九页：如果出事，立刻开会。','所有人都听懂了计划，除了计划本人。','执行方案很周密，问题是没有写怎么放学。','她打开表格，操场上的风都被登记了。'],
 T01:['今日广播：比赛开始了！其实已经打了一半。','信号接通！哦，接到了食堂广播。','主持人还没找到话筒，话筒先宣布加时。','播音员请注意，你把天气预报念成了战报。'],
 T02:['今日隐藏套餐：打赢不用排队。','菜单自己翻页，厨师长说没学过这道菜。','点餐请排队，抽牌也请排队。','本周新品：一份人气，两份运气。'],
 T03:['收发室来信：请把对手退回原班级。','快递单写着：送往中央竞技场。','这个包裹很轻，里面装的全是战术。','签收人是谁？全场五个人一起举手。'],
 T04:['活动室门禁升级：连钥匙也要排队。','保安说不能打架，然后帮忙摆好了牌桌。','这扇门能挡住所有人，除了食堂阿姨。','守门人没动，但门先害怕了。'],
 M01:['音乐老师定下节拍，连黑板擦都跟着跳。','一二三四，迟到算不算切分音？','今天的练习曲：体育馆交响曲。','五线谱上出现了橡皮筋，老师沉思良久。'],
 M02:['食堂阿姨来了：谁打架，先来吃饭！','锅铲不是武器，是食堂最后的尊严。','这一勺饭加上去，所有人都有力气。','阿姨说要公平：两边都不许插队。'],
 E05:['呐喊音量超标，隔壁班也跟着加速。','体育老师正在调查这阵神秘风声。','这声加油一路穿过三层走廊。','同学们：我们只是想说一句加油啊。'],
 E06:['黑板擦宣布独立飞行，老师完全不知情。','教室清洁工具开始挑战空气动力学。','黑板上的知识飞过来了，是真的飞。','这一下很响，但清洁值依然为零。'],
 G05:['课桌抢救成功！学生会要求出具维修单。','坏掉的是桌角，修好的是同学的心态。','修桌子的速度比写检讨快得多。','桌腿：这次我绝对不会再投降。'],
 G06:['计划翻到第二页，第一条写着别看第一页。','第二页比第一页还神秘，校长看了一下午。','下一步计划：先看下一步计划。','多一张牌，就多一次临时改变计划的理由。'],
 T05:['暖心加餐来了！今天不用靠吼解决问题。','食堂这碗汤，把战场煮成了晚饭时间。','加餐不排队，但请先把牌放好。','谁说食堂不能改变战局？'],
 T06:['放学广播响了两遍，两个班走了三个方向。','通知：原定放学时间改为继续打牌。','主持人读错一个字，全校重新排了一遍队。','这条广播来自食堂，是不是有点奇怪？'],
 chalk_hit:['粉笔飞行执照？没有，老师也来不及查！','这粉笔不是飞出去的，是教室送去比赛的。','粉笔落点已确认，板书从此更有力量。','校工师傅说这东西不能报修，得报案。','黑板还在等粉笔回来。'],
 chalk_direct:['对手还没站稳，粉笔已经找到校门了。','没有人挡路，粉笔直接冲向对方人气。','这一击不用找角色，目标就是人气。','裁判提醒：这是直击人气，不是召唤物退场。'],
 broadcast_draw:['本台消息：意外多一张牌，主持人也没料到。','广播室串台了！战术部申请追加一张。','赛场通知：补抽一张，播音员也要签字。','话筒正在走神，牌库倒是很守纪律。','这条广播没有换战线，只带来一张新牌。'],
 poster_shield:['招新海报贴得真结实，连攻击都得排队。','保护罩盖好了，宣传部比保安还可靠。','社团招新：报名先送真实护盾两点。','海报一展开，大家都想加入这个社团。'],
 poster_draw:['没有人需要护盾？宣传部改送一张牌。','海报没有找到队员，只好把纸当卡片寄出去。','招新启事：没有护盾目标，就补抽一张。','今天的社团福利不是护盾，是新手牌。'],
 buff:['队长喊加油，真正加上的还是规则里的数值。','超速口号不卖饮料，只给战术加速。','这声加油，不是全场自动赢。','口号响了，轮到下一位出牌的同学。'],
 blast:['飞来的黑板擦请注意：飞行路线不受控。','老师正在找黑板擦，黑板擦已经有新工作了。','这是正版教具，但使用方法显然有问题。','黑板擦说：这一回真的不是我的错。'],
 repair:['桌角修好，还额外有个小小的奇迹。','修理班来了，工单还在路上。','加固完成！家具开始反向感谢学生。','谁说学校维修只能等下周一。'],
 draw:['翻开第二页，剧情居然变得更复杂。','计划写得太满，只好抽两张重新考虑。','有人认真做计划，有人拿计划当道具。','翻页以后，战术突然有了新的选择。'],
 heal:['暖心加餐出场，汤温刚刚好。','先喝口汤，再考虑谁来当社长。','这碗汤有名字：少吵架，多吃饭。','食堂最厉害的不是锅铲，是热乎饭。'],
 confuse:['广播里放的是天气预报，结果下起了黑板擦。','校内广播接错线路，战术也得重新接线。','同学们注意，本通知已经过期三分钟。','看来广播室的信号比纸飞机还调皮。']
});
export const COMIC_REPLY_LINES=Object.freeze({
 player:['这回是我先出牌！','等一下，这个战术我想好了。','有点离谱，但我觉得能赢。','社长不在，就由我来主持。','别眨眼，我还没出完牌。'],
 ai:['很有创意，不过我也有一套。','你这招，我要记进社团档案。','我已经把下个回合写进计划。','你确定体育馆允许这么玩吗？','先别庆祝，轮到我了。'],
 victory:['赢了！班主任刚好没看见。','这就是社团经费的正确用法。','体育馆今天终于安静了……两秒钟。'],
 defeat:['今天输了，明天放学再来。','社长写了检讨，原因是太好玩。','没关系，校园的故事还没结束。'],
 draw:['双方打平，裁判宣布去食堂吃饭。','谁也没赢，但广播员赢得了麦克风。','这场平局，值得一张新海报。']
});
function hash(value){
 let h=2166136261;
 for(const c of value){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 return h>>>0;
}
export function makeComedyScript(seed=1){
 const lastTwo=new Map(),history=[];
 function choose(key,serial=1,side='player'){
  const set=COMIC_ASIDE_LINES[key]||COMIC_REPLY_LINES[key];
  if(!set?.length)return null;
  const topic=key+':'+side;
  const recent=lastTwo.get(topic)||[];
  const offset=hash(topic+':'+String(seed)+':'+String(serial));
  const start=offset%set.length;
  let index=start;
  for(let i=0;i<set.length;i++)if(!recent.includes((start+i)%set.length)){index=(start+i)%set.length;break}
  recent.push(index);
  lastTwo.set(topic,recent.slice(-2));
  const text=set[index];
  const item={key,serial,side,text,index,spoken:false};
  history.push(item);if(history.length>85)history.shift();
  return item;
 }
 function forCard(cardId,serial,side){
  if(!BY_ID[cardId])return null;
  return choose(cardId,serial,side);
 }
 function forCombo(event){
  if(!event||!['player','ai'].includes(event.side)||!Number.isInteger(event.serial))return null;
  if(!['chalk_hit','chalk_direct','broadcast_draw','poster_shield','poster_draw'].includes(event.effect))return null;
  return choose(event.effect,event.serial,event.side);
 }
 function forSpell(cardId,serial,side){
  const c=BY_ID[cardId];
  if(c?.kind!=='spell')return null;
  return choose(c.effect,serial,side);
 }
 function reply(side,serial){return choose(side,serial,side)}
 function outcome(winner,serial){
  return choose(winner==='player'?'victory':winner==='ai'?'defeat':'draw',serial,'center');
 }
 return{choose,forCard,forCombo,forSpell,reply,outcome,get history(){return [...history]}};
}
