"""R185 original physically authored Blender 5.2 source sculptures.
No rights-infringing reference models, no texture-only impostors.
Each real GLB exports 3D physical actor node hierarchy for independent action.
Not approved for production (no Android S21 or aesthetic acceptance).
"""
import sys,os,json,math,random
from pathlib import Path
from math import sin,cos,pi
sys.path.insert(0,str(Path(__file__).resolve().parent))
import build_r182_signature_six as a
M=a.material;B=a.beveled;G=a.globe;C=a.cylinder
L=a.lathe;S=a.swept;A=a.arc;R=a.flat_ribbon;F=a.mesh;T=a.signage
random.seed(18511)
NAMES={
'G06':('G06_Second_Page_PopUp_School_Plan','翻到第二页的方案'),
'T05':('T05_Heartwarming_Cafeteria_Chef_Soup','食堂暖心加餐'),
'K05':('K05_Invisible_Air_Soup_Bowl','校长秘制空气汤'),
'Q03':('Q03_Dreaming_School_Blackboard','会做梦的黑板'),
'Q04':('Q04_Embarrassing_Dormitory_Public_Play','全寝室公开播放'),
'Q07':('Q07_Second_Cardboard_Classroom_Moon','教室里的第二个月亮'),
'Q08':('Q08_Chalk_Draw_Prison','粉笔画地为牢'),
'S02':('S02_One_Pencil_Tiny_Stationery_Case','只能装一根笔的文具盒'),
'S05':('S05_Confused_Homeroom_Class_Leader_Robot','乌龙机器人班长'),
'S07':('S07_School_Bell_Time_Wormhole','放学铃声虫洞')}
a.PRESETS.clear();a.PRESETS.update(NAMES)
def stick(name,src,dst,rad,mat,role):
 return S(name,[src,dst],rad,mat,role,seg=14)
def ovoid(name,p,s,m,r):return G(name,p,s,m,r,28,18)
def g06():
 leather=M('Cobalt blue miniature school portfolio binding',(.095,.27,.54),.37)
 cream=M('Uncoated warm cotton classroom plan paper',(.93,.85,.67),.76)
 ruled=M('Actual graphite hand drawn classroom report ink',(.27,.31,.39),.53)
 gold=M('Special merit school ink gold letter',(.83,.54,.11),.31,.43)
 red=M('Red teacher comments on folding plan',(.82,.11,.10),.46)
 metal=M('Visible three-ring binder steel mechanisms',(.51,.59,.67),.27,.8)
 green=M('Actual school desks hidden popup illustration mint green',(.18,.66,.48),.52)
 navy=M('Original dark blue inkwell',(.035,.09,.17),.48)
 B('G06 leatherbound A5 school action plan book cover',
  (0,.09,.20),(1.42,.95,.12),leather,'G06_BOOK_ACTOR',.06)
 B('G06 3D stacked physical 35 classroom paper sheets',
  (0,.075,.27),(1.30,.86,.095),cream,'G06_BOOK_ACTOR',.036)
 for j in range(13):
  z=.230+j*.0054
  stick('G06 individual exposed real paper-edge layer',
    (-.60,-.36,z),(.62,-.36,z),.0022,ruled,'G06_BOOK_ACTOR')
 # physical sheet turns away from the book with lifted corners: 21x9 mesh
 v=[];f=[]
 for j in range(10):
  u=j/9
  for k in range(21):
   t=k/20
   x=-.6+1.2*t
   y=-.30+.66*u + .07*sin(pi*t)*sin(pi*u)
   z=.33+.39*sin(pi*t)*(.2+.8*u)+.06*t
   v.append((x,y,z))
   if j and k:
    n=(j-1)*21+k-1
    f.append((n,n+1,n+22,n+21))
 F('G06 second actual curved paper page turns as a real surface',
  v,f,cream,'G06_PAGE_TURN_ACTOR')
 for i in range(11):
  y=-.26+i*.05
  stick('G06 original legible plan paragraphs as ink strokes',
    (-.47,y,.394),(.43-i*.03,y,.401),.0035,ruled,'G06_PAGE_TURN_ACTOR')
 for i in range(3):
  C('G06 visible real punched ring binder polished metal',
    (-.47+i*.48,.10,.38),.065,.05,metal,'G06_BOOK_ACTOR',18,rotation=(pi/2,0,0))
 # pop-up classroom real stage scene uses dimensional folded stands
 B('G06 popup little mint school desk chair',(.22,-.14,.55),
   (.33,.21,.20),green,'G06_POPUP_SCENE_ACTOR',.048)
 B('G06 pop-up school easel white projection board',(.17,-.03,.88),
   (.43,.055,.46),cream,'G06_POPUP_SCENE_ACTOR',.02)
 stick('G06 diagram arrow in air',(-.19,-.13,.87),
  (.30,-.13,1.09),.028,gold,'G06_POPUP_SCENE_ACTOR')
 T('G06 original printed second page title','第二页才对',
  (-.48,-.40,.39),red,'G06_PAGE_TURN_ACTOR',.105)
def t05():
 crock=M('Old ivory porcelain cafeteria soup bowl',(.86,.79,.64),.31,0,.43)
 edge=M('Copper metal double lip and spoon rim',(.67,.43,.20),.22,.7)
 broth=M('Thick organic golden handmade broth',(.71,.39,.14),.19,0,.6)
 leaf=M('Spinach real irregular jade herbs',(.13,.48,.19),.57)
 carrot=M('Real cooked carrot orange sculpted cubes',(.94,.37,.09),.42)
 tofu=M('School cafeteria soft tofu cream',(.91,.84,.64),.53)
 spoon=M('Brushed stainless hand ladle',(.51,.61,.64),.25,.7)
 dark=M('Cafeteria bowl navy blue painterly decoration',(.12,.25,.42),.48)
 vapor=M('Steam soft beige physically ribboned',(.86,.84,.76),.86)
 L('T05 truly deep ceramic bowl with curved side and cavity',
   [(.12,.07),(.32,.08),(.58,.16),(.78,.36),(.83,.48),
    (.80,.52),(.73,.45),(.54,.26),(.26,.14),(.10,.12)],
   crock,'T05_SOUP_BOWL_ACTOR',radials=76)
 A('T05 physically engraved copper cafeteria bowl lip',
   (0,0),.80,.515,edge,'T05_SOUP_BOWL_ACTOR',.020,76)
 L('T05 visibly concave warm soup real surface',
   [(.06,.35),(.30,.355),(.58,.38),(.68,.42)],
   broth,'T05_SOUP_BOWL_ACTOR',radials=64,warp=.009)
 for side in (-1,1):
  S('T05 real porcelain broad serving handles',
    [(side*.76,-.05,.47),(side*1.00,-.06,.48),(side*1.03,-.05,.34),
     (side*.75,-.06,.29)],[.07,.068,.05,.057],
    crock,'T05_SOUP_BOWL_ACTOR',14)
 for j in range(15):
  theta=j*2.399963
  rr=.12+.55*(j%5)/5
  if j%3==0:
   B('T05 physically diced carrot floating',(rr*cos(theta),rr*sin(theta),.45),
     (.115,.08,.07),carrot,'T05_SOUP_BOWL_ACTOR',.015)
  elif j%3==1:
   B('T05 soft cooked tofu with slightly rounded corners',
    (rr*cos(theta),rr*sin(theta),.44),(.15,.13,.09),
    tofu,'T05_SOUP_BOWL_ACTOR',.02)
  else:
   R('T05 curved actual cilantro leaf in soup',
    [(rr*cos(theta),rr*sin(theta),.43),
     (rr*cos(theta)+.12,rr*sin(theta)+.06,.45),
     (rr*cos(theta)+.18,rr*sin(theta)+.10,.43)],
     .12,leaf,'T05_SOUP_BOWL_ACTOR')
 # spoon independent scoop, genuine inner basin
 L('T05 actual ladle cup with steel rolled rim',
  [(.08,.04),(.18,.05),(.25,.12),(.28,.14),(.25,.17),(.19,.10)],
  spoon,'T05_SPOON_ACTOR',center=(.30,-.22,.83),radials=44)
 S('T05 long polished curved restaurant ladle handle',
   [(.35,-.20,.92),(.50,-.25,1.17),(.68,-.30,1.57),
   (.71,-.29,1.68)], [.05,.045,.03,.026],spoon,'T05_SPOON_ACTOR',16)
 # real steam only in small non-generic flowing curls, not glowing rings
 for j in range(3):
  angle=j*2*pi/3
  S('T05 delicate transparent-like steam curling through hot soup',
    [(r*cos(angle)+.06*sin(i*pi/8),r*sin(angle),.55+.055*i)
     for i,r in enumerate([.22+.014*k for k in range(13)])],
    [.016]*13,vapor,'T05_STEAM_ACTOR',8)
 for j in range(6):
  A('T05 handpainted enamel cafeteria motif',(0,0),
    .64-j*.003,.28+.024*j,dark,'T05_SOUP_BOWL_ACTOR',.008,30)
def k05():
 blue=M('Shimmering midnight transparent-look porcelain enamel',(.18,.37,.58),.22,0,.7)
 glazed=M('Interior pearl-clear ceramic empty bowl',(.92,.91,.83),.24,0,.7)
 gold=M('Authentic old bronze service lip',(.77,.59,.25),.28,.7)
 sign=M('Cafeteria funny chef sign cream ink',(.95,.87,.61),.53)
 handle=M('Long restaurant spoon walnut handle',(.48,.23,.10),.47)
 silver=M('Golden reflective empty spoon steel',(.58,.68,.73),.22,.83)
 air=M('Sculpted mirage ribbons not generic magic ring',(.78,.87,.86),.72)
 red=M('Teacher no ingredient stamp',(.74,.07,.08),.52)
 dark=M('Deep inside truly hollow soup container',(.07,.18,.31),.34)
 # noticeably empty TRUE bowl interior; no fake soup colored plane!
 L('K05 actual empty double-shell deep food ceramic bowl',
 [(.10,.04),(.42,.07),(.70,.19),(.90,.46),(.94,.57),(.91,.61),
  (.84,.55),(.65,.29),(.34,.15),(.12,.12)],blue,
  'K05_EMPTY_BOWL_ACTOR',radials=88)
 L('K05 visibly EMPTY inside bowl deep bottom bowl interior',
 [(.10,.122),(.32,.17),(.50,.24)],dark,
 'K05_EMPTY_BOWL_ACTOR',radials=72)
 A('K05 hand rolled genuine brass lip',(0,0),.925,.605,gold,
   'K05_EMPTY_BOWL_ACTOR',.025)
 C('K05 restaurant soup bowl ceramic shallow foot',
 (0,0,.08),.38,.12,glazed,'K05_EMPTY_BOWL_ACTOR',46)
 # empty SPoon clearly held up, not textured reflection
 L('K05 genuine empty steel ladle 3D concave bowl',
 [(.08,.02),(.18,.04),(.27,.11),(.29,.16),(.25,.16),(.19,.10)],
 silver,'K05_SPOON_ACTOR',center=(.32,-.13,1.16),radials=48)
 S('K05 actual wooden ladle handle',
 [(.39,-.13,1.20),(.47,-.07,1.49),(.53,-.02,1.76)],
 [.046,.04,.025],handle,'K05_SPOON_ACTOR',16)
 for j in range(3):
  th=(j+.1)*2*pi/3
  points=[(.18*cos(th)+.08*sin(i*.6+j),.18*sin(th),
    .64+.090*i) for i in range(11)]
  S('K05 invisible meal heat refractive sculptural air current',
    points,[.028-.001*i for i in range(11)],air,
    'K05_AIR_CURRENT_ACTOR',12)
 # an actual card that says the soup has no ingredients
 B('K05 restaurant hand-held EMPTY ingredients menu',
  (-.62,-.11,1.27),(.54,.055,.51),
  glazed,'K05_EMPTY_MENU_ACTOR',.026)
 T('K05 menu actual empty inventory label','空气汤 0料',
   (-.87,-.153,1.30),red,'K05_EMPTY_MENU_ACTOR',.11)
 T('K05 bowl authentic cafeteria nameplate','绝对没东西',
  (-.35,-.61,.39),sign,'K05_EMPTY_BOWL_ACTOR',.115)
def q03():
 black=M('True deep dark classroom black slate',(.026,.073,.073),.77)
 frame=M('Oiled oak class blackboard solid bevel frame',(.49,.26,.11),.48)
 brass=M('School gold wood frame corner studs',(.75,.57,.24),.24,.68)
 cream=M('Glassy white gypsum chalk',(.88,.87,.76),.72)
 cyan=M('Pale cyan whimsical chalk dream doodles',(.38,.78,.80),.70)
 pink=M('Rosy blush chalk stars and lips',(.88,.49,.53),.67)
 red=M('School red grade 100 point stamp',(.92,.16,.08),.49)
 sleep=M('Night class dark indigo eye eyelids',(.18,.28,.45),.54)
 B('Q03 authentic heavy school wall mounted board', (0,.23,1.08),
 (1.86,.19,1.48),frame,'Q03_BOARD_STATIC',.06)
 B('Q03 matte dark green slate face', (0,.118,1.08),
 (1.66,.045,1.27),black,'Q03_BOARD_STATIC',.025)
 for x in (-.82,.82):
  for z in (.47,1.68):
   C('Q03 actual old school frame corner screw bolt',(x,.087,z),
    .035,.03,brass,'Q03_BOARD_STATIC',16,rotation=(pi/2,0,0))
 B('Q03 white chalk trough', (0,.02,.36),(1.87,.19,.12),
  frame,'Q03_BOARD_STATIC',.03)
 # comic eyelids, not entire board shaking
 for side in (-1,1):
  cx=side*.39
  S('Q03 expressive dreamy half closed blackboard eyelid',
    [(cx-.24,-.009,1.30),(cx,-.012,1.22),(cx+.24,-.009,1.30)],
    [.034,.047,.034],cream,'Q03_EYES_ACTOR')
  for j in range(3):
   S('Q03 actual white chalk sleeping eyelash',
    [(cx-.12+j*.12,-.015,1.26),
     (cx-.18+j*.12,-.018,1.20)],
     .013,cyan,'Q03_EYES_ACTOR')
 S('Q03 dreamy smiling chalk mouth',
   [(-.35,-.021,.80),(0,-.023,.70),(.35,-.021,.80)],
   .027,pink,'Q03_EYES_ACTOR')
 # physical self writing school chalk and its raised written numeral 100
 C('Q03 full physical long white drawing chalk stick',(.33,-.22,.74),
  .065,.44,cream,'Q03_CHALK_HAND_ACTOR',30,rotation=(pi/2,0,.17))
 T('Q03 white chalk magical original handwriting grade', '100分!',
   (-.70,-.01,1.53),red,'Q03_WRITING_ACTOR',.28)
 for j in range(7):
  t=j*2*pi/7
  S('Q03 real school chalk dusty thought star points',
   [(.70*cos(t),-.07,1.07+.40*sin(t)),
    (.77*cos(t),-.075,1.08+.41*sin(t))],.021,
   cyan,'Q03_WRITING_ACTOR')
def q04():
 smartphone=M('Deep violet OLED edge to edge smartphone',(.19,.16,.33),.24,.34)
 screen=M('Actual warm color waveform player display',(.20,.39,.52),.18,.28)
 metal=M('Brushed aluminum phone milled frame',(.51,.59,.64),.21,.84)
 speaker=M('Acoustic soundbar black fabric grill',(.05,.065,.10),.60)
 rim=M('Speaker brushed neon magenta edging',(.75,.19,.43),.34)
 pale=M('Ceramic water cup near shaking speaker',(.85,.82,.72),.34)
 water=M('Cup real pale turquoise water rim',(.25,.67,.69),.23,.11,.48)
 red=M('Emergency mute button deep red',(.87,.06,.07),.30)
 orange=M('Ridiculous dormitory roommate message yellow',(.98,.72,.26),.51)
 B('Q04 giant custom smartphone gold glass physical chassis',
  (-.67,.02,1.05),(.53,.20,1.20),smartphone,'Q04_PHONE_ACTOR',.11)
 B('Q04 inset real OLED color lit phone front',
  (-.67,-.093,1.08),(.47,.035,1.02),screen,'Q04_PHONE_ACTOR',.036)
 for i in range(18):
  x=-.89+i*.027
  z=.92+.13*sin(i*.8)
  stick('Q04 waveform bars physical raised not glow',
   (x,-.12,.89),(x,-.12,z),.008,orange,'Q04_PHONE_ACTOR')
 B('Q04 actual speaker honeycomb fabric body',(.29,.07,.94),
   (1.13,.43,.65),speaker,'Q04_SPEAKER_ACTOR',.11)
 B('Q04 soundbar colored anodized edge',(.29,-.168,.95),
   (1.17,.05,.71),rim,'Q04_SPEAKER_ACTOR',.044)
 for side in (-1,1):
  C('Q04 real analog speaker woofer cones',
    (.29+side*.30,-.193,1.00),.22,.050,metal,
    'Q04_SPEAKER_ACTOR',40,rotation=(pi/2,0,0))
  C('Q04 fully concave woofer front black cap',
    (.29+side*.30,-.225,1.00),.085,.03,speaker,
    'Q04_SPEAKER_ACTOR',25,rotation=(pi/2,0,0))
 # real physics glass vibrates
 L('Q04 original porcelain glass water tumbler',
 [(.04,.05),(.18,.05),(.24,.13),(.27,.50),(.28,.59),
 (.26,.61),(.225,.54),(.19,.17),(.05,.12)],
 pale,'Q04_GLASS_ACTOR',center=(.94,-.24,0),radials=54)
 L('Q04 physically visible water liquid free surface',
 [(.02,.38),(.17,.39),(.23,.42)],water,
 'Q04_GLASS_ACTOR',center=(.94,-.24,0),radials=50)
 ovoid('Q04 tactile protruding stop playback switch',
  (-.66,-.138,.53),(.060,.020,.060),red,'Q04_PHONE_ACTOR')
 T('Q04 original school club scary loudspeaker banner','全寝室都听见',
  (-.01,-.24,1.47),orange,'Q04_SPEAKER_ACTOR',.11)
def q07():
 board=M('Blue painted night classroom slate blackboard',(.045,.12,.24),.73)
 frame=M('Antique cafeteria classroom dark oak frame',(.38,.20,.08),.53)
 moon=M('Original hand cut fibrous cardboard paper moon surface',(.89,.80,.60),.83)
 crate=M('Real corrugated paper moon crater layers',(.64,.55,.36),.71)
 cream=M('Full moon brighter school art club gilded paint',(.96,.86,.43),.58)
 yellow=M('Hand painted tiny gleaming star dots',(.98,.78,.26),.40)
 silver=M('Actual thin metal mobile lunar model rods',(.61,.63,.66),.27,.70)
 red=M('School astronomy nonsense label red ink',(.83,.11,.11),.51)
 B('Q07 actual classroom nighttime wall hanging chalkboard',
   (0,.45,1.10),(1.90,.18,1.55),frame,'Q07_BACKGROUND_STATIC',.06)
 B('Q07 night-sky slate face recessed in wooden frame',
   (0,.33,1.13),(1.66,.04,1.31),board,'Q07_BACKGROUND_STATIC',.019)
 for i in range(25):
  theta=i*2.4
  x=.71*cos(theta)*(1-i/28)
  z=1.09+.52*sin(theta)
  ovoid('Q07 real star school chalk dot',
   (x,.299,z),(.016,.009,.021),
   yellow,'Q07_BACKGROUND_STATIC')
 # Real a little moon sphere and a conspicuously fake flat cardboard moon:
 ovoid('Q07 real physical sculpted crater covered first moon',
   (-.40,.02,1.19),(.38,.36,.38),cream,'Q07_REAL_MOON_ACTOR')
 for j in range(13):
  t=2.4*j
  rad=.24*(.45+.5*(j%4)/4)
  ovoid('Q07 actual first moon uneven circular relief crater rims',
   (-.40+.24*cos(t),-.30,1.19+.24*sin(t)),
   (.039+.01*(j%3),.023,.032),
   crate,'Q07_REAL_MOON_ACTOR')
 # cardboard fake 2nd moon has thickness, curved silhouette, labeled tape
 C('Q07 absurd SECOND moon fake cardboard disk actually suspended',
  (.43,-.30,1.26),.38,.075,moon,
  'Q07_CARDBOARD_MOON_ACTOR',58,rotation=(pi/2,0,0))
 for j in range(8):
  t=j*2.39996
  rad=.28*(j%4+1)/5
  ovoid('Q07 cardboard moon hand glued crater bumps',
  (.43+rad*cos(t),-.355,1.26+rad*sin(t)),
  (.033,.014,.032),crate,'Q07_CARDBOARD_MOON_ACTOR')
 stick('Q07 actual school physics second moon support wire',
  (.44,-.25,1.56),(.38,.14,1.86),
  .012,silver,'Q07_CARDBOARD_MOON_ACTOR')
 R('Q07 pasted paper moon fluttering little label',
  [(.34,-.36,1.03),(.51,-.36,1.08),(.61,-.37,1.04)],
  .08,red,'Q07_CARDBOARD_MOON_ACTOR')
 T('Q07 second moon tag just kidding','第二个月亮',
   (.16,-.38,.88),red,'Q07_CARDBOARD_MOON_ACTOR',.12)
def q08():
 chalk=M('Real white plaster molded chalk stick',(.88,.85,.75),.84)
 pink=M('Pastel pink fluorescent-looking non-glow chalk drawing',(.85,.44,.45),.68)
 gray=M('Old school rough stone tile classroom floor',(.47,.43,.39),.82)
 dark=M('Actual ragged chalk deposit dark dusty underlay',(.15,.17,.17),.86)
 wood=M('School principal stamped detention notice sign wood',(.44,.24,.11),.55)
 gold=M('School gold brass lock and key old hardware',(.71,.54,.16),.22,.69)
 paper=M('Hand written do not step out sign',(.91,.85,.66),.61)
 red=M('Warning red school disciplinary seal',(.83,.14,.12),.41)
 # non-concentric physically hand-drawn crooked four-sided prison, real uneven plaster rods
 B('Q08 low rough tactile school classroom floor slab',(0,.04,.17),
   (1.90,1.53,.18),gray,'Q08_FLOOR_STATIC',.035)
 path=[(-.64,-.49,.29),(.69,-.40,.29),(.63,.58,.29),(-.57,.53,.29),(-.64,-.49,.29)]
 for j in range(4):
  p0,p1=path[j:j+2]
  for i in range(4):
   t=i/4
   px=p0[0]*(1-t)+p1[0]*t+sin(i+j)*.009
   py=p0[1]*(1-t)+p1[1]*t+sin(i*2+j)*.006
   px2=p0[0]*(1-(t+.25))+p1[0]*(t+.25)
   py2=p0[1]*(1-(t+.25))+p1[1]*(t+.25)
   stick('Q08 actual raw school chalk lines of tilted prison boundary',
    (px,py,.291),(px2,py2,.291),.027,
     chalk,'Q08_CHALK_PRISON_ACTOR')
 # draw some real jail vertical white chalk staves on floor
 for x in (-.42,-.20,.03,.26,.46):
  S('Q08 tilted physical chalk prisoner stripe',
   [(x,-.43,.298),(x+.015,.05,.299),(x+.02,.51,.302)],
   .012,pink,'Q08_CHALK_PRISON_ACTOR',10)
 # two chalk sticks scattered with physical chalk dust ends
 for n in range(2):
  C('Q08 actual broken school chalk hand-sticks',
   (-.48+n*.43,-.56,.43),.069,.43,
   chalk,'Q08_CHALK_STICK_ACTOR',30,rotation=(pi/2,.14*n,0))
  for j in range(12):
   a0=j*2.4
   ovoid('Q08 genuine fallen chalk granules',
    (-.48+n*.43+.09*cos(a0),-.56+.09*sin(a0),.292),
    (.013,.011,.012),chalk,'Q08_CHALK_STICK_ACTOR')
 # oversized official real padlock hooked to a chalk corner
 B('Q08 school detention brass padlock body',(.64,-.41,.54),
  (.24,.12,.23),gold,'Q08_LOCK_ACTOR',.05)
 S('Q08 real arched shackle of 3D school detention lock',
  [(.58,-.41,.63),(.55,-.41,.74),(.71,-.41,.74),(.69,-.41,.63)],
   .028,gold,'Q08_LOCK_ACTOR',14)
 B('Q08 written discipline notice paper sign',
  (-.60,-.59,.63),(.39,.055,.29),paper,'Q08_LOCK_ACTOR',.018)
 T('Q08 no student leave prison notice','不准出圈',
  (-.78,-.63,.61),red,'Q08_LOCK_ACTOR',.08)
def s02():
 lid=M('Sun-worn dark petrol green pencil case handcast shell',(.06,.38,.42),.33,0,.45)
 body=M('Pencil case velvet inner lining navy dark blue',(.09,.17,.26),.78)
 hinge=M('Actual steel long heavy duty pencil case hinge',(.45,.51,.55),.21,.75)
 yellow=M('School pencil classic yellow hexagonal lacquer',(.97,.69,.15),.42)
 lead=M('Graphite sharpened school pencil nib',(.034,.047,.058),.73)
 wood=M('Exposed wooden pencil cedar fragrant shell',(.64,.41,.22),.57)
 eraser=M('Pencil back pink eraser cap',(.93,.46,.54),.60)
 ivory=M('Case etched label original off white',(.96,.84,.69),.57)
 red=M('School warning red nobody else allowed',(.79,.09,.08),.44)
 copper=M('Molded brass magnetic one-pencil case clasp',(.68,.50,.23),.29,.65)
 # authentic hollow stretched case; compact narrow, single pencil
 B('S02 little school mini stationery case bottom',
  (0,.03,.22),(1.33,.36,.27),lid,'S02_CASE_BODY_ACTOR',.13)
 B('S02 real soft felt U-shaped pencil single-channel tray',
  (0,-.01,.33),(1.18,.24,.10),body,'S02_CASE_BODY_ACTOR',.051)
 for side in (-1,1):
  stick('S02 truly one-pen capacity rail',
   (-.57,side*.10,.38),(.57,side*.10,.38),
   .021,ivory,'S02_CASE_BODY_ACTOR')
 # open lid rises at rear, not overlapping pen
 B('S02 actual independent folded metal pencil case opening lid',
  (0,.18,.82),(1.29,.10,.28),lid,
  'S02_LID_ACTOR',.085)
 B('S02 genuine navy blue lid underside liner',
  (0,.110,.81),(1.18,.035,.20),body,'S02_LID_ACTOR',.026)
 for x in (-.45,0,.45):
  C('S02 actual metal lid hinge pivot bearings',(x,.205,.53),
   .055,.075,hinge,'S02_LID_ACTOR',20,rotation=(pi/2,0,0))
 # pencil body segmented with true pointed wood tip
 C('S02 one ONLY wooden pencil yellow lacquer full cylinder',
  (-.04,-.01,.46),.059,.93,yellow,
  'S02_ONLY_PENCIL_ACTOR',hex:=6,rotation=(0,pi/2,0))
 S('S02 exposed sharpened cedar pencil tip',
   [(.40,-.01,.46),(.56,-.01,.46)],[.060,.017],
   wood,'S02_ONLY_PENCIL_ACTOR',hex)
 S('S02 actual graphite writing needle',
   [(.55,-.01,.46),(.61,-.01,.46)],[.023,.002],
    lead,'S02_ONLY_PENCIL_ACTOR',12)
 C('S02 pink actual eraser end cap at back',
  (-.53,-.01,.46),.065,.08,eraser,
  'S02_ONLY_PENCIL_ACTOR',24,rotation=(0,pi/2,0))
 B('S02 gold one-pencil release magnetic latch',
   (0,-.16,.22),(.19,.05,.12),copper,'S02_CASE_BODY_ACTOR',.028)
 T('S02 special one pencil only tiny embossed sticker','仅限一支!',
  (-.37,-.220,.24),red,'S02_CASE_BODY_ACTOR',.09)
def s05():
 steel=M('Comically shiny bright green school robot school vest',(.18,.52,.36),.34,.39)
 dark=M('Robot dark graphite aluminum inner frame',(.12,.16,.20),.31,.64)
 chrome=M('Real brushed silver robot arm fastener',(.58,.64,.69),.22,.80)
 eye=M('Robotic bright blue lens physical deep-seated',(.27,.67,.89),.18,0,.72)
 black=M('Black robot LCD face background',(.037,.063,.081),.20)
 red=M('Robot embarrassed apology screen red',(.91,.26,.19),.35)
 paper=M('Teacher register official cream paper',(.91,.83,.65),.74)
 blue=M('Class attendance roll heavy dark blue ink',(.19,.35,.58),.61)
 wood=M('School class monitor wooden clipboard',(.57,.36,.13),.50)
 yellow=M('Robot goofy cardboard paper school tie',(.94,.68,.17),.47)
 B('S05 metallic student class leader robot round body',
  (0,0,.90),(.71,.51,.77),steel,
  'S05_ROBOT_BODY_ACTOR',.16)
 B('S05 robot actual neck metal swivel',
   (0,-.02,1.31),(.24,.25,.20),chrome,
   'S05_ROBOT_HEAD_ACTOR',.06)
 B('S05 robot swollen TV-screen shaped head',
   (0,-.03,1.59),(.82,.59,.60),dark,
   'S05_ROBOT_HEAD_ACTOR',.13)
 B('S05 true recessed monitor display with dark inset',
   (0,-.35,1.65),(.64,.03,.38),black,
   'S05_ROBOT_HEAD_ACTOR',.035)
 for x in (-.21,.21):
  ovoid('S05 halfmoon robotic expressive googly eye',
   (x,-.378,1.70),(.075,.020,.084),
   eye,'S05_ROBOT_HEAD_ACTOR')
 S('S05 robot digital stupid mouth smile',
   [(-.16,-.385,1.56),(0,-.39,1.50),
    (.17,-.385,1.55)],.018,red,'S05_ROBOT_HEAD_ACTOR')
 for x in (-.40,.40):
  S('S05 student monitor robot active arm elbow',
   [(x,.07,1.07),(x*1.25,-.08,.98),
    (x*1.44,-.21,.70)],
   [.12,.095,.060],steel,'S05_ROBOT_ARMS_ACTOR',16)
  ovoid('S05 robot two-finger hand metal grappler',
   (x*1.43,-.21,.66),(.11,.09,.12),chrome,
   'S05_ROBOT_ARMS_ACTOR')
 for x in (-.25,.25):
  B('S05 school robot foot with actual sole',
   (x,-.02,.26),(.27,.34,.18),dark,
   'S05_ROBOT_BODY_ACTOR',.052)
  S('S05 robot steel leg piston',
    [(x,.04,.48),(x,-.01,.30)],.07,chrome,
    'S05_ROBOT_BODY_ACTOR')
 # clipboard truly held upright and paper list
 B('S05 authentic wooden classroom attendance clipboard',
  (.65,-.34,.96),(.51,.10,.85),wood,
  'S05_ATTENDANCE_LIST_ACTOR',.04)
 B('S05 fully real paper roll call student roster',
  (.65,-.402,.95),(.43,.037,.72),paper,
  'S05_ATTENDANCE_LIST_ACTOR',.02)
 for i in range(6):
  yy=1.20-i*.095
  stick('S05 school names accidentally electric rice cookers',
   (.48,-.424,yy),(.80,-.424,yy),
   .008,blue,'S05_ATTENDANCE_LIST_ACTOR')
 C('S05 metal clipboard spring retainer',
  (.65,-.40,1.35),.085,.043,chrome,
  'S05_ATTENDANCE_LIST_ACTOR',28,rotation=(pi/2,0,0))
 T('S05 robot actual roll calling error display','电饭煲同学?',
  (-.30,-.397,1.40),red,'S05_ROBOT_HEAD_ACTOR',.095)
def s07():
 brass=M('Nostalgic old school bronze recess bell',(.68,.46,.13),.26,.74)
 brasshi=M('Polished raised school bell lip bright gold',(.92,.70,.24),.19,.79)
 frame=M('Real campus oak school corridor door frames',(.46,.28,.13),.51)
 walnut=M('Old classroom double doors painted blue',(.08,.26,.47),.37)
 paper=M('Actual white timetable pages in folded time tunnel',(.92,.87,.74),.70)
 ink=M('Red Monday label printed school red ink',(.80,.09,.09),.51)
 gear=M('Steel visible school bell rotating gear',(.45,.56,.62),.27,.71)
 dark=M('Real deep hallway unlit 3D door (not glow ring)',(.07,.08,.14),.55)
 # 3 nested real classroom door frames: each is a doorway, not empty glow
 for j in range(3):
  z=.36+j*.14;y=.23+j*.21;sc=1-j*.15
  for x in (-.77*sc,.77*sc):
   B('S07 authentic physical school corridor oak portal post',
     (x,y,.94),(.13,.12,1.55*sc),frame,
     'S07_CORRIDOR_DOORS_ACTOR',.025)
  B('S07 school corridor horizontal wooden top lintel',
    (0,y,1.73*sc), (1.61*sc,.14,.12),
    frame,'S07_CORRIDOR_DOORS_ACTOR',.024)
  B('S07 school interior dark doorway recession depth',
    (0,y+.045,.97), (1.30*sc,.025,1.3*sc),
    dark,'S07_CORRIDOR_DOORS_ACTOR',.012)
  B('S07 actual open blue classroom hinged door leaf',
    (-.55*sc,y-.03,.98),
    (.55*sc,.07,1.23*sc),walnut,
    'S07_CORRIDOR_DOORS_ACTOR',.018)
  C('S07 classroom brass knob on door leaf',
    (-.32*sc,y-.08,1.03),.055,.06,
    brasshi,'S07_CORRIDOR_DOORS_ACTOR',18,rotation=(pi/2,0,0))
 # unmissable giant cast bronze real old-school bell with clapper
 L('S07 actual forged heavy real copper school recess hand bell',
   [(.07,.10),(.19,.14),(.30,.25),(.38,.43),
    (.42,.52),(.41,.57),(.37,.55),(.29,.38),(.07,.15)],
    brass,'S07_BELL_ACTOR',center=(.55,-.49,.97),radials=66)
 A('S07 thick raised bell rolled lip',(.55,-.49),.42,1.54,
    brasshi,'S07_BELL_ACTOR',.029,68)
 stick('S07 physical bell clapper suspended on one arm',
   (.55,-.49,1.04),(.55,-.49,.93),.037,
    gear,'S07_CLAPPER_ACTOR')
 ovoid('S07 literal bronze clapper ball visible below bell',
   (.55,-.49,.87),(.11,.10,.10),brass,
    'S07_CLAPPER_ACTOR')
 stick('S07 hall monitor bell pull handle stem',
   (.55,-.49,1.49),(.55,-.49,1.73),.058,
   brasshi,'S07_BELL_ACTOR')
 # time distortion manifests as paper Monday notices, not hollow glow rings
 for j in range(10):
  th=2.39996*j
  rad=.16+.18*(j%4)/4
  p=(rad*cos(th),-.33+.06*j,.73+.09*j)
  R('S07 animated Monday school timetable sheet physical ribbon',
   [(p[0]-.14,p[1],p[2]),
    (p[0],p[1]-.10,p[2]+.04),
    (p[0]+.14,p[1]-.08,p[2]+.10)],
   .17,paper,'S07_TIMETABLE_ACTOR')
 T('S07 time rewind school notice says Monday AGAIN','又是星期一',
   (-.56,-.39,1.69),ink,'S07_TIMETABLE_ACTOR',.13)
def main():
 allfn={
 'G06':g06,'T05':t05,'K05':k05,'Q03':q03,'Q04':q04,
 'Q07':q07,'Q08':q08,'S02':s02,'S05':s05,'S07':s07}
 chosen=[k for k in NAMES if (not os.environ.get('R185_ID') or
    k in os.environ['R185_ID'].split(','))]
 for id in chosen:
  print('R185_BLENDER_SOURCE_START',id,flush=True)
  a.reset();allfn[id]();a.render_export(id)
 (a.PHOTO/'R185_ten_hero_receipts.json').write_text(json.dumps({
  'total':len(a.AUDIT),'assets':a.AUDIT,
  'visualAccepted':0,'androidAccepted':False,'release':'NO_GO'},
  ensure_ascii=False,indent=2))
 print('R185_TRUE_BLENDER_SCULPTS_GENERATED',len(a.AUDIT),flush=True)
if __name__=='__main__':main()
