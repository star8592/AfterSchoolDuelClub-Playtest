# R96 — Real permanent duelist actors, two-bone IK, face and reactions

## Problem
A player reported the two duelists on the left/right platforms were standing
motionless with widely held A/T bind-pose arms. Although the original E01/G01
VRM source files existed, the R95 scene kept those rigs invisible except for
combat and did not instantiate independent podium avatars.

## Changes
- Preserve the latest R95 main engine, R93 character choreography, live
  3D score and six rule-triggered spell visualizations.
- Reuse R85 vrm-hero-pose-ik.mjs (real shoulder–elbow–wrist solver)
  and vrm-character-acting.mjs (source VRM0 facial blendshapes).
- Clone full skeletal high-density source VRMs for separate always-visible
  podium E01/G01 characters, without changing the summonable source rigs.
- Continuous breathing, glance, card inspection, relaxed hands, show/cast,
  recoil and independently timed blinks; original hand targets unique by role.
- Trigger show/cast only on R46 real card play; hit only on rule R81 host
  damage or deduplicated R95 spell damage; no rule or HP mutation.
- Real original joy/fun facial morphs when revealing and casting cards;
  return to neutral during hits, retaining independent blink weights.
- Keep GLB/VRM loading failure gates and finalArtApproved=false.

## Tested
Run: ASDC_QA_ORIGIN=http://127.0.0.1:11096 node r45-duel/qa/browser-r96-permanent-duelists.mjs

- 1600x900 and 430x900 real Chrome: 30/30 checks passed, zero JS/HTTP errors.
- Both genuine VRMs always visible, >100 native bones per actor, both arm
  directions naturally downward, solved wrist IK errors below 0.25.
- Real selected card moves player's wrist approximately 0.31 3D units;
  AI core events animate its own duelist independently.
- Source facial morph blink weights reach about 1 on both actors.
- Actual E06 blast lowers real AI HP and prompts real opponent recoil;
  physical scoreboard stays equal to rule HP, with no additional damage.
- R95 vs R96 short GPU browser samples on Z890: 1600px 58.8 vs 58.8 FPS;
  430px 60 vs 60 FPS. Not a universal guarantee.
- QA report/screenshots in qa/evidence/r96/.

## Legacy regression
- R95 six-spell real-browser acceptance: 26/26 passed, 0 errors.
- R94 default-on audio, 20-card rules and three rematch cases: 14/14 passed.
- R93 seven native actor footwork, hit, and old motion rollback: 4/4 passed.

## Limitations
This is real animation infrastructure, not final artistic sign-off.
Remaining: user-reference costume/prop review, M01/M02 appearance and low-poly
replacement, per-character voice emotion and music audition.
