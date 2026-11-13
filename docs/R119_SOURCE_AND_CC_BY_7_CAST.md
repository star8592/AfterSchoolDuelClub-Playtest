# R119 · 七名高精度角色的原始工程、真蒙皮及商用署名

## 素材来源
| 卡牌身份 | Blender Studio 角色 | 官方页面 | 原始 Rig 骨骼 | 原工程确有加权网格 |
|---|---|---|---:|---:|
| E03 | Ellie | https://studio.blender.org/characters/ellie/v1/ | 1,887 | 31 |
| E04 | Phil | https://studio.blender.org/characters/phil/v1/ | 1,383 | 14 |
| G02 | Snow v4 | https://studio.blender.org/characters/snow/v4/ | 1,494 | 15 |
| G03 | Jay | https://studio.blender.org/characters/jay/v1/ | 1,605 | 18 |
| G04 | Victoria | https://studio.blender.org/characters/victoria/v1/ | 1,618 | 18 |
| T03 | Rain v3 | https://studio.blender.org/characters/rain/v3/ | 2,166 | 18 |
| T04 | Rex | https://studio.blender.org/characters/rex/v1/ | 1,556 | 22 |

许可证是 CC BY 4.0，不是 CC0。任何正式发布都需要对应 Blender Foundation/Blender Studio 署名、许可证 URL 和改编说明。通用标注：
Ellie, Phil, Snow, Jay, Victoria, Rain and Rex Rigs © Blender Foundation / Blender Studio — CC BY 4.0; adapted for After School Duel Club.

## 原工程与取证
前三类旧项目原始 .blend 源已在 Z890 保存。Snow v4 与 Rain v3 源文件来自上述官方网站免费角色包，包含原始 Blender CloudRig 工程和纹理：
- Snow 官方 ZIP 111,580,346 B；SHA256 98d58ef3a07083ede14140bc462cccb55d317062846aa0eb652d2e4a7ac422a6；8,377,421 B .blend + 33 张图片。
- Rain 官方 ZIP 67,579,177 B；SHA256 80217f163f6392dc829233d63c2cfb5e1376775bc34101ad14f39631fea70d24；9,167,189 B .blend + 22 张图片。
- 私有缓存目录：/home/master/.cache/asdc-r119-ccby-rigs/，哈希及原始归档有单独 source-proof.json；不发布 .blend 和 ZIP 文件。
- Blender 5.2.3 LTS 使用 --disable-autoexec 禁止源模型脚本自行执行。

## 工程规定
- 不得用 glTF 文件中存在 skins 数组作为实际绑定的成功依据；应检查默认可见 scene 下的每个 Mesh.skin 和真实 JOINTS_0 / WEIGHTS_0。
- 必须用浏览器抽取真实 SkinnedMesh 顶点的 CPU 骨骼变形结果，验证它们随源骨骼变动。
- 普通玩家仍旧使用经过艺术评审的正式 R97 高精度形变模型，新版 7 名真人都只通过开发参数 r119Rig 单独试验。
- 七份 GLB 需要真实动作、脚底稳定、面向对手、不缺失材质、桌面与竖屏实测和加载性能评估。任何一个不达标都不能称为 7/7 已正式替换。
- 对 Snow/Rain 高纹理数据仅进行可验证的贴图压缩；所有非图片 bufferView 的 SHA-256 保持不变，不更改网格、顶点权重。
- 最终发行前必须把 CC BY 4.0 的作者、许可证、修改说明展示给游戏用户；不得仅存于内部文件。

## 追溯文件
本次七名 source rig 的真实顶点权重审计 JSON 在 r45-duel/qa/evidence/r119-source/。
Blender 源权重核验脚本、真 SkinnedMesh 导出、贴图优化、浏览器骨骼及像素验收脚本由独立 R119 工程分支管理。
