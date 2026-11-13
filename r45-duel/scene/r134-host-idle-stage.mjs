/**
 * R134: two different *real-source VRM* podium idle director performances.
 * Actual J_Bip spine/chest/head/thigh/knee plus original two-arm IK targets
 * consume these bounded offsets. Never fabricate a mesh, card or new bone.
 * The authoritative cards/voices/turn order are completely untouched.
 */
const clamp=v=>Math.min(1,Math.max(0,Number.isFinite(v)?v:0));
const ease=t=>{const x=clamp(t);return x*x*(3-2*x)};
const pulse=(t,a,b,c,d)=>ease((t-a)/(b-a))*(1-ease((t-c)/(d-c)));
const round=v=>+v.toFixed(4);
export function r134HostIdleBeat(id,seconds,{busy=0,reduced=false}={}){
 if(!['E01','G01'].includes(id)||!Number.isFinite(seconds))return null;
 const fem=id==='E01',period=fem?8.6:10.1;
 const phase=((seconds+(fem?0:2.35))%period+period)%period;
 const inspect=pulse(phase,fem?.62:.58,fem?1.16:1.35,fem?2.55:2.85,fem?3.25:3.55);
 const challenge=pulse(phase,fem?4.45:4.92,fem?5.03:5.45,fem?6.15:7.25,fem?6.9:7.95);
 const continuous=Math.sin(seconds*(fem?1.31:1.07)+(fem?.45:1.8));
 const shift=Math.sin(seconds*(fem?.47:.38)+(fem?0:1.7));
 const strength=Math.pow(1-clamp(busy),2)*(reduced?.18:1);
 // Only source rig joints: this is not a random whole-body dance.
 // Female: impatient peeking at the held card, then a small challenge.
 // Male: thoughtful scan, body weight to one leg, then confident stance.
 const beat={
  id,period,phase:round(phase),inspect:round(inspect*strength),
  challenge:round(challenge*strength),strength:round(strength),
  story:inspect>.45?'check_hand':challenge>.45?'challenge_opponent':'ready',
  shiftX:(fem?.052:.039)*shift*strength,
  liftY:.004*Math.max(0,continuous)*strength,
  yaw:(fem?.060:-.048)*challenge*strength,
  spinePitch:(fem?-.085:-.068)*inspect*strength+
   (fem?.032:.048)*challenge*strength,
  spineRoll:(fem?.052:-.045)*shift*strength,
  chestPitch:(fem?-.13:-.105)*inspect*strength+
   (fem?-.045:.085)*challenge*strength,
  chestRoll:(fem?.082:-.077)*shift*strength,
  headPitch:(fem?-.18:-.15)*inspect*strength+
   (fem?.070:-.035)*challenge*strength,
  headYaw:(fem?.25:-.21)*inspect*strength+
   (fem?-.24:.23)*challenge*strength,
  headRoll:(fem?.027:-.025)*shift*strength,
  thighL:(fem?.102:.080)*shift*strength+(fem?.028:.038)*challenge*strength,
  thighR:(fem?-.102:-.080)*shift*strength,
  kneeL:(fem?.075:.053)*Math.max(0,shift)*strength,
  kneeR:(fem?.075:.053)*Math.max(0,-shift)*strength,
  handR:(fem?
   [.08*inspect,.24*inspect,.075*inspect]:
   [-.07*inspect,.20*inspect,-.06*inspect]).map(x=>x*strength),
  handL:(fem?
   [.20*challenge,.24*challenge,-.08*challenge]:
   [-.18*inspect,.13*challenge,-.08*inspect]).map(x=>x*strength)
 };
 return beat;
}
