# R63 · Actual source-front visual evidence and hard-fail GPU/camera gates

Date: 2026-11-10. Branch `feature/duel-r63-front-visual-20261110` starts from R62 `fa0a7bf`; it changes **QA only**, not game rules, summoned instances, art meshes, or runtime yaw values.

## Verified and not verified

- The 10 GLB summon assets E02–E04, G02–G04, T01–T04 were rendered individually at source yaw 0/90/180/270 and their screenshots inspected. Their +Z source-front convention is consistent with their presented face/front details. E02 is a non-face object: top-down four-angle evidence checks its airplane nose against green local +Z direction arrows.
- Each of those 10 captures was generated with hardware GPU rendering. `qa/evidence/r63/results.json` records all 10 passing, nonempty mesh counts, nonblank screenshot guards, zero browser errors/context loss, and renderer `ANGLE (NVIDIA Corporation, NVIDIA GeForce RTX 5070 Ti/PCIe/SSE2, OpenGL ES 3.2)`.
- E01/G01 are the existing VRM actors, which use the R62 +Z source-front calibration; they are covered by the actual in-arena R62 game test, **not** by this new standalone GLB four-angle capture.
- The first R62 source-E02 capture was blank even though the GLB loaded, due to WebGL context loss under forced experimental Vulkan feature flags. R63 uses GPU OpenGL `--use-angle=gl`, retains real GPU acceleration, and fails on context loss or a blank render; the final paper-plane capture is visible.
- `qa/browser-r62-scale-audit.mjs` now checks `metrics.withinFrame===true` as an actual pass/fail condition; previously this was only recorded in the output but did not gate success.
- Re-run from the R63 tree: 12 arena batches × 10 physical summons = **120/120** with direction, scale, floor and now actual fully-in-frame gate passing at wide 1920×1080 and portrait 430×900, camera 0°,45°,90°,180° when included. Rules 18/18, source-side math contracts 24/24.

## Evidence and reproducibility

With repo root HTTP-served, run:

```bash
ASDC_QA_ORIGIN=http://127.0.0.1:10993 node r45-duel/qa/r63-capture-all-fronts.mjs
ASDC_QA_ORIGIN=http://127.0.0.1:10993 node r45-duel/qa/browser-r62-scale-audit.mjs
node r45-duel/qa/r62-facing-contract.mjs
node r45-duel/qa/r61-rule-all-cards.mjs
```

Evidence: `qa/evidence/r63/{E02,E03,E04,G02,G03,G04,T01,T02,T03,T04}-four-angles.png`, `E02-top-four-angles.png`, `results.json`. New standalone viewer accepts `?id=E02&top=1`. R62 in-game evidence and baselines are retained on the earlier branch; no R62 baseline files are changed in this commit.

**Scope boundary:** This verifies playable prototype source orientation and runtime composition; it does not certify final 3D art, identity match to original concept art, animations in all future poses, commercial licensing, nor art signoff (still 0/12). Source GLB/VRM replacements must be reviewed again before passing their front-axis test.
