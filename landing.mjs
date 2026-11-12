/**
 * R101 ultra-light playtest front door: imports ONLY deterministic card rules,
 * never Three.js, 3D GLBs, VRMs, or audio before the visitor clicks Play.
 * No external analytics, user tracking, player ID or remote data collection.
 */
import {CARDS} from './r45-duel/engine.mjs';
const $=id=>document.getElementById(id);
const base='https://star8592.github.io/AfterSchoolDuelClub-Playtest/';
const seedUTC=()=>{
 const d=new Date();
 return d.getUTCFullYear()*10000+(d.getUTCMonth()+1)*100+d.getUTCDate();
};
const todaySeed=seedUTC();
const daily=new URL('./r45-duel/',location.href);
daily.searchParams.set('seed',String(todaySeed));
daily.searchParams.set('ref','daily');
$('daily-seed').textContent=String(todaySeed);
$('daily-play').href=daily.href;
function safeEntry(url){
 // Only accepted exploration parameters flow to game. No open redirects,
 // auth or arbitrary URL content copied from referrer/query strings.
 const supplied=new URLSearchParams(location.search);
 for(const [key,value] of supplied){
  if(!['ref','utm_source','utm_medium','utm_campaign'].includes(key))continue;
  if(!/^[A-Za-z0-9_-]{1,48}$/.test(value))continue;
  url.searchParams.set(key,value);
 }
 return url;
}
document.querySelectorAll('[data-play]').forEach(link=>{
 const target=new URL(link.getAttribute('href'),location.href);
 safeEntry(target);
 link.href=target.href;
});
async function copyText(text){
 try{
  if(navigator.clipboard?.writeText){
   await navigator.clipboard.writeText(text);return true;
  }
 }catch{}
 const field=document.createElement('textarea');
 field.value=text;field.style.position='fixed';field.style.opacity='0';
 document.body.append(field);field.select();
 const done=document.execCommand('copy');
 field.remove();return done;
}
async function shareOrCopy({title,text,url}){
 if(typeof navigator.share==='function'){
  try{await navigator.share({title,text,url});return '分享面板已打开'}
  catch(e){if(e?.name==='AbortError')return '已取消分享'}
 }
 const copied=await copyText(text+' '+url);
 return copied?'链接已复制，可发送给朋友':'复制不可用，请从地址栏复制链接';
}
$('daily-share').addEventListener('click',async()=>{
 const msg=await shareOrCopy({title:'放学后决斗社 · 今日同局挑战',
  text:'放学后决斗社：今天的牌局是 '+todaySeed+'。来看看你能不能赢过 AI！',
  url:daily.href});
 $('share-status').textContent=msg;
});
const styleNames={ember:'活力',grove:'创意',tide:'默契'};
const styleIcons={ember:'⚡',grove:'✿',tide:'✦'};
const kinds={unit:'人物 / 单位',spell:'事件牌'};
function paintCards(filter='all'){
 const gallery=$('card-gallery');
 gallery.replaceChildren();
 const list=CARDS.filter(card=>filter==='all'||card.kind===filter);
 const frag=document.createDocumentFragment();
 for(const card of list){
  const article=document.createElement('article');
  article.className='mini-card';article.dataset.kind=card.kind;
  const top=document.createElement('div');top.className='mini-top';
  const ident=document.createElement('span');
  ident.textContent=styleIcons[card.style]+' '+styleNames[card.style]+' · '+card.id;
  const cost=document.createElement('span');cost.className='mini-cost';
  cost.textContent=String(card.cost);
  top.append(ident,cost);
  const title=document.createElement('h3');title.textContent=card.name;
  const joke=document.createElement('p');joke.textContent=card.line;
  const meta=document.createElement('small');
  meta.textContent=kinds[card.kind]+
   (card.kind==='unit'?' · 攻 '+card.attack+' / ♥ '+card.hp:'');
  article.append(top,title,joke,meta);frag.append(article);
 }
 gallery.append(frag);
}
paintCards();
document.querySelectorAll('[data-filter]').forEach(button=>{
 button.addEventListener('click',()=>{
  const filter=button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(b=>
   b.setAttribute('aria-pressed',String(b===button)));
  paintCards(filter);
 });
});
function feedbackDraft(){
 const kind=$('feedback-kind').value;
 const note=$('feedback-note').value.trim();
 return '《放学后决斗社》试玩反馈\n类型：'+kind+
  '\n具体描述：'+(note||'（待补充）')+
  '\n版本：R101 公开试玩\n可选：设备/浏览器、进入游戏的等待体验、最喜欢的连携。';
}
$('feedback-copy').addEventListener('click',async()=>{
 const yes=await copyText(feedbackDraft());
 $('feedback-status').textContent=yes?'反馈文字已复制，可以粘贴发送':'复制失败，请手动选中文本';
});
$('feedback-submit').addEventListener('click',()=>{
 const title='[试玩反馈] '+$('feedback-kind').value;
 const body=feedbackDraft()+'\n\n请勿填写手机号、地址或其他个人信息。';
 const issue=new URL('https://github.com/star8592/AfterSchoolDuelClub-Playtest/issues/new');
 issue.searchParams.set('title',title);issue.searchParams.set('body',body);
 $('feedback-status').textContent='正在打开 GitHub 反馈页面；提交可能需要 GitHub 账号。';
 window.open(issue.href,'_blank','noopener,noreferrer');
});
