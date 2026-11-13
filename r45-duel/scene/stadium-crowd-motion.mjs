/** R114 pure audience anticipation, cheer and sympathy motion. */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>{const t=clamp(v);return t*t*(3-2*t)};
export function crowdReactionMotion({type='idle',winner=null,team='player',
 elapsed=0,offset=0,reduced=false,index=0,focusIndex=-1,scenario=null}={}){
 const t=Math.max(0,elapsed);
 // R122: individual reactions to a misdirected school magic projectile.
 // Closest spectator ducks or jumps; neighbors shield their heads, far
 // spectator flinches and yells. All local-space and reset each frame.
 if(type==='accident'){
  const duration=2.2,active=t>=0&&t<duration;
  const entrance=ease(t/.14),exit=1-ease((t-1.65)/.55);
  const weight=active?entrance*exit:0;
  const near=index===focusIndex;
  const next=((index+3)%4===focusIndex||(index+1)%4===focusIndex);
  const power=near?1:next?.7:.37;
  const wave=active?Math.sin(t*(near?17:12)+offset*4):0;
  return {active,weight,mode:near?'accident_target':next?'accident_neighbor':'accident_gasp',
   yaw:(near?.28:next?.16:.12)*weight*(index%2?-1:1),
   tilt:power*weight*(near?.19:next?.12:.06)*(index%2?1:-1),
   bounce:reduced?0:near?.16*weight*Math.max(0,Math.sin(t*9)):next?.045*weight:0,
   arms:reduced?.11*weight:near?.82*weight:next?.61*weight:.34*weight,
   duration,near,scenario,wave};
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
