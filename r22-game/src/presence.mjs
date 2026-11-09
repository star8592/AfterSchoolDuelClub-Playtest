/**
 * Pure projection of persistent on-board units.
 * Reads canonical board snapshots, never changes combat rules or HP.
 * All visual motion is derived from measured state changes.
 */
function takeSnapshot(board) {
  const out=new Map();
  for(const side of ['player','ai']){
    for(let lane=0;lane<3;lane++){
      for(const unit of board[side][lane]){
        out.set(side+':'+unit.uid,Object.freeze({
          key:side+':'+unit.uid,side,lane,uid:unit.uid,id:unit.id,
          hp:unit.hp,shield:unit.shield||0,
          attack:unit.attack+(unit.buff||0),
          summonedAt:unit.summonedAt
        }));
      }
    }
  }
  return out;
}
export function createPresenceTracker(){
  let previous=new Map();
  function reset(){previous=new Map();}
  function reconcile(board){
    const current=takeSnapshot(board);
    const changes=[];
    for(const [key,now] of current){
      const old=previous.get(key);
      if(!old){
        changes.push(Object.freeze({kind:'summon',key,...now}));
        continue;
      }
      if(old.lane!==now.lane)changes.push(Object.freeze({kind:'relocate',key,from:old.lane,to:now.lane,side:now.side,uid:now.uid}));
      if(old.hp>now.hp)changes.push(Object.freeze({kind:'hurt',key,amount:old.hp-now.hp,side:now.side,uid:now.uid,lane:now.lane}));
      if(old.shield>now.shield)changes.push(Object.freeze({kind:'block',key,amount:old.shield-now.shield,side:now.side,uid:now.uid,lane:now.lane}));
      if(old.shield<now.shield)changes.push(Object.freeze({kind:'shield',key,amount:now.shield-old.shield,side:now.side,uid:now.uid,lane:now.lane}));
      if(old.attack<now.attack)changes.push(Object.freeze({kind:'powerup',key,amount:now.attack-old.attack,side:now.side,uid:now.uid,lane:now.lane}));
    }
    for(const [key,old] of previous)if(!current.has(key))
      changes.push(Object.freeze({kind:'leave',key,side:old.side,uid:old.uid,id:old.id,lane:old.lane}));
    previous=current;
    return Object.freeze(changes);
  }
  return {reconcile,reset,get size(){return previous.size;}};
}
