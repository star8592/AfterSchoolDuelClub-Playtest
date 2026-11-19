/**
 * R199 explicit 46-spell physical preview. This is an inspector, not an
 * auto popup or a fake card play. It never mutates the deterministic duel.
 */
import {BY_ID} from './engine.mjs';
import {SCHOOL_MAGIC_IDENTITIES,SCHOOL_MAGIC_FAMILIES} from './scene/campus-magic-bible.mjs';
export function installR199MagicGallery({sendScene,sceneReady}){
 const head=document.createElement('button');
 head.type='button';head.className='r199-launch';head.textContent='46种校园魔法 · 实物演出预览';
 head.title='选择真正的原创3D校园魔法，逐个观看。不会影响当前牌局。';
 head.setAttribute('aria-expanded','false');
 const panel=document.createElement('section');
 panel.className='r199-panel';panel.hidden=true;
 panel.setAttribute('aria-label','46种校园魔法实物原型预览');
 const title=document.createElement('h3');title.textContent='46种校园荒诞魔法';
 const info=document.createElement('p');
 info.textContent='点击一个名字 → 加载对应的原创 Blender 3D 道具 → 在真实体育馆表演。仅演出，不影响血量和卡牌规则。';
 const category=document.createElement('select');
 category.setAttribute('aria-label','魔法类别筛选');
 for(const name of ['全部',...SCHOOL_MAGIC_FAMILIES]){
  const option=document.createElement('option');option.value=name;option.textContent=name;category.append(option)
 }
 const search=document.createElement('input');search.type='search';
 search.placeholder='搜索魔法或道具';search.setAttribute('aria-label','搜索46种魔法');
 const list=document.createElement('div');list.className='r199-spells';
 const status=document.createElement('p');status.className='r199-status';status.textContent='请选择一道魔法。';
 const close=document.createElement('button');close.type='button';close.textContent='关闭列表';
 close.addEventListener('click',()=>toggle(false));
 panel.append(title,info,category,search,list,status,close);
 document.body.append(head,panel);
 const ids=Object.keys(SCHOOL_MAGIC_IDENTITIES);
 if(ids.length!==46)throw Error('R199 preview must contain exactly 46 distinct spells');
 let current=null;
 function toggle(open){panel.hidden=!open;head.setAttribute('aria-expanded',String(open))}
 head.addEventListener('click',()=>toggle(panel.hidden));
 function paint(){
  list.replaceChildren();
  const selected=ids.filter(id=>
   (category.value==='全部'||SCHOOL_MAGIC_IDENTITIES[id].family===category.value)&&
   (id+' '+BY_ID[id]?.name+' '+SCHOOL_MAGIC_IDENTITIES[id].prop)
    .toLowerCase().includes(search.value.trim().toLowerCase()));
  for(const id of selected){
   const spell=SCHOOL_MAGIC_IDENTITIES[id];
   const button=document.createElement('button');button.type='button';
   button.dataset.magicId=id;
   button.title=spell.flight+'；'+spell.impact;
   button.textContent=id+' · '+BY_ID[id].name;
   button.addEventListener('click',()=>{
    if(!sceneReady()){status.textContent='竞技场还没有载入完成，请在场地完成后施法。';return}
    current=id;
    status.textContent='正在获取 '+BY_ID[id].name+' 的真正3D模型…';
    const ok=sendScene({type:'ASDC_R199_MAGIC_PREVIEW',id,side:'player'});
    if(!ok){status.textContent='3D场景尚未准备好，暂不施法';return}
    // Do not block the stadium with an inspector while the magic plays.
    toggle(false);
   });
   list.append(button);
  }
  status.textContent=selected.length+' / 46 种魔法可选';
 }
 category.addEventListener('change',paint);search.addEventListener('input',paint);
 paint();
 function onEvent(msg){
  const id=msg.id;
  if(msg.event==='assetReady'&&id===current){
   status.textContent='原始模型加载成功：'+BY_ID[id]?.name+' · '+msg.meshes+'个真实3D网格';
  }else if(msg.event==='cast'&&id===current){
   status.textContent='正在表演：'+BY_ID[id]?.name+'（非光圈法术）';
  }else if(['loadError','previewFailed','castFailed'].includes(msg.event)&&id===current){
   status.textContent='原始模型加载失败，没有使用低模或旧光效替代：'+String(msg.message).slice(0,130);
   toggle(true);
  }
 }
 return {ids:[...ids],head,panel,onEvent,
  get current(){return current}};
}
