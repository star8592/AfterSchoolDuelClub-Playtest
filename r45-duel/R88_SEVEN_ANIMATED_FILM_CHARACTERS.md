# R88: All seven high-resolution film-style human cards have native animation

E03 Ellie, E04 Phil, G04 Victoria, T03 Rain and T04 Rex now use independent native glTF `Idle`, `Attack`, `Hit` clips with morph-target positions captured from their original Blender Studio CloudRig poses. Snow G02 (R86) and Jay G03 (R87) remain unchanged. Five source projects and conversion scripts are retained under `/mnt/data/game-assets/after-school-duel/film-character-rigs-20261111/` on Z890. Source material Blender Foundation / Blender Studio, CC BY 4.0 — see source URLs/hashes in `qa/evidence/r88/manifest.json`. User approved high-quality stand-in characters but these are not the final movie-grade look.

No unsupported claim of full live bones, facial acting, hair simulation or motion-capture. This is *localized vertex deformation* with native tracks, not a static mesh or entire actor rotating. Rain source's extraneous historical action stashes were removed from the final glTF animation list.

Rollback the five to their former static GLBs through `?r88Study=old` without changing G02/G03 or other game systems. The desktop 1440px and portrait 430px Chrome QA verified both teams simultaneously, five active Attack/Hit clips, visibility, correct orientation and all five rollbacks. `qa/browser-r88-five.cjs` is reproducible on the same Z890 QA environment.
