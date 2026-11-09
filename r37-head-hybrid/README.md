# R37 face-sculpt diagnostic — rejected as visual art upgrade

RESEARCH ONLY. ART_APPROVED=false; MESH_FINAL=false; RELEASE_CANDIDATE=false.

This branch explores if a mild anatomically named shape-key applied to the existing R30/R36 skinned parametric face can correct the character's mismatch with the R34 Pixal3D illustration, without topology replacement.

Outcome: NO. The old youthful head and stiff hair remain visually dominant. Same-camera Blender 5.2.3 540x540 renders before/after show only a tiny pixel change (see evidence/face-sculpt-visual-decision.json). Never promote the R37 face as an art improvement.
- Technical geometry: 22,572 head vertices modified via reversible shape key; mean 2.09mm and maximum 5.23mm displacement; preserved all 163 armature bones and R36 torso morph target. No expression animation created.
- Two decorative spectacles meshes decimated 63,168 -> 12,631 triangles, saving 50,537 faces; total candidate 180,584 triangles vs R36 231,121.
- candidate/R37_parametric_face_v1_optimized_glasses.glb is a failed facial visual experiment plus a successful geometric LOD test. Do not replace either R34 artwork model or R36 QA site with this file.

## Actual correction plan
1. Stop iterating on the bad R30 visual head. Keep its skeleton, head/neck control and deformation groups as a non-rendered control cage, not the displayed facial surface.
2. Rebuild a high-quality canonical neutral head using an approved same-identity front/side/three-quarter reference set. The 569x940 R32 single illustration is insufficient to recover accurate face geometry. Need robust facial landmarks; never silently invent a canonical likeness from the up-looking portrait.
3. Model clean edge loops around lids/nasolabial fold/lips/jaw and separate controllable brow, mouth, eyes, teeth and hair. Rig to the existing 163 bones with named skinning masks and facial blend shapes.
4. Treat R34 Pixal cloth and hair as high-resolution shape/material references, rebuild them as separate animation-ready quad meshes, project details to normal/AO/PBR textures, validate four views and deformation. Do NOT bind the single 934k-polygon merged generated surface globally by closest bone.
5. Performance evaluation: optimize accessory mesh FIRST; only keep high triangle density where its visual gain is measurable. Gate on same-camera close-up, source identity, bone poses, silhouette and WebGL2 load, not on polygon count alone.

This branch is separate from the stable R34 real-3D exhibit and the R25 playable 18-card game. The PlayMoru main site is not modified.
