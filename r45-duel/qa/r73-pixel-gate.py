"""Reject white/unpainted R73 headless-GPU screenshots; require real canvas pixels."""
from pathlib import Path
from PIL import Image,ImageStat
import json,sys
root=Path(__file__).resolve().parent/'evidence/r73'
rows=[]
for name in ('wide','portrait'):
 for angle in (0,45,90,180):
  file=root/f'{name}-{angle}-canvas.png'
  im=Image.open(file).convert('RGB')
  st=ImageStat.Stat(im)
  # Photo-like scene has dark slate background, real color variation,
  # and actual rendered owl actors. Pure white compositor is not acceptable.
  pass_gate=max(st.mean)<215 and max(st.stddev)>16 and all(x>5 for x in st.stddev)
  row={'viewport':name,'angle':angle,'file':file.name,'pass':bool(pass_gate),
    'mean_rgb':[round(v,2) for v in st.mean],
    'stddev_rgb':[round(v,2) for v in st.stddev]}
  rows.append(row)
  print('R73_REAL_PIXEL_GATE',json.dumps(row))
(root/'real-pixel-results.json').write_text(json.dumps(rows,indent=2)+'\n')
if not all(x['pass'] for x in rows):sys.exit(2)
