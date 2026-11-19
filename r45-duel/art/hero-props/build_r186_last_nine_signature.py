"""R186 nine final original Blender 5.2 campus-comedy GLBs with individual physical actors.
These are native editable .blend models, not generic light-ring placeholders.
QA candidate assets; no Android or aesthetic signoff.
"""
import os,sys,json,math,random
from math import sin,cos,pi
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import build_r182_signature_six as a
M=a.material;B=a.beveled;G=a.globe;C=a.cylinder
L=a.lathe;S=a.swept;A=a.arc;R=a.flat_ribbon;F=a.mesh;T=a.signage
random.seed(186)
NAMES={
'P01':('P01_Gale_Hair_School_Hero','狂风炸毛超人'),
'P02':('P02_Century_Without_Goal_Soccer','百年没有进球的足球'),
'P06':('P06_Backwards_Run_Gym_Treadmill','体育馆倒跑机'),
'P08':('P08_Sports_Medal_Meteor_Rain','运动会流星奖牌'),
'X01':('X01_Reversing_School_Clock_Tower','倒退一小时的校钟'),
'X04':('X04_Lunchtime_Prophecy_Pillow','午休预言枕头'),
'X06':('X06_Morning_Reading_Duplicator','早读复制器'),
'X07':('X07_Vanishing_Last_Classroom_Lesson','消失的最后一节课'),
'X08':('X08_Campus_Gate_Time_Security_Guard','校门口时空保安')}
a.PRESETS.clear();a.PRESETS.update(NAMES)
def st(name,src,dst,r,m,actor):
 return S(name,[src,dst],r,m,actor,seg=12)
def bl(name,p,sc,m,actor):
 return G(name,p,sc,m,actor,26,18)
def p01():
 indigo=M('Superhero deep indigo uniform film matte',(.08,.15,.39),.51)
 pale=M('Cheery peach comic face soft skin',(.95,.65,.43),.65)
 dark=M('Wild sea-blue ultra-frizzy actual head hair',(.05,.17,.31),.58)
 cyan=M('Electric turquoise tiny flyaway hair accents',(.12,.64,.72),.48)
 white=M('Embossed sport captain cream chest insignia',(.96,.88,.70),.46)
 gold=M('Woven mustard yellow school wind scarf',(.90,.52,.12),.59)
 red=M('Bright brick red hero boots',(.77,.14,.13),.43)
 eye=M('Expressive deep navy glass pupil',(.03,.05,.10),.26)
 sock=M('Sport sock white cotton piping',(.89,.85,.76),.68)
 cape=M('Fabric superhero cape maroon windblown',(.60,.055,.17),.70)
 B('P01 rounded actual cartoon sports hero jacket',(0,.04,.89),
   (.65,.48,.80),indigo,'P01_BODY_ACTOR',.16)
 for x in (-.27,.27):
  S('P01 school hero angled articulated arm',
    [(x,.01,1.16),(x*1.58,-.17,.92),(x*1.24,-.36,1.02)],
    [.12,.11,.07],indigo,'P01_ARMS_ACTOR',16)
  bl('P01 hand actually grabbing scarf', (x*1.24,-.36,1.02),
    (.11,.11,.12),pale,'P01_ARMS_ACTOR')
  S('P01 leg sprint pose with folded knee',
    [(x*.8,.04,.57),(x,-.11,.40),(x*1.25,-.25,.18)],
    [.14,.11,.10],indigo,'P01_LEGS_ACTOR',16)
  B('P01 comic wide rubber sports boot',(x*1.30,-.31,.13),
    (.26,.33,.21),red,'P01_LEGS_ACTOR',.067)
  B('P01 real white sock brim',(x,-.04,.39),(.19,.19,.12),
    sock,'P01_LEGS_ACTOR',.02)
 bl('P01 large expressive exact human head',
  (0,-.03,1.58),(.37,.31,.41),pale,'P01_HEAD_ACTOR')
 for x in (-.13,.13):
  bl('P01 eyebrow emotional awake eye',
    (x,-.327,1.68),(.064,.014,.073),eye,'P01_HEAD_ACTOR')
 for k in range(96):
  theta=k*2.39996322972865;layer=k%4
  rr=.10+.24*(1-(k%8)/14)
  x0=rr*cos(theta);y0=rr*sin(theta)
  z0=1.92+.13*(k%7)/7;grow=.18+.23*(k%5)/5
  pts=[(x0,y0,z0),
    (x0+.12*cos(theta),y0+.11*sin(theta),z0+grow*.55),
    (x0+.34*cos(theta+layer*.2),y0+.27*sin(theta),z0+grow)]
  S('P01 individually wind lifted real curved spiky hair filament',
    pts,[.036,.029,.002],dark if k%5 else cyan,
    'P01_HAIR_ACTOR',9)
 T('P01 real hero jersey monogram chest print','风力满分',
   (-.24,-.24,1.0),white,'P01_BODY_ACTOR',.10)
 R('P01 actual wind swept fabric cape with scalloped border',
  [(0,.29,1.33),(.23,.49,1.18),(.45,.81,1.00),(.62,1.06,1.10),
   (.77,1.22,.94)],.46,cape,'P01_CAPE_ACTOR')
 S('P01 caught yellow neck scarf curling in real wind',
   [(-.13,-.15,1.30),(-.41,-.11,1.27),(-.62,-.17,1.48),
    (-.86,-.19,1.56)],
   [.075,.064,.055,.007],gold,'P01_CAPE_ACTOR',18)
def p02():
 ivory=M('Actual scuffed old football white leather',(.78,.76,.65),.65)
 navy=M('Original black genuine soccer pentagonal stitched patches',(.045,.075,.10),.47)
 wood=M('Unpainted ancient gymnasium timber goal posts',(.49,.25,.08),.58)
 white=M('Old football net robust real cotton cord',(.86,.87,.77),.79)
 red=M('Century-old match disqualification scarlet',(.76,.12,.09),.60)
 yellow=M('Brass stopwatch championship result panel',(.71,.52,.19),.28,.72)
 rubber=M('Scuffed soccer cleat soles dark',(.17,.18,.17),.75)
 green=M('Old football pitch grassy square physical base',(.11,.40,.24),.73)
 B('P02 small grass training football field',
  (0,.30,.15),(1.95,1.16,.17),green,'P02_GOAL_STATIC',.04)
 for side in (-1,1):
  st('P02 actual old steel football goal upright',
     (side*.77,.24,.20),(side*.77,.24,1.56),.058,
     wood,'P02_GOAL_STATIC')
 st('P02 real timber goal crossbar',
  (-.77,.24,1.56),(.77,.24,1.56),.052,wood,'P02_GOAL_STATIC')
 for j in range(13):
  x=-.75+j*.125
  S('P02 physical real football nets rope vertical per column',
   [(x,.24,.22),(x,.24,1.55),(x,.73,1.38),(x,.79,.33)],
   .010,white,'P02_NET_ACTOR',8)
 for j in range(12):
  z=.28+j*.103
  st('P02 genuine hand-woven cotton horizontal football net',
    (-.77,.47,z),(.77,.47,z),.009,white,'P02_NET_ACTOR')
 bl('P02 actually inflated round old cracked leather football',
  (-.47,-.36,.55),(.28,.28,.28),ivory,'P02_BALL_ACTOR')
 for k in range(22):
  theta=k*2.399963;z=.55+.255*sin(theta*.7)
  rad=.255*max(.28,abs(cos(theta*.7)))
  x=-.47+rad*cos(theta);y=-.36+rad*sin(theta)
  bl('P02 independent stitched dark soccer leather patch',
   (x,y,z),(.050,.023,.055),navy,'P02_BALL_ACTOR')
 B('P02 football score board ornate brass panel',
   (.60,-.49,1.77),(.54,.07,.29),
    yellow,'P02_SCOREBOARD_ACTOR',.04)
 T('P02 score says hundred years and zero goals','百年 0球',
   (.35,-.542,1.76),red,'P02_SCOREBOARD_ACTOR',.11)
 S('P02 exaggerated football rebound bent trail made of shoeprints',
   [(-.47,-.40,.85),(-.34,-.46,1.16),(-.18,-.53,1.25),
    (.10,-.55,1.10),(.20,-.57,.89)],
   [.032,.031,.025,.015,.002],rubber,'P02_BALL_ACTOR',12)
def p06():
 steel=M('Treadmill industrial brushed aluminum welded supports',(.45,.54,.58),.27,.78)
 rubber=M('Black deeply textured real endless treadmill belt',(.064,.069,.074),.77)
 blue=M('Professional sports club deep blue sidewalls',(.085,.31,.47),.42)
 gold=M('Reverse treadmill silly indicator mustard arrow',(.90,.68,.18),.45)
 glass=M('Real LCD sports tachometer digital azure',(.24,.66,.76),.24)
 red=M('Big emergency stop treadmill physical red knob',(.83,.08,.07),.30)
 black=M('Durable black leg rubber protective tips',(.09,.10,.10),.82)
 white=M('Running sneakers actual sole ivory',(.91,.89,.75),.63)
 B('P06 commercial real metal treadmill chassis',(0,.0,.46),
  (1.72,.91,.31),steel,'P06_FRAME_STATIC',.085)
 B('P06 fully physical black flexible tread running surface',
  (0,-.01,.648),(1.52,.75,.05),rubber,'P06_BELT_ACTOR',.040)
 for k in range(21):
  x=-.72+k*.072
  st('P06 actual tread belt ribbed molded grip ridges',
   (x,-.34,.687),(x,.34,.687),.006,black,'P06_BELT_ACTOR')
 for end in (-1,1):
  C('P06 real rolling endless treadmill end spindle',
    (end*.72,0,.61),.14,.77,steel,'P06_ROLLER_ACTOR',28,
    rotation=(pi/2,0,0))
 for side in (-1,1):
  B('P06 industrial treadmill side rail with visible rolled edge',
   (0,side*.44,.58),(1.75,.10,.21),blue,'P06_FRAME_STATIC',.045)
  for x in (-.60,.65):
   B('P06 black actual anti wobble floor support foot',
     (x,side*.45,.19),(.22,.18,.33),
     black,'P06_FRAME_STATIC',.05)
  S('P06 curved real upright handle bars',
   [(side*.61,.17,.63),(side*.62,-.12,1.31),
   (side*.49,-.21,1.56)],
   [.050,.050,.043],steel,'P06_HANDLE_STATIC',14)
 B('P06 treadmill genuine sports terminal computer screen',
   (0,-.28,1.65),(.65,.16,.37),blue,'P06_TERMINAL_ACTOR',.06)
 B('P06 treadmill blue clear electronic speed readout',
   (0,-.377,1.67),(.53,.02,.27),glass,
   'P06_TERMINAL_ACTOR',.033)
 T('P06 big digital WRONG direction rewind indication','倒着跑!',
   (-.21,-.401,1.66),gold,'P06_TERMINAL_ACTOR',.12)
 C('P06 large physical red emergency stop button',
   (.21,-.407,1.53),.060,.06,red,
   'P06_TERMINAL_ACTOR',24,rotation=(pi/2,0,0))
 for side in (-1,1):
  B('P06 lone runner padded modern sneaker',
    (side*.21,.17,.90),(.29,.37,.20),
    white,'P06_SHOES_ACTOR',.07)
  for k in range(4):
   st('P06 real shoelace binding crossing on sneaker',
    (side*.21-.06,.02+k*.064,1.00),
    (side*.21+.06,.02+k*.064,1.00),
    .009,gold,'P06_SHOES_ACTOR')
def p08():
 bronze=M('Sports awards warm copper meteor crater metal',(.55,.26,.10),.43,.63)
 gold=M('Champion sports medal bright hammered gold',(.83,.60,.18),.28,.79)
 silver=M('Second place honest silver polished medallion',(.62,.69,.73),.22,.76)
 blue=M('School track relay cobalt blue athletic ribbon',(.13,.30,.65),.53)
 red=M('Pompous school championships garnet neck ribbon',(.72,.09,.15),.62)
 white=M('Sports tournament white screen-printed badge',(.93,.91,.78),.45)
 green=M('Stadium turf jade green sculpted crater bank',(.15,.37,.16),.84)
 char=M('Meteor dark scorched rocky crater patches',(.15,.14,.15),.86)
 orange=M('Molten-orange molten award medal scratches',(.89,.33,.07),.39)
 # irregular physical meteoroid: rocky ball with many different bumps
 bl('P08 central actual irregular runner medal meteor core',
   (0,0,1.15),(.44,.39,.41),bronze,'P08_METEOR_ACTOR')
 for k in range(37):
  t=k*2.399963
  u=2*k/37-1
  x=.42*math.sqrt(1-u*u)*cos(t)
  y=.35*math.sqrt(1-u*u)*sin(t)
  z=1.15+.4*u
  bl('P08 real discrete jagged irregular sports meteor crust',
   (x,y,z),(.056+.016*(k%3),.04,.045),char if k%4 else gold,
    'P08_METEOR_ACTOR')
 # 3 championship medals (actual medallions and raised icon)
 for j in range(3):
  cx=-.44+j*.44;cy=-.35-.07*(j%2);cz=.79+j*.05
  C('P08 solid heavy sports medallion independently sculpted',
   (cx,cy,cz),.22,.065,
   [gold,silver,bronze][j],'P08_MEDALS_ACTOR',54,rotation=(pi/2,0,0))
  C('P08 inset double raised stamped medal seal on solid brass face',
   (cx,cy-.043,cz),.157,.012,white,
   'P08_MEDALS_ACTOR',40,rotation=(pi/2,0,0))
  T('P08 medal actually printed champion number',
   str(j+1),(cx-.047,cy-.056,cz-.062),orange,
   'P08_MEDALS_ACTOR',.16)
  # loop real ribbon over every medal, not fake neon light arc
  R('P08 actual sewn prize neck ribbon flutters through meteor trail',
   [(cx-.06,cy,cz+.16),(cx-.11,cy,cz+.46),
    (cx+.02,cy+.13,cz+.63),(cx+.20,cy+.19,cz+.74)],
    .12,blue if j%2 else red,'P08_RIBBONS_ACTOR')
 # physical impacted turf crater rim rather than generic magic torus
 L('P08 landed track stadium broken bowl shaped crater',
  [(.15,.04),(.42,.07),(.71,.14),(.81,.22),(.88,.26),(.95,.20)],
  green,'P08_CRATER_STATIC',radials=77,warp=.075)
 for j in range(17):
  t=2*pi*j/17
  bl('P08 roasted upturned landing crater separate soil chunks',
   (.79*cos(t),.79*sin(t),.25),
   (.07,.11,.09),char,'P08_CRATER_STATIC')
 S('P08 genuine flying metal track medal diagonal tail',
   [(-.29,.16,1.35),(-.45,.22,1.58),
    (-.75,.33,1.77),(-.91,.44,2.03)],
    [.076,.054,.036,.004],orange,'P08_RIBBONS_ACTOR',16)
def x01():
 stone=M('Old school clock tower deep sandstone structural blocks',(.50,.36,.22),.80)
 stonehi=M('School landmark limestone trim cream textured',(.83,.71,.47),.71)
 oak=M('Tower wood carved door and dry roof braces',(.33,.16,.067),.55)
 copper=M('Aged green patina roof weather copper',(.11,.34,.30),.62,.44)
 bronze=M('Clock tower solid brass timeworks gear',(.68,.50,.16),.26,.79)
 dial=M('Bright campus clock enamel porcelain dial',(.92,.87,.71),.43)
 black=M('Clock graphite-black numerals and hands',(.035,.06,.065),.32)
 red=M('Time reversal school warning stamped ink red',(.82,.15,.12),.48)
 night=M('Real recessed tower arched window deep blue',(.063,.13,.21),.48)
 # genuine square tall clock tower not previous S01 bedside alarm
 B('X01 genuine thick old campus sandstone clock tower',
  (0,.18,.95),(.96,.90,1.70),stone,
  'X01_TOWER_STATIC',.06)
 for floor in range(7):
  z=.28+floor*.245
  for x in (-.39,.39):
   B('X01 hand laid protruding independent school tower masonry blocks',
    (x,-.32,z),(.19,.13,.14),
    stonehi if floor%3==0 else stone,'X01_TOWER_STATIC',.024)
 B('X01 copper building roof overhanging eaves',
   (0,.18,1.88),(1.23,1.08,.16),copper,
   'X01_TOWER_STATIC',.052)
 # steep slanted roof silhouette (not simple cylinder)
 roofv=[(-.55,-.36,1.97),(.55,-.36,1.97),(.55,.73,1.97),
        (-.55,.73,1.97),(0,.20,2.43)]
 F('X01 four tapered panels real historic campus roof',
   roofv,[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],
   copper,'X01_TOWER_STATIC')
 # independent front physical dial and hands mounted to clock face
 C('X01 massive original school stone clock housing',
   (0,-.34,1.37),.47,.09,stonehi,
    'X01_CLOCK_DIAL_ACTOR',60,rotation=(pi/2,0,0))
 C('X01 painted ivory school clock numbered dial',
   (0,-.401,1.37),.405,.04,dial,
    'X01_CLOCK_DIAL_ACTOR',70,rotation=(pi/2,0,0))
 for j in range(12):
  theta=2*pi*j/12
  x=.33*sin(theta);z=1.37+.33*cos(theta)
  st('X01 carefully engraved reverse clock tick marks',
   (.95*x,-.43,1.37+.95*.33*cos(theta)),
   (1.06*x,-.43,1.37+1.06*.33*cos(theta)),
   .015,black,'X01_CLOCK_DIAL_ACTOR')
 rim=A('X01 raised huge brass campus clock round dial frame',
   (0,0),.446,0,bronze,
   'X01_CLOCK_DIAL_ACTOR',.035,72)
 rim.rotation_euler.x=pi/2
 rim.location=(0,-.435,1.37)
 # explicit clock hand independent Empty pivot, hand centered scene origin as required
 st('X01 physically moving long reverse-time clock minute hand',
   (0,-.474,1.37),(0,-.483,1.68),.027,
    red,'X01_REVERSE_HANDS_ACTOR')
 st('X01 physically moving short brass hour hand',
   (0,-.487,1.37),(.19,-.495,1.49),.038,
    black,'X01_REVERSE_HANDS_ACTOR')
 bl('X01 real nickel timework central clock pin',
   (0,-.49,1.37),(.061,.030,.061),bronze,
    'X01_REVERSE_HANDS_ACTOR')
 # side has exposed gears showing mechanical effort
 for j in range(2):
  cx=.49;cy=-.02+j*.40;cz=.80+j*.33
  C('X01 massive real toothed century-old clock mechanism',
    (cx,cy,cz),.25-j*.06,.07,
     bronze,'X01_GEARS_ACTOR',32,rotation=(0,pi/2,0))
  for i in range(14):
   th=2*pi*i/14
   B('X01 actual old cast gear individual asymmetric teeth',
    (cx+.037,cy+(.245-j*.06)*cos(th),cz+(.245-j*.06)*sin(th)),
     (.04,.065,.065),bronze,'X01_GEARS_ACTOR',.010)
 B('X01 building true recessed front principal arched entrance',
  (0,-.34,.36),(.36,.03,.46),night,'X01_TOWER_STATIC',.02)
 T('X01 school building superintendent official reversed time plaque',
  '倒退一小时',(-.38,-.41,.28),red,
    'X01_TOWER_STATIC',.13)
def x04():
 cloth=M('Original soft sea-foam brushed cotton pillow',(.55,.82,.79),.94)
 pale=M('Real satin white piping stitched along pillow sides',(.90,.91,.82),.61)
 blue=M('Navy woven embroidered prophecy stitched artwork',(.18,.34,.48),.75)
 gold=M('Warm golden sleepy prophetic star stitches',(.91,.67,.25),.56)
 gray=M('Cloudlike mattress vintage linen resting pad',(.64,.70,.73),.79)
 black=M('School red black explanatory handwriting',(.11,.19,.29),.52)
 paper=M('Cream real folded tomorrow test forecast',(.93,.84,.67),.62)
 red=M('Teacher unexpected test danger symbol red',(.85,.17,.09),.40)
 # pillow is curved true superquadric silhouette with bulged top and stitched hem.
 v=[];f=[];nx=28;ny=22
 for surface in (0,1):
  for j in range(ny):
   vv=j/(ny-1)*2-1
   for i in range(nx):
    uu=i/(nx-1)*2-1
    # square rounded woven pillow with a puffed middle and pinched seams
    x=.85*uu;y=.54*vv
    puff=(max(0,1-uu*uu)*max(0,1-vv*vv))**.47
    z=.48+(.18*puff if surface==1 else -.11*puff)
    v.append((x,y,z))
    if i and j:
     p=surface*nx*ny+(j-1)*nx+i-1
     f.append((p,p+1,p+nx+1,p+nx))
 F('X04 genuinely lofted sewn curved pillow dual-face fabric mesh',
   v,f,cloth,'X04_PILLOW_ACTOR')
 # Actual plump fibre-filled soft cushion volume (not two loose paper sheets).
 bl('X04 physically LOFTED pillow stuffed 3D cotton cushioning body',
    (0,0,.47),(.80,.50,.17),cloth,'X04_PILLOW_ACTOR')
 # Side-gusset convex satin fabric physically joins both curved faces.
 bl('X04 pillow hand stuffed central extra filling lumpy real volume',
    (.02,.012,.42),(.70,.43,.12),cloth,'X04_PILLOW_ACTOR')
 # visible seam double cord around full edge at z seam
 for j in range(2):
  z=.46+.021*j
  S('X04 actual continuous cotton embroidered pillow piping',
    [(.83*cos(t*2*pi/95),.53*sin(t*2*pi/95),z) for t in range(96)],
    .017,pale,'X04_PILLOW_ACTOR',10)
 # stitched stars physically on curved surface, not flat glowing magic
 for i in range(7):
  th=i*2.399963
  x=.34*cos(th);y=.22*sin(th)
  z=.61
  for j in range(5):
   a0=j*2*pi/5
   st('X04 raised physically stitched star embroidery thread',
      (x,y,z),(x+.045*cos(a0),y+.042*sin(a0),z+.012),
      .009,gold,'X04_PILLOW_ACTOR')
 # pillow on curved sleep mat
 B('X04 school dorm single nap bed visible folded quilt',
   (0,.06,.16),(1.83,1.22,.13),gray,
    'X04_BED_STATIC',.07)
 # real paper fortune slip caught in pillowcase
 B('X04 actual school predicted tomorrow test paper scroll',
   (.21,-.42,.88),(.47,.07,.45),paper,
    'X04_PROPHECY_NOTE_ACTOR',.025)
 T('X04 original ominous fortune test schedule','明日突击考!',
   (.02,-.47,.89),red,'X04_PROPHECY_NOTE_ACTOR',.09)
 for k in range(5):
  st('X04 physical ruled prediction handwriting ink line',
   (.05,-.46,1.02-k*.05),
   (.38-k*.03,-.46,1.02-k*.05),.0045,
   black,'X04_PROPHECY_NOTE_ACTOR')
 S('X04 actual rolled ribbon of prophecy escaping nap pillow',
   [(.08,-.25,.64),(.21,-.42,.77),(.43,-.57,1.03),
    (.60,-.62,1.30)],
   [.05,.04,.027,.005],blue,'X04_PROPHECY_NOTE_ACTOR')
def x06():
 white=M('Copying machine ceramic ivory industrial shell',(.84,.84,.76),.44)
 blue=M('School premium blue photocopy console',(.10,.28,.53),.28)
 silver=M('Physically accurate brushed scanner rollers',(.59,.66,.68),.22,.81)
 glass=M('Dark glass scanner platen',(.05,.15,.26),.19,.14)
 green=M('LCD pastel mint green morning reading sign',(.34,.78,.66),.33)
 paper=M('School book authentic warm cellulose book paper',(.93,.86,.67),.75)
 dark=M('Printer mechanical feed slots graphite grey',(.09,.11,.13),.61)
 red=M('School book red editor correction marks',(.79,.08,.11),.54)
 gold=M('School reading club brass emblem print',(.80,.58,.22),.35)
 # actual substantial scanning/copier station
 B('X06 physical white blue schoolbook duplicator body',
   (0,.21,.61),(1.38,.89,.86),white,
    'X06_PRINTER_STATIC',.12)
 B('X06 angled thick real desktop hinged scanner lid',
   (0,.07,1.09),(1.42,.91,.17),blue,
    'X06_SCANNER_LID_ACTOR',.05)
 B('X06 black glass scanner bed beneath open lid',
   (0,-.03,1.04),(1.18,.75,.027),glass,
    'X06_PRINTER_STATIC',.025)
 B('X06 book output tray physically sticks out of copier',
   (.53,-.49,.41),(.69,.71,.11),blue,
    'X06_PRINTER_STATIC',.031)
 for x in (-.47,.47):
  C('X06 stainless scanner roller mechanical connector',
    (x,-.03,1.03),.042,.52,silver,
    'X06_SCANNER_LID_ACTOR',22,rotation=(pi/2,0,0))
 B('X06 real morning read status glass screen',
   (0,-.259,.68),(.59,.03,.24),green,
   'X06_LCD_ACTOR',.018)
 T('X06 visible morning rehearsal repeat count title','早读X2',
   (-.21,-.287,.64),red,'X06_LCD_ACTOR',.16)
 # independent 3d book: folded pages, spine, convex ink lines
 B('X06 original book binder robust blue cloth cover',
   (-.38,-.34,1.21),(.61,.56,.10),blue,
   'X06_BOOK_ACTOR',.027)
 for j in range(10):
  B('X06 truly separate translucent-looking printed morning reader pages',
   (-.38,-.34,1.27+j*.007),(.52,.48,.007),
    paper,'X06_BOOK_ACTOR',.004)
 for j in range(8):
  st('X06 literal three dimensional raised reading lines',
   (-.60,-.51,1.355+j*.005),
   (-.19,-.51,1.355+j*.005),.0035,dark,
    'X06_BOOK_ACTOR')
 # more than 1 output duplicate paper, physically unfolded from tray
 for copy in range(3):
  p0=(.46+copy*.06,-.43-copy*.26,.51+copy*.09)
  B('X06 genuinely printed separate duplicated reader page',
    p0,(.54,.42,.018),paper,'X06_COPIES_ACTOR',.007)
  for j in range(5):
   st('X06 duplicate physical letterpress ruled stripes',
    (p0[0]-.21,p0[1]-.18,p0[2]+.02+j*.007),
    (p0[0]+.21,p0[1]-.18,p0[2]+.02+j*.007),
    .003,dark,'X06_COPIES_ACTOR')
 # separate book tongue curled up
 R('X06 paper scroll actually unfolding from scanner output',
  [(.52,-.35,.52),(.72,-.46,.66),(.93,-.57,.88),
   (1.11,-.69,.94)],
  .21,paper,'X06_COPIES_ACTOR')
 T('X06 copy machine physical book club badge','早读复印官',
   (-.39,-.271,.89),gold,'X06_PRINTER_STATIC',.13)
def x07():
 slate=M('Disappearing lesson pale gray actual schoolboard',(.28,.37,.43),.77)
 walnut=M('School historic walnut desk real wood',(.47,.24,.10),.52)
 silver=M('School stainless desk leg and analog hinge',(.46,.55,.61),.29,.71)
 paper=M('Aged cream classroom note paper',(.91,.86,.72),.76)
 blue=M('Last lesson textbook blue navy cloth cover',(.08,.24,.50),.53)
 chalk=M('Chalk ivory chalk residue drawn lesson',(.82,.85,.80),.77)
 red=M('Last lesson red correction and date ink',(.84,.14,.11),.54)
 indigo=M('Schoolboard true empty matte dark green',(.04,.15,.14),.83)
 amber=M('Tiny actual brass alarm end of lesson pointer',(.83,.61,.21),.25,.72)
 B('X07 actual original school vintage three-legged desk',
   (0,-.22,.59),(1.30,.73,.16),walnut,
    'X07_DESK_ACTOR',.04)
 for side in (-1,1):
  for y in (-.44,.04):
   st('X07 real tubular school table removable vertical legs',
      (side*.50,y,.52),(side*.50,y,.18),.043,
       silver,'X07_DESK_ACTOR')
 B('X07 actual hinged missing last class wooden chair back',
   (.66,.31,.75),(.29,.11,.80),walnut,'X07_CHAIR_ACTOR',.065)
 B('X07 actual school wooden chair seat',
   (.65,.20,.45),(.48,.36,.12),walnut,'X07_CHAIR_ACTOR',.04)
 for x in (.51,.79):
  st('X07 chair hind legs',
      (x,.32,.42),(x,.32,.15),.039,
      silver,'X07_CHAIR_ACTOR')
 # class slate board with true vanishing physical last row and erased gaps
 B('X07 real blackboard behind vanished final classroom period',
   (0,.44,1.48),(1.86,.16,1.02),walnut,
    'X07_BOARD_STATIC',.043)
 B('X07 actual dark green board usable painting inset',
   (0,.337,1.50),(1.67,.04,.87),indigo,
    'X07_BOARD_STATIC',.020)
 for k in range(7):
  z=1.71-k*.085
  if k in (1,4):continue
  st('X07 vanishing lesson chalk writing breaks into illegible fragments',
   (-.69,.31,z),(.62-k*.055,.31,z),
    .009,chalk,'X07_DISAPPEARING_TEXT_ACTOR')
 for k in range(7):
  x=-.55+k*.19
  bl('X07 individual classroom memory chalk dust particles',
     (x,.29,1.23+.05*(k%3)),(.023,.019,.027),
     chalk,'X07_DISAPPEARING_TEXT_ACTOR')
 # actual textbook open then physical pages scatter from classroom
 B('X07 school final period hardback textbook cover',
   (-.26,-.32,.77),(.55,.43,.08),blue,'X07_TEXTBOOK_ACTOR',.023)
 for j in range(6):
  B('X07 handbound textbook removable paper sheet page',
    (-.26,-.32,.84+j*.007),(.49,.41,.006),
     paper,'X07_TEXTBOOK_ACTOR',.003)
 for j in range(6):
  theta=j*2.39
  x=.30+.34*cos(theta);y=-.32+.30*sin(theta);z=.91+j*.11
  R('X07 vanishing scattered last period lesson pages independent',
   [(x-.12,y,z),(x+.03,y+.07,z+.08),(x+.12,y-.03,z+.13)],
    .15,paper,'X07_PAGES_ACTOR')
 T('X07 teacher last lesson strike out actually red print',
   '最后一节:  消失',(-.69,.30,1.81),
    red,'X07_DISAPPEARING_TEXT_ACTOR',.12)
 # embossed fixed engraved plaque at board base
 B('X07 last lesson classroom actual brass end of day bell',
   (.68,.25,1.12),(.20,.12,.10),amber,
    'X07_BOARD_STATIC',.025)
def x08():
 blue=M('Old campus guard historic navy canvas work jacket',(.075,.18,.38),.61)
 red=M('Security cap burgundy school emblem',(.64,.11,.11),.48)
 skin=M('Guard warm human clay textured stylized skin',(.76,.47,.30),.62)
 black=M('Actual black time-guard peaked cap visor',(.045,.059,.087),.53)
 gold=M('Guard cap school gold eagle tiny badge',(.86,.62,.23),.28,.68)
 steel=M('School building security stainless tollgate',(.46,.55,.58),.24,.71)
 wood=M('Old bamboo and timber school gate pillars',(.40,.27,.13),.63)
 green=M('Visitor-school smart pass digital green LCD',(.12,.60,.43),.36)
 pale=M('Security guard bright cream shirt sleeves',(.90,.83,.70),.59)
 paper=M('Official forgotten visitor pass handmade paper',(.91,.83,.65),.73)
 blackeye=M('Actual guard tired black cartoon eye',(.04,.07,.07),.33)
 blueglass=M('Physical acrylic entry swipe card',(.21,.47,.71),.35)
 # real two massive wood school gate posts, plaque and attached turnstile
 for side in (-1,1):
  B('X08 real campus entrance old square timber gate pillar',
   (side*.84,.44,1.08),(.22,.28,2.06),wood,
    'X08_CAMPUS_GATE_STATIC',.042)
  B('X08 gold school entry plaque over pillar',
    (side*.84,.253,1.79),(.17,.045,.25),
    gold,'X08_CAMPUS_GATE_STATIC',.025)
 B('X08 actual school above gate hanging timber arch lintel',
   (0,.44,2.06),(1.98,.34,.21),wood,
   'X08_CAMPUS_GATE_STATIC',.037)
 T('X08 old school campus access control sign',
    '校园时空门',(-.43,.24,2.045),gold,
   'X08_CAMPUS_GATE_STATIC',.15)
 C('X08 real school gate polished stainless turnstile hub',
   (.40,-.17,.75),.15,.24,steel,
    'X08_TURNSTILE_ACTOR',30)
 for j in range(3):
  theta=2*pi*j/3
  S('X08 individually swinging real waist-high metal tripod gate arm',
   [(.40,-.17,.75),
    (.40+.38*cos(theta),-.17+.38*sin(theta),.75)],
   [.054,.037],steel,'X08_TURNSTILE_ACTOR',16)
 B('X08 security guard small identification swipe scanner',
   (.65,-.44,1.15),(.25,.23,.33),steel,
   'X08_CARD_SCANNER_ACTOR',.045)
 B('X08 recessed live security access card reading green screen',
   (.65,-.563,1.18),(.19,.025,.21),green,
   'X08_CARD_SCANNER_ACTOR',.03)
 # Actual human-ish guard with curved knees and expressive face, far from T pose.
 B('X08 actual slightly portly campus time security guard tunic',
   (-.28,-.23,1.00),(.63,.49,.71),blue,
    'X08_GUARD_BODY_ACTOR',.14)
 for side in (-1,1):
  x=-.28+side*.25
  S('X08 guard stylized down relaxed elbow bent human arm',
   [(x,-.20,1.26),(x+side*.17,-.39,.98),
    (x+side*.08,-.48,.89)],
   [.12,.11,.075],blue,'X08_GUARD_ARMS_ACTOR',16)
  bl('X08 relaxed security staff gentle hands',
     (x+side*.08,-.48,.86),(.099,.092,.096),skin,
      'X08_GUARD_ARMS_ACTOR')
  S('X08 real relaxed human foot knee fold',
   [(x,-.20,.68),(x+side*.03,-.17,.37),(x+side*.06,-.32,.16)],
    [.12,.11,.09],blue,'X08_GUARD_BODY_ACTOR',14)
  B('X08 real curved black security uniform leather boot',
    (x+side*.07,-.39,.13),(.26,.32,.20),
    black,'X08_GUARD_BODY_ACTOR',.060)
 bl('X08 old security guard kindly 3d head',
  (-.28,-.25,1.56),(.31,.29,.37),
  skin,'X08_GUARD_HEAD_ACTOR')
 for side in (-1,1):
  bl('X08 guard tired alert genuine dark glass pupils',
   (-.28+side*.12,-.533,1.62),(.040,.018,.048),
    blackeye,'X08_GUARD_HEAD_ACTOR')
 B('X08 physical peaked hat lower navy cap on security face',
   (-.28,-.24,1.89),(.64,.42,.19),red,
   'X08_GUARD_HEAD_ACTOR',.075)
 B('X08 school-guard hat actual black peak forward visor',
   (-.28,-.48,1.83),(.65,.23,.075),
   black,'X08_GUARD_HEAD_ACTOR',.027)
 C('X08 school crest physical metallic brass badge',
   (-.28,-.455,1.93),.058,.035,gold,
   'X08_GUARD_HEAD_ACTOR',26,rotation=(pi/2,0,0))
 # guard has a visitor pass physically in independent swinging hand, timestamps
 B('X08 mysterious school visitor time travel swipe pass',
   (-.58,-.57,1.11),(.36,.06,.23),blueglass,
    'X08_TIME_PASS_ACTOR',.025)
 T('X08 stamped visitor pass travel date note','迟到100年',
   (-.75,-.611,1.07),paper,
    'X08_TIME_PASS_ACTOR',.10)
 B('X08 security turnstile ticket paper extra pass',
   (.42,-.55,.59),(.35,.045,.23),
   paper,'X08_TIME_PASS_ACTOR',.02)
def main():
 fn={'P01':p01,'P02':p02,'P06':p06,'P08':p08,
     'X01':x01,'X04':x04,'X06':x06,'X07':x07,'X08':x08}
 selected=[k for k in NAMES if not os.environ.get('R186_ID') or
           k in os.environ['R186_ID'].split(',')]
 for id in selected:
  print('R186_BLENDER_MODEL_BEGIN',id,flush=True)
  a.reset();fn[id]();a.render_export(id)
 (a.PHOTO/'R186_nine_hero_receipts.json').write_text(json.dumps({
   'total':len(a.AUDIT),'assets':a.AUDIT,'sourceApproved':True,
   'visualAccepted':0,'androidAccepted':False,'release':'NO_GO'},
  ensure_ascii=False,indent=2))
 print('R186_TRUE_EDITABLE_SOURCE_COMPLETE',len(a.AUDIT),flush=True)
if __name__=='__main__':main()
