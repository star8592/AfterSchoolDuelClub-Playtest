/** R103 genuine 20-card art gallery; shares one immutable visual catalog
 * with the playable duel, with no independent gameplay-rule copies. */
import {CARDS} from '../engine.mjs';
import {cardPresentation,CARD_PRESENTATIONS,R103_RULE_NOTE} from '../card-presentation.mjs';
const $=id=>document.getElementById(id);
const root=$('card-grid');
const dialog=$('card-detail');
function make(tag,cl='',value=''){
 const n=document.createElement(tag);if(cl)n.className=cl;if(value)n.textContent=value;return n;
}
const artUrl=id=>'../assets/cards/r103/'+id+'.webp';
function showCard(id){
 const p=cardPresentation(id);if(!p)return;
 dialog.dataset.style=p.style;
 $('detail-art').src=artUrl(id);
 $('detail-art').alt=p.name+' 的独立角色／事件插画';
 $('detail-style').textContent=p.styleLabel+' · '+(p.kind==='unit'?'角色牌':'事件牌')+' · '+p.id;
 $('detail-cost').textContent=String(p.cost);
 $('detail-title').textContent=p.name;
 $('detail-name').textContent=p.name;
 $('detail-role').textContent=p.role;
 $('detail-scene').textContent=p.scene;
 $('detail-stats').textContent=p.kind==='unit'?'攻击 '+p.attack+'　·　生命 '+p.hp+'　·　花费 '+p.cost:
  '即时事件　·　花费 '+p.cost;
 $('detail-rule').textContent=p.rule;
 $('detail-flavor').textContent=p.flavor;
 $('detail-hook').textContent=p.hook;
 const combos=$('detail-combos');combos.replaceChildren();
 for(const item of p.combos)combos.append(make('p','detail-combo',item.title+'　｜　'+item.detail));
 $('detail-note').textContent=R103_RULE_NOTE;
 dialog.showModal();
}
function paint(filter='all'){
 root.replaceChildren();
 const source=CARD_PRESENTATIONS.filter(c=>filter==='all'||c.kind===filter||c.style===filter);
 for(const c of source){
  const btn=make('button','collection-card '+c.style);
  btn.type='button';btn.dataset.cardId=c.id;
  btn.setAttribute('aria-label','查看完整卡牌：'+c.name+'，花费 '+c.cost+'，'+c.rule);
  const art=make('img','collection-card-image');
  art.src=artUrl(c.id);art.alt='';art.loading='lazy';art.decoding='async';
  const shade=make('div','collection-card-shade');
  const header=make('div','collection-card-header');
  header.append(make('span','collection-card-tag',c.styleLabel+' · '+(c.kind==='unit'?'人物':'事件')),
    make('span','collection-card-cost',String(c.cost)));
  const bottom=make('div','collection-card-bottom');
  bottom.append(make('small','collection-card-id',c.id+' / '+c.role),
    make('strong','collection-card-title',c.name),
    make('span','collection-card-stat',c.kind==='unit'?'⚔ '+c.attack+'　♥ '+c.hp:'✦ 即时事件'));
  shade.append(header,bottom);btn.append(art,shade);
  btn.addEventListener('click',()=>showCard(c.id));
  root.append(btn);
 }
 $('collection-count').textContent='正在展示 '+source.length+' / '+CARDS.length+' 张现有正式卡牌';
}
paint();
for(const btn of document.querySelectorAll('#card-filters [data-filter]')){
 btn.addEventListener('click',()=>{
  const selected=btn.dataset.filter;
  document.querySelectorAll('#card-filters button').forEach(b=>
   b.setAttribute('aria-pressed',String(b===btn)));
  paint(selected);
 });
}
$('detail-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
