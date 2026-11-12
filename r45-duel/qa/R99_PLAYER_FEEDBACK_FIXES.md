# R99 — User screenshot defects: tutorial, orientation, M02, and speech loudness

Source: real player screenshot of R98 tutorial after first chapter completion,
November 12, 2026. The core had emitted a valid combo_effect; the small
top-left next button was visible but the main bottom button remained disabled,
and all remaining cards were hidden. This is a real dead-end in the main UX.

## Fixes

1. Completed tutorial displays a full-width success message in the hand area
   and the primary GOLD bottom button changes to Next chapter / Free Duel.
   The dead disabled bottom End Turn button is hidden; the redundant small
   top next-button is hidden. Only one real objective card can be played
   before the core combo event marks the chapter complete.
2. Opponent-facing yaw preserves >.95 target dot while biasing 0.31 radians
   toward camera (+Z). M02 Blender Head/headfront bone points toward -Y,
   converted to GLB +Z: old added PI/2 yaw was genuinely incorrect.
   Original 14 source VRM/GLB references preserved with current R97 landings.
3. Rebuilt original 31,891-vertex M02 as genuine rigged
   M02-CafeteriaAunt-ChefHat-Spatula-R99.glb with a high-resolution pleated
   chef toque and stainless spatula with oak handle. 11 separate accessory
   meshes are weighted via glTF JOINTS_0 / WEIGHTS_0 to the original Head
   and RightHand bones; 10 native original animation clips retained. Original
   source available through ?r99Chef=old, no low-poly placeholder.
   Reproducible Blender source: art-lab/r99-chef-gear/build.py.
4. 98 project-made Qwen3-TTS Opus clips re-mastered by ffmpeg EBU loudnorm
   to target -16 LUFS, true peak -1.5 dBTP; SHA256 manifest updated.
   Default mix BGM 32%, voice 100%, SFX 75%; during voice, BGM ×0.20.
   Exact untouched older defaults migrate, user-customized mixes preserved.
   Voice URL cache version r99 avoids stale browser Opus.
5. True 12-GLB+2-VRM loader gate, six true spell effects, seven landing
   actors, outcome/rematch and original rules were not bypassed.

## Verification

- qa/check-r99-chef-voice.mjs: 146/146 structural assertions including real
  rigged parts and skin weights, 10 original source clips, 98 SHA checks,
  and all 28 team-facing direction checks.
- qa/r62-facing-contract.mjs: 14 source types x 2 sides, front-to-opponent
  >.95 and spectator-facing z >.30.
- qa/browser-r99-orientation-chef-voice.mjs: 11/11 Chrome assertions, PC and
  phone, BOTH M02 positions, 10 clips, old-model rollback and actual voice
  playback, zero JS and GLB network errors.
- qa/browser-r98-three-lessons.mjs: 80/80 real Chrome assertions, three
  actual chapters and GOLD bottom Next after each completion, graduation to
  free duel, 1550/430 viewports, zero JS/GLB errors.
- Additional real-browser regression: R94 14/14 (audio + win/loss/draw +
  rematch), R95 26/26 (all 6 real 3D spells and physical scores),
  R96 30/30 (native VRM IK, cast, blink, actual recoil),
  R96.1 14/14 (actual broken GLB download and manual reload),
  R97 4/4 grouped GPU tests (7 current landing actors and rollback).
  All tests exited zero. R98 seeded rules 300 scenarios / 4,501 asserts.
- Original player-facing result screenshot and R99 before-public model captures
  are in qa/evidence/r99. Existing R98 screenshots updated to show the main
  GOLD next-step button rather than the dead End Turn control.

M02's original source license was previously labeled CC0 candidate.
The new hat and spatula meshes are authored here; this is not a user
art-direction sign-off nor proof 98 speech clips were human-auditioned.
