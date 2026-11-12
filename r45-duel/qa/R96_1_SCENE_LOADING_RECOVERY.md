# R96.1 — Genuine 3D loading failure recovery without fake scene readiness

## Incident
During R96 release, one independent fresh headless Chrome session timed out
waiting for the public 3D scene; a fresh diagnostic session loaded all 14
source models via HTTP 200 and correctly reached scene-ready. A repeated full
public R96 suite passed 30/30, with 22/22 production/legacy GLBs HTTP 200.

An earlier 404/503 model incident proved that missing resources must be surfaced
and never reported as scene-ready. However, the prior game still allowed card
buttons while the iframe 3D scene was missing: the rule engine's gameReady()
ignored the separate sceneReady flag, and the 3D fatal error showed no usable
retry action. Players could advance the match without visible characters.

## Fix
- The browser's 3D loader still awaits all original VRM actors and all 12
  authentic current GLB templates before sending ASDC_R45_SCENE_READY.
- On load error, do not fake completion. Present a visible and keyboard
  accessible retry button inside the 3D arena iframe, with a concise error.
  The user initiates exactly one iframe reload, not an infinite auto-retry.
- Notify the parent game with ASDC_R45_SCENE_FAILED (no private paths/secrets).
  Disable all ordinary legal card plays/end-turn moves until the real loader
  completes, preserving the current core game state and final result.
- After the iframe independently reloads and confirms every model ready, the
  parent re-synchronizes the true board/score and calls render() to re-enable
  buttons. Recoverability does not require resetting scores or deck.
- The first frame is rendered before sceneReady and all legacy R92 real-GLB
  checks remain intact.

## Real fault injection
ASDC_QA_ORIGIN=http://127.0.0.1:11097 node r45-duel/qa/browser-r96-recovery.mjs

Playwright deliberately aborts an actual G03 GLB GET. Desktop and 430px phone
both verify: failure error visible; playable-card count zero; turn disabled;
no fake sceneReady; clickable retry. After the interception is removed and
retry is clicked, the model list is genuinely 12/12, both E01/G01 native
duelists appear, the real physical score stays 20:20, and valid cards can
be played again. 14/14 assertions passed, zero unhandled JS errors.

## Legacy regression after adding the scene-ready gate
- R96 native permanent VRM arms, expressions and actual hit test: 30/30 passed.
- R95 real six spell, stadium score and orbit visual test: 26/26 passed.
- R94 audio, 20 playable cards, win/AI win/draw and rematch: 14/14 passed.
- R93 seven-actor native/rollback GPU compatibility: 4/4 passed.
- All exits zero and no JS/GLB errors.

This is manual recovery from failed GLB loading. It does **not** establish that
public network cold-start latency is always fast; further resource profiling
and progressive asset delivery remain separate performance work.
