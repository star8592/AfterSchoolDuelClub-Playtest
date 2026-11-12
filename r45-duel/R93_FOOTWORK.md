# R93 — Seven-actor Blender-baked footwork (independent art feature)

Main already included R91 match end/rematch and R92.1 asset QA fixes. This **R93 footwork** change sits on top; it does not touch those workflows.

Seven Blender Studio originals have been re-exported from source rigs with actual FK thigh and foot rotations, including a forward step on Attack and a backward repositioning response on Hit. Existing R89 arms-down poses and R90 event-aligned choreography remain. The newly added `Step` and `Retreat` morph targets follow real Blender evaluated meshes, including footwear and clothing; there are still precisely three semantic glTF clips (`Idle`, `Attack`, `Hit`).

**Scope:** Only `scene/summon-models.mjs` asset mapping and seven immutable GLBs are used in the game. `r93-footwork-review.html` is an independent seven-actor glTF preview, with orbit rotation and clip controls. No rule, match state, payment, result screen, rematch or other project is changed.

**Rollback:** append `?r93Footwork=old` to the game URL, reverting to unchanged R89 GLBs while keeping R90 combat timing, or `?r90Motion=off` for old timing.

**Evidence:** on Z890, real Chrome desktop and portrait checks confirm a nonzero actual `Step` and `Retreat` morph weight in each actor's lower-body mesh. Separate two-batch court tests verify seven actors can be summoned on both sides with correct orientation, animation, safe placement and rollback. `qa/evidence/r93/manifest.json` provides asset hashes, Blender Studio attribution and test results.

**Limits:** FK/shape-key deformation is **not** full live skeletal locomotion, natural foot-plant IK or motion capture. Final motion must still improve knee flexibility, torso/center-of-mass balancing and per-foot ground collision. Visual art remains a prototype requiring further refinement.
