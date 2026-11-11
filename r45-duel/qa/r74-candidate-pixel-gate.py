from pathlib import Path
from PIL import Image,ImageStat
import sys,json
root=Path(__file__).resolve().parent/'evidence/r74/recast'
rows=[]
for viewport in ['wide','portrait']:
 for angle in [0,45,90,180]:
  file=root/f'{viewport}-{angle}-canvas.png'
  im=Image.open(file).convert('RGB');st=ImageStat.Stat(im)
  passed=max(st.mean)<170 and all(v>15 for v in st.stddev)
  row={'viewport':viewport,'angle':angle,'pass':passed,'mean':[round(x,2) for x in st.mean],'stddev':[round(x,2) for x in st.stddev]}
  rows.append(row);print('R74_RECAST_REAL_PIXEL',json.dumps(row))
(root/'pixel-check.json').write_text(json.dumps(rows,indent=2)+'\n')
if not all(x['pass'] for x in rows):sys.exit(3)
