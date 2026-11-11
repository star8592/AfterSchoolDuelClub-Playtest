# R87 — Jay real animated character, reversible

G03 Jay now has three native glTF animation clips Idle/Attack/Hit. Blender Studio original source Jay (Blender Foundation CC BY 4.0): https://studio.blender.org/characters/jay/v1/ . This is not whole-body swaying: R87 bakes actual shoulder deformation from CloudRig into target positions in jay_body and jay_jacket, with independent animated shape key tracks. Full browser skeletal rig and facial expression remain unimplemented.

`?g03Study=r80` selects old static R80 Jay, with no game-rule or damage changes. Source .blend plus conversion script and hash evidence retained on Z890 `/mnt/data/game-assets/after-school-duel/film-character-rigs-20261111/`. Chrome desktop 1440px / portrait 430px: native Attack/Hit play actions verified, no JS errors, old rollback verified.
