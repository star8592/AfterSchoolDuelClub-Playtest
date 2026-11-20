/**
 * R208: seven card-pair collisions in the original R169 46-spell Foley bible.
 * We keep each original two sound layers; add ONE recognizable, quiet accent
 * only to the seven second cards, after an authoritative real 3D cue.
 * No new assets, GPU objects, synthetic voice or live sound generators.
 */
export const R208_SPELL_FOLEY_ACCENTS=Object.freeze({
 Q05:Object.freeze({cue:'r102_radio_tune',phase:'cast',gainScale:.23,delay:.11,reason:'粉笔记者会的麦克风调台'}),
 Q08:Object.freeze({cue:'r102_stamp_pop',phase:'contact',gainScale:.27,delay:.06,reason:'粉笔监狱封印'}),
 K05:Object.freeze({cue:'r102_comedy_whistle',phase:'cast',gainScale:.24,delay:.08,reason:'空气汤空锅'}),
 Q04:Object.freeze({cue:'r102_crowd_gasp',phase:'contact',gainScale:.26,delay:.05,reason:'寝室声音外放'}),
 P07:Object.freeze({cue:'r121_ice',phase:'contact',gainScale:.27,delay:.05,reason:'黑天鹅溜冰'}),
 P02:Object.freeze({cue:'r102_spring_boing',phase:'contact',gainScale:.29,delay:.08,reason:'皮球碰墙弹回'}),
 S04:Object.freeze({cue:'r121_electric',phase:'contact',gainScale:.25,delay:.04,reason:'错题发电机电弧'})
});
export function r208SpellAccent(id,phase){
 const spec=R208_SPELL_FOLEY_ACCENTS[id];
 return spec?.phase===phase?spec:null;
}
