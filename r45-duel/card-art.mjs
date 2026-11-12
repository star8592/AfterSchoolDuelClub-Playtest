/**
 * R109 verified, real visual source registry.
 * An ID is only listed when a distinct artwork file exists in assets/cards/r109.
 * Do not synthesize art coverage from a placeholder or emoji.
 * The 20 classics come from R103; 40 theme events were drawn with Z-Image Turbo in R109.
 */
export const PAINTED_CARD_IDS=Object.freeze([
 'E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'K01', 'K02', 'K03', 'K04', 'K05', 'K06', 'K07', 'K08', 'M01', 'M02', 'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06', 'Q07', 'Q08', 'S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'X01', 'X02', 'X03', 'X04', 'X05', 'X06', 'X07', 'X08'
]);
const painted=new Set(PAINTED_CARD_IDS);
export function cardArtURL(id,base='./assets/cards/r109/'){
 return painted.has(id)?base+id+'.webp':null;
}
export function cardArtStatus(id){
 return painted.has(id)?'illustrated':'art-pending';
}
