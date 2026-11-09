/** R40 read-only visual combat history. Source is canonical core.mjs ONLY. */
import {BY_ID,LANES} from './core.mjs';
const nat=v=>Number.isFinite(v)&&v>=0?Math.trunc(v):0;
const name=id=>BY_ID[id]?.name||String(id||'未知角色');
const valid=e=>!!e&&(e.type==='exchange'||e.type==='direct_hit')&&
  (e.side==='player'||e.side==='ai')&&Number.isInteger(e.lane)&&e.lane>=0&&e.lane<3&&
  !!BY_ID[e.from]&&Number.isSafeInteger(e.serial)&&e.serial>0;
export function describeCombatR40(e){
 if(!valid(e))return null;
 const exchange=e.type==='exchange';
 if(exchange&&!BY_ID[e.to])return null;
 const actor=name(e.from),target=exchange?name(e.to):'对方人气';
 const damage=nat(e.damage),blocked=exchange?nat(e.blocked):0;
 const retaliation=exchange?nat(e.retaliation):0;
 const retaliationBlocked=exchange?nat(e.retaliation_blocked):0;
 const damageLabel=blocked>0&&damage===0?'护盾格挡 '+blocked:
    '造成 '+damage+' 点伤害'+(blocked?' · 格挡 '+blocked:'');
 const counterLabel=exchange&&(retaliation>0||retaliationBlocked>0)?
  '反击 '+retaliation+(retaliationBlocked?' · 格挡 '+retaliationBlocked:''):'';
 return Object.freeze({
  serial:e.serial,side:e.side,lane:e.lane,laneName:LANES[e.lane],
  actor,target,damage,blocked,retaliation,retaliationBlocked,damageLabel,counterLabel,
  exchange,defeated:exchange&&e.target_defeated===true,
  summary:LANES[e.lane]+' · '+actor+' → '+target+' · '+damageLabel+(counterLabel?' · '+counterLabel:'')
 });
}
export function createCombatFeedbackR40({documentRef=document,win=window,onFocus=()=>{}}={}){
 const el=id=>documentRef.getElementById(id);
 const root=el('arena-r40-feedback'),feed=el('arena-r40-combat-feed');
 const list=el('arena-r40-combat-list'),replay=el('arena-r40-replay');
 let entries=[],timer=null,lastPlayed=null;
 const reduced=()=>win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
 function clear(){if(timer!==null){win.clearTimeout(timer);timer=null;}}
 function animateCast(row){
  if(reduced())return;
  const attacker=el(row.side==='player'?'arena-player-actor':'arena-enemy-actor');
  const opponent=el(row.side==='player'?'arena-enemy-actor':'arena-player-actor');
  const sign=row.side==='player'?1:-1,opts={duration:750,easing:'cubic-bezier(.22,.9,.26,1)'};
  attacker?.animate?.([
   {transform:'translateX(0)',filter:'brightness(1)'},
   {transform:'translateX('+(sign*24)+'px) scale(1.06)',filter:'brightness(1.5)',offset:.38},
   {transform:'translateX(0)',filter:'brightness(1)'}],opts);
  if(row.exchange&&row.damage+row.blocked>0)opponent?.animate?.([
   {transform:'translateX(0)',filter:'brightness(1)'},
   {transform:'translateX('+(sign*13)+'px) rotate('+(sign*3)+'deg)',filter:'brightness(1.8)',offset:.55},
   {transform:'translateX(0)',filter:'brightness(1)'}],opts);
 }
 function show(row){
  if(!row)return;
  clear();onFocus(row.lane);
  root.hidden=false;root.dataset.side=row.side;root.dataset.serial=String(row.serial);
  root.dataset.exchange=String(row.exchange);
  el('arena-r40-lane').textContent=row.laneName+' · 真实规则结算';
  el('arena-r40-action').textContent=row.actor+' → '+row.target;
  el('arena-r40-damage').textContent=row.damageLabel+(row.defeated?' · 击倒':'');
  el('arena-r40-counter').textContent=row.counterLabel;
  lastPlayed=row.serial;
  root.classList.remove('r40-flash-animate');void root.offsetWidth;root.classList.add('r40-flash-animate');
  animateCast(row);
  timer=win.setTimeout(()=>{root.hidden=true;root.classList.remove('r40-flash-animate');timer=null;},reduced()?1500:2500);
 }
 function renderFeed(){
  feed.hidden=entries.length===0;replay.disabled=entries.length===0;list.replaceChildren();
  for(const row of entries){
   const b=documentRef.createElement('button');b.type='button';b.className='arena-r40-entry';
   b.dataset.eventSerial=String(row.serial);b.textContent=row.summary;
   b.setAttribute('aria-label','回看战斗：'+row.summary);
   b.addEventListener('click',()=>show(row));list.append(b);
  }
 }
 replay.addEventListener('click',()=>show(entries[0]||null));
 function ingest(events){
  const rows=(Array.isArray(events)?events:[]).map(describeCombatR40).filter(Boolean);
  if(!rows.length)return;
  const existing=new Set(entries.map(x=>x.serial));
  const next=rows.filter(x=>!existing.has(x.serial));
  if(!next.length)return;
  entries=[...next.reverse(),...entries].slice(0,3);
  renderFeed();show(next[0]);
 }
 function reset(){
  clear();entries=[];lastPlayed=null;root.hidden=true;
  root.classList.remove('r40-flash-animate');delete root.dataset.serial;renderFeed();
 }
 reset();
 const qa={
  get events(){return entries.map(x=>({serial:x.serial,summary:x.summary,side:x.side,lane:x.lane,damage:x.damage,retaliation:x.retaliation}))},
  get lastPlayedSerial(){return lastPlayed},get visible(){return !root.hidden},replay:()=>show(entries[0]||null)
 };
 return {ingest,reset,qa};
}
