/**
 * R195 QA-only recovery contract. Engine stays in parent memory while the
 * same-origin 3D renderer iframe is reconstructed after actual GPU context loss.
 * Never mutates game, never alters card/shuffle/RNG, no persistence cookies.
 */
export const R195_SOURCE_IDS=Object.freeze([
 'E02','E03','E04','G02','G03','G04','M01','M02','T01','T02','T03','T04']);
const r195Available=new Set(R195_SOURCE_IDS);
export function r195NeededRealGlbs(g,BY_ID){
 if(!g||!BY_ID||!g.hand||!g.board)throw Error('R195 missing rules state');
 const cards=[...g.hand.player,...g.hand.ai,
  ...g.board.player[0].map(u=>u.id),
  ...g.board.ai[0].map(u=>u.id)];
 const ids=[...new Set(cards.filter(id=>BY_ID[id]?.kind==='unit'&&
   !['E01','G01'].includes(id)))];
 if(ids.some(id=>!r195Available.has(id)))throw Error('R195 unknown real source');
 return ids;
}
export function r195Fingerprint(g){
 if(!g||!['playing','ended'].includes(g.phase))throw Error('R195 invalid engine phase');
 // Serialize every authoritative field, including RNG/deck/discard, not
 // just visible hand/HP. Never stores or exports this outside QA.
 const value=JSON.stringify(g);
 let hash=2166136261;
 for(let i=0;i<value.length;i++){
   hash^=value.charCodeAt(i);
   hash=Math.imul(hash,16777619)>>>0;
 }
 return {serial:g.serial,round:g.round,seed:g.seed,deck:g.deckPreset,
  length:value.length,digest:hash.toString(16).padStart(8,'0')};
}
