import {APPROVED_ART} from './art-approved.mjs';

const HEX64=/^[0-9a-f]{64}$/i;
const SAFE_DATA=/^data:image\/(?:png|webp|avif);base64,[A-Za-z0-9+/=]+$/;

/**
 * Slots follow "scene:campus:classroom", "portrait:campus:E01",
 * and "effect:campus:chalk". Never load a generic full UI mockup.
 */
export function approvedArtwork(slot) {
  if(typeof slot!=='string'||!/^(?:scene|portrait|effect):[a-z0-9:-]+$/.test(slot))
    return null;
  const item=APPROVED_ART[slot];
  if(!item||item.review_status!=='APPROVED')return null;
  if(item.slot!==slot||item.is_composite_ui===true)return null;
  if(item.source!=='ChatGPT-native'||
     item.model_verified!==true||
     typeof item.model_version!=='string'||
     !item.model_version.toLowerCase().includes('gpt-image-2.6'))return null;
  if(!HEX64.test(item.sha256)||!SAFE_DATA.test(item.data_uri))return null;
  return item;
}
export function appendApprovedArtwork(parent,slot,alt='',className='art-image') {
  const asset=approvedArtwork(slot);
  if(!asset)return false;
  const img=document.createElement('img');
  img.className=className;
  img.src=asset.data_uri;
  img.alt=alt;
  img.loading='lazy';
  img.decoding='async';
  img.setAttribute('data-approved-slot',slot);
  parent.append(img);
  return true;
}
export const ART_SLOT_NAMES=Object.freeze([
  'scene:campus:classroom',
  'portrait:campus:E01',
  'portrait:campus:G01',
  'portrait:campus:T01',
  'effect:campus:chalk',
  'effect:campus:broadcast',
  'effect:campus:poster'
]);
export function auditArtRuntime() {
  return {
    required_slots:ART_SLOT_NAMES.length,
    approved_slots:ART_SLOT_NAMES.filter(slot=>approvedArtwork(slot)).length,
    rejected_or_missing_slots:ART_SLOT_NAMES.filter(slot=>!approvedArtwork(slot)),
    isolated_assets_only:true,
    used_as_public_art:ART_SLOT_NAMES.filter(slot=>approvedArtwork(slot)).length>0
  };
}
