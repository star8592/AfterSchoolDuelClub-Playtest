# R90 — Event-synchronised combat choreography

R89 had a specific timing defect: attacker `Attack` and defender `Hit` started simultaneously even though the actual event-linked damage and impact occurred only near the midpoint of the 0.90-second exchange. R90 delays `Hit` to phase 0.42 while keeping the actual game engine as the only authority for HP/turns.

The new scene-only module `scene/combat-choreography.mjs` provides seven character-specific anticipation/lunge/recoil curves. Attackers wind up, advance and recover; defenders react after contact, recoil and recover. A shared 12-instance mesh provides character-tinted impact sparks only for damaging events, and the glTF animation mixer pauses briefly at impact for hitstop. The existing ring/HP label remain event-linked. No camera shake and no new procedural character meshes. The existing R89 glTF morph clips and the game rules are unchanged. Motion uses temporary whole-instance translation/lean, NOT true skeleton-driven torso, feet, cloth or facial acting; these remain art/animation follow-up tasks.

Rollback R90 choreography via `?r90Motion=off`; this leaves R89 old clip timing in place. Separate R89 model rollback `?r89Study=r88` remains unchanged.

`r90-combat-review.html` is a dedicated visual QA page. It embeds the real `scene/index.html`, selects each of 7 real model cards, sends same-origin synthetic board/combat events through the existing public in-browser message API, provides one-hit/three-hit buttons and R89/R90 comparison. It **does not alter a real match score**. Sound in this preview defaults on after a user click; browsers may block it before user gesture.

Test evidence `qa/evidence/r90/report.json`; on Z890 run `qa/browser-r90-timing.cjs`, `qa/browser-r90-demo.cjs`, and `qa/browser-r90-seven-regression.cjs`. Desktop and portrait Chrome: seven real characters, attack/hit, late impact, HP, no drift, three hits, comparison rollback and zero JS/HTTP errors. All results are browser-tested, not claims of cinematic-quality full-body animation.
