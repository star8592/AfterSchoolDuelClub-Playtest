# R95 — Genuine 3D score and spell impacts on the R94 unified mainline

## Source preservation / scope

- Based on latest published R94 `main`, not a hard merge of obsolete R85 scene.
- Reuses original, already tested R85 visual modules
  `scene/live-scoreboard.mjs` and `scene/spell-impact.mjs`, preserving
  the modern R93 character footwork, R94 audio/20-card engine and R91 rematch.
- The physical court jumbotron reads only `ASDC_R81_SCORE` snapshots from
  the game engine. It never writes HP or winner and hides its rear face when
  the user orbits behind the court.
- Six actual spell cards: E05 rally, E06 eraser impact, G05 repair crystals,
  G06 book-page glyphs, T05 warm canteen magic, T06 sonic broadcast.
  Rendering requires `card_play.spellOutcome` emitted by the core; effect
  labels are derived from the actual card, rather than arbitrary VFX.
- Already-used spell serials are ignored to prevent duplicate visuals.
  Targeted alive units may flinch after a real spell; defeated units removed
  by the core are not resurrected just to perform an animation.
- Real direct host hits pulse the corresponding three-dimensional podium and
  are exposed for read-only QA. **R85 natural permanent-duelist full IK poses
  are NOT included here** and remain a separate R96 task.

## Deterministic real-browser verification

`ASDC_QA_ORIGIN=http://127.0.0.1:11095 node r45-duel/qa/browser-r95-score-spells.mjs`

- Actual browser card selections and `play`/turn buttons (no fabricated spell
  event injected into the engine): 26/26 acceptance checks passed, zero JS or
  local GLB/asset HTTP errors.
- G05, T05, E06, E05, T06, G06 all actually played, visually projected into
  the 3D arena, and verified against the canonical scoreboard.
- An E06 eraser really reduced HP by 3 in the validated sample; T06 dealt
  damage to 3D in-arena units, and support spells left HP unchanged.
- `r45-duel/qa/evidence/r95/r95-real-browser-report.json` has exact card IDs,
  seeds, event serials, rule outcomes and derived scene stats.
- Front/back orbit automatically hides/reveals physical LED without mutating the HUD.
- R94 real Chrome audio/20 cards/win-loss-draw/rematch regression 14/14;
  R93 actual GPU 7-character animation and fallback regression 4/4.

## Art and next work

The added scene elements are functional 3D prototypes, not final visual
art-direction sign-off. Next work: natural non-T/A-pose permanent duelists with
native IK and reaction/blink/face animation, more precise character hit/death
beats, and visual comparison to reference frames. No silent low-poly fallback.
