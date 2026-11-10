# R51: UID-bound battle animation and provenance

R50 made 12 unit cards visible, but real combat choreography was limited to the original E01(player)->G01(ai) combination. Other units could lose HP without any hit animation.

R51:
- Keeps the verified full-rig R46 cinematic for E01 versus G01.
- Plays every other real exchange and direct hit with a short 3D lunge, correct-target recoil, position-based luminous strike ribbon and the actual engine damage indicator.
- Engine adds attacker_uid only as metadata to direct-hit records; HP, energy, game rules and AI choices are unchanged.
- Transmits exact pre- and post-combat unit snapshots, keyed by unique unit ID so that defeated targets remain visible through impact but are removed afterward. New board snapshots defer while the sequence runs.
- Limits a sequence to 12 real events, preventing excessively long sequences. A new turn can supersede an older animation without rewriting game state.
- The old 6.45s dedicated choreography runs before the new generic events when both appear in one turn.
- Identifiable R50 temporary standees are not counted as finished models.

QA:
- browser-r51-combat.mjs tests actual seed 1 E02/G01 exchange damage 3, seed 4 G02 direct hit damage 2, and post-combat unit UID equality at desktop/standard/portrait resolutions.
- browser-r49-regression.mjs confirms the R46 true-VRM bone animation and its historical actual damage sample.
- browser-r50-roster.mjs verifies all 12 cards on both sides, duplicate instances and cleanup.
- browser-r49-proportions.mjs covers 6 aspect ratios, 45/90/180 orbit and full-screen placement.

Cast art status is recorded separately in assets/characters/CAST_MANIFEST.json. It is intentionally not labeled production-complete.
