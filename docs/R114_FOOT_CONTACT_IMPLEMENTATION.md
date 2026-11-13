# R114 · Human foot contact, no more bounce sliding

- True foot-joint anchor tracking activates for the original chef M02 GLB
  (LeftFoot/RightFoot), with a measured world-space stance ankle and a
  bounded 6.5cm correction. Fixed rest pose prevents animated bone drift.
- Other Blender Studio characters do not expose their foot joints through
  the current instantiated scene graph: no fabricated IK. They use fixed
  court-ground root height and a smaller displacement in the victory dance.
- The two podium VRM duelists use alternating left/right leg flexion in the
  real J_Bip bones while eliminating root jump during the celebration.
  The existing arm IK, facing, attack priorities and authentic game outcome remain unchanged.
- Flight characters continue to hover and are not forced onto ground.
- Mobile / desktop GPU Chrome: R114 dedicated 12/12, R113 choreography
  regression 26/26, R112 live scene regression 20/20. Evidence in
  r45-duel/qa/evidence/r114-foot.
- R114 is a visual animation correction; this is not a full humanoid
  foot IK solver for every Blender Studio rig. Foot planting of those
  unsupported rigs requires authoritative per-model rig exports.
