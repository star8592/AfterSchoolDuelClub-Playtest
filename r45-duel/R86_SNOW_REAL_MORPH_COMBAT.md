# R86 Snow real localized combat animation

G02 blackboard expert now uses Blender Studio Snow (original Blender Foundation, CC BY 4.0) with real localized shoulder/arm and shirt vertex deformations from its original CloudRig source file. Three independent native GLB clips `Idle`, `Attack`, `Hit` (morph target channels); not fake root body sway. 19 base source meshes; two of them (body and shirt) use two morph targets to simulate source skeleton poses, 3 exported glTF animations. Full live rig, detailed facial performance, and independent elbows/fingers are NOT yet present.

Source: https://studio.blender.org/characters/snow/v4/ . Original `.blend` and exporter retained on Z890 in `/mnt/data/game-assets/after-school-duel/film-character-rigs-20261111/`; CC BY 4.0 attribution remains in game.

Rollback old static Snow at `?g02Study=r83`. Chrome local 1440 / 430 QA: actual G02 `Attack` and `Hit` clip playing, zero JS/resource errors; rollback restored R83 static clip count=0. Other 11 units and card rules unchanged. QA manifest `qa/evidence/r86/manifest.json`.
