"""R183 eight additional independent school-comedy Blender sculptures.
Uses same tested R182 export/render library but new authored mesh geometry,
individual physical moving subassemblies and eight nonrepeating silhouettes.
Each output is independent editable .blend + GLB + true Eevee source preview.
"""
import os,random,math,json,sys
from math import sin,cos,pi
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).resolve().parent))
import build_r182_signature_six as a
m=a.material;b=a.beveled;g=a.globe;cy=a.cylinder
lathe=a.lathe;sw=a.swept;arc=a.arc;mesh=a.mesh;rib=a.flat_ribbon;letter=a.signage
ids={
 'P03':('P03_Cardboard_Tyrannosaurus_Stomp','纸箱霸王龙'),
 'S08':('S08_Angry_Campus_Vending_Machine','暴怒售货机'),
 'X03':('X03_Rooftop_School_Patrol_Car','教务车屋顶违停'),
 'Q06':('Q06_Three_Click_Moonlight_Desk_Lamp','三连拍台灯'),
 'K02':('K02_Watermelon_Rubber_Eraser_Stew','橡皮炖西瓜'),
 'K08':('K08_Chocolate_Armored_Banana_Knight','巧克力装甲香蕉'),
 'S03':('S03_Antigravity_School_Broom','反重力扫把'),
 'Q01':('Q01_SelfWriting_Apology_Eraser','自动写检讨橡皮')}
a.PRESETS.clear();a.PRESETS.update(ids)
random.seed(18308)
def stick(name,p1,p2,r,mat,actor):
 return sw(name,[p1,p2],r,mat,actor,seg=14)
def bulge(name,cent,scale,mat,actor,detail=26):
 return g(name,cent,scale,mat,actor,detail,16)
def p03():
 card=m('Corrugated warm ochre craft cardboard',(.54,.33,.16),.82)
 edge=m('Open corrugated brown cardboard edges',(.31,.17,.077),.88)
 tape=m('Crossed packaging paper tape',(.78,.58,.26),.61)
 rust=m('Cardboard printed dark marker outlines',(.12,.15,.18),.71)
 tooth=m('Handcut white craft foam dinosaur teeth',(.86,.83,.66),.74)
 eyes=m('Googly plastic eyeball whites',(.94,.96,.93),.25)
 pupil=m('Googly pupils hard black',(.018,.025,.034),.20)
 red=m('School art club red paint',(.8,.12,.07),.45)
 # actual assembled carton body with creased and folded panels
 b('P03 cardboard T-Rex large rounded belly',(.05,0,1.02),
  (1.32,.67,1.02),card,'P03_BOX_BODY_ACTOR',.14)
 for i in range(5):
  z=.66+i*.16
  stick('P03 visible exposed corrugation side lines',
   (-.60,-.35,z),(.61,-.35,z+.018*sin(i)),.015,edge,'P03_BOX_BODY_ACTOR')
 for x in (-.56,.54):
  stick('P03 taped crossbar on cardboard belly',
   (x,-.37,.67),(x*.65,-.37,1.42),.025,tape,'P03_BOX_BODY_ACTOR')
 # dinosaur neck and large illustrated hinged jaw
 b('P03 back-folded neck',(.42,.07,1.54),
  (.55,.49,.83),card,'P03_DINO_HEAD_ACTOR',.13)
 b('P03 enormous square roaring T-Rex head',(.71,-.04,1.94),
  (.99,.63,.57),card,'P03_DINO_HEAD_ACTOR',.10)
 b('P03 actual separate hollow jaw',(.90,-.17,1.66),
  (1.08,.48,.19),edge,'P03_DINO_HEAD_ACTOR',.042)
 for side in (-1,1):
  bulge('P03 oversized googly dinosaur eye',
   (.53,side*.32,2.06),(.17,.042,.15),eyes,'P03_DINO_HEAD_ACTOR',22)
  bulge('P03 independently molded googly pupil',
   (.60,side*.363,2.07),(.066,.025,.067),pupil,'P03_DINO_HEAD_ACTOR',16)
 for i in range(8):
  x=.49+i*.115
  tip=(x,-.34,1.75)
  sw('P03 triangular foam jaw teeth',[(x,-.32,1.82),tip],
    [.049,.008],tooth,'P03_DINO_HEAD_ACTOR',9)
 # handpainted dorsal spikes (no generic rings)
 for i in range(5):
  x=-.55+i*.30
  sw('P03 actual cardboard cut dorsal spine',
   [(x,.05,1.53),(x-.08,.06,1.67),(x-.15,.08,1.77)],
   [.10,.08,.009],red,'P03_BOX_BODY_ACTOR',11)
 # strong dinosaur kick legs with real claw-toes and shadow-sense
 for x in (-.40,.44):
  b('P03 large leg thigh carton fold',(x,-.1,.54),(.31,.44,.54),
   card,'P03_DINO_LEGS_ACTOR',.08)
  b('P03 three-toed claw sole',(x,-.28,.20),(.40,.65,.16),
   edge,'P03_DINO_LEGS_ACTOR',.07)
  for j in (-1,0,1):
   sw('P03 white painted dinosaur toe nail',
    [(x+j*.12,-.58,.20),(x+j*.12,-.68,.19)],
    [.054,.007],tooth,'P03_DINO_LEGS_ACTOR',11)
 # rectangular cardboard tail curling backward
 sw('P03 crooked folded long dinosaur tail',
 [(-.50,.21,.94),(-.78,.27,.85),(-1.05,.32,.70),(-1.30,.35,.82)],
 [.26,.22,.13,.028],card,'P03_DINO_TAIL_ACTOR',14)
 letter('P03 School art club press label','纸箱霸王龙',(-.52,-.37,1.20),
   red,'P03_BOX_BODY_ACTOR',.11)
def s08():
 shell=m('Candy mint machine enamel',(.13,.48,.43),.27, .42)
 dark=m('Vending black glass monitor',(.022,.04,.055),.19,.12)
 steel=m('Steel reinforced chrome bevel',(.45,.56,.58),.23,.75)
 drink1=m('Fizzy orange soda aluminum',(.94,.30,.04),.23,.67)
 drink2=m('School cola burgundy can',(.53,.062,.10),.23,.72)
 drink3=m('Mint soda bottle bright teal',(.07,.71,.69),.22,.54)
 white=m('White typographic credit display',(.90,.91,.81),.42)
 yellow=m('Angry brass yellow flashing price',(.94,.60,.11),.32)
 button=m('Red vending emergency coin reject button',(.85,.07,.04),.27)
 mouth=m('Black vending mouth cavity',(.03,.035,.035),.70)
 b('S08 solid mint steel body',(.0,.09,.94),(1.13,.78,1.66),shell,
   'S08_MACHINE_ACTOR',.14)
 b('S08 chilled product display black glass',(-.16,-.321,1.31),
   (.70,.09,.75),dark,'S08_MACHINE_ACTOR',.055)
 for j in range(2):
  for k in range(3):
   x=-.42+j*.31;z=1.09+k*.21
   cy('S08 genuine soda can cylindrical shell',(x,-.388,z),.090,.19,
      [drink1,drink2,drink3][(j+k)%3],'S08_MACHINE_ACTOR',24)
   arc('S08 actual soda top metal roll',(x,-.388),.075,z+.106,
     steel,'S08_MACHINE_ACTOR',.012,24)
 b('S08 large angry OLED face above sodas',(.10,-.344,1.85),
   (.77,.08,.22),dark,'S08_FACE_ACTOR',.04)
 for x,sgn in [(-.12,1),(.30,-1)]:
  stick('S08 visible slanted angry eyebrow',
   (x-.095,-.392,1.89+sgn*.04),(x+.095,-.392,1.85-sgn*.04),
   .025,button,'S08_FACE_ACTOR')
  bulge('S08 red angry pupil',(x,-.399,1.81),(.052,.017,.045),
    yellow,'S08_FACE_ACTOR',12)
 b('S08 snarling lower output hatch',(.08,-.359,.38),
   (.82,.105,.22),mouth,'S08_MACHINE_ACTOR',.06)
 b('S08 real removable chrome dispensing door',(.0,-.416,.23),
   (.60,.05,.11),steel,'S08_MACHINE_ACTOR',.03)
 b('S08 physical coin-in slot',(.44,-.35,1.46),
   (.09,.040,.18),dark,'S08_MACHINE_ACTOR',.014)
 bulge('S08 aggressively blinking red button',(.43,-.378,1.13),
   (.08,.035,.073),button,'S08_FACE_ACTOR',16)
 for i in range(5):
  x=-.26+.13*i;z=.47+.07*(i%2)
  cy('S08 real expelled beverage aluminum cylinder',
   (x,-.65,z),.10,.28,
   [drink1,drink2,drink3][i%3],'S08_FLYING_CAN_ACTOR',24,rotation=(pi/2,0,.13*i))
  arc('S08 pulled aluminum tab and rim',(x,-.65),.080,z+.15,
    steel,'S08_FLYING_CAN_ACTOR',.013,24)
 letter('S08 machine angry top marque','不投币就喷你',(-.42,-.36,1.63),
  yellow,'S08_FACE_ACTOR',.10)
def x03():
 roof=m('Old red school clay roof tiles',(.54,.16,.11),.7)
 rooftrim=m('Campus terracotta faded crest trim',(.86,.40,.20),.55)
 car=m('Bright toy school patrol taxi yellow',(.94,.63,.10),.22,.1,.6)
 window=m('School patrol tinted sky-blue windscreen',(.20,.60,.73),.18,.18,.65)
 steel=m('Windshield aluminum metallic trim',(.45,.47,.49),.22,.8)
 wheel=m('Actual rubber black tire',(.042,.050,.057),.74)
 hub=m('Silver polished hubcaps',(.71,.75,.71),.21,.78)
 red=m('Hand-painted traffic fine red',(.78,.08,.06),.50)
 paper=m('Warm ticket stationery',(.92,.86,.73),.63)
 b('X03 school roof rectangular eave',(0,.10,.28),(2.03,1.29,.26),rooftrim,
   'X03_ROOF_STATIC',.055)
 # two sloping ridged roof tile planes using authored quad meshes:
 for sign in (-1,1):
  v=[];f=[]
  for j in range(9):
   y=sign*(.05+j*.068)
   z=.82-.44*j/8+.019*sin(j*pi)
   for i in range(21):
    x=-.97+i*.097
    v.append((x,y,z+.012*sin((i+j)*pi)))
    if i and j:
     a0=(j-1)*21+i-1
     f.append((a0,a0+1,a0+22,a0+21))
  mesh('X03 overlapped roof tile ridged curved plane',v,f,roof,
    'X03_ROOF_STATIC')
 for y in (-.60,.60):
  sw('X03 real terracotta roof ridge',
   [(-1.0,y,.35),(0,y,.40),(1,y,.35)],
   .04,rooftrim,'X03_ROOF_STATIC',10)
 # Toy police car sits ridiculously across the roof ridge.
 b('X03 die-cast school patrol car chassis',(0,0,1.00),
   (1.22,.57,.32),car,'X03_CAR_ACTOR',.16)
 b('X03 car front bonnet',(.39,0,1.20),(.45,.55,.17),
   car,'X03_CAR_ACTOR',.065)
 b('X03 toy car cabin',( -.10,0,1.25),(.63,.51,.46),
   car,'X03_CAR_ACTOR',.13)
 b('X03 curved front windscreen glass',(.18,-.01,1.40),
   (.055,.46,.24),window,'X03_CAR_ACTOR',.026)
 for y in (-.281,.281):
  b('X03 door glass window',( -.18,y,1.43),(.40,.03,.20),
   window,'X03_CAR_ACTOR',.025)
 for x in (-.39,.40):
  for y in (-.29,.29):
   cy('X03 genuine treaded rubber tire',(x,y,0.96),
    .17,.10,wheel,'X03_CAR_ACTOR',32,rotation=(pi/2,0,0))
   cy('X03 shiny curved chrome wheel hub',(x,y+(.065 if y>0 else -.065),.96),
    .070,.013,hub,'X03_CAR_ACTOR',24,rotation=(pi/2,0,0))
 b('X03 roof mounted blue warning beacon',(-.08,0,1.54),
   (.24,.16,.09),window,'X03_CAR_ACTOR',.04)
 for x in (.61,-.61):
  bulge('X03 front headlights and red tail lamps',(x,-.17,1.10),
   (.03,.09,.045),hub if x>0 else red,'X03_CAR_ACTOR',12)
 # the failure ticket is a PHYSICAL flying written sheet
 rib('X03 actual whipping roof parking fine receipt',
   [(.68,-.46,1.18),(.83,-.57,1.27),(.95,-.68,1.47),
    (1.14,-.73,1.59)],.38,paper,'X03_TICKET_ACTOR')
 letter('X03 big traffic ticket printed label','屋顶违停罚单',
  (.66,-.77,1.39),red,'X03_TICKET_ACTOR',.10)
def q06():
 brass=m('Antique desk lamp burnished bronze',(.59,.39,.16),.28,.72)
 shade=m('Porcelain goose-neck lamp yellow enamel',(.93,.73,.25),.27,.16,.8)
 shadeinside=m('Lamp matte warm pearl inner reflector',(.92,.88,.63),.47,.0)
 cable=m('Soft cloth braided black lamp cord',(.075,.065,.062),.73)
 btn=m('Classroom enormous red push button',(.85,.075,.043),.24,.08,.8)
 grey=m('Robot desk lamp joint dark graphite',(.13,.18,.22),.24,.53)
 eye=m('Desk lamp bright white filament',(.95,.94,.79),.17,.0,.9)
 base=m('Polished walnut square base',(.30,.15,.07),.39,0,.5)
 signmat=m('Three-stage control ivory lettering',(.97,.90,.75),.52)
 b('Q06 actual weighted rectangular walnut desk base',(0,.08,.18),
  (.94,.77,.22),base,'Q06_BASE_ACTOR',.11)
 cy('Q06 die-cast articulated brass base collar',(0,.08,.40),.16,.15,
  brass,'Q06_BASE_ACTOR')
 sw('Q06 double articulated gooseneck metal lamp arm',
  [(0,.08,.39),(.14,.10,.59),(.34,.06,.98),(.26,-.05,1.49),
   (.11,-.11,1.79)], [.09,.075,.055,.060,.045],
  brass,'Q06_SHADE_ACTOR')
 for point in ((.14,.10,.59),(.26,-.05,1.49)):
  g('Q06 actual exposed swivel ball joint',point,
   (.11,.11,.11),grey,'Q06_SHADE_ACTOR',20,14)
 # Conical flared lampshade, inner+outer real thickness, open bottom:
 lathe('Q06 double-walled concave fluted desk lampshade',
  [(.13,0),(.20,.025),(.32,.095),(.46,.29),(.51,.34),(.49,.37),
   (.44,.35),(.29,.14),(.16,.085)],
   shade,'Q06_SHADE_ACTOR',center=(.11,-.11,1.65),radials=54,warp=.018)
 arc('Q06 deep bronzed rim of lamp shade',(.11,-.11),.496,2.0,
  brass,'Q06_SHADE_ACTOR',.027,64)
 g('Q06 physical pearlescent halogen bulb',(.11,-.11,1.75),
  (.13,.13,.17),eye,'Q06_SHADE_ACTOR',24,16)
 # The 3-count button control visibly has three actual buttons
 for n in range(3):
  x=-.29+n*.28
  cy('Q06 punchy real pushbutton cylindrical stem',
   (x,-.22,.34),.100,.11,brass,'Q06_BUTTONS_ACTOR',28)
  g('Q06 bright red compressible button cap',
   (x,-.22,.41),(.095,.095,.06),btn,'Q06_BUTTONS_ACTOR',24,12)
  letter('Q06 engraved three-press roman numerals',
   str(n+1),(x-.028,-.326,.46),signmat,'Q06_BUTTONS_ACTOR',.085)
 sw('Q06 braided cloth electrical wire curved',
  [(.0,.23,.42),(-.32,.30,.40),(-.53,.17,.27),
   (-.74,-.11,.12)],.029,cable,'Q06_BASE_ACTOR',12)
def k02():
 watermelon=m('Farm-grown dark emerald watermelon skin',(.07,.27,.10),.48,0,.4)
 strip=m('Actual watermelon irregular lighter green stripes',(.22,.48,.13),.52)
 flesh=m('Juicy cut watermelon vivid coral flesh',(.89,.16,.20),.19,0,.69)
 rind=m('Watermelon juicy pale rind',(.88,.85,.63),.48)
 seed=m('Black watermelon glossy seed droplets',(.050,.032,.029),.26)
 white=m('School premium soft white eraser rubber',(.88,.88,.83),.78)
 blue=m('Eraser protective teal sleeve',(.13,.41,.55),.52)
 blush=m('Chewed eraser irregular bite crumb',(.72,.69,.62),.87)
 # 3D half melon bowl concave real lathed shell
 lathe('K02 sculpted watermelon cross-section bowl carved',
 [(.03,.08),(.35,.08),(.60,.14),(.80,.30),(.91,.55),
  (.94,.67),(.88,.68),(.82,.54),(.69,.35),(.50,.24),(.03,.22)],
 watermelon,'K02_MELON_ACTOR',radials=72)
 for j in range(12):
  a0=j*2*pi/12
  pts=[]
  for i in range(12):
   t=i/11
   pts.append((.92*cos(a0+.06*sin(t*5)),.92*sin(a0+.06*sin(t*5)),
    .53-.29*t))
  sw('K02 raised naturally curved rind stripe',pts,.024,
   strip,'K02_MELON_ACTOR',10)
 lathe('K02 handcut ruby flesh in true concave slice',
 [(.06,.38),(.48,.38),(.68,.43),(.82,.50),(.85,.59),
  (.77,.61),(.50,.53),(.08,.48)],
 flesh,'K02_MELON_ACTOR',radials=64)
 arc('K02 white rind pulp ring',(0,0),.84,.61,rind,
  'K02_MELON_ACTOR',.027,72)
 for k in range(20):
  alpha=k*2.399963
  rad=.18+.51*(k%5)/5
  g('K02 actual watermelon black curved teardrop seed',
   (rad*cos(alpha),rad*sin(alpha),.49+.006*(k%3)),
   (.025,.045,.013),seed,'K02_MELON_ACTOR',12,10)
 # giant actual rectangular rubber with sleeve and a bite mark
 b('K02 rectangular giant school eraser body',
  (-.36,-.19,1.21),(.70,.41,.48),white,'K02_ERASER_ACTOR',.09)
 b('K02 actual eraser cardboard sleeve',
  (-.36,-.19,1.19),(.39,.45,.54),blue,'K02_ERASER_ACTOR',.05)
 for i in range(7):
  a=i*pi/6
  g('K02 partly eaten tiny rubber crumbs',
    (.08+.13*cos(a),-.36,1.29+.14*sin(a)),
    (.038,.03,.035),blush,'K02_ERASER_ACTOR',12,8)
 letter('K02 eraser size and original label','橡皮真的能炖?',
   (-.55,-.44,1.18),white,'K02_ERASER_ACTOR',.09)
 # Both halves absurdly bounce, with actual shield ring a melon slice
 arc('K02 physical watermelon translucent-looking safety rim',
   (0,0),1.00,.61,rind,'K02_MELON_ACTOR',.025,72)
def k08():
 peel=m('Ripe banana bright golden yellow real peel',(.97,.70,.15),.32,0,.46)
 peelhi=m('Raised banana ivory peach seams',(.99,.85,.44),.43)
 spots=m('Real banana toasted brown spots',(.35,.17,.06),.58)
 armor=m('Tempered dark chocolate knight cuirass',(.21,.083,.055),.22,0,.65)
 gold=m('Belgian caramel bronze chocolate trim',(.73,.37,.14),.23,.55)
 eye=m('Brave knight banana cartoon eye',(.02,.03,.042),.14)
 shield=m('Sculpted dark milk chocolate shield',(.33,.09,.065),.19,.12,.72)
 teeth=m('White porcelain banana knight smile',(.94,.91,.73),.3)
 # curve actual yellow banana with round sections, not oval cylinder
 path=[]
 for i in range(31):
  t=i/30
  path.append((-.48+.93*t,.06+.22*sin(pi*t),
   .31+1.13*t+.11*sin(t*pi)))
 radii=[.095+.17*sin(pi*(i+.3)/31)**.55 for i in range(31)]
 sw('K08 expressive curved golden banana body',path,radii,peel,
  'K08_BANANA_ACTOR',18)
 for offset in (.0,pi*.45,pi*.90):
  ribpoints=[]
  for i,p in enumerate(path):
   t=i/30
   ribpoints.append((p[0]+radii[i]*.74*cos(offset),
     p[1]+radii[i]*.74*sin(offset),p[2]+.034))
  sw('K08 physically embossed full length banana ridge',
   ribpoints,.014,peelhi,'K08_BANANA_ACTOR',10)
 for j in range(13):
  p=path[3+j*2]
  g('K08 authentic irregular ripe banana brown pockmark',
   (p[0]+.12,p[1]-.14,p[2]+.02),
   (.020+.015*(j%3),.01,.024),spots,'K08_BANANA_ACTOR',12,8)
 # armor is geometry, not a generic glow
 b('K08 dark carved chocolate chest armor center',
   (.03,-.16,1.07),(.45,.29,.43),
   armor,'K08_ARMOR_ACTOR',.11)
 for x in (-.19,.19):
  b('K08 dark chocolate overlapping segmented cuirass pauldrons',
   (x,-.08,1.21),(.17,.30,.19),
   armor,'K08_ARMOR_ACTOR',.057)
 for h in (.90,1.02,1.15):
  sw('K08 physically sculpted gold trim curved around breastplate',
   [(-.21,-.30,h),(-.08,-.33,h+.015),(.08,-.33,h+.018),
    (.23,-.27,h)],.012,gold,'K08_ARMOR_ACTOR',10)
 lathe('K08 small pointed knight chocolate helm',
  [(.10,0),(.20,.06),(.25,.20),(.24,.34),(.16,.49),
   (.06,.56)],armor,'K08_HELMET_ACTOR',
  center=(.32,-.05,1.34),radials=40)
 for j in range(3):
  sw('K08 embossed helmet bronze crest fin',
   [(.29,-.06,1.67+j*.03),(.24,-.05,1.85+j*.035)],
   [.042,.010],gold,'K08_HELMET_ACTOR',12)
 b('K08 real heraldic shield molded chocolate',
  (.55,-.26,.99),(.47,.15,.59),
  shield,'K08_SHIELD_ACTOR',.12)
 for i in range(6):
  a=i*2*pi/6
  g('K08 beautiful gold boss on chocolate shield',
   (.55+.15*cos(a),-.35,.99+.20*sin(a)),
   (.036,.019,.037),gold,'K08_SHIELD_ACTOR',14,8)
 sw('K08 raised heroic golden X on shield',
  [(.42,-.367,.85),(.55,-.370,1.02),(.71,-.367,1.14)],
  .021,gold,'K08_SHIELD_ACTOR',10)
 for x in (.25,.41):
  g('K08 bright black helmet peek eye',
    (x,-.29,1.59),(.034,.017,.044),
    eye,'K08_HELMET_ACTOR',14,10)
def s03():
 shaft=m('Natural polished beech wood broom shaft',(.53,.30,.11),.39)
 bristle=m('Hand-tied straw broom natural fibers',(.71,.52,.22),.78)
 tip=m('Broom brass fastening fork',(.55,.40,.18),.32,.72)
 dust=m('Suspended real chalk dust grey-beige',(.80,.77,.69),.87)
 paper=m('Flying classroom chalk scrap',(.90,.87,.77),.76)
 blue=m('School janitor canvas tie',(.22,.40,.57),.62)
 wood=m('Broom head engraved darker wood',(.27,.14,.07),.45)
 sw('S03 real long curved broom wooden handle',
  [(-.17,0,2.20),(-.08,0,1.76),
   (.02,.0,1.19),(.09,.05,.58)],
  [.045,.041,.049,.061],shaft,
  'S03_BROOM_ACTOR',18)
 b('S03 true dense broom hardwood sweeping crossbar',
   (.09,.07,.50),(.87,.25,.20),
   wood,'S03_BROOM_ACTOR',.05)
 for j in range(48):
  x=-.32+(j%16)*.057
  y=-.09+(j//16)*.08
  z=.47
  pts=[(x,y,z),(x+.04*sin(j*1.3),y-.03,.31),
   (x+.05*sin(j*2.7),y-.08,.11+.025*sin(j*.6))]
  sw('S03 individually bent natural broom fiber',pts,
   [.018,.011,.003],bristle,'S03_BROOM_ACTOR',7)
 for x in (-.24,.24):
  cy('S03 metal fastening ferrule',(x,.05,.48),
   .055,.095,tip,'S03_BROOM_ACTOR',18)
 sw('S03 blue woven janitor binding cable',
  [(-.21,.14,.54),(0,.17,.55),(.24,.13,.54)],
  .027,blue,'S03_BROOM_ACTOR',10)
 for j in range(22):
  angle=j*2.399963;r=.20+.64*(j%7)/7
  p=(r*cos(angle),r*sin(angle),.28+.055*j)
  g('S03 actual dust gravity-defying irregular cloud',p,
   (.024+.014*(j%3),.027+.010*(j%4),.019+.010*(j%2)),
   dust,'S03_REVERSED_DUST_ACTOR',12,9)
 for i in range(6):
  p=(.5*sin(i*2.6),-.44+.09*i,.76+.16*i)
  rib('S03 flying scrap sheet because janitor reversed gravity',
   [(p[0]-.08,p[1],p[2]),(p[0],p[1]-.07,p[2]+.06),
    (p[0]+.13,p[1]-.10,p[2]+.11)],
    .11,paper,'S03_REVERSED_DUST_ACTOR')
def q01():
 rubber=m('Natural cream pencil eraser soft rubber',(.92,.80,.62),.75)
 blue=m('Eraser cardboard blue school wrapper',(.18,.38,.63),.59)
 eye=m('Eraser goofy charcoal pupils',(.026,.042,.062),.28)
 pink=m('Embarrassed rubber blush coral',(.81,.32,.27),.44)
 lead=m('Actual dark graphite sharpened pencil point',(.06,.075,.08),.64)
 wood=m('Pencil exposed cedar wood',(.76,.49,.19),.42)
 yellow=m('Pencil No2 lacquer yellow',(.93,.58,.08),.28)
 red=m('Teacher red crosses permanent marker ink',(.80,.052,.07),.46)
 paper=m('Formal apology notebook warm cream paper',(.92,.88,.76),.58)
 line=m('Pale blue notebook handwriting ruling',(.32,.52,.71),.58)
 # not a cube avatar: soft, beautifully bevelling with real detailed limbs
 b('Q01 giant anthropomorphic eraser rounded rubber body',
   (-.20,.15,1.01),(.72,.41,.93),
   rubber,'Q01_ERASER_ACTOR',.13)
 b('Q01 actual school eraser cardboard blue wrapper waist',
  (-.20,.13,.79),(.76,.44,.42),blue,'Q01_ERASER_ACTOR',.055)
 for ex in (-.38,-.05):
  g('Q01 real goofy expressive eraser pupils',
   (ex,-.065,1.23),(.067,.019,.08),eye,'Q01_ERASER_ACTOR',18,12)
 for ex in (-.44,.03):
  g('Q01 self-conscious pink rubber blush',
   (ex,-.075,1.08),(.092,.019,.049),
   pink,'Q01_ERASER_ACTOR',18,10)
 sw('Q01 hand-cut human smile crescent',
  [(-.37,-.09,.99),(-.20,-.102,.93),(-.07,-.09,1.01)],
  .014,eye,'Q01_ERASER_ACTOR',12)
 for x in (-.53,.12):
  sw('Q01 actual floppy eraser arm',
    [(x,.15,1.00),(x+.11,.02,.85),(x+.15,-.16,.68)],
    [.088,.074,.052],rubber,'Q01_ERASER_ACTOR',14)
 # individual physical pencil, autonomous moving and writing on real paper
 sw('Q01 authentic cedar colored pencil yellow barrel',
  [(.09,-.40,.96),(.30,-.45,.70),(.48,-.48,.38)],
  [.074,.067,.056],yellow,'Q01_AUTOWRITING_PENCIL_ACTOR',18)
 sw('Q01 exposed sharpened wooden pencil tip',
  [(.48,-.48,.38),(.55,-.48,.26)],
  [.056,.01],wood,'Q01_AUTOWRITING_PENCIL_ACTOR',18)
 sw('Q01 real graphite writing nib',
  [(.55,-.48,.26),(.58,-.48,.21)],
  [.022,.003],lead,'Q01_AUTOWRITING_PENCIL_ACTOR',12)
 # actual curved apology sheet with blue lines, red cross cancellations
 verts=[];faces=[]
 for j in range(17):
  t=j/16
  for k in range(2):
   verts.append((-.66+1.39*t,-.62+.82*k,
    .20+.050*sin(pi*t)+.013*sin(k*3*t)))
  if j:faces.append((2*j-2,2*j-1,2*j+1,2*j))
 mesh('Q01 real handwritten apology paper curved surface',
   verts,faces,paper,'Q01_APOLOGY_PAPER_ACTOR')
 for k in range(8):
  yy=-.51+k*.10
  sw('Q01 repeated handwritten correction lines',
   [(-.53+i*.066,yy,.252+.022*sin(i*pi/19)) for i in range(20)],
    .004,line,'Q01_APOLOGY_PAPER_ACTOR',6)
 for j in range(3):
  xx=-.40+.45*j
  for direction in (-1,1):
   sw('Q01 emphatic raised red apology correction X',
    [(xx+i*.014,-.67+i*.012,
     .27+.05*direction*(i-5)/5) for i in range(11)],
    .008,red,'Q01_APOLOGY_PAPER_ACTOR',8)
 letter('Q01 apologies professor school poster','检讨自己写',
  (-.42,-.072,.72),rubber,'Q01_ERASER_ACTOR',.095)
def main():
 functions={
  'P03':p03,'S08':s08,'X03':x03,'Q06':q06,
  'K02':k02,'K08':k08,'S03':s03,'Q01':q01}
 chosen=([k for k in ids if k in os.environ['R183_ID'].split(',')]
  if os.environ.get('R183_ID') else list(ids))
 for id in chosen:
  print('R183_TRUE_SCULPT_START',id,flush=True)
  a.reset();functions[id]();a.render_export(id)
 (a.PHOTO/'R183_eight_art_receipts.json').write_text(json.dumps(
  {'total':len(a.AUDIT),'assets':a.AUDIT,'finalArtApproved':0,
   'release':'NO_GO'},ensure_ascii=False,indent=2))
 print('R183_EIGHT_BLENDER_SCULPTS_COMPLETED',len(a.AUDIT),flush=True)
if __name__=='__main__':main()
