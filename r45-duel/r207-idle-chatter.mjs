/** R207 — rare, character-specific recorded idle barks.
 * Personality dialogue is presentation-only. Never sends messages to engine.mjs.
 * The same text is used to synthesize, validate and caption original Qwen clips.
 */
export const R207_IDLE_LINES=Object.freeze({
 HOST_PLAYER:['喂，对面那位，你的牌怎么一股食堂味儿？','等一下，我不是紧张，我是在等一个很帅的出场。'],
 HOST_AI:['我只是战略性发呆，别催。','这张牌再不争气，我申请换个同桌。'],
 E01:['铃还没响呢，我先喘口气。','谁把秒针调成冲刺模式了？'],
 E02:['别折我机翼，今天飞行证刚办好。','我绕一圈回来，作业就算交了吗？'],
 E03:['都精神点！连板凳都在给咱们加油！','刚才那叫热身，真正的口号还没喊呢！'],
 E04:['我跑得快，是怕食堂的排骨卖完！','接力棒哪儿去了？谁给我一根法棍？'],
 G01:['我再拉一下，应该不会弹到校长吧？','这不是歪，是建筑学里的情绪曲线。'],
 G02:['黑板上那行字，不是作业，是我的密码。','别擦！那是我算了三节课的结果！'],
 G03:['实验报告我写好了，实验对象还在逃跑。','别碰这个瓶子，碰了今天就提前放学。'],
 G04:['请不要打断，混乱也需要排日程。','我的计划只有一个漏洞：你们全不按计划来。'],
 M01:['一二三四……谁把第四拍偷吃了？','你们先别打，我的指挥棒还没找到节奏。'],
 M02:['今天的隐藏菜单叫：少废话，多吃饭！','谁在这里扔香蕉？我还没批准这道菜！'],
 T01:['咕？我不是熬夜，我是夜班班长！','我要声明，猫头鹰也有早八恐惧。'],
 T02:['本菜单郑重声明，茄子炒香蕉不是我写的！','别翻我！今天的招牌菜还没决定要不要逃跑。'],
 T03:['有你一封急件……哎呀，寄给隔壁班了。','收到请回复，尤其是欠我橡皮的那位。'],
 T04:['活动室门口禁止追逐，魔法可以慢点飞吗？','今天值班第一条，谁的板擦飞出去谁捡。']
});

function randomFromSeed(seed){
 let x=(Number(seed)>>>0)||0x9e3779b9;
 return ()=>{
  x^=x<<13;x^=x>>>17;x^=x<<5;
  return (x>>>0)/4294967296;
 };
}
export function createR207IdleChatter(seed,{quick=false}={}){
 const random=randomFromSeed(seed^0x207),spoken=[],lastByActor=new Map();
 const initial=quick?2600:14000,quietGap=quick?1500:8500,interval=quick?3500:26000;
 let nextAt=null,lastActionAt=0,lastSerial=null,attempts=0,accepted=0,suppressed=0;
 function propose(now,actorIds,serial,{quiet=false}={}){
  if(!Number.isFinite(now)||!Array.isArray(actorIds))return null;
  if(nextAt===null){nextAt=now+initial+random()*(quick?900:10000);lastActionAt=now}
  if(serial!==lastSerial){
   lastSerial=serial;lastActionAt=now;
   nextAt=Math.max(nextAt,now+quietGap);
  }
  if(quiet||now<nextAt||now-lastActionAt<quietGap){if(quiet)suppressed++;return null}
  const unique=[...new Set(actorIds)].filter(id=>R207_IDLE_LINES[id]?.length);
  // Refrain from monopolizing the mic: exclude the last two speakers, then
  // prefer someone who has not spoken recently.
  let eligible=unique.filter(id=>!spoken.slice(-2).includes(id)&&
    now-(lastByActor.get(id)||-Infinity)>(quick?3500:50000));
  if(!eligible.length)eligible=unique.filter(id=>id!==spoken.at(-1));
  if(!eligible.length)eligible=unique;
  if(!eligible.length)return null;
  attempts++;
  const id=eligible[Math.floor(random()*eligible.length)];
  return {id,kind:'idle'};
 }
 function settle(proposal,now,didStart){
  if(!proposal||!Number.isFinite(now))return;
  if(didStart){
   accepted++;spoken.push(proposal.id);if(spoken.length>24)spoken.shift();
   lastByActor.set(proposal.id,now);
   nextAt=now+interval+random()*(quick?1800:16000);
  }else{suppressed++;nextAt=now+(quick?1400:4000)}
 }
 function inspect(){return{
  attempts,accepted,suppressed,lastSpokenActors:spoken.slice(-8),
  lastActionAt,nextAt,lastSerial,quick,registeredCharacters:Object.keys(R207_IDLE_LINES).length
 }}
 return{propose,settle,inspect};
}
