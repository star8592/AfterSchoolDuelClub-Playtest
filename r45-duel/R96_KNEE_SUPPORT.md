# R96 — Source-rig knee articulation and planted support foot

This new character-art revision uses the seven original Blender Studio rigs (CC BY 4.0) to bake FK thigh + knee (or Shin on Rain) + ankle motion, as well as a small FK Spine shift, into the previously supported semantic GLB clips `Idle`, `Attack` and `Hit`.

It fixes the actual limitations of R93: the leg previously swung almost rigidly with little knee motion, and animation blending double-added leg deformation because Strike and Step included the same leg bend. R96 keeps upper-body Strike/Recoil separate from the lower-body Step/Retreat shape keys, so the two are additive without duplicated limb motion.

At attack peak the right shoe is the supporting contact, during recoil the left shoe is the support. Source-geometry shoe vertices on that side were measured at max **0.0** displacement in the two selected poses for all seven actors. This is baked geometric foot pinning, not real-time IK or foot collision simulation; independent camera QA checked minimum heights too.

Change scope: seven immutable GLBs and a precise `scene/summon-models.mjs` mapping. `r96-knee-review.html` is the real browser GLB viewer, set to loop Attack and Hit for visual inspection. Existing game logic is unchanged, including R95 live arena scoring and six authoritative spell impacts.

`?r96Knee=old` returns to R93 models; previous `?r93Footwork=old` and `?r90Motion=off` still work. Source authoring and Playwright regression scripts committed under `qa/` with detailed provenance evidence `qa/evidence/r96/manifest.json`.

Limitations: body weight and landing remain offline keyframes. No real-time planted-foot IK, no physical grounded locomotion, no ragdoll or motion capture. Finish polish after gameplay stays complete.
