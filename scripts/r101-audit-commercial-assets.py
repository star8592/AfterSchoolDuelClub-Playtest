#!/usr/bin/env python3
"""R101 production-source audit; no network, no invented license approvals.

Matches EXACT live M02/R97 and two VRM filenames, records SHA256, byte counts,
official upstream claims and the still-missing asset chain. A source license
being permissive is NOT proof the installed derivative was correctly sourced.
"""
import json,re,hashlib,html
from pathlib import Path
root=Path(__file__).resolve().parents[1]
registry=(root/'r45-duel/scene/summon-models.mjs').read_text()
block=registry.split('export const UNIT_MODEL_SPECS=Object.freeze({',1)[1].split('});',1)[0]
active=dict(re.findall(r"^ ([EGTM]\d\d):\{file:'([^']+)'",block,re.M))
assert len(active)==12,('source changed: update this audit first',active)
upstreams={
 'E01':('Shino-original-CC0.vrm','Original Shino VRM','CC0 claimed in filename, origin missing','','PENDING_PROVENANCE','Locate original creator/license receipt and the exact VRM source hash'),
 'G01':('Fumiriya-original-CC0.vrm','Original Fumiriya VRM','CC0 claimed in filename, origin missing','','PENDING_PROVENANCE','Locate original creator/license receipt and the exact VRM source hash'),
 'E02':(active['E02'],'Project paper-plane study','Project-owned provisional artwork','','PENDING_TEXTURE_REVIEW','Prove every embedded paper/texture input is original or cleared'),
 'E03':(active['E03'],'Ellie — Blender Studio','CC BY 4.0','https://studio.blender.org/characters/ellie/v1/','UPSTREAM_LICENSE_VERIFIED','Preserve original attribution and document precise GLB conversion/hashes'),
 'E04':(active['E04'],'Phil — Blender Studio','CC BY 4.0','https://studio.blender.org/characters/phil/v1/','UPSTREAM_LICENSE_VERIFIED','Preserve original attribution and document precise GLB conversion/hashes'),
 'G02':(active['G02'],'Snow — Blender Studio','CC BY 4.0','https://studio.blender.org/characters/snow/v4/','UPSTREAM_LICENSE_VERIFIED','Preserve original attribution and document precise GLB conversion/hashes'),
 'G03':(active['G03'],'Jay — Blender Studio','CC BY 4.0','https://studio.blender.org/characters/jay/v1/','UPSTREAM_LICENSE_VERIFIED','Preserve original attribution and document precise GLB conversion/hashes'),
 'G04':(active['G04'],'Victoria — Blender Studio','CC BY 4.0','https://studio.blender.org/characters/victoria/v1/','UPSTREAM_LICENSE_VERIFIED','Preserve original attribution and document precise GLB conversion/hashes'),
 'M01':(active['M01'],'School Teacher — Polyfork','Free mesh CC BY 4.0 per general licensing page','https://polyfork.dev/licensing','SOURCE_MATCH_PENDING','Find exact School Teacher product page and prove asset is free CC BY mesh, not HD/module edition'),
 'M02':(active['M02'],'Cafeteria Aunt, R99 bone-attached costume','CC0 claimed for original R76 without original source URL','','SOURCE_MATCH_PENDING','Locate CC0 original model URL & SHA and prove upstream embedded textures; R99 hat/spatula authored in repo'),
 'T01':(active['T01'],'Owl — Innerscene original 3D part','CC0 1.0','https://www.innerscene.com/tools/library/3d-parts/owl-d696472a','UPSTREAM_LICENSE_VERIFIED','Archive source page plus original-versus-current GLB mesh/texture hashes'),
 'T02':(active['T02'],'Living Menu — original project illustration','Project-owned provisional animated menu','','PENDING_TEXTURE_REVIEW','Clear/replace underlying illustrated texture layers before commercial launch'),
 'T03':(active['T03'],'Rain — Blender Studio','CC BY 4.0','https://studio.blender.org/characters/rain/v3/','UPSTREAM_LICENSE_VERIFIED','Preserve original attribution and document precise GLB conversion/hashes'),
 'T04':(active['T04'],'Rex — Blender Studio','CC BY 4.0','https://studio.blender.org/characters/rex/v1/','UPSTREAM_LICENSE_VERIFIED','Preserve original attribution and document precise GLB conversion/hashes')
}
def dig(path):
 with open(path,'rb')as f:
  h=hashlib.sha256()
  for chunk in iter(lambda:f.read(1048576),b''):h.update(chunk)
 return h.hexdigest()
listings=[]
for id,entry in sorted(upstreams.items()):
 filename,label,license,source,status,required=entry
 assert (id not in active or active[id]==filename) or id in ('E01','G01')
 rel='r45-duel/assets/model/'+filename if id in ('E01','G01') else 'r45-duel/assets/summons/'+filename
 path=root/rel
 assert path.is_file() and path.stat().st_size>1000,rel
 listings.append({'card_id':id,'file':rel,'size_bytes':path.stat().st_size,
  'sha256':dig(path),'source':label,'claimed_license':license,
  'source_url':source,'status':status,'todo_before_paid_launch':required,
  'commercial_final_approval':False})
assert len(listings)==14
voice=json.loads((root/'r45-duel/assets/audio/voice-manifest.json').read_text())
clips=[x for family in voice['clips'].values() for x in family.values()]
assert len(clips)==98
for entry in clips:
 path=root/'r45-duel/assets/audio/voices'/entry['file']
 assert path.is_file() and dig(path)==entry['sha256']
summary={
 'schema':'R101-LIVE-COMMERCIAL-ASSETS-1','as_of':'2026-11-12',
 'scope':'Only exact active 14 VRM/GLB model selections, plus Qwen and PBR source categories. Historical alternatives and tool modules not fully audited.',
 'not_a_legal_opinion':True,'commercial_final_signoff':False,
 'game_card_count':20,
 'active_3d_models':len(listings),
 'active_3d_total_bytes':sum(i['size_bytes'] for i in listings),
 'character_assets':listings,
 'additional_assets':[
  {'name':'Qwen3-TTS-12Hz-1.7B-CustomVoice','license':'Apache-2.0 stated on official Hugging Face model page',
   'source_url':'https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice',
   'files_verified_sha256':len(clips),'todo':'Voice/speaker provenance and complete human listening review remain; no assumption of rights in third-party reference voices'},
  {'name':'Gym floor WoodFloor045 1K','license':'CC0 stated on ambientCG page',
   'source_url':'https://ambientcg.com/view?id=WoodFloor045','todo':'Original 1K JPG color/normal/roughness source files referenced by existing textures LICENSE.txt'},
  {'name':'Background music / SFX','license':'Project-authored per R70 source comments; license chain not independently proven',
   'source_url':'','todo':'Record DAW source files/composition ownership and samples before paid commercial distribution'}
 ],
 'release_caveats':['Public playtest ≠ commercial clearance','CC BY demands attribution, source and modifications','All 98 voice clips include SHA check but review_status still pending-human-listening','All old rollback 3D assets hosted in the public repository must also be audited before full commercial distribution']
}
target=root/'docs/r101-commercial-asset-audit.json'
target.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
rows=[]
for i in listings:
 badge='上游许可核对' if i['status']=='UPSTREAM_LICENSE_VERIFIED' else '来源待补证据'
 link='<a href="'+html.escape(i['source_url'],quote=True)+'" target="_blank" rel="noopener noreferrer">查看原始官方页面</a>' if i['source_url'] else '暂无可核对的原始链接'
 rows.append('<tr><td><strong>'+html.escape(i['card_id'])+'</strong></td><td>'+
  html.escape(i['source'])+'</td><td>'+html.escape(i['claimed_license'])+'</td><td>'+badge+
  '</td><td>'+link+'</td></tr>')
credits='''<!doctype html><html lang="zh-Hans"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="index,follow">
<link rel="canonical" href="https://star8592.github.io/AfterSchoolDuelClub-Playtest/credits.html">
<meta name="description" content="放学后决斗社真实三维角色、Qwen3-TTS、体育馆素材与来源许可说明。尚未进行全部商用终审。">
<title>模型、音乐、语音来源与商用审核｜放学后决斗社</title>
<style>
body{background:#0c1d2e;color:#e6edf0;font:15px/1.7 system-ui,"Noto Sans CJK SC",sans-serif;margin:0}
main{max-width:1130px;margin:auto;padding:35px 22px 70px}
h1,h2{color:#ffe0aa}
p{max-width:850px}
a{color:#a9e3ec}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:11px 8px;text-align:left;border-bottom:1px solid #456374;vertical-align:top}
th{background:#234453;color:#f5dab2}
table tr:nth-child(even){background:#182f41}
.note{background:#263e4e;border:1px solid #bb9669;border-radius:12px;padding:15px}
@media(max-width:650px){main{padding:20px 10px}table{font-size:11px}th,td{padding:7px 4px}}
</style></head><body><main>
<a href="./">返回试玩首页</a>
<h1>素材来源、署名和商用许可状态</h1>
<p class="note">本页是公开试玩阶段的真实来源登记，不是已经取得全部商业授权的声明。14 个当前模型均列出来源及待办；即便原网站使用 CC BY 或 CC0，仍需补齐各资产的下载版本、转换链条和附带纹理凭据。没有完成的审核，不能因为游戏正常加载就算通过。</p>
<h2>14 个当前三维人物与召唤物</h2>
<table><thead><tr><th>卡牌</th><th>源作者/作品</th><th>已知许可</th><th>审核状态</th><th>原始来源</th></tr></thead><tbody>'''+''.join(rows)+'''</tbody></table>
<h2>重要署名及额外素材</h2>
<ul>
<li>Blender Studio / Blender Foundation：Ellie、Phil、Snow、Jay、Victoria、Rain、Rex。官方页面注明 CC BY，游戏将原有角色转换为 WebGL GLB，按项目需要简化材质、增加动画与场景适配。依据 <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>，保留源作品/创作者、许可链接及变更说明，不暗示原作者认可本游戏。</li>
<li>Innerscene：猫头鹰原模标注 CC0，见上表来源。</li>
<li>Polyfork：免费模型的网格按其许可页面可依 CC BY 使用，但此游戏的 School Teacher 具体来源文件与版本还未核对；详见 <a href="https://polyfork.dev/licensing">官方许可</a>。</li>
<li>ambientCG：<a href="https://ambientcg.com/view?id=WoodFloor045">WoodFloor045</a>，木地板 PBR 贴图，CC0。</li>
<li>Qwen3-TTS 官方 <a href="https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice">CustomVoice 模型</a>：模型页注明 Apache-2.0；当前角色语音为项目生成的 98 条音频，文件哈希已经校对，尚待完整人工试听及声音来源终审。</li>
<li>音乐和音效：项目现有本地原创素材声明仍须补齐作曲工程、音频采样与授权来源记录。</li>
</ul>
<h2>可复核的机器清单</h2>
<p>每件当前使用的 VRM/GLB 文件大小、SHA-256、来源与未完成审核任务，可查 <a href="./docs/r101-commercial-asset-audit.json">R101 可机读清单</a>；历史 3D 回退资源仍需单独全面审查。</p>
<p><a href="./">返回试玩首页</a></p>
</main></body></html>'''
(root/'credits.html').write_text(credits)
print('R101_COMMERCE_AUDIT',json.dumps({
 'models':len(listings),'bytes':summary['active_3d_total_bytes'],
 'upstream_license_found':sum(i['status']=='UPSTREAM_LICENSE_VERIFIED' for i in listings),
 'source_pending':sum(i['status']!='UPSTREAM_LICENSE_VERIFIED' for i in listings),
 'voice_sha':len(clips),'commercial_final_signoff':False},ensure_ascii=False))
