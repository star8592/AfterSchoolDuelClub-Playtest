# R92 — Keep old open tabs playable across static root switches

## Incident
On 2026-11-12 the Z890 127.0.0.1:1024 preview server was moved
from a R85 worktree to a R91 worktree. An already-open R85 iframe
continued requesting G03-Jay-BlenderStudio-R85-Acting.glb, but the
R91 worktree only had the R89 model filename. GLTFLoader returned
HTTP 404 and correctly refused to signal scene-ready.

## Repair
Retain all ten historically requested R85 GLBs (including the
R85 character acting files and M01/M02/T01) in the active static
r45-duel/assets/summons/ directory. The current R91/R90.1 code
and its natural R89 models are unchanged; no fake ready or silent
downgrade is introduced. Models are the exact binary assets copied
from the committed R85 worktree, byte-verified.

## Release gate
node r45-duel/qa/check-asset-release.mjs validates GLB v2 headers,
embedded glTF scene/mesh JSON, size and existence for both 10+10
generations. Pass a public or local /r45-duel/ URL as an argument
to also require HTTP 200 and matching Content-Length.

node r45-duel/qa/browser-r92-old-assets.cjs asserts in Chromium
that the latest scene fully becomes ready and the 10 earlier URLs
still return genuine GLB bytes.

Caution: a tab already showing a fatal preload error must reload
once to rerun asset initialization; adding the files alone does not
retroactively retry a rejected Promise.all. Do not change the preview
server's backing directory without retaining active release assets.
