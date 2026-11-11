# R86 Jay pilot: genuine skinned attack/idle/hit/walk

R85 remains the production default. Visit `/r45-duel/?g03Study=rig` for opt-in R86 G03 Jay. The original Blender Studio *Jay* source has 1605 rig bones; selective glTF export retains 295 joint bones and true SkinnedMesh vertex weights (one glTF skin, 36 mesh primitives, 4.46 MB). 0 glTF embedded animation clips: this patch authors FOUR genuine quaternion-keyframed bone clips at runtime (idle, attack, hit, walk). Never call these native source GLB actions. No whole-body sway in R86 G03.

**Visual issues:** a detached decorative trim `Data_GEO-jay_jacket_1` is temporarily hidden only in opt-in study because bone attribution needs repair. Original garment and complete source remain unchanged, old G03 default preserved. The rigged pose is a pilot, not an approved final character. Movie shader and hair require separate conversion.

Rights: Blender Foundation / Blender Studio Jay https://studio.blender.org/characters/jay/v1/ , CC BY 4.0.

QA: `qa/evidence/r86-jay-rig.json`, actual Chrome 1440×900 and 430×900, both players G03 and combat event; baseline original G03 still works. Hardware evidence and the local sample scene stored on Z890 under `/mnt/data/game-assets/after-school-duel/r80-mainport-qa/` and `/mnt/data/game-assets/after-school-duel/film-character-rigs-20261111/`. Do not roll this experimental source onto all seven models.
