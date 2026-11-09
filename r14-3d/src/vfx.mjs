/**
 * Rule-event-driven, presentation-only cue projection.
 *
 * Never modifies game state. Animation may be skipped, reduced, or absent.
 * Never infer a skill from title/description text.
 */
const SPEC = Object.freeze({
  chalk_hit:{kind:'chalk',title:'粉笔弹射！',motion:'impact'},
  chalk_direct:{kind:'chalk',title:'粉笔突破！',motion:'direct'},
  broadcast_move:{kind:'broadcast',title:'广播串台！',motion:'relocate'},
  broadcast_draw:{kind:'broadcast',title:'广播补牌！',motion:'draw'},
  poster_shield:{kind:'poster',title:'海报护卫！',motion:'shield'},
  poster_draw:{kind:'poster',title:'招新灵感！',motion:'draw'}
});
export const ANIMATION_PHASES=Object.freeze(['windup','impact','aftermath']);
export function projectComboCue(event) {
  if(!event||event.type!=='combo_effect')return null;
  const visual=SPEC[event.effect];
  if(!visual)return null;
  if(!Number.isInteger(event.lane)||event.lane<0||event.lane>2)
    return null;
  const amount=event.effect==='chalk_hit'?event.damage:
    event.effect==='chalk_direct'?event.damage:
    event.effect==='poster_shield'?event.shield:
    event.draw||0;
  const suffix=event.effect==='broadcast_move'?' → 战线'+(event.to_lane+1):
    event.effect==='chalk_hit'?' −'+event.damage+' HP'+(event.blocked?'（格挡'+event.blocked+'）':''):
    event.effect==='chalk_direct'?' 人气 −'+event.damage:
    event.effect==='poster_shield'?' 护盾 +'+event.shield:
    event.draw?' 手牌 +'+event.draw:'';
  return Object.freeze({
    sourceSerial:event.serial,
    lane:event.lane,
    side:event.side,
    kind:visual.kind,
    motion:visual.motion,
    title:visual.title,
    subtitle:suffix.trim(),
    amount,
    phases:ANIMATION_PHASES
  });
}
