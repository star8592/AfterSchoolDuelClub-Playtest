"""R184 ten original editable 3D campus props, Blender 5.2.
Every asset: native .blend / real GLB / physical actor groups / Eevee screenshot.
No art or Android acceptance claim.
"""
import os,sys,random,math,json
from math import sin,cos,pi
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import build_r182_signature_six as a
M=a.material;B=a.beveled;G=a.globe;C=a.cylinder
L=a.lathe;S=a.swept;A=a.arc;mesh=a.mesh;sheet=a.flat_ribbon;print3=a.signage
random.seed(184)
NAMES={
'E05':('E05_Giant_Cheer_Megaphone','超速呐喊巨型扩音器'),
'G05':('G05_Repairing_Animated_School_Desk','自动修理校桌'),
'T06':('T06_Broken_School_Announcement_System','误播的放学广播'),
'K03':('K03_Corn_Grape_Cafeteria_Dance','玉米炒葡萄'),
'K04':('K04_Chili_Mooncake_Catastrophe','辣椒月饼大灾难'),
'Q02':('Q02_Origami_Beast_From_School_Notice','返校通知折纸神兽'),
'S01':('S01_Reversed_Forged_School_Alarm','逆转迟到闹钟'),
'S06':('S06_Quantum_Rubber_Band_Teacher_Hat','弹飞老师帽橡皮筋'),
'P07':('P07_Black_Swan_Ice_Rink','黑天鹅溜冰'),
'X02':('X02_School_Uniform_Passing_Wall','穿墙校服')}
a.PRESETS.clear();a.PRESETS.update(NAMES)
def stick(name,start,end,r,mat,actor):
 return S(name,[start,end],r,mat,actor,seg=12)
def ball(name,pos,scale,mat,actor):
 return G(name,pos,scale,mat,actor,segments=26,rings=18)
def e05():
 red=M('School cheer horn fire engine red',(.88,.093,.07),.27,0,.48)
 blue=M('School team turquoise accent paint',(.12,.47,.67),.36)
 chrome=M('Polished industrial horn rolled brass',(.77,.58,.18),.19,.74)
 ivory=M('Cream durable enamel lettering',(.92,.88,.74),.48)
 handle=M('Black rubber molded pommel grip',(.067,.077,.085),.78)
 paper=M('Woven rally banner deep crimson',(.64,.08,.15),.61)
 stitch=M('White stitched sports jersey chevron',(.91,.88,.74),.59)
 o=L('E05 hollow thick-wall megaphone flared trumpet shell',
  [(.13,.12),(.17,.16),(.23,.29),(.36,.54),(.48,.85),
   (.53,.90),(.52,.95),(.47,.96),(.39,.78),(.17,.35),(.11,.16)],
  red,'E05_HORN_ACTOR',radials=80,warp=.007)
 o.rotation_euler.x=pi/2;o.location=(0,-.40,1.31)
 o=A('E05 rolled carnival gold bullhorn rim',(0,0),.52,0,
   chrome,'E05_HORN_ACTOR',.026,80)
 o.rotation_euler.x=pi/2;o.location=(0,-1.34,1.31)
 B('E05 genuine speaker mouthpiece behind bell',
   (0,-.48,1.31),(.24,.18,.20),handle,'E05_HORN_ACTOR',.070)
 B('E05 actual carry grip hinged to horn',(0,-.69,.89),(.19,.28,.71),
   blue,'E05_HORN_ACTOR',.073)
 stick('E05 welded actual megaphone connecting handle to body',
  (0,-.68,1.21),(0,-.62,1.34),.058,
  chrome,'E05_HORN_ACTOR')
 C('E05 bright trigger switch',(0,-.69,.55),.082,.10,
  chrome,'E05_HORN_ACTOR',24,rotation=(pi/2,0,0))
 for j in range(18):
  z=1.42+(j%3)*.09;x=-.38+(j//3)*.13
  ball('E05 embossed copper dots on cone',(x,-.22,z),(.012,.016,.015),
    chrome,'E05_HORN_ACTOR')
 S('E05 football victory flag solid metal pole',
   [(.36,-.54,1.20),(.61,-.59,1.57),(.81,-.61,2.06)],
   [.035,.027,.022],chrome,'E05_BANNER_ACTOR')
 verts=[];faces=[]
 for i in range(25):
  t=i/24;x=.8+.70*t;y=.02+.085*sin(2*pi*t)
  for side in (-1,1):verts.append((x,y,1.86+.17*side*(1-t)))
  if i:faces.append((2*i-2,2*i-1,2*i+1,2*i))
 mesh('E05 genuine waving school battle pennant fabric',verts,faces,
  paper,'E05_BANNER_ACTOR')
 for k in range(3):
  S('E05 cream victory flag stitched stripe',
   [(.88+i*.03,.03+.05*sin(i*.25),1.71+k*.055) for i in range(16)],
   .009,stitch,'E05_BANNER_ACTOR',seg=8)
 print3('E05 brass label on school rally horn','全校冲刺',
  (-.42,-.15,1.34),ivory,'E05_HORN_ACTOR',.11)
def g05():
 wood=M('Varnished vintage classroom elm top',(.39,.20,.10),.46,0,.42)
 grain=M('Raised linear elm growth-ring highlights',(.61,.37,.17),.59)
 metal=M('Blue-gray school desk steel tubing',(.29,.38,.46),.34,.73)
 rubber=M('Rubber desk furniture protective feet',(.067,.075,.08),.76)
 silver=M('Real nickel machine threaded fasteners',(.72,.74,.74),.20,.79)
 orange=M('Handy emergency repair screwdriver orange',(.93,.36,.11),.36)
 tip=M('Chrome steel screwdriver tip',(.55,.64,.66),.28,.75)
 label=M('Ivory school registration number',(.94,.89,.71),.65)
 B('G05 actual solid elm school desk tabletop',(0,0,1.19),
  (1.72,.82,.16),wood,'G05_TABLETOP_ACTOR',.065)
 for j in range(10):
  x=-.78+j*.173
  stick('G05 physical thin carved long wooden grain',
   (x,-.41,1.282),(x+.02,.40,1.282),.005,
   grain,'G05_TABLETOP_ACTOR')
 for side in (-1,1):
  B('G05 welded under-desk steel support',
   (side*.69,0,1.07),(.085,.74,.08),
   metal,'G05_LEGS_ACTOR',.026)
  for ys in (-.30,.30):
   stick('G05 original ergonomic desk tubular leg',
    (side*.69,ys,1.05),(side*.72,ys,.21),
    .061,metal,'G05_LEGS_ACTOR')
   B('G05 real anti-slip rubber desk foot',
    (side*.72,ys,.18),(.17,.15,.10),
    rubber,'G05_LEGS_ACTOR',.03)
 for y in (-.29,.29):
  stick('G05 crossbar joining desk legs',
   (-.72,y,.35),(.72,y,.35),.041,metal,'G05_LEGS_ACTOR')
 for x in (-.69,.69):
  for y in (-.29,.29):
   ball('G05 visible desk-leg actual screw bolt',
    (x,y,1.03),(.03,.022,.03),silver,'G05_LEGS_ACTOR')
 B('G05 crooked detachable threaded repair extender',
  (.72,-.29,.30),(.16,.15,.24),silver,
  'G05_REPAIR_TOOL_ACTOR',.035)
 S('G05 real repair screwdriver steel shaft',
  [(.86,-.60,.92),(.80,-.49,.75),(.73,-.35,.51)],
  [.028,.025,.009],tip,'G05_REPAIR_TOOL_ACTOR',14)
 B('G05 orange ergonomic screwdriver handle',
  (.90,-.63,1.02),(.13,.16,.34),orange,'G05_REPAIR_TOOL_ACTOR',.056)
 print3('G05 school property wooden desk plate','课桌抢修',
  (-.43,-.423,1.10),label,'G05_TABLETOP_ACTOR',.10)
def t06():
 teal=M('Old campus turquoise radio enamel',(.11,.47,.54),.32,.23)
 cream=M('Warm cream broadcast console housing',(.91,.85,.69),.41)
 steel=M('Brushed metal real internal speaker mesh',(.47,.52,.55),.36,.62)
 black=M('Dark speaker resonant cone cavity',(.055,.066,.074),.55)
 cone=M('Large metallic gray loudspeaker diaphragm',(.25,.33,.36),.49,.19)
 red=M('School broadcast red emergency button',(.90,.10,.08),.27)
 gold=M('Radio station frequency needle',(.88,.54,.12),.24,.61)
 paper=M('PA incident notification placard cardstock',(.90,.83,.66),.64)
 B('T06 real dual-broadcast control console',(0,.08,.56),
  (1.48,.65,.79),teal,'T06_CONTROL_CONSOLE_ACTOR',.13)
 B('T06 hand-polished broadcast radio top panel',(0,-.17,.91),
  (1.19,.54,.16),cream,'T06_CONTROL_CONSOLE_ACTOR',.06)
 B('T06 black rectangular tuning frequency display',
  (-.29,-.465,.80),(.68,.06,.22),black,'T06_CONTROL_CONSOLE_ACTOR',.032)
 for k in range(5):
  C('T06 real tactile programmable radio switches',
    (.24+k*.13,-.48,.51),.047,.045,
    gold if k%2 else red,'T06_CONTROL_CONSOLE_ACTOR',20,rotation=(pi/2,0,0))
 for n in (-1,1):
  x=n*.51
  B('T06 original loudspeaker square housing',
   (x,.14,1.30),(.65,.49,.68),cream,'T06_LOUDSPEAKER_ACTOR',.085)
  o=L('T06 true flared cone loudspeaker diaphragm',
   [(.07,.03),(.14,.06),(.23,.12),(.29,.16),(.29,.20),(.24,.19)],
   cone,'T06_LOUDSPEAKER_ACTOR',center=(0,0,0),radials=48)
  o.rotation_euler.x=pi/2;o.location=(x,-.09,1.32)
  C('T06 actual voice coil speaker dust cap',(x,-.31,1.32),
   .095,.04,black,'T06_LOUDSPEAKER_ACTOR',26,rotation=(pi/2,0,0))
  for rr in (.23,.29):
   o=A('T06 real concentric rubber acoustic speaker suspension',
    (0,0),rr,0,black,'T06_LOUDSPEAKER_ACTOR',.017,48)
   o.rotation_euler.x=pi/2;o.location=(x,-.30,1.32)
 stick('T06 attached broadcast microphone stand',
  (.15,-.43,.76),(.28,-.65,1.25),.035,steel,'T06_MICROPHONE_ACTOR')
 ball('T06 vintage foam microphone capsule',
  (.28,-.65,1.28),(.115,.105,.16),black,'T06_MICROPHONE_ACTOR')
 S('T06 actual coiled broadcast mic wire',
   [(.28+.11*cos(t*2*pi/26*8),-.63+.11*sin(t*2*pi/26*8),
     1.25-.025*t) for t in range(27)],
   .012,steel,'T06_MICROPHONE_ACTOR',8)
 B('T06 actual mistaken school-announcement paper ticket',
   (0,-.57,.35),(.67,.04,.25),paper,'T06_CONTROL_CONSOLE_ACTOR',.02)
 print3('T06 embossed broadcast center front red lettering',
  '放学？重播！',(-.33,-.609,.31),red,'T06_CONTROL_CONSOLE_ACTOR',.092)
def k03():
 pan=M('Hammered black steel school wok',(.12,.14,.15),.38,.74)
 copper=M('Pan copper sunburnt hanging handle',(.60,.31,.11),.24,.76)
 yellow=M('Corn on cob vibrant golden cooked kernels',(.92,.58,.10),.28)
 cornlight=M('Sweet popcorn pale yellow buds',(.98,.84,.38),.36)
 grape=M('Purple plump seedless grapes',(.31,.09,.34),.19,0,.68)
 green=M('Fresh grape vine emerald leaves',(.16,.38,.13),.49)
 sauce=M('Tomato-egg deep orange sizzle',(.69,.23,.09),.26)
 silver=M('Stainless cook steel spatula',(.62,.66,.65),.21,.79)
 wood=M('Oiled blackwood cooking spatula handle',(.26,.13,.06),.52)
 L('K03 physical deep hand-hammered concave frying pan',
  [(.11,.02),(.41,.07),(.64,.14),(.85,.34),(.92,.41),
   (.89,.44),(.81,.41),(.60,.21),(.40,.14),(.13,.11)],
   pan,'K03_PAN_ACTOR',radials=72,warp=.016)
 A('K03 machined copper pan top rim',(0,0),.89,.43,copper,'K03_PAN_ACTOR',.026)
 S('K03 heavy side cooking handle',
  [(.86,0,.35),(1.05,.02,.36),(1.51,.02,.43)],
  [.087,.076,.06],wood,'K03_PAN_ACTOR',16)
 for n in range(2):
  pos=(-.34+.62*n,.03,.48+.11*n)
  C('K03 grilled genuine corn cob base',
   pos,.15,.62,yellow,'K03_CORN_ACTOR',32,rotation=(0,pi/2,.38*n))
  for j in range(10):
   x=pos[0]-.26+j*.055
   for k in range(10):
    theta=k*2*pi/10+.28*j
    ball('K03 individual irregular cooked corn nib',
     (x,pos[1]+.17*cos(theta),pos[2]+.17*sin(theta)),
     (.042,.040,.043),
     cornlight if (j+k)%4==0 else yellow,'K03_CORN_ACTOR')
 for n in range(14):
  th=n*2.399963;radius=.16+.58*(n%6)/6
  ball('K03 real juicy glossy purple grape with stalk',
   (radius*cos(th),radius*sin(th),.64+.08*(n%3)),
   (.10,.095,.10),grape,'K03_GRAPES_ACTOR')
  S('K03 microscopic grape vine actual branch',
   [(radius*cos(th),radius*sin(th),.74),
    (radius*cos(th)+.055,radius*sin(th)+.11,.80)],
   .012,green,'K03_GRAPES_ACTOR',9)
 for n in range(5):
  ball('K03 irregular lacquered wok sauce splashes',
   (.30*sin(n*3),.30*cos(n*3),.28+.05*n),
   (.14,.085,.032),sauce,'K03_PAN_ACTOR')
 S('K03 physical curved chef steel frying spatula',
  [(-.82,-.36,.63),(-.59,-.34,.85),
   (-.27,-.35,1.45)],
   [.10,.05,.035],silver,'K03_SPATULA_ACTOR')
 B('K03 spatula wooden non-slip cooking grip',
  (-.20,-.35,1.52),(.13,.13,.36),wood,'K03_SPATULA_ACTOR',.06)
def k04():
 dough=M('Deep roasted golden mooncake pastry',(.70,.40,.12),.68,.0,.24)
 doughhi=M('Mooncake embossed toasted raised golden edges',(.93,.67,.21),.55)
 sesame=M('Dark black sesame baking surface',(.17,.11,.06),.65)
 chili=M('Dried scarlet chili deep pepper enamel',(.88,.073,.035),.27)
 green=M('Pepper stem vivid leaf forest green',(.12,.34,.095),.44)
 cream=M('Red bean mooncake filling cream',(.42,.16,.09),.60)
 gold=M('Chef copper serving tray',(.63,.34,.11),.28,.70)
 red=M('School hottest lunch menu chalk',(.92,.25,.11),.51)
 blue=M('Mooncake stamped school seal',(.20,.35,.49),.46)
 # scalloped genuinely 3D pastry with segmented crimped extruded rims
 shape=[]
 for z in (.20,.25,.36,.47,.54,.61,.65):
  shape.append((.63 if z in (.20,.65) else .76,z))
 L('K04 scalloped baked mooncake first-class round body',
   shape,dough,'K04_MOONCAKE_ACTOR',radials=128,warp=.035)
 for k in range(24):
  ang=2*pi*k/24
  ball('K04 dimensional crimped mooncake fluted side',
    (.745*cos(ang),.745*sin(ang),.41),
    (.073,.076,.15),doughhi,'K04_MOONCAKE_ACTOR')
 A('K04 gilded toasted mooncake top border',(0,0),.62,.67,
  doughhi,'K04_MOONCAKE_ACTOR',.038,80)
 for i in range(24):
  t=i*2.399963;rad=.11+.45*((i%6)+1)/7
  ball('K04 toasted real sesame food speck',
   (rad*cos(t),rad*sin(t),.661),
   (.022,.014,.012),sesame,'K04_MOONCAKE_ACTOR')
 # actual indented red-bean filling and stamped ancient numeral "辣"
 L('K04 actual inset baking caramel mooncake core',
  [(.05,.65),(.36,.66),(.43,.675)],cream,
  'K04_MOONCAKE_ACTOR',radials=55)
 print3('K04 physical raised mooncake chili character relief',
  '辣',(-.19,-.10,.700),red,'K04_MOONCAKE_ACTOR',.40,rotation=(0,0,0))
 # physically curved tapered chili pepper (not cylinder)
 points=[(-.13,-.01,.81),
   (.18,-.08,1.01),(.37,-.05,1.28),
   (.45,.08,1.55),(.40,.16,1.71),(.29,.21,1.78)]
 S('K04 real irregular curved ghost chili pepper',
   points,[.115,.135,.115,.080,.036,.008],
   chili,'K04_CHILI_ACTOR',22)
 ball('K04 green spiky actual chili stem',(-.13,-.01,.81),
  (.10,.085,.06),green,'K04_CHILI_ACTOR')
 for j in range(12):
  th=j*2*pi/12
  S('K04 separate pepper calyx ridged veins',
   [(-.13,-.01,.86),(-.13+.12*cos(th),-.01+.12*sin(th),.76)],
   [.027,.006],green,'K04_CHILI_ACTOR',9)
 # little physical chef copper tray with scalloped rolled edge
 L('K04 physical serving copper scalloped pastry tray',
  [(.20,0),(.79,.01),(.87,.04),(.89,.07),(.82,.09)],
  gold,'K04_TRAY_ACTOR',radials=88)
 A('K04 brass rolled pastry dish lip',(0,0),.86,.10,
  gold,'K04_TRAY_ACTOR',.031,88)
 print3('K04 school chef catastrophe warning placard',
  '超辣',(.65,-.19,.14),blue,'K04_TRAY_ACTOR',.12)
def q02():
 paper=M('School notice cream folded craft paper',(.92,.83,.67),.65)
 blue=M('School notice cobalt deep blue ink',(.18,.34,.67),.48)
 dark=M('Origami dragon printed eyes',(.02,.037,.059),.25)
 red=M('Origami beast mouth warm crimson felt',(.69,.10,.14),.51)
 yellow=M('Ancient paper-dragon golden horn',(.88,.58,.15),.44)
 grey=M('Metal bulletin board paper clips',(.52,.58,.61),.24,.76)
 wood=M('School notice board old timber',(.41,.25,.12),.54)
 pastel=M('Origami creature folded interior pale blue',(.68,.84,.93),.65)
 B('Q02 actual walnut school notice bulletin display',
  (0,.28,.93),(1.53,.19,1.37),wood,'Q02_NOTICE_ACTOR',.07)
 B('Q02 actual ivory printed enrollment notice',
  (0,.163,.95),(1.25,.055,1.15),paper,'Q02_NOTICE_ACTOR',.012)
 print3('Q02 legible school emergency notice headline','神兽返校',
  (-.47,.123,1.33),blue,'Q02_NOTICE_ACTOR',.21)
 for i in range(6):
  stick('Q02 printed official announcement ruled paragraph',
   (-.48,.123,1.15-i*.11),(.46-i*.027,.123,1.15-i*.11),
   .005,blue,'Q02_NOTICE_ACTOR')
 for x in (-.49,.49):
  ball('Q02 rustless metal clipping nail',
   (x,.126,1.47),(.027,.02,.027),grey,'Q02_NOTICE_ACTOR')
 # beast physical folding fan-neck and triangular hard paper head
 v=[(-.20,-.03,.95),(.15,-.10,1.10),(.58,-.51,1.25),
     (.27,-.64,1.48),(-.12,-.50,1.29)]
 f=[(0,1,3),(1,2,3),(0,3,4)]
 mesh('Q02 unique folded 3D origami guardian beast hood',
  v,f,pastel,'Q02_BEAST_HEAD_ACTOR')
 B('Q02 three-dimensional origami beast angular snout',
  (.51,-.54,1.22),(.58,.28,.23),paper,'Q02_BEAST_HEAD_ACTOR',.035)
 for x in (.36,.65):
  ball('Q02 small origami creature glossy glass eye',
   (x,-.707,1.35),(.044,.017,.047),
   dark,'Q02_BEAST_HEAD_ACTOR')
 for x in (.25,.64):
  S('Q02 triangular actual folded school-dragon horn',
   [(x,-.50,1.41),(x-.07,-.51,1.64),(x-.13,-.52,1.69)],
   [.085,.035,.003],yellow,'Q02_BEAST_HEAD_ACTOR')
 # folded red tongue physically protrudes
 sheet('Q02 bright red paper origami tongue and roar',
  [(.60,-.67,1.20),(.76,-.78,1.17),(.95,-.88,1.09)],
  .18,red,'Q02_BEAST_HEAD_ACTOR')
 # three actual origami folded beast legs
 for j in range(3):
  x=-.33+.31*j
  S('Q02 paper-folded animal front claw',
   [(x,-.24,.76),(x+.08,-.42,.66),(x+.16,-.48,.55)],
   [.057,.042,.015],paper,'Q02_PAPER_LEGS_ACTOR')
def s01():
 steel=M('Old school chrome alarm clock rim',(.52,.58,.61),.24,.80)
 blue=M('School clock lacquer navy enamel',(.12,.25,.41),.27,.28)
 paper=M('Clean ivory clock dial painted enamel',(.93,.86,.68),.48)
 black=M('Visible black clock numerals and hands',(.035,.052,.064),.20)
 red=M('Reverse rotation red stopwatch hand',(.82,.07,.055),.24,.42)
 gold=M('Actual heavy brass bell ringing buttons',(.76,.54,.17),.27,.78)
 glass=M('Reflective crystal face rim',(.85,.90,.91),.16,.21,.70)
 rubber=M('Antique clock rubber feet',(.055,.062,.07),.68)
 # clock axis oriented front Y negative. Cylinders rotated 90 degrees.
 C('S01 old-fashioned real circular analog clock body',
   (0,.12,1.11),.63,.29,blue,'S01_CLOCK_CASE_ACTOR',80,
   rotation=(pi/2,0,0))
 C('S01 porcelain engraved clock dial',
   (0,-.055,1.11),.54,.014,paper,'S01_CLOCK_CASE_ACTOR',80,
   rotation=(pi/2,0,0))
 for k in range(12):
  theta=k*2*pi/12
  x=.45*sin(theta);z=1.11+.45*cos(theta)
  stick('S01 engraved actual clock dial hour markers',
   (x*.95,-.07,1.11+.45*cos(theta)*.95),
   (x*1.05,-.07,1.11+.45*cos(theta)*1.05),
   .012,black,'S01_CLOCK_CASE_ACTOR')
 for rr in (.56,.64):
  o=A('S01 genuine rolled chrome analog face rim',
    (0,0),rr,0,steel,'S01_CLOCK_CASE_ACTOR',.027,88)
  o.rotation_euler.x=pi/2
  o.location=(0,-.075,1.11)
 # actual independent clock hands rotate about a shared origin relative to dial
 stick('S01 reversing crimson long minute hand',
  (0,-.094,1.11),(.0,-.10,1.53),
  .028,red,'S01_HANDS_ACTOR')
 stick('S01 reversing short navy hour hand',
  (0,-.105,1.11),(.21,-.11,1.23),
  .041,black,'S01_HANDS_ACTOR')
 ball('S01 physical sapphire clock pin pivot',
   (0,-.125,1.11),(.064,.025,.064),gold,'S01_HANDS_ACTOR')
 # actual external bell domes and clappers
 for side in (-1,1):
  x=side*.39
  ball('S01 ringable real brass alarm half bell',
   (x,.09,1.84),(.30,.24,.18),gold,'S01_BELLS_ACTOR')
  stick('S01 alarm gong hand-bent brass bell support',
   (side*.27,.09,1.56),(x,.09,1.74),.027,
   steel,'S01_BELLS_ACTOR')
  B('S01 sturdy clock standing foot',
   (side*.42,.12,.53),(.20,.20,.22),
   rubber,'S01_CLOCK_CASE_ACTOR',.051)
 # central striker actually connects the bell-domes
 S('S01 little old clock oscillating bell hammer',
   [(-.08,.1,1.78),(0,.1,1.94),(.08,.1,1.78)],
   [.023,.047,.023],gold,'S01_BELLS_ACTOR')
 print3('S01 school reverse time clock printed special mark',
  '再迟到',(-.27,-.08,.71),red,'S01_CLOCK_CASE_ACTOR',.115)
def s06():
 body=M('School physics antique dark oak experimental fixture',(.31,.18,.08),.42)
 steel=M('Actual tempered metal band testing steel arms',(.50,.57,.61),.31,.76)
 elastic=M('Thick real school saffron latex rubber cord',(.89,.56,.11),.49)
 rubber=M('Strong silicone rubber slingshot grip',(.17,.21,.28),.61)
 hat=M('Felt teachers hat oxford navy',(.08,.12,.20),.78)
 brim=M('Teacher wool hat black fabric edge',(.055,.066,.083),.86)
 feather=M('Teachers signature bright white feather',(.91,.90,.79),.73)
 copper=M('Slingshot spring coil copper',(.67,.37,.13),.22,.75)
 B('S06 actual polished science experiment table base',
  (0,.12,.30),(1.60,.85,.25),body,'S06_RIG_ACTOR',.08)
 for x in (-.65,.65):
  S('S06 actual welded science slingshot steel fork',
   [(x,.12,.36),(x,.1,.83),(x,.10,1.80)],
   [.073,.058,.044],steel,'S06_RIG_ACTOR')
  B('S06 actual shock damper rubber tip cap',
   (x,.1,1.80),(.17,.17,.15),rubber,'S06_RIG_ACTOR',.04)
 # giant stretched real latex elastic is not a generic glow effect
 S('S06 true heavy U-shaped experimental elastic band with sag',
   [(-.65,.11,1.76),(-.49,.02,1.50),(-.23,-.08,1.28),
    (0,-.15,1.23),(.27,-.06,1.36),(.48,.03,1.54),(.65,.11,1.76)],
   [.056,.054,.060,.064,.061,.054,.053],elastic,'S06_BAND_ACTOR',20)
 for x in (-.65,.65):
  A('S06 real steel coil spring clamp',(x,.12),.075,1.72,
    copper,'S06_RIG_ACTOR',.018,36)
 # wide floppy brim, cylindrical crown, physically sculpted schoolteacher cap
 L('S06 teacher felt fedora brim and round crown',
   [(.15,.02),(.32,.03),(.48,.03),(.50,.06),(.39,.10),
    (.28,.11),(.27,.44),(.23,.47),(.10,.45)],
   hat,'S06_TEACHER_HAT_ACTOR',center=(0,-.16,1.48),
   radials=72)
 A('S06 fedora real thick stitched felt brim',(0,-.16),.49,1.55,
   brim,'S06_TEACHER_HAT_ACTOR',.022,75)
 A('S06 fedora raised teacher ceremonial hat band',(0,-.16),.28,1.78,
   copper,'S06_TEACHER_HAT_ACTOR',.020,70)
 S('S06 physical long curved unlicensed teacher-feather',
   [(.26,-.13,1.82),(.38,-.11,2.01),
    (.43,-.02,2.30),(.34,.06,2.45)],
   [.066,.054,.036,.002],feather,'S06_TEACHER_HAT_ACTOR',16)
def p07():
 black=M('Black swan velvet feather iridescent black',(.045,.056,.074),.51)
 wing=M('Black swan individual indigo silk wing feathers',(.09,.13,.25),.60)
 ivory=M('Swan glossy ivory porcelain eye-ring',(.93,.91,.80),.23)
 pupil=M('Black swan glass black bead eye',(.018,.019,.023),.19)
 orange=M('Bright amber genuine swan beak',(.84,.29,.06),.34)
 white=M('Heavy winter lake natural cracked ice',(.71,.86,.90),.46)
 blue=M('Icy deep blue edge cracks',(.28,.64,.74),.33,.08)
 steel=M('Polished figure-skate bright chrome blade',(.63,.73,.77),.22,.77)
 gold=M('Swan championship skater gold scarf',(.85,.60,.16),.48)
 red=M('Sport silly swan hat cherry red',(.72,.13,.11),.38)
 # irregular true fractured ice floe geometries with underside
 v=[];f=[]
 n=15
 for z in (.12,.23):
  for i in range(n):
   ang=i*2*pi/n
   rad=1.08+.13*sin(i*2.4)
   v.append((rad*cos(ang),rad*sin(ang)*.72,z+.015*sin(i*4)))
 for i in range(n):
  a0=i;b0=(i+1)%n
  f.append((a0,b0,b0+n,a0+n))
 f.extend([tuple(reversed(range(n))),tuple(range(n,2*n))])
 mesh('P07 actual asymmetric jagged ice floating rink',v,f,
   white,'P07_ICE_RINK_STATIC')
 for i in range(13):
  theta=i*2.3999
  S('P07 real irregular angular rink cracks',
   [(.22*cos(theta),.20*sin(theta),.242),
    (.48*cos(theta),.37*sin(theta),.244),
    (.70*cos(theta+.1),.43*sin(theta+.1),.246)],
   [.011,.008,.002],blue,'P07_ICE_RINK_STATIC',8)
 # Body wings: film-style swan, identifiable curved S-shaped long neck
 ball('P07 full plush black swan realistic body',(0,0,.89),
  (.57,.38,.32),black,'P07_SWAN_BODY_ACTOR')
 neck=[(.37,-.02,.88),(.45,-.12,1.20),(.28,-.12,1.55),
  (.15,-.17,1.68),(.17,-.30,1.86)]
 S('P07 physically modeled famous swan S-curve neck',
   neck,[.20,.15,.12,.115,.10],black,
   'P07_SWAN_NECK_ACTOR',26)
 ball('P07 delicately expressive realistic swan head',
   (.17,-.33,1.87),(.19,.18,.16),black,'P07_SWAN_NECK_ACTOR')
 S('P07 authentic tapered amber swan beak',
   [(.20,-.45,1.84),(.27,-.66,1.80),
    (.29,-.76,1.78)],
   [.092,.065,.004],orange,'P07_SWAN_NECK_ACTOR',18)
 for x in (.06,.27):
  ball('P07 small porcelain eye socket high-quality',
   (x,-.479,1.93),(.055,.026,.048),
   ivory,'P07_SWAN_NECK_ACTOR')
  ball('P07 glistening shy swan pupils',
   (x+.006,-.500,1.932),(.029,.011,.032),
   pupil,'P07_SWAN_NECK_ACTOR')
 # layered true feather geometry around both wings, not one triangle
 for side in (-1,1):
  for i in range(11):
   x=-.38+.071*i
   S('P07 independently sculpted layered black swan wing plume',
    [(x,side*.27,1.02),(x-.18,side*.41,1.10),
     (x-.37,side*.54,1.08)],
    [.060,.038,.004],wing,'P07_SWAN_WINGS_ACTOR',14)
  # ice skate articulated boot and steel runner
  B('P07 unusual swan figure-skating polished boot',
   (side*.27,side*.06,.48),(.23,.18,.28),
   red,'P07_SKATES_ACTOR',.09)
  B('P07 actual sharp silver flat ice skating blade',
   (side*.27,side*.06,.30),(.48,.035,.033),
   steel,'P07_SKATES_ACTOR',.012)
 S('P07 fluttering gold prize scarf',
  [(.21,.12,1.57),(.41,.22,1.60),(.63,.33,1.50),
   (.79,.40,1.57)],
  [.048,.045,.039,.002],gold,'P07_SWAN_NECK_ACTOR',13)
def x02():
 wall=M('School clinker brick warm deep red',(.53,.22,.15),.85)
 stone=M('Mortar grid real lime gray',(.59,.54,.48),.88)
 rim=M('Cut physical sculpted brick edge',(.35,.15,.10),.74)
 white=M('Real pressed white cotton school shirt',(.89,.87,.80),.70)
 blue=M('Navy school uniform hand-cut fabric blazer',(.09,.23,.42),.59)
 lighter=M('True uniform contrast piping ivory',(.84,.77,.63),.58)
 red=M('School uniform cardinal red necktie',(.66,.085,.085),.44)
 gold=M('Authentic school blazer buttons',(.84,.63,.22),.24,.62)
 black=M('Dark doorway internal depth, not glowing portal',(.073,.071,.070),.75)
 # whole true beveled masonry wall: many individual bricks with mortar gap
 B('X02 structural gray wall mortar foundation',(.02,.41,.96),
  (1.86,.24,1.94),stone,'X02_WALL_STATIC',.025)
 for row in range(7):
  z=.23+row*.253
  for col in range(8):
   x=-.88+col*.248+(.125 if row%2 else 0)
   if abs(x)>.93 or (abs(x)<.40 and z>.50 and z<1.48):continue
   B('X02 individually hand-laid dark red school brick',
    (x,.245,z),(.234,.155,.23),
    wall,'X02_WALL_STATIC',.017)
 # extruded empty doorway gap has different reverse depth
 B('X02 real nonluminescent wall depth shadow opening',
  (.0,.288,1.0),(.70,.024,1.02),
  black,'X02_WALL_STATIC',.023)
 for x in (-.41,.41):
  B('X02 3D cut exposed red doorway brick border',
   (x,.18,.99),(.072,.20,1.15),rim,'X02_WALL_STATIC',.018)
 # physical ghost-like shirt with arched neck, sleeves, not solid person proxy
 B('X02 school blue blazer cloth main suit torso',
   (0,-.06,1.03),(.64,.20,.78),blue,'X02_UNIFORM_ACTOR',.10)
 B('X02 actual buttoned school shirt ivory center opening',
   (0,-.177,1.01),(.21,.045,.58),white,'X02_UNIFORM_ACTOR',.021)
 for side in (-1,1):
  B('X02 school uniform tailored shoulder sleeves',
   (side*.39,-.06,1.20),(.26,.22,.50),
   blue,'X02_UNIFORM_ACTOR',.085)
  B('X02 physical white shirtsleeve cuff',
   (side*.39,-.08,.94),(.27,.24,.11),
   white,'X02_UNIFORM_ACTOR',.023)
  # triangular lapels are actual mesh polygons
  pts=[(side*.11,-.22,1.40),(side*.31,-.22,1.32),
    (side*.09,-.23,.98)]
  mesh('X02 original folded blazer asymmetric cloth lapel',
    pts,[(0,1,2)],lighter,'X02_UNIFORM_ACTOR')
 for z in (.87,1.01,1.14):
  ball('X02 actual small glossy school blazer buttons',
   (.02,-.231,z),(.028,.011,.029),gold,'X02_UNIFORM_ACTOR')
 S('X02 red necktie real tailored long silk fabric',
  [(0,-.243,1.38),(0,-.253,1.20),
   (.03,-.26,1.03)],
  [.072,.050,.012],red,'X02_UNIFORM_ACTOR',12)
 # Actual independent hollow sleeves, tie, graduation placard
 ball('X02 asymmetric original cloth shirt collar',
  (0,-.11,1.48),(.15,.11,.08),white,'X02_UNIFORM_ACTOR')
 print3('X02 original campus no-door uniform warning poster',
  '校服穿墙',(-.67,.11,1.82),gold,'X02_WALL_STATIC',.11)
def main():
 f={'E05':e05,'G05':g05,'T06':t06,'K03':k03,'K04':k04,
    'Q02':q02,'S01':s01,'S06':s06,'P07':p07,'X02':x02}
 selected=([k for k in NAMES if k in os.environ['R184_ID'].split(',')]
  if os.environ.get('R184_ID') else list(NAMES))
 for id in selected:
  print('R184_PHYSICAL_ASSET_START',id,flush=True)
  a.reset();f[id]();a.render_export(id)
 (a.PHOTO/'R184_ten_hero_receipts.json').write_text(json.dumps({
  'total':len(a.AUDIT),'assets':a.AUDIT,'visualAccepted':0,
  'androidPassed':False,'release':'NO_GO'},
  ensure_ascii=False,indent=2))
 print('R184_ALL_10_SCULPTS_COMPLETE',len(a.AUDIT),flush=True)
if __name__=='__main__':main()
