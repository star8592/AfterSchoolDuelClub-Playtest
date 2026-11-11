# R89 — Natural arm-chain stances for seven film-style characters

All 7 premium character bases now begin the three glTF clips Idle/Attack/Hit from significantly more natural arms-down positions instead of the source T-pose. This resolves the actual issue found in visual comparison: the source CloudRig shoulder-control sign was reversed, plus source IK wrist copy still constrained the hands despite the shoulder moving. In R89 the Shoulder/Forearm/Wrist FK chain all follows the same pose. Rain and Snow have their own rig variants and need separate fixes. Original Blender Studio models (Blender Foundation, CC BY 4.0); models and GLB proofs retained on Z890.

This is an incremental game asset improvement; not 7 fully expressive cinematic performances. Browser morph targets embed shoulder/arm/hand and attached cloth, but facial expressions, step/weight balance, finger posing and full-body fighting remain future work. Manual visual review confirmed hands lowered and the R88→R89 comparison is included at `qa/evidence/r89/pose-comparison.jpg`.

**User-facing review:** `r89-animation-review.html` offers 7 character choices, native Idle/Attack/Hit, orbit zoom and speed.

**Safe rollback:** `?r89Study=r88` restores the previous animated GLBs (R88 for 5, R86 Snow and R87 Jay), without removing earlier named rollbacks.

**QA:** Chrome actual desktop 1440x900 and portrait 430x900. Two complete summons batches verified seven roles on both teams and seven genuine Attack/Hit pairs. Previous-version rollback verified on all seven, both screen classes. Seven-character animation review also passed in both viewports, zero JS/HTTP errors. Evidence under `qa/evidence/r89/manifest.json` and executable browser QA scripts.
