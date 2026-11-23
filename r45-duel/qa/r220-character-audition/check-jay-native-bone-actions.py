from pathlib import Path
import json,struct,sys
glb=Path(__file__).resolve().parent/'assets/jay-teen-duel-v01.glb'
b=glb.read_bytes()
assert b[:4]==b'glTF' and struct.unpack_from('<I',b,4)[0]==2
assert struct.unpack_from('<I',b,8)[0]==len(b)
size=struct.unpack_from('<I',b,12)[0]
j=json.loads(b[20:20+size])
clips={x['name']:x for x in j.get('animations',[])}
required=['Duel_Idle_LookAround','Duel_DrawCard','Duel_ThrowCard','Duel_Recoil','Duel_Victory']
assert len(j.get('skins',[]))==1 and len(j['skins'][0]['joints'])==24
for name in required:
 assert name in clips,('missing',name)
 a=clips[name]
 rot={j['nodes'][ch['target']['node']].get('name','') for ch in a['channels'] if ch['target']['path']=='rotation'}
 needed={'Hips','Spine','Spine01','LeftArm','RightArm','LeftForeArm','RightForeArm',
         'Head','LeftUpLeg','RightUpLeg','LeftLeg','RightLeg'}
 assert needed <= rot,(name,'missing bones',needed-rot)
 assert len(rot)>=20,(name,len(rot))
 raw_time=[j['accessors'][sam['input']]['max'][0] for sam in a['samplers'] if 'max' in j['accessors'][sam['input']]]
 assert raw_time and .6<=max(raw_time)<=8,(name,'duration',max(raw_time) if raw_time else 0)
 print('PASS',name,len(rot),'real named bone rotation channels','max duration',round(max(raw_time),2))
assert {'Idle_Breathe','walk','run'} <= set(clips)
print('R220_SCENE_CANDIDATE_TECHNICAL_PASS',(glb.name,len(b),len(clips),24),
      'VISUAL_APPROVAL_NOT_GRANTED',True)
