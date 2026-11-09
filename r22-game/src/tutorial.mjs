/**
 * Three concise ORIGINAL campus episodes, all using canonical card rules.
 * Tutorials are deterministic staging only; no made-up cards or combat state.
 */
import {BY_ID,createGame,playCard} from './core.mjs';

export const EPISODES=Object.freeze([
  Object.freeze({
    id:'campus-recruitment-01',title:'第1关 · 社团招新战',
    story:'风纪委员抢先占领走廊。两张不同风格的牌，能把一次意外变成你的反击！',
    steps:Object.freeze([
      Object.freeze({card:'E01',lane:0,title:'第一步：派出活力社员',instruction:'选择「铃声追不上」，部署到教室。',progress:'1 / 2'}),
      Object.freeze({card:'G01',lane:1,title:'第二步：制造粉笔弹射',instruction:'选择「橡皮筋建筑师」，部署到走廊。不同风格组合将命中对方前排。',progress:'2 / 2'})
    ]),
    foe:Object.freeze({card:'T01',lane:1}),
    expectedEffect:'chalk_hit',
    conclusion:'粉笔弹射成功！',
    successText:'两种风格组成了粉笔弹射，把走廊的阻挡清除了。'
  }),
  Object.freeze({
    id:'campus-broadcast-02',title:'第2关 · 广播室串台',
    story:'广播员把校内通知播错频道。正好把对手从走廊调离，为进攻打开空间。',
    steps:Object.freeze([
      Object.freeze({card:'E01',lane:0,title:'第一步：抢占教室',instruction:'选择「铃声追不上」，部署到教室。',progress:'1 / 2'}),
      Object.freeze({card:'T01',lane:1,title:'第二步：触发广播调度',instruction:'选择「迟到的播音员」，部署到走廊，让敌方前排移动到操场。',progress:'2 / 2'})
    ]),
    foe:Object.freeze({card:'G01',lane:1}),
    expectedEffect:'broadcast_move',
    conclusion:'广播串台成功！',
    successText:'走廊的敌方人物已被调往操场。重新部署改变了阻挡和进攻路线。'
  }),
  Object.freeze({
    id:'campus-poster-03',title:'第3关 · 招新海报',
    story:'社团招新海报突然贴满走廊。趁乱为前排筑起护盾，再决定下一步。',
    steps:Object.freeze([
      Object.freeze({card:'G01',lane:1,title:'第一步：在走廊建立防线',instruction:'选择「橡皮筋建筑师」，部署到走廊。',progress:'1 / 2'}),
      Object.freeze({card:'T01',lane:1,title:'第二步：海报支援',instruction:'选择「迟到的播音员」，也部署到走廊，使前排获得2点护盾。',progress:'2 / 2'})
    ]),
    foe:Object.freeze({card:'E01',lane:1}),
    expectedEffect:'poster_shield',
    conclusion:'招新海报成功！',
    successText:'走廊的己方前排得到了2点护盾。你已经掌握三种不同的连携后果。'
  })
]);
export const FIRST_EPISODE=EPISODES[0];

function extractCard(game,side,id) {
  for(const bucket of [game.hand[side],game.deck[side]]) {
    const index=bucket.indexOf(id);
    if(index>=0){bucket.splice(index,1);return id;}
  }
  throw new Error('Tutorial deck missing required card '+id);
}
function episodeOf(game){
  const id=game.tutorial?.id;
  return EPISODES.find(episode=>episode.id===id)||null;
}

/** Get one of the three tutorial chapters (1-based). */
export function createGuidedEpisode(level=1,seed=20261108) {
  if(!Number.isInteger(level)||level<1||level>EPISODES.length)
    throw new Error('Invalid tutorial episode');
  const episode=EPISODES[level-1];
  const game=createGame(seed);
  const cards=episode.steps.map(step=>extractCard(game,'player',step.card));
  game.hand.player.unshift(...cards);
  const foe=extractCard(game,'ai',episode.foe.card);
  const stats=BY_ID[foe];
  game.board.ai[episode.foe.lane].push({
    uid:'TUTORIAL-FOE-'+level,id:foe,style:stats.style,
    attack:stats.attack,hp:stats.hp,buff:0,shield:0,summonedAt:0
  });
  game.energy.player=2;
  game.tutorial={id:episode.id,level,stage:0,completed:false};
  return game;
}
export function createRecruitmentTutorial(seed=20261108){
  return createGuidedEpisode(1,seed);
}
export function tutorialStep(game){
  if(!game.tutorial||game.tutorial.completed)return null;
  return episodeOf(game)?.steps[game.tutorial.stage]||null;
}
export function tutorialStatus(game){
  const episode=episodeOf(game);
  if(!episode)return null;
  const step=tutorialStep(game);
  return step?{...step,completed:false,stage:game.tutorial.stage,level:game.tutorial.level}:{
    title:episode.conclusion,instruction:episode.successText+' 可以继续自由出牌，或结束回合。',
    completed:true,stage:2,level:game.tutorial.level,progress:'完成'
  };
}
export function playTutorialCard(game,index,lane){
  const step=tutorialStep(game);
  if(!step)return playCard(game,index,lane);
  const id=game.hand[game.active]?.[index];
  if(id!==step.card||lane!==step.lane)
    return {ok:false,reason:'本关教学：请将「'+BY_ID[step.card].name+'」部署到'+['教室','走廊','操场'][step.lane]+'。'};
  const result=playCard(game,index,lane);
  if(!result.ok)return result;
  game.tutorial.stage+=1;
  const episode=episodeOf(game);
  if(game.tutorial.stage===episode.steps.length){
    const effect=game.events.findLast(event=>event.type==='combo_effect');
    if(!effect||effect.effect!==episode.expectedEffect||effect.lane!==step.lane)
      throw new Error('Tutorial invariant: expected actual '+episode.expectedEffect+' on lane '+step.lane);
    game.tutorial.completed=true;
  }
  return result;
}
