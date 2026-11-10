# R67 T02 Food Canteen Aunt + Living Menu: real 3D dual summon

Status: TECH_VERIFIED on tested GPU/browser, ART_NO_GO, commercial release NO_GO.

## Standalone and live game routes

- /r67-t02-duo/ : true single-GLB character viewer, rotate and play both sets of native glTF animations
- /r45-duel/r67-t02-arena.html : real game stadium, side-by-side R62 menu-only baseline and opt-in T02 duo; 1v1 / 2v2 and orbit controls
- /r45-duel/?seed=1&t02Study=duo : original real card game, selectively enable T02 two-character GLB; remove query param for exact existing default

## Actual human and menu GLB

Source human is MPFB 2.0.18 MakeHuman human basemesh, 53 game_engine bones and mature Asian female skin plus eyes/hair/clothing from official makehuman_system_assets_cc0 pack. MPFB editor itself GPL-3.0-or-later, generated basemesh and specified independent system pack content CC0. Original system pack URL:
https://files.makehumancommunity.org/asset_packs/makehuman_system_assets/makehuman_system_assets_cc0.zip

Source zip 280737770 bytes SHA256 b542127a8e25547c7c29c19f2d1d2adb9a664c80396ecd694095dbc8028a0107.

Original Blender costume accessories (not a fake human body): apron, waistband, pocket stitching, straps, chef hat and headband. Blender MakeHuman ExportService applies mask, removes helper meshes and extra importer Icosphere. Custom Blender-generated source and all processing archives stay isolated in Data studio:
/mnt/disk1/H3_Studio/game-assets/t02-canteen-aunt-20261111

Human four genuine skeleton quaternion clips: Idle_Aunt_Breath, Serve_Menu, Wave_Welcome, Hit_Recoil.

R59 existing menu input: SHA256 4bc18a506143786deaa86d5a807336dafb1a4afc2d217e496f49b10a6255a43a, with five native animations.

Combined GLB in this branch:
r45-duel/assets/summons/T02-CanteenAunt-LivingMenu-Duo-STUDY.glb
26128908 bytes, SHA256 8fc68df913d4f8587981ebccce8edf24706a1ebf441d994e05549acc90545b58.
59 real meshes, 11 skinned meshes, 53 human bones, 82085 triangles, 9 independent native glTF2 animation clips.

## R67 visual-only game integration

Only if t02Study=duo is present in the same-origin game or scene URL, T02 pulls the above GLB. Default remains the existing T02 R59 menu-only resource. All other unit assets, match rules, decks, attacks and health calculations remain untouched.

Actual existing AnimationMixer drives independent duet:
- idle: aunt breath + menu breath
- attack: aunt serves + menu flips
- hit: aunt recoils + menu retreats

No gameplay damage calculations are added by this implementation. R67 only adds read-only playingClips for QA, no gameplay debug mutations.

## Real Z890 GPU/browser QA

Chrome WebGL2 Vulkan ANGLE on NVIDIA RTX 5070 Ti:
- qa/browser-r67-t02-duo.mjs, desktop 1440x900 and portrait 430x900 baseline/duo: 4/4 PASS. Baseline 43 mesh/5 clips; opt-in 59 mesh/9 clips, both sides with real loaded model, facing frontDot=1, visual height1.58, floor minY0.008, JS/HTTP error0.
- qa/browser-r67-duo-viewer.mjs standalone desktop/portrait: 2/2 PASS, right arm quaternion delta ~0.328 after Serve_Menu, no errors.
- qa/browser-r67-showcase.mjs desktop/portrait: 2/2 PASS, version switch, 1 vs 2 paired units per side, camera orbit 90 degrees, return to old5 clip model.
- qa/browser-r67-combat.mjs desktop/portrait: 2/2 PASS, authoritative ASDC_R51_COMBAT_EVENTS handling confirms attacker simultaneously plays Serve_Menu and Attack_Flip_Menu while defender simultaneously plays Hit_Recoil and Hit_Retreat. This verifies actual GLB track execution, not separate fake effects.

Actual PNG screenshots and JSON results in qa/evidence/r67. Passing tests means technical correctness on these tested conditions, not universal absence of clipping or approved final art.

## Art/rights limits

Mature female is a functioning base with cook uniform, but facial identity, stylistic consistency with cartoon living menu, facial expression, clothing wear and physically accurate hand movement still need genuine artist review. No final concept art approval claimed. The original menu is from existing project; its full provenance and all third-party inputs still require a final per-asset audit before commercial release.

Never silently replace PlayMoru production or the default published T02; URL opt-in maintains rollback without deleting previous assets.
