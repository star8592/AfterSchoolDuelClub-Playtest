/**
 * R103 presentation-only catalog. Rule data always comes from engine.mjs.
 * Never invent rarity stats or change actual attack, shield or combo outcomes.
 */
import {CARDS,BY_ID} from './engine.mjs';
export const STYLE_VISUALS=Object.freeze({
 ember:{name:'活力',code:'EMBER',sigil:'✦',accent:'#f3b080',secondary:'#864d40'},
 grove:{name:'创意',code:'GROVE',sigil:'❖',accent:'#bde7a2',secondary:'#446f61'},
 tide:{name:'默契',code:'TIDE',sigil:'✧',accent:'#abdcef',secondary:'#416c8f'}
});
export const CARD_STORIES=Object.freeze({
 E01:{role:'铃声猎人',scene:'校门口 · 迟到冲刺',hook:'跑赢铃声，未必能跑赢值日生'},
 E02:{role:'纸条飞行员',scene:'教学楼 · 空中走廊',hook:'这张纸条已经比快递还忙'},
 E03:{role:'应援队长',scene:'操场 · 体育社团',hook:'一声加油，隔壁班也被叫醒'},
 E04:{role:'跑腿冠军',scene:'食堂 · 最后一份午餐',hook:'比赛重要，红烧肉更重要'},
 G01:{role:'实验型建筑师',scene:'创客社 · 奇怪实验',hook:'经费不足，橡皮筋来凑'},
 G02:{role:'黑板破译员',scene:'实验教室 · 神秘板书',hook:'答案已经写在板书背面'},
 G03:{role:'反向科学家',scene:'科学室 · 红色按钮',hook:'实验事故，被称为新发现'},
 G04:{role:'社团指挥官',scene:'学生会 · 战略会议',hook:'计划严谨，执行情况随缘'},
 M01:{role:'音乐指挥',scene:'音乐教室 · 放学后乐队',hook:'一二三四，出牌也得踩拍子'},
 M02:{role:'食堂守护者',scene:'食堂 · 厨师帽与锅铲',hook:'先吃饭再决斗，谁都不许插队'},
 T01:{role:'超时播音员',scene:'广播室 · 直播事故',hook:'赛后宣布：比赛现在开始'},
 T02:{role:'会走路的菜单',scene:'食堂 · 今日隐藏套餐',hook:'菜单不想站着等顾客'},
 T03:{role:'秘密传递员',scene:'收发室 · 一封神秘信',hook:'排队领取你的战术情报'},
 T04:{role:'活动室守门人',scene:'活动中心 · 铁门禁令',hook:'进门要登记，出牌也要排队'},
 E05:{role:'全场支援',scene:'操场 · 夸张大喇叭',hook:'冲刺的不是人，是音量'},
 E06:{role:'突击事件',scene:'教室 · 黑板擦飞行事故',hook:'老师还没扔，它自己先飞了'},
 G05:{role:'紧急支援',scene:'维修间 · 拯救课桌',hook:'今天的修补胶带比战术还强'},
 G06:{role:'计划变动',scene:'学生会 · 第二页方案',hook:'翻页以后，再做一个新计划'},
 T05:{role:'温暖支援',scene:'食堂 · 热汤加餐',hook:'今天的社团危机先喝一碗汤'},
 T06:{role:'广播意外',scene:'广播室 · 频道串台',hook:'一半放学，一半继续打牌'}
});
const EFFECT_TEXT=Object.freeze({
 buff:'使己方第一名角色攻击力 +2；没有角色则不产生该加成。',
 blast:'对对手人气直接造成 3 点伤害。',
 repair:'己方场上每名角色回复 2 点生命。',
 draw:'从自己牌库抽 2 张手牌（最多持有 8 张）。',
 heal:'己方人气恢复 3 点（最高 20）。',
 confuse:'对对方场上每名角色造成 2 点伤害，护盾优先抵消。'
});
const COMBOS=Object.freeze({
 'ember,grove':{title:'粉笔弹射',detail:'伤害对方首位角色 2 点；若无目标则直击人气 1 点。'},
 'ember,tide':{title:'广播串台',detail:'额外抽 1 张牌。'},
 'grove,tide':{title:'社团招新海报',detail:'己方首位角色获得护盾 2；若无目标则抽 1 张牌。'}
});
export function cardPresentation(cardOrId){
 const c=typeof cardOrId==='string'?BY_ID[cardOrId]:cardOrId;
 if(!c||!BY_ID[c.id])return null;
 const story=CARD_STORIES[c.id],look=STYLE_VISUALS[c.style];
 const related=Object.entries(COMBOS).filter(([pair])=>pair.split(',').includes(c.style))
  .map(([pair,combo])=>({styles:pair.split(','),...combo}));
 return Object.freeze({
  id:c.id,name:c.name,kind:c.kind,style:c.style,cost:c.cost,
  attack:c.kind==='unit'?c.attack:null,hp:c.kind==='unit'?c.hp:null,
  flavor:c.line,role:story.role,scene:story.scene,hook:story.hook,
  accent:look.accent,styleLabel:look.name,code:look.code,sigil:look.sigil,
  art:'./assets/cards/r103/'+c.id+'.webp',
  rule:c.kind==='unit'?('攻击 '+c.attack+' · 生命 '+c.hp+'。刚上场待命，己方下一轮才参与攻击。'):
   EFFECT_TEXT[c.effect],
  combos:related
 });
}
export const CARD_PRESENTATIONS=Object.freeze(CARDS.map(c=>cardPresentation(c)));
export const CARD_PRESENTATION_BY_ID=Object.freeze(
 Object.fromEntries(CARD_PRESENTATIONS.map(c=>[c.id,c])));
export const R103_RULE_NOTE='连携只在本方首次使用两种不同风格时触发一次；具体效果由已使用的两种风格决定，非指定的两张卡。';
