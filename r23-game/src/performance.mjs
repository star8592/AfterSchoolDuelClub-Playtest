/**
 * Original performance scripts for a card-game CUT-IN prototype.
 *
 * Compiles events that have ALREADY happened in the canonical engine.
 * This module cannot deal damage, summon a unit, change turns, draw cards
 * or affect victory. All consequences are copied from the source events.
 *
 * Real character frames / Qwen voice clips are not approved yet. Stage
 * presentation is marked '演出样机' until both asset tracks pass review.
 */
import {BY_ID,LANES} from './core.mjs';

export const CAST=Object.freeze({
  E01:Object.freeze({name:'铃声追不上',voice:'rush',pose:'dash',line:'放学铃一响，谁也别想追上我！'}),
  G01:Object.freeze({name:'橡皮筋建筑师',voice:'inventor',pose:'calculate',line:'角度算好了……大概吧！'}),
  T01:Object.freeze({name:'迟到的播音员',voice:'announcer',pose:'broadcast',line:'各位请注意！比赛……现在开始！'}),
  E03:Object.freeze({name:'加油过头的队长',voice:'captain',pose:'charge',line:'全体注意！一、二、冲——！'})
});
export const VOICE_PROFILES=Object.freeze({
  rush:Object.freeze({role:'行动派',voice_description:'爽朗急切的年轻男声，快节奏，有突然拔高的情绪',pitch:1.13,rate:1.1}),
  inventor:Object.freeze({role:'发明家',voice_description:'机灵谨慎、思考时停顿的年轻女声，结尾突然惊讶',pitch:1.16,rate:0.98}),
  announcer:Object.freeze({role:'播音员',voice_description:'温和而认真、偏正式播报，偶尔反应慢半拍',pitch:0.9,rate:0.89}),
  captain:Object.freeze({role:'队长',voice_description:'力量感十足、明亮坚定、带战斗呼喝',pitch:0.99,rate:1.06}),
  narrator:Object.freeze({role:'旁白',voice_description:'温厚清晰的普通话叙述，节奏稳重',pitch:1,rate:0.95})
});
const EFFECT_SCRIPTS=Object.freeze({
  chalk_hit:{kind:'chalk',move:'aim',name:'粉笔弹射',line:'看我的！粉笔弹射——糟糕，真的飞出去了！'},
  chalk_direct:{kind:'chalk',move:'dash',name:'粉笔突破',line:'拦不住了！粉笔直接穿过去啦！'},
  broadcast_move:{kind:'broadcast',move:'relocate',name:'广播串台',line:'紧急通知！走廊的同学，立刻转移阵地！'},
  broadcast_draw:{kind:'broadcast',move:'broadcast',name:'广播补牌',line:'喂？频道串了？那就再来一张！'},
  poster_shield:{kind:'poster',move:'defend',name:'海报护卫',line:'社团招新！贴住海报，守住阵线！'},
  poster_draw:{kind:'poster',move:'reveal',name:'海报灵感',line:'海报背面居然还有新计划！'}
});

function impactText(e) {
  if(e.effect==='chalk_hit')
    return '命中！实际造成 '+e.damage+' 点伤害'+(e.blocked?'，护盾格挡 '+e.blocked+' 点':'');
  if(e.effect==='chalk_direct')return '突破！对方人气实际减少 '+e.damage+' 点';
  if(e.effect==='broadcast_move')return '调度成功：'+LANES[e.lane]+' → '+LANES[e.to_lane];
  if(e.effect==='broadcast_draw'||e.effect==='poster_draw')
    return '战术补充：实际抽取 '+e.draw+' 张手牌';
  if(e.effect==='poster_shield')return '防线建立：实际获得 '+e.shield+' 点护盾';
  throw new Error('Unknown engine effect');
}
const duration=(tier,phase)=>tier==='major'?
  ({entrance:790,action:860,impact:1050}[phase]||800):
  ({entrance:640,action:500,impact:570}[phase]||550);

export function compilePerformances(events,{theme='campus'}={}){
  if(theme!=='campus'||!Array.isArray(events))return [];
  const result=[];
  const source=events.filter(e=>e&&e.type==='card_play'&&BY_ID[e.card]&&
    (e.side==='player'||e.side==='ai')&&Number.isInteger(e.lane)&&e.lane>=0&&e.lane<3);
  for(const played of source){
    const actor=CAST[played.card]||null;
    const card=BY_ID[played.card];
    const effect=events.find(e=>e.type==='combo_effect'&&e.serial>played.serial&&
      e.lane===played.lane&&e.side===played.side&&!events.some(other=>other.type==='card_play'&&other.serial>played.serial&&other.serial<e.serial));
    const script=effect?EFFECT_SCRIPTS[effect.effect]:null;
    const tier=effect?'major':'ordinary';
    const actorName=actor?.name||card.name;
    const greeting=actor?.line||card.line;
    const beats=[{
      phase:'entrance',motion:actor?.pose||'arrive',caption:card.kind==='unit'?'人物登场':'发动事件',
      speaker:actorName,voice:actor?.voice||'narrator',
      line:greeting,duration_ms:duration(tier,'entrance')
    }];
    if(script){
      beats.push({
        phase:'action',motion:script.move,caption:script.name,
        speaker:actorName,voice:actor?.voice||'narrator',
        line:script.line,duration_ms:duration(tier,'action')
      });
      beats.push({
        phase:'impact',motion:effect.effect,caption:'战术结果 · '+LANES[effect.lane],
        speaker:'战场播报',voice:'narrator',
        line:impactText(effect),duration_ms:duration(tier,'impact')
      });
    } else if(card.kind==='unit'){
      beats.push({
        phase:'impact',motion:'summon',caption:'入场完成 · '+LANES[played.lane],
        speaker:'战场播报',voice:'narrator',
        line:actorName+'已经登场！等待下一次己方行动再发动攻击。',
        duration_ms:duration(tier,'impact')
      });
    } else{
      beats.push({
        phase:'impact',motion:'spell',caption:'事件已发动 · '+LANES[played.lane],
        speaker:'战场播报',voice:'narrator',
        line:'卡牌效果已按正式战斗规则结算。',duration_ms:duration(tier,'impact')
      });
    }
    result.push(Object.freeze({
      event_serial:played.serial,
      actor_id:card.id,actor_name:actorName,
      side:played.side,lane:played.lane,
      kind:card.kind==='unit'?'summon':'event',
      tier,effect:effect?.effect||null,
      target_uid:effect?.target||null,
      target_card_id:effect?.card||null,
      target_name:effect?.card&&BY_ID[effect.card]?BY_ID[effect.card].name:null,
      target_style:effect?.card&&BY_ID[effect.card]?BY_ID[effect.card].style:null,
      target_defeated:effect?.defeated===true,
      target_hp_after:Number.isFinite(effect?.hp_after)?effect.hp_after:null,
      to_lane:effect?.to_lane??null,
      damage:effect?.damage??null,blocked:effect?.blocked??null,
      shield:effect?.shield??null,draw:effect?.draw??null,
      beats:Object.freeze(beats.map(beat=>Object.freeze(beat)))
    }));
  }
  return result;
}
/**
 * Truth-preserving opponent reaction for the animated cut-in.
 * No visual "defeat" is allowed unless the rules engine explicitly reports it.
 */
export function describeReaction(scene) {
  if(!scene?.effect)return Object.freeze({kind:'summon',primary:'',secondary:''});
  const damage=Math.max(0,Number(scene.damage)||0);
  const blocked=Math.max(0,Number(scene.blocked)||0);
  if(scene.effect==='exchange'){
    const note=scene.retaliation>0?' · 反击 '+scene.retaliation:'';
    if(scene.target_defeated)
      return Object.freeze({kind:'defeated',primary:'−'+damage,secondary:'击倒'+note,target:scene.target_name||'敌方前排'});
    if(damage===0&&blocked>0)
      return Object.freeze({kind:'blocked',primary:'护盾',secondary:'格挡 '+blocked+note,target:scene.target_name||'敌方前排'});
    return Object.freeze({kind:'hurt',primary:'−'+damage,secondary:(blocked?'格挡 '+blocked:'受到伤害')+note,target:scene.target_name||'敌方前排'});
  }
  if(scene.effect==='direct_hit')
    return Object.freeze({kind:'direct',primary:'−'+damage,secondary:'对方人气',target:'对方人气'});
  if(scene.effect==='chalk_hit'){
    if(scene.target_defeated)
      return Object.freeze({kind:'defeated',primary:'−'+damage,secondary:'击倒',target:scene.target_name||'敌方前排'});
    if(damage===0&&blocked>0)
      return Object.freeze({kind:'blocked',primary:'护盾',secondary:'格挡 '+blocked,target:scene.target_name||'敌方前排'});
    return Object.freeze({kind:'hurt',primary:'−'+damage,secondary:blocked?'格挡 '+blocked:'受到伤害',target:scene.target_name||'敌方前排'});
  }
  if(scene.effect==='chalk_direct')
    return Object.freeze({kind:'direct',primary:'−'+damage,secondary:'人气',target:'对方人气'});
  if(scene.effect==='broadcast_move')
    return Object.freeze({kind:'moved',primary:'→',secondary:'转往'+LANES[scene.to_lane],target:scene.target_name||'敌方前排'});
  if(scene.effect==='poster_shield')
    return Object.freeze({kind:'protected',primary:'+'+Math.max(0,Number(scene.shield)||0),secondary:'护盾',target:scene.target_name||'己方前排'});
  if(scene.effect==='broadcast_draw'||scene.effect==='poster_draw')
    return Object.freeze({kind:'draw',primary:'+'+Math.max(0,Number(scene.draw)||0),secondary:'抽牌',target:'己方手牌'});
  return Object.freeze({kind:'unknown',primary:'',secondary:''});
}

/**
 * The regular end-of-turn duel also plays on the same stage:
 * first strike, real impact, and then a counterattack when one actually occurs.
 */
export function compileTurnPerformances(events,{theme='campus'}={}) {
  if(theme!=='campus'||!Array.isArray(events))return [];
  const result=[];
  for(const e of events){
    if(!e||!['exchange','direct_hit'].includes(e.type)||!['player','ai'].includes(e.side))continue;
    if(!Number.isInteger(e.lane)||e.lane<0||e.lane>2||!BY_ID[e.from])continue;
    const actor=CAST[e.from]||null;
    const actorName=actor?.name||BY_ID[e.from].name;
    const target=e.type==='exchange'&&BY_ID[e.to]?BY_ID[e.to]:null;
    if(e.type==='exchange'&&!target)continue;
    const counter=Math.max(0,Number(e.retaliation)||0);
    const counterBlocked=Math.max(0,Number(e.retaliation_blocked)||0);
    const beats=[{
      phase:'action',motion:'duel-strike',caption:actorName+' · 普通攻击',
      speaker:actorName,voice:actor?.voice||'narrator',
      line:'我的回合！进攻——',duration_ms:520
    },{
      phase:'impact',motion:'exchange',caption:'正式交锋 · '+LANES[e.lane],
      speaker:'战场播报',voice:'narrator',
      line:e.type==='exchange'?
        '命中！实际造成 '+e.damage+' 点伤害'+(e.blocked?'，护盾抵消 '+e.blocked+' 点':''):
        '突破！对方人气实际减少 '+e.damage+' 点',
      duration_ms:580
    }];
    if(e.type==='exchange'&&(counter>0||counterBlocked>0)){
      beats.push({
        phase:'counter',motion:'retaliation',caption:'对手反击',
        speaker:target.name,voice:CAST[target.id]?.voice||'narrator',
        line:'看招！反击实际造成 '+counter+' 点伤害'+(counterBlocked?'，己方护盾抵消 '+counterBlocked+' 点':''),
        duration_ms:520
      });
    }
    result.push(Object.freeze({
      event_serial:e.serial,actor_id:e.from,actor_name:actorName,
      side:e.side,lane:e.lane,kind:e.type==='exchange'?'exchange':'direct',
      tier:'ordinary',effect:e.type,target_card_id:target?.id||null,
      target_name:target?.name||null,target_style:target?.style||null,
      target_uid:e.target_uid||null,target_defeated:e.target_defeated===true,
      damage:Math.max(0,Number(e.damage)||0),blocked:Math.max(0,Number(e.blocked)||0),
      retaliation:counter,retaliation_blocked:counterBlocked,
      attacker_defeated:e.attacker_defeated===true,
      beats:Object.freeze(beats.map(b=>Object.freeze(b)))
    }));
  }
  return result;
}

export function sceneRuntimeMs(scene,{reducedMotion=false,fast=false}={}){
  if(!scene||!Array.isArray(scene.beats))return 0;
  if(reducedMotion)return 450;
  return scene.beats.reduce((sum,beat)=>sum+Math.max(0,beat.duration_ms),0)*(fast?0.47:1);
}
