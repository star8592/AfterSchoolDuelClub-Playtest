/**
 * R121: authoritative-card-bound contact presentation.
 * The game engine, not these descriptors, decides damage and affected UIDs.
 * Each of the 46 playable spell cards receives one stable element and a
 * distinct card signature; assets are original and character-specific.
 */
import {BY_ID,CARDS} from '../engine.mjs';
import {CARD_MAGIC_MOTIFS} from './magic-arsenal.mjs';

export const ELEMENTS=Object.freeze({
 metal:{name:'金',reaction:'clang',color:0xe9e1be,sound:'ice_shatter'},
 wood:{name:'木',reaction:'entangle',color:0x69db8a,sound:'shield_block'},
 water:{name:'水',reaction:'splash',color:0x75d7fa,sound:'sonic_wave'},
 fire:{name:'火',reaction:'burn',color:0xff8948,sound:'meteor_impact'},
 earth:{name:'土',reaction:'stagger',color:0xc4a377,sound:'hit'},
 electric:{name:'雷电',reaction:'twitch',color:0xc6acff,sound:'spell_charge'},
 wind:{name:'风',reaction:'blown',color:0xb7e9e3,sound:'sonic_wave'},
 ice:{name:'冰',reaction:'shiver',color:0xc7f3ff,sound:'ice_shatter'},
 light:{name:'光',reaction:'dazzled',color:0xffe7a3,sound:'shield_chime'},
 shadow:{name:'暗',reaction:'cower',color:0x9477cc,sound:'sonic_wave'},
 time:{name:'时间',reaction:'stunned',color:0xf8cda1,sound:'card_flip'},
 space:{name:'空间',reaction:'displaced',color:0x9db9ff,sound:'spell_charge'},
 mind:{name:'精神',reaction:'dizzy',color:0xf3b5e9,sound:'sonic_wave'},
 sound:{name:'声波',reaction:'cover_ears',color:0x96dcff,sound:'sonic_wave'},
 absurd:{name:'荒诞',reaction:'comic_bounce',color:0xffd980,sound:'r102_rubber_squeak'}
});
const MOTIF_ELEMENTS=Object.freeze({
 aurora:'light',meteor:'fire',crystal:'metal',runes:'mind',tidal:'water',
 lightning:'electric',banana:'absurd',shield:'light',fruit:'wood',
 chili:'fire',steam:'water',volcano:'earth',frog:'absurd',chocolate:'absurd',
 eraser:'earth',beasts:'mind',dream:'mind',broadcast:'sound',papers:'wind',
 lamp:'light',moons:'shadow',chalk:'metal',clock:'time',pencil:'wood',
 tornado:'wind',robot:'electric',elastic:'metal',portal:'space',
 vending:'earth',ball:'earth',cosmic:'space',echo:'sound'
});
// A few deliberately art-directed deviations from the motif category:
// these cards carry recognizable elemental identity even with the old mesh.
const OVERRIDES=Object.freeze({
 K05:'ice',P07:'ice',Q07:'shadow',X07:'time',Q02:'wood',
 X05:'space',S08:'electric',P05:'metal',K04:'fire',S01:'time'
});
export const CARD_ELEMENTS=Object.freeze(Object.fromEntries(
 Object.entries(CARD_MAGIC_MOTIFS).map(([id,motif])=>
  [id,OVERRIDES[id]||MOTIF_ELEMENTS[motif]])
));
export const SPELL_SIGNATURES=Object.freeze(Object.fromEntries(
 Object.entries(CARD_ELEMENTS).map(([id,element])=>[id,Object.freeze({
  id,element,cardName:BY_ID[id]?.name||id,motif:CARD_MAGIC_MOTIFS[id],
  // Four character-specific beats have independent animations, but damage
  // remains canonical. Never claim 46 unrelated source mesh assets.
  signature:id+'-'+CARD_MAGIC_MOTIFS[id],reaction:ELEMENTS[element]?.reaction,
  accent:ELEMENTS[element]?.color,sound:ELEMENTS[element]?.sound
 })])
));
export function describeSpellContact(event){
 if(!event||event.type!=='ASDC_R81_SPELL_RESULT'||
    !['player','ai'].includes(event.side)||
    !Number.isInteger(event.serial)||event.serial<=0)return null;
 const card=BY_ID[event.card],style=SPELL_SIGNATURES[event.card];
 if(card?.kind!=='spell'||!style||event.effect!==card.effect)return null;
 const directDamage=Math.max(0,Number(event.directDamage)||0);
 const targetUids=Array.isArray(event.targetUids)?
  [...new Set(event.targetUids.filter(x=>typeof x==='string'&&/^U\d+$/.test(x)))].slice(0,5):[];
 const unitDamage=Math.max(0,Number(event.damage)||0)-directDamage;
 return Object.freeze({...style,serial:event.serial,caster:event.side,
   victim:event.side==='player'?'ai':'player',
   directDamage,unitDamage,
   targetUids:unitDamage>0?targetUids:[],
   // A status card or healing card is never misrepresented as a damaging hit.
   damaging:directDamage>0||unitDamage>0,
   supportive:directDamage<=0&&unitDamage<=0});
}
const spells=CARDS.filter(c=>c.kind==='spell');
if(spells.length!==46||Object.keys(SPELL_SIGNATURES).length!==46||
   spells.some(c=>!SPELL_SIGNATURES[c.id]||!ELEMENTS[SPELL_SIGNATURES[c.id].element]))
 throw Error('R121 elemental contract must cover all 46 real spell cards');
