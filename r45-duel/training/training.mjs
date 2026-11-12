import {BY_ID} from '../engine.mjs';
import {TRIALS,createTrial,trialStatus,actTrial} from './trials.mjs';
const $=id=>document.getElementById(id);
let session=createTrial(0),passed=new Set();
function drawTabs(){
 const tabs=$('trial-tabs');tabs.replaceChildren();
 for(let i=0;i<TRIALS.length;i++){
  const t=TRIALS[i],button=document.createElement('button');
  button.type='button';button.dataset.trial=t.id;
  button.textContent=(passed.has(i)?'✓ ':t.number+'  ')+t.name;
  button.setAttribute('aria-pressed',String(i===session.level));
  button.onclick=()=>{session=createTrial(i);paint()};
  tabs.append(button);
 }
}
function paint(){
 const t=TRIALS[session.level],s=trialStatus(session),g=session.game;
 drawTabs();
 $('trial-step').textContent=t.number+' / 04';
 $('trial-name').textContent=t.short;
 $('trial-story').textContent=t.story;
 $('trial-task').textContent=t.task;
 $('trial-tip').textContent=t.tip;
 $('hp-player').textContent=g.hp.player;
 $('hp-ai').textContent=g.hp.ai;
 $('trial-energy').textContent=String(s.energy);
 $('trial-end').hidden=t.action!=='end'||session.completed;
 const field=$('field-unit-list');field.replaceChildren();
 for(const unit of g.board.player[0]){
  const tag=document.createElement('span');
  tag.className='trial-real-unit';
  tag.textContent=BY_ID[unit.id].name+'　⚔ '+(unit.attack+unit.buff)+'　♥ '+unit.hp;
  field.append(tag);
 }
 if(!field.children.length)field.textContent='现在还没有角色，打出人物牌让他们上场。';
 const hand=$('trial-hand');hand.replaceChildren();
 for(const [i,id] of g.hand.player.entries()){
  const c=BY_ID[id],button=document.createElement('button');
  button.className='trial-card '+c.style;button.type='button';button.dataset.cardId=id;
  button.disabled=session.completed||!s.legal.includes(id)||t.action==='end';
  const art=document.createElement('img');
  art.src='../assets/cards/r103/'+id+'.webp';art.alt='';
  const banner=document.createElement('div');
  banner.className='trial-card-banner';
  const badge=document.createElement('b');badge.textContent=String(c.cost);
  const title=document.createElement('strong');title.textContent=c.name;
  banner.append(title,badge);
  const rules=document.createElement('small');
  rules.textContent=c.kind==='unit'?'人物牌 · 攻 '+c.attack+' / ♥ '+c.hp:'事件牌 · 即时生效';
  button.append(art,banner,rules);
  button.onclick=()=>attempt({cardId:id});
  hand.append(button);
 }
 $('trial-next').hidden=!session.completed;
 $('trial-next').textContent=session.level===TRIALS.length-1?
  '完成试炼 · 去三维剧情 →':'进入下一关 →';
}
function attempt(move){
 const res=actTrial(session,move);
 $('trial-feedback').className='trial-feedback'+(res.ok?' success':' caution');
 $('trial-feedback').textContent=res.ok?
  (session.completed?'✓ '+TRIALS[session.level].success:'✓ 真实出牌成功！继续选择下一张。'):
  '提示：'+res.reason;
 if(session.completed){
  passed.add(session.level);
  if(passed.size===TRIALS.length)$('training-complete').hidden=false;
 }
 const recent=session.game.events.slice(-4);
 $('trial-event-log').textContent=recent.filter(e=>e.type!=='start').map(e=>{
  if(e.type==='combo_effect')return '✓ 连携结算：'+e.effect+'，实际伤害 '+(e.damage||0);
  if(e.type==='direct_hit')return '⚔ 真实人气伤害：'+e.damage;
  if(e.type==='card_play')return '✔ 已使用真实牌 '+BY_ID[e.card].name;
  return '';
 }).filter(Boolean).join(' · ');
 paint();
}
$('trial-end').onclick=()=>attempt({end:true});
$('trial-reset').onclick=()=>{session=createTrial(session.level);$('trial-feedback').textContent='';paint()};
$('trial-next').onclick=()=>{
 if(!session.completed)return;
 if(session.level===TRIALS.length-1){
  location.href='../?mode=tutorial&level=1';return;
 }
 session=createTrial(session.level+1);$('trial-feedback').textContent='';paint();
};
paint();
