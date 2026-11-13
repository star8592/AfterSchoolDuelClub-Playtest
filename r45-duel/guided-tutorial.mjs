/** R120 · Three-round narrated practice. All turns/cards/combat use engine.mjs.
 * This is a deliberately shortened teaching match: 20 player HP, 6 AI HP.
 * Normal free duels still start 20:20. Not a video or fake HP animation.
 */
import {BY_ID,createGame,playCard,endTurn} from './engine.mjs';
export const GUIDED_LINES=Object.freeze({
 intro_f:{side:'player',text:'欢迎加入放学后决斗社！正式比赛双方各有二十点人气，谁先把对面打到零，谁就赢。为了快速学会，我们把陪练的人气设为六点。'},
 intro_m:{side:'ai',text:'我来当你的陪练！你出牌，我回应。你看见的每次攻击、扣血、反击，都是真实规则。'},
 prompt_one:{side:'player',text:'第一回合，你有两点能量。选中铃声追不上，再点击金色出牌。'},
 played_one:{side:'player',text:'我召唤了铃声追不上！刚上场的伙伴先待命，下次轮到我才能攻击。'},
 prompt_end_one:{side:'player',text:'这回合先点击结束回合。别着急，刚召唤的角色还不能立刻攻击。'},
 ai_one:{side:'ai',text:'轮到我！我打出橡皮筋建筑师，花掉一点能量。和你一样，我刚召唤的角色也先待命。'},
 round_two:{side:'player',text:'第二回合开始！能量增加了。现在选飞来的巨大黑板擦，这是一张事件牌，发动后立刻扣对手三点人气。'},
 played_two:{side:'player',text:'你看！黑板擦一飞出去，陪练的人气从六点变成三点。事件牌可以马上生效，不用等到下回合。'},
 prompt_end_two:{side:'player',text:'现在结束回合！上一回合召唤的人物终于能攻击了。对面有人守着，就先攻击对面的人物。'},
 exchange_m:{side:'ai',text:'接招！人物碰面会互相造成伤害。你看，攻击不是只打一边，防守方也会反击！'},
 ai_two:{side:'ai',text:'我再召唤一位迟到的播音员。现在双方都有过攻防，真正决定输赢的还是上方的人气值。'},
 round_three:{side:'player',text:'第三回合了！对面只剩三点人气。再选一张巨大黑板擦，用三点能量，直接结束比赛！'},
 victory_f:{side:'player',text:'赢啦！对手人气归零！正式比赛双方都从二十点开始，你已经学会了选牌、召唤、结束回合、攻防和事件牌。'},
 victory_m:{side:'ai',text:'厉害！你已经会玩了。接下来去正式对战，试试三种风格连携和更多搞笑卡牌吧！'}
});
export const GUIDED_STEPS=Object.freeze([
 Object.freeze({key:'summon',round:1,target:'E01',verb:'出牌',hint:'选中「铃声追不上」，再点击金色「出牌」按钮。'}),
 Object.freeze({key:'end1',round:1,target:null,verb:'结束回合',hint:'刚上场的角色待命。点击「结束回合」，看看对手怎么回应。'}),
 Object.freeze({key:'spell1',round:2,target:'E06',verb:'出牌',hint:'选中「飞来的巨大黑板擦」，扣对手 3 点人气。'}),
 Object.freeze({key:'end2',round:2,target:null,verb:'结束回合',hint:'点击「结束回合」，观察人物自动攻击和反击。'}),
 Object.freeze({key:'spell2',round:3,target:'E06',verb:'出牌',hint:'再出一张「飞来的巨大黑板擦」，把对方剩余人气打到 0。'}),
 Object.freeze({key:'won',round:3,target:null,verb:'完成',hint:'真实规则判定胜利！你已经学会基本玩法。'})
]);
function takeExisting(g,side,id){
 for(const stock of [g.hand[side],g.deck[side]]){
  const pos=stock.indexOf(id);
  if(pos>=0)return stock.splice(pos,1)[0];
 }
 throw Error('Practice only uses existing physical deck card: '+id);
}
export function createGuidedGame(seed=20261113){
 const g=createGame(seed,'classic');
 g.hp.ai=6; // visibly disclosed teaching handicap, never used in free duel
 const player=['E01','E06','E06'].map(id=>takeExisting(g,'player',id));
 g.hand.player.unshift(...player);
 const ai=['G01','T01'].map(id=>takeExisting(g,'ai',id));
 g.hand.ai.unshift(...ai);
 g.guided={step:0,completed:false,shortened:true,aiStartingHp:6};
 return g;
}
export function guidedStatus(g){
 if(!g.guided)return null;
 return {...GUIDED_STEPS[g.guided.step],step:g.guided.step,completed:g.guided.completed,round:g.round};
}
export function guidedCanPlay(g,index){
 const state=guidedStatus(g);
 return !!state?.target&&g.phase==='playing'&&g.active==='player'&&
  g.hand.player[index]===state.target&&index===g.hand.player.indexOf(state.target);
}
export function guidedPlayCard(g,index,lane=0){
 if(!guidedCanPlay(g,index)||lane!==0)return {ok:false,reason:'请按旁白提示出牌'};
 const before=g.guided.step;
 const result=playCard(g,index,0);
 if(!result.ok)return result;
 g.guided.step++;
 if(before===4){
  if(g.phase!=='ended'||g.winner!=='player'||g.hp.ai!==0)
   throw Error('The guided victory must be won by authentic HP depletion');
  g.guided.completed=true;
 }
 return result;
}
export function guidedEndTurn(g){
 const state=guidedStatus(g);
 if(!state||!['end1','end2'].includes(state.key)||g.active!=='player'||g.phase!=='playing')
  return {ok:false,reason:'请按照教学步骤行动'};
 const round=state.round;
 const first=endTurn(g);
 if(!first.ok||g.phase!=='playing'||g.active!=='ai')throw Error('Practice player turn invalid');
 const opponentCard=round===1?'G01':'T01';
 const idx=g.hand.ai.indexOf(opponentCard);
 if(idx<0)throw Error('Missing actual AI card '+opponentCard);
 const played=playCard(g,idx,0);
 if(!played.ok)throw Error('Cannot play practice AI '+opponentCard+': '+played.reason);
 const second=endTurn(g);
 if(!second.ok||g.active!=='player'||g.round!==round+1)throw Error('Practice AI response invalid');
 g.guided.step++;
 return {ok:true,round,aiCard:opponentCard,playerEnd:first,aiEnd:second};
}
