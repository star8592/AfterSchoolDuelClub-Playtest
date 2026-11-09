# R23: real game-card E02/T02 3D integration

## Completed in real playable homepage
- Deterministic original core game.board[side][focusedLane][0] controls E02/T02
  actual WebGL GLB actor rendering on the left/right battlefield.
- Blender-authored prototype: E02 folded-paper airplane (17 WebGL meshes,
  17,170 triangles) and T02 chef menu (41 meshes, 39,216 triangles).
  GLTF resources are loaded lazily only on real card entry or deliberate demo.
- Actual card-play events and true game UID drive 3D presentation. WebGL
  graphics module NEVER mutates core energy, HP, turn, damage or card draw.
- Three.js scene is inserted as an arena overlay with pointer-events:none.
  All other ten unit cards retain their unchanged placeholder visuals.
- Hand cards, formation and waiting arena view show transparent WebGL captures
  of these exact GLBs, marked experimental and NOT art-approved.
- Research demo preview is explicitly distinct from actual game state.

## Verified against real interactions
- Real core seed 70 includes E02 and T02 in the starting hand. In separate
  actual matches QA clicked real hand button then real lane for each ID.
  Both spend actual 2 energy, show the correct unit UID, and render the
  real GLB scene for at least 17 frames. Restart clears the 3D unit.
- Preview toggle leaves HP, round and energy intact; no fake battle logic.
- On Z890 RTX 5070 Ti, real Vulkan-backed Chrome WebGL2 tested on
  desktop 1280x820 and simulated mobile 390x844, no JS exceptions.
- Original src/core.mjs bytes match private source: 104/104 tests pass.

## Remaining issues / NO-GO
- E01/G01/T01 original face and clothing topology still needs substantial
  original sculpt; R22 PBR lighting did not generate this geometry.
- E02/T02 require full dedicated rig/attack/recoil animation and artist
  approval. They are prototype models, not final 3D commercial game art.
- Ten other unit models and six spell props remain unresolved.
- R22 remains immutable fallback; PlayMoru production not deployed.
