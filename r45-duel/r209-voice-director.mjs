/** R209 one-sentence-safe duel voice arbitration. No timers/gameplay mutation. */
export const R209_MAX_DEFER_SECONDS=2.5;
const originalCast=/^HOST_(?:PLAYER|AI):r208_[A-Z][0-9]{2}$/;
const actualInjury=/^(?:hurt|r202_[A-Z][0-9]{2}|r203_[A-Z][0-9]{2})$/;
export function r209CanDelayHurt({activeKey,activeDuration,position,hitId,hitKind}={}){
 if(!originalCast.test(String(activeKey||''))||
    !['HOST_PLAYER','HOST_AI'].includes(hitId)||
    !actualInjury.test(String(hitKind||'')))return false;
 if(activeKey.startsWith(hitId+':'))return false; // no self-overlap
 if(!Number.isFinite(activeDuration)||!Number.isFinite(position))return false;
 const remain=activeDuration-position;
 // Do not defer an injury behind an unusually long/cold-loading clip.
 return position>=0&&remain>0&&remain<=R209_MAX_DEFER_SECONDS;
}
export function r209DropStaleVoice(item){
 return item?.kind==='idle'||item?.kind==='enter'||item?.kind==='social';
}
