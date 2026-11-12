# R98 — Three actual playable school-comedy lessons (single 3D arena)

2026-11-12. Historical source research:
`star8592/AfterSchoolDuelClub` V0.5 three-level campus comedy and
V0.6 chalk / broadcast / poster cinematics; provenance recorded in
`docs/DUEL_PARALLEL_CHATS_CONVERGENCE_20261112.md`.

## Exact product behavior

The current, single-arena `/r45-duel/` homepage has a visible **玩三关剧情教学**
button. One click navigates to the **same game** with
`?mode=tutorial&level=1`. Players can enter or leave from a visible
`自由对战` control without a third menu or account.

The tutorial uses the **same unchanged** R97 `engine.mjs`, real card deck,
real GLB/VRM stadium, default-on Qwen sound and event-driven spell effects.
It does NOT restore legacy three-lane deployment or old CSS placeholder actors.

Each lesson is a fresh scripted **challenge setup** (an opponent unit is
placed in the starting board by taking an actual card from the AI deck/hand).
Only actual cards in the 40-card player's deck are moved into the starting
hand; no ghost cards are created, and the player must use the normal
`playCard` engine action to win each challenge. The lesson itself does not
apply any damage, shield, draw, or energy refund.

| Chapter | Genuine played cards | Checked core event |
|---|---|---|
| 1. 粉笔弹射 | E01 then G01 | `chalk_hit`: 2 true damage, T01 loses 2 HP and leaves the field |
| 2. 广播室串台 | E01 then T01 | `broadcast_draw`: 1 extra actual card, **not** fake cross-lane movement |
| 3. 招新海报 | G01 then T01 | `poster_shield`: +2 actual shield on G01 |

Stages only complete if the authoritative `combo_effect` is present and
its ID is the expected one. The next step reveals a single playable
target card and does not allow ending the turn early. After completion,
the next-stage button replaces the local scenario **without reloading the
70MB+ 3D stadium**; actor UID namespaces are different across lessons to
prevent reuse of previous opponent models. After chapter 3, clicking
the next button opens unrestricted free play.

## Verification

- `node r45-duel/qa/check-r98-three-lessons.mjs`: 100 seeded matches per
  chapter (300 total scenarios), **4,501 assertions passed**. Exact deck
  copy conservation for both players, forced action order, genuine combo
  evidence, and exact HP/shield/draw consequences.
- `ASDC_QA_ORIGIN=http://127.0.0.1:11098 node r45-duel/qa/browser-r98-three-lessons.mjs`:
  Chrome desktop 1550px plus portrait 430px, **80/80 interactive checks,
  zero JS and asset HTTP errors**. Real UI card selection and play buttons,
  no phantom combos, three stages and graduation, sound requested by default,
  genuine 12 current GLBs and two original VRM duelists, shared iframe,
  verified score reset and original free duel accessibility.
- Screenshots and exact report at `qa/evidence/r98/`.
- Release gate still requires R94 audio/endings/rematch, R95 actual 3D
  spell score, R96 permanent IK, and R97 seven animation-capable characters
  including real rollback to pass on the **same branch**.

## Remaining story film work

This R98 increment intentionally ships usable instruction first.
The historic V0.6 multi-shot movie-like cutscene director
(`entrance → action → true impact`, speed/skip/reduced motion) is
**not** reproduced by this UI. R95 actual spell effects and R97 native
character poses remain present. A follow-up 3D combo event director
can animate exact `combo_effect` without mutating game rules and should
reuse current licensed models, music, and voices rather than obsolete CSS
characters. Further actor art/costume review still needed.
