/**
 * R45 Clean Room — single-arena deterministic 19-card core.
 * Pure module: no browser, network, user identifiers, or storage.
 */
export const STYLES = Object.freeze(['ember', 'grove', 'tide']);
export const COUNTER = Object.freeze({ember: 'grove', grove: 'tide', tide: 'ember'});
// ONE arena only. No legacy 3-lane feature or three-scene mode exists.
export const LANES = Object.freeze(['中央竞技场']);
export const MAX_FIELD_UNITS=5;
export const MAX_HP = 20;
export const MAX_TURNS = 12;
export const CARDS = Object.freeze([
  {id:'E01',style:'ember',kind:'unit',cost:1,attack:1,hp:2,name:'铃声追不上',line:'迟到是铃声跑得太快。'},
  {id:'E02',style:'ember',kind:'unit',cost:2,attack:2,hp:2,name:'拐弯纸飞机',line:'本来送纸条，结果绕操场三圈。'},
  {id:'E03',style:'ember',kind:'unit',cost:3,attack:3,hp:3,name:'加油过头的队长',line:'她喊加油，隔壁班以为放暑假。'},
  {id:'E04',style:'ember',kind:'unit',cost:5,attack:5,hp:4,name:'食堂接力冠军',line:'最后一棒跑去打饭。'},
  {id:'G01',style:'grove',kind:'unit',cost:1,attack:1,hp:3,name:'橡皮筋建筑师',line:'一根橡皮筋撑起半间教室。'},
  {id:'G02',style:'grove',kind:'unit',cost:2,attack:2,hp:3,name:'黑板密码专家',line:'答案原来就写在黑板上。'},
  {id:'G03',style:'grove',kind:'unit',cost:3,attack:2,hp:5,name:'反向实验学长',line:'按下红钮，蓝钮先自己按了。'},
  {id:'G04',style:'grove',kind:'unit',cost:5,attack:4,hp:5,name:'社团计划总监',line:'连校长都看不懂计划表。'},
  {id:'M01',style:'tide',kind:'unit',cost:3,attack:2,hp:5,name:'音乐老师',line:'一二三，跟着节奏一起出牌！'},
  {id:'T01',style:'tide',kind:'unit',cost:1,attack:1,hp:2,name:'迟到的播音员',line:'赛后宣布：比赛马上开始。'},
  {id:'T02',style:'tide',kind:'unit',cost:2,attack:2,hp:3,name:'食堂隐藏菜单',line:'今天的套餐叫胜利。'},
  {id:'T03',style:'tide',kind:'unit',cost:3,attack:3,hp:3,name:'默契收发员',line:'把吵架变成排队。'},
  {id:'T04',style:'tide',kind:'unit',cost:5,attack:4,hp:6,name:'活动室守门人',line:'门锁都不知道自己锁了谁。'},
  {id:'E05',style:'ember',kind:'spell',cost:1,effect:'buff',name:'超速呐喊',line:'声音撞墙后，队友反而更快。'},
  {id:'E06',style:'ember',kind:'spell',cost:3,effect:'blast',name:'飞来的巨大黑板擦',line:'老师没扔，黑板擦自己飞走了。'},
  {id:'G05',style:'grove',kind:'spell',cost:1,effect:'repair',name:'课桌紧急修补',line:'桌子变得比原来还结实。'},
  {id:'G06',style:'grove',kind:'spell',cost:2,effect:'draw',name:'翻到第二页的方案',line:'被涂掉的计划居然更好用。'},
  {id:'T05',style:'tide',kind:'spell',cost:1,effect:'heal',name:'食堂暖心加餐',line:'一碗汤可以解决社团矛盾。'},
  {id:'T06',style:'tide',kind:'spell',cost:3,effect:'confuse',name:'误播的放学广播',line:'一半人回家，一半继续比赛。'}
]);
export const BY_ID = Object.freeze(Object.fromEntries(CARDS.map(c => [c.id,Object.freeze(c)])));
function rand(g) {let x=g.rng|0;x^=x<<13;x^=x>>>17;x^=x<<5;g.rng=x>>>0;return g.rng/4294967296;}
function shuffle(g,arr) {for(let i=arr.length-1;i>0;i--){const j=Math.floor(rand(g)*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
function draw(g,side,n=1) {for(let k=0;k<n;k++){if(g.hand[side].length>=8)break;if(!g.deck[side].length){if(!g.discard[side].length)break;g.deck[side]=shuffle(g,g.discard[side].splice(0));}g.hand[side].push(g.deck[side].pop());}}
function event(g,type,data={}){g.serial++;g.events.push({serial:g.serial,type,side:g.active,...data});if(g.events.length>160)g.events.shift();}
export const opponent = side => side==='player'?'ai':'player';
export function createGame(seed=20261108) {
  if(!Number.isFinite(seed))throw new Error('Invalid seed');
  const g={version:'r45-clean-1.0',seed:seed>>>0,rng:(seed>>>0)||0xA11CE,serial:0,active:'player',phase:'playing',
    winner:null,round:1,turns:{player:1,ai:0},hp:{player:MAX_HP,ai:MAX_HP},
    energy:{player:2,ai:0},deck:{player:[],ai:[]},hand:{player:[],ai:[]},discard:{player:[],ai:[]},
    board:{player:[[]],ai:[[]]},stylesPlayed:{player:[],ai:[]},
    comboTriggered:{player:false,ai:false},comboSerial:0,comboCounts:{player:0,ai:0},events:[]};
  for(const side of ['player','ai']){g.deck[side]=shuffle(g,CARDS.flatMap(c=>[c.id,c.id]));draw(g,side,5);}
  event(g,'start',{seed:g.seed});return g;
}
export function legalMoves(g) {
  if(g.phase!=='playing')return [];
  const side=g.active,moves=[];
  g.hand[side].forEach((id,index)=>{
    const c=BY_ID[id];if(c.cost>g.energy[side])return;
    for(let lane=0;lane<LANES.length;lane++){if(c.kind==='unit'&&g.board[side][lane].length>=MAX_FIELD_UNITS)continue;moves.push({index,lane,id});}
  });
  return moves;
}
// All combat and event damage uses the same two-stage shield resolution.
function hitUnit(unit, amount) {
  const shieldBefore=unit.shield||0;
  const blocked=Math.min(shieldBefore,amount);
  unit.shield=shieldBefore-blocked;
  const applied=amount-blocked;
  unit.hp=Math.max(0,unit.hp-applied);
  return {applied,blocked};
}
function applyComboEffect(g,side,lane,styles) {
  const other=opponent(side);
  const pair=[...styles].sort().join(',');
  if(pair==='ember,grove'){
    const front=g.board[other][lane][0];
    if(front){
      const hit=hitUnit(front,2);
      g.board[other][lane]=g.board[other][lane].filter(unit=>unit.hp>0);
      event(g,'combo_effect',{lane,effect:'chalk_hit',target:front.uid,card:front.id,damage:hit.applied,blocked:hit.blocked,defeated:front.hp<=0,hp_after:front.hp,shield_after:front.shield});
    } else {
      g.hp[other]=Math.max(0,g.hp[other]-1);
      event(g,'combo_effect',{lane,effect:'chalk_direct',damage:1});
    }
  } else if(pair==='ember,tide'){
    // No fictional "other battlefield" in the single central arena.
    // Preserve the established combo refund and fallback card draw.
    draw(g,side,1);
    event(g,'combo_effect',{lane,effect:'broadcast_draw',draw:1});
  } else if(pair==='grove,tide'){
    const ally=g.board[side][lane][0];
    if(ally){
      ally.shield=(ally.shield||0)+2;
      event(g,'combo_effect',{lane,effect:'poster_shield',target:ally.uid,card:ally.id,shield:2});
    } else {
      draw(g,side,1);
      event(g,'combo_effect',{lane,effect:'poster_draw',draw:1});
    }
  } else {
    throw new Error('Unknown combo style pair');
  }
}
function settle(g) {
  if(g.phase!=='playing'||(g.hp.player>0&&g.hp.ai>0))return;
  g.phase='ended';g.winner=g.hp.player<=0&&g.hp.ai<=0?'draw':g.hp.player<=0?'ai':'player';
  event(g,'game_end',{winner:g.winner,reason:'hp'});
}
export function playCard(g,index,lane) {
  const side=g.active,other=opponent(side);
  if(g.phase!=='playing')return {ok:false,reason:'game ended'};
  if(!Number.isInteger(index)||index<0||index>=g.hand[side].length)return {ok:false,reason:'invalid index'};
  if(!Number.isInteger(lane)||lane!==0)return {ok:false,reason:'single arena only'};
  const id=g.hand[side][index],c=BY_ID[id];
  if(c.cost>g.energy[side])return {ok:false,reason:'insufficient energy'};
  if(c.kind==='unit'&&g.board[side][lane].length>=MAX_FIELD_UNITS)return {ok:false,reason:'arena full'};
  g.hand[side].splice(index,1);g.energy[side]-=c.cost;
  if(c.kind==='unit') {
    g.board[side][lane].push({uid:'U'+(g.serial+1),id,style:c.style,attack:c.attack,hp:c.hp,buff:0,shield:0,summonedAt:g.turns[side]});
  } else {
    g.discard[side].push(id);
    const ally=g.board[side][lane],enemy=g.board[other][lane];
    switch(c.effect) {
      case 'buff': if(ally.length)ally[0].buff+=2;break;
      case 'blast':g.hp[other]=Math.max(0,g.hp[other]-3);break;
      case 'repair':for(const u of ally)u.hp+=2;break;
      case 'draw':draw(g,side,2);break;
      case 'heal':g.hp[side]=Math.min(MAX_HP,g.hp[side]+3);break;
      case 'confuse':for(const u of enemy)hitUnit(u,2);g.board[other][lane]=enemy.filter(u=>u.hp>0);break;
      default:throw new Error('Unknown effect');
    }
  }
  event(g,'card_play',{card:id,lane});
  if(!g.stylesPlayed[side].includes(c.style))g.stylesPlayed[side].push(c.style);
  if(!g.comboTriggered[side]&&g.stylesPlayed[side].length>=2){
    g.comboTriggered[side]=true;g.comboSerial++;g.comboCounts[side]++;
    g.energy[side]=Math.min(9,g.energy[side]+1);
    event(g,'combo',{comboSerial:g.comboSerial,styles:g.stylesPlayed[side].slice(0,2),refund:1,lane});
    applyComboEffect(g,side,lane,g.stylesPlayed[side].slice(0,2));
  }
  settle(g);return {ok:true,card:id,lane};
}
function limitResult(g) {
  g.phase='ended';g.winner=g.hp.player===g.hp.ai?'draw':g.hp.player>g.hp.ai?'player':'ai';
  event(g,'game_end',{winner:g.winner,reason:'turn_limit'});
}
export function endTurn(g) {
  if(g.phase!=='playing')return {ok:false,reason:'game ended'};
  const side=g.active,other=opponent(side);
  for(let lane=0;lane<LANES.length&&g.phase==='playing';lane++){
    for(const atk of g.board[side][lane].slice()){
      if(g.phase==='ended')break;
      if(!g.board[side][lane].some(u=>u.uid===atk.uid)||g.turns[side]<=atk.summonedAt)continue;
      const target=g.board[other][lane][0];
      if(target){
        const dmg=atk.attack+atk.buff+(COUNTER[atk.style]===target.style?1:0);
        const reply=target.attack+(COUNTER[target.style]===atk.style?1:0);
        const dealt=hitUnit(target,dmg),retaliation=hitUnit(atk,reply);
        event(g,'exchange',{lane,from:atk.id,to:target.id,damage:dealt.applied,blocked:dealt.blocked,retaliation:retaliation.applied,retaliation_blocked:retaliation.blocked,target_uid:target.uid,attacker_uid:atk.uid,target_defeated:target.hp<=0,attacker_defeated:atk.hp<=0,target_hp_after:target.hp,attacker_hp_after:atk.hp});
      } else {
        const dmg=atk.attack+atk.buff;g.hp[other]=Math.max(0,g.hp[other]-dmg);
        event(g,'direct_hit',{lane,from:atk.id,attacker_uid:atk.uid,damage:dmg});
      }
      atk.buff=0;
      g.board[side][lane]=g.board[side][lane].filter(u=>u.hp>0);
      g.board[other][lane]=g.board[other][lane].filter(u=>u.hp>0);
      settle(g);
    }
  }
  if(g.phase==='ended')return {ok:true,ended:true};
  if(side==='ai'&&g.turns.ai>=MAX_TURNS){limitResult(g);return {ok:true,ended:true};}
  g.active=other;if(other==='player')g.round++;
  g.turns[other]++;g.energy[other]=Math.min(9,g.turns[other]+1);
  g.stylesPlayed[other]=[];g.comboTriggered[other]=false;draw(g,other,1);
  event(g,'turn_start',{round:g.round});return {ok:true,ended:false};
}
/**
 * Deterministic tactical value of completing a style combo in a given lane.
 * Evaluation is only used to choose AI actions; the real state transition
 * is still exclusively playCard -> applyComboEffect.
 */
export function comboOpportunityScore(g,side,style,lane,kind='unit') {
  if(g.phase!=='playing'||g.comboTriggered[side])return 0;
  const played=g.stylesPlayed[side];
  if(played.length!==1||played.includes(style))return 0;
  if(!Number.isInteger(lane)||lane!==0)return 0;
  const pair=[played[0],style].sort().join(',');
  const foe=opponent(side);
  const front=g.board[foe][lane][0];
  const ally=g.board[side][lane][0];
  const energyRefund=2.5;
  if(pair==='ember,grove'){
    if(!front)return energyRefund+1.4;
    const damage=Math.min(front.hp,Math.max(0,2-(front.shield||0)));
    return energyRefund+1.5+damage*1.1+(damage>=front.hp?1.0:0);
  }
  if(pair==='ember,tide'){
    // Same central arena for every effect: this combo now always draws a card.
    return energyRefund+1.7+(g.hand[side].length<4?0.7:0);
  }
  if(pair==='grove,tide'){
    // A newly played unit also becomes shield-eligible.
    if(ally||kind==='unit')
      return energyRefund+1.1+(g.board[foe][lane].length?1.6:0.4);
    return energyRefund+1.2; // fallback draw
  }
  return 0;
}
export function aiTurn(g) {
  if(g.phase!=='playing'||g.active!=='ai')return {ok:false,reason:'not AI turn'};
  let plays=0;
  while(plays<7&&g.phase==='playing'){
    const moves=legalMoves(g);if(!moves.length)break;
    const rated=moves.map(m=>{
      const c=BY_ID[m.id],allies=g.board.ai[m.lane],enemies=g.board.player[m.lane];
      let score=c.kind==='unit'?5+c.attack*.7+enemies.length*.9-allies.length*.6:
        c.effect==='blast'?7:c.effect==='draw'?(g.hand.ai.length<5?7:1):
        c.effect==='confuse'?(enemies.length?6+enemies.length:0):
        c.effect==='heal'?(g.hp.ai<14?6:1):allies.length?5:0;
      score+=comboOpportunityScore(g,'ai',c.style,m.lane,c.kind);
      return {m,score:score-c.cost*.13};
    }).sort((a,b)=>b.score-a.score||a.m.index-b.m.index||a.m.lane-b.m.lane);
    if(rated[0].score<.5)break;
    const result=playCard(g,rated[0].m.index,rated[0].m.lane);
    if(!result.ok)break;plays++;
  }
  if(g.phase==='playing')endTurn(g);
  return {ok:true,plays};
}
export function simulate(seed=1,strategy='first') {
  const g=createGame(seed);let guard=0;
  while(g.phase==='playing'&&guard++<200){
    if(g.active==='ai'){aiTurn(g);continue;}
    for(let i=0;i<7&&g.phase==='playing';i++){
      const m=legalMoves(g);if(!m.length)break;
      const next=strategy==='last'?m[m.length-1]:m[0];
      playCard(g,next.index,next.lane);
    }
    if(g.phase==='playing')endTurn(g);
  }
  if(g.phase!=='ended')throw new Error('Simulation did not finish');
  return g;
}
