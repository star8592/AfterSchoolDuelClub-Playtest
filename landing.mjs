/**
 * R101 ultra-light playtest front door: imports ONLY deterministic card rules,
 * never Three.js, 3D GLBs, VRMs, or audio before the visitor clicks Play.
 * No external analytics, user tracking, player ID or remote data collection.
 */
import {CARDS} from './r45-duel/engine.mjs';
import {cardArtURL} from './r45-duel/card-art.mjs';
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
 const list=CARDS.filter(card=>filter==='all'||(filter==='trend'?!!card.trend:card.kind===filter))
  .sort((a,b)=>(!!b.trend)-(!!a.trend)||
   (b.trend?.date||'').localeCompare(a.trend?.date||''));
 const frag=document.createDocumentFragment();
 for(const card of list){
  const article=document.createElement('article');
  article.className='mini-card';article.dataset.kind=card.kind;
  if(card.trend)article.dataset.trend='2026';
  const top=document.createElement('div');top.className='mini-top';
  const ident=document.createElement('span');
  ident.textContent=styleIcons[card.style]+' '+styleNames[card.style]+' · '+card.id;
  const cost=document.createElement('span');cost.className='mini-cost';
  cost.textContent=String(card.cost);
  top.append(ident,cost);
  const artBox=document.createElement('div');artBox.className='mini-art-box';
  const artwork=cardArtURL(card.id,'./r45-duel/assets/cards/r109/');
  if(artwork){
   const img=document.createElement('img');img.src=artwork;img.alt=card.name+'的原创卡牌画面';
   img.width=620;img.height=780;img.loading='lazy';img.decoding='async';
   img.className='mini-card-image';artBox.append(img);
   article.dataset.art='illustrated';
  }else{
   const note=document.createElement('span');note.className='mini-art-pending';
   note.textContent='独立插画制作中';artBox.append(note);
   article.dataset.art='pending';
  }
  article.tabIndex=0;article.setAttribute('role','button');
  article.setAttribute('aria-label','查看卡牌大图：'+card.name);
  const title=document.createElement('h3');title.textContent=card.name;
  const joke=document.createElement('p');joke.textContent=card.line;
  const meta=document.createElement('small');
  meta.textContent=(card.trend?'2026热梗 · ':'')+kinds[card.kind]+(card.theme?' · '+card.theme:'')+
   (card.kind==='unit'?' · 攻 '+card.attack+' / ♥ '+card.hp:'')+
   (card.rule?' · '+card.rule:'');
  article.append(top,artBox,title,joke,meta);
  article.addEventListener('click',()=>showCardArt(card));
  article.addEventListener('keydown',e=>{
   if(e.key==='Enter'||e.key===' '){e.preventDefault();showCardArt(card)}
  });
  frag.append(article);
 }
 gallery.append(frag);
}
// One reusable detail panel; the image is full-width when verified artwork exists.
// No 3D stage load and no fake picture for cards with art still pending.
const detail=document.createElement('div');
detail.className='card-art-detail';detail.hidden=true;
detail.setAttribute('role','dialog');detail.setAttribute('aria-modal','true');
detail.setAttribute('aria-label','卡牌插画放大预览');
document.body.append(detail);
let returnFocus=null;
function closeCardArt(){
 if(detail.hidden)return;
 detail.hidden=true;detail.replaceChildren();returnFocus?.focus({preventScroll:true});
}
function showCardArt(card){
 returnFocus=document.activeElement;
 detail.replaceChildren();
 const panel=document.createElement('div');panel.className='card-art-detail-panel '+card.style;
 const button=document.createElement('button');button.type='button';button.className='close-art';
 button.textContent='✕ 关闭';button.addEventListener('click',closeCardArt);
 const image=cardArtURL(card.id,'./r45-duel/assets/cards/r109/');
 const figure=document.createElement('figure');
 if(image){
  const img=document.createElement('img');img.src=image;img.alt=card.name+'高清卡牌画面';
  img.width=620;img.height=780;img.decoding='async';figure.append(img);
 }else{
  const div=document.createElement('div');div.className='art-placeholder';
  div.textContent='该卡牌的独立插画仍在制作中';figure.append(div);
 }
 const desc=document.createElement('section');
 const title=document.createElement('h2');title.textContent=card.name;
 const meta=document.createElement('p');
 meta.textContent='费用 '+card.cost+' · '+(card.theme||'经典社团')+' · '+(card.kind==='unit'?'人物':'事件');
 const story=document.createElement('p');story.textContent=card.line;
 const rule=document.createElement('strong');rule.textContent=card.rule||(
  card.kind==='unit'?'攻击 '+card.attack+' / 生命 '+card.hp:'');
 desc.append(title,meta,story,rule);
 panel.append(button,figure,desc);detail.append(panel);detail.hidden=false;button.focus({preventScroll:true});
}
detail.addEventListener('click',e=>{if(e.target===detail)closeCardArt()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!detail.hidden)closeCardArt()});
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
