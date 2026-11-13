/** R114 pure audience anticipation, cheer and sympathy motion. */
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>{const t=clamp(v);return t*t*(3-2*t)};
export function crowdReactionMotion({type='idle',winner=null,team='player',
 elapsed=0,offset=0,reduced=false}={}){
 const t=Math.max(0,elapsed);
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
