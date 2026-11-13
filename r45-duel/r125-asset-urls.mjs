import './r125-asset-fingerprints.js';
const PREFIX='/r45-duel/assets/';
export function r125VersionedAssetURL(input){
 const u=new URL(input,location.href);
 let disabled=new URLSearchParams(location.search).get('r125Cache')==='off';
 try{disabled ||=window.parent!==window&&
  new URLSearchParams(window.parent.location.search).get('r125Cache')==='off';}
 catch{ /* standalone scene or cross-origin parent */ }
 if(disabled)return u;
 const offset=u.pathname.indexOf(PREFIX);
 if(offset<0)return u;
 const relative=u.pathname.slice(offset+PREFIX.length);
 const sha=globalThis.ASDC_R125_FINGERPRINTS?.[relative];
 if(sha)u.searchParams.set('v',sha.slice(0,16));
 return u;
}
