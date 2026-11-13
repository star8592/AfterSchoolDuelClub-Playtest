/** R114 pure audience anticipation, cheer and sympathy motion. */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>{const t=clamp(v);return t*t*(3-2*t)};
export function crowdReactionMotion({type='idle',winner=null,team='player',
 elapsed=0,offset=0,reduced=false,index=0,focusIndex=-1,scenario=null,role='spectator'}={}){
 const t=Math.max(0,elapsed);
 // R122: individual reactions to a misdirected school magic projectile.
 // Closest spectator ducks or jumps; neighbors shield their heads, far
 // spectator flinches and yells. All local-space and reset each frame.
 if(type==='accident'){
  // Correct *actual* left/right seat adjacency; the two edge spectators
  // aren't neighbors. Prop accident -> near duck -> next chair -> far gasp.
  if(role==='supervisor'){
   const delay=.43,phase=Math.max(0,t-delay);
   const inAction=t>=delay&&t<2.65;
   const envelope=inAction?ease(phase/.22)*(1-ease((phase-1.50)/.95)):0;
   const s=(reduced?.23:1)*envelope;
   return {active:inAction,weight:s,mode:'supervisor_intervene',
    yaw:-.16*s,tilt:-.25*s,bounce:reduced?0:.085*Math.max(0,Math.sin(phase*6))*s,
    arms:.91*s,headYaw:-.20*s,headPitch:-.18*s,duck:0,
    duration:2.65,near:false,neighbor:false,delay,scenario};
  }
  const seatX=[-8,-4.65,4.65,8,-6.25,-2.65,2.65,6.25];
  const near=index===focusIndex;
  const next=!near&&Math.abs(seatX[index]-seatX[focusIndex])<3.8;
  const delay=near?0:next?.18:.43+(index%2)*.10;
  const phase=Math.max(0,t-delay);
  const duration=2.65,active=t>=delay&&t<duration;
  const envelope=active?ease(phase/.12)*(1-ease((phase-1.9)/.68)):0;
  const power=near?1:next?.69:.31;
  const s=(reduced?.24:1)*envelope;
  const side=index%2?-1:1;
  const panic=scenario==='misfire'?1.18:
   scenario==='overshoot'?1.10:scenario==='shockwave'?.83:1;
  const turn=(Math.sin(phase*9+offset)*.24+Math.sin(phase*3)*.14)*power;
  const hops=Math.max(0,Math.sin(Math.min(phase,1.35)*8));
  // The body doesn't remain bent forever; settle restores full skeleton.
  return {active,weight:s*power,mode:near?'accident_target':
   next?'accident_neighbor':'accident_gasp',
   yaw:side*turn*s*panic,
   tilt:side*(.12+.07*Math.sin(phase*12))*power*s*panic,
   bounce:reduced?0:(near?.19:next?.064:.025)*hops*s,
   arms:(near?.86:next?.58:.26)*s*panic,
   headYaw:side*(near?.24:next?.16:.14)*s,
   headPitch:(near?-.17:next?-.09:.11)*s,
   duck:near?.12*s:0,
   duration,near,neighbor:next,delay,scenario,
   wave:Math.sin(phase*15+offset)*envelope};
 }

 const duration=type==='finale'?6.4:type==='hit'?1.45:1.65;
 const active=type!=='idle'&&t>=0&&t<duration;
 const envelope=active?ease(t/.25)*(1-ease((t-duration+.4)/.4)):0;
 const winning=winner===team;
 const s=reduced?0:envelope;
 const tempo=type==='finale'?7.5:type==='hit'?4.8:5.2;
 const beat=t*tempo+offset;
 const power=type==='finale'?(winning?1.0:.38):type==='hit'?.52:.72;
 return {active,weight:s,mode:type==='finale'?(winning?'cheer':'sympathy'):type,
  yaw:.10*Math.sin(beat*.75)*power*s,
  tilt:(type==='hit'?.055:.060)*Math.sin(beat)*power*s,
  bounce:(type==='finale'&&winning?.038:0)*Math.max(0,Math.sin(beat*2))*s,
  arms:(type==='finale'&&winning?.27:type==='hit'?.12:.14)*power*s,
  duration};
}
