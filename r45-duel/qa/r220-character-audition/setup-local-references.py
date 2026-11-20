from pathlib import Path
import os
root=Path('r45-duel/qa/r220-character-audition/assets')
root.mkdir(parents=True,exist_ok=True)
sources={
'wealth_chef.glb':Path('/mnt/disk2/projects/WealthTown3D/web-v10-optimized/assets/chef_desktop.glb'),
'wealth_teen.glb':Path('/mnt/disk2/projects/WealthTown3D/web-v10-optimized/assets/teen_desktop.glb'),
'dandao_healer.glb':Path('/home/master/projects/DanDao-V1-OnlinePG-20261119/art-lab/w49/assets/luoqingxing-animated-hanfu-v04.glb'),
'kaykit_general.glb':Path('/mnt/disk2/projects/WealthTown3D/art/vendor/animation/Rig_Medium_General.glb')}
for name,src in sources.items():
 assert src.is_file() and src.stat().st_size>500_000
 dst=root/name
 if dst.exists() or dst.is_symlink():
  assert dst.is_symlink() and dst.resolve()==src
 else:dst.symlink_to(src)
 print('R220_LINK',name,'MB',round(src.stat().st_size/1e6,2),src)
assert (root/'jay-teen-duel-v01.glb').exists()
