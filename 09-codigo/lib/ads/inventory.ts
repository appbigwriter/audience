import { validateAd } from './fbr-ads-client'
export type AdType='affiliate'|'product'; export type Ad={id:string;type:AdType;width:number;height:number;title:string;disclosure?:string}
export function addAd(ad:Ad){validateAd(ad.type,ad.width,ad.height);if(ad.type==='affiliate'&&!ad.disclosure)throw new Error('affiliate disclosure required');return ad}
export function selectSlots(ads:Ad[]){const affiliate=ads.find(a=>a.type==='affiliate');const product=ads.find(a=>a.type==='product');return {affiliate:affiliate?.id??null,product:product?.id??null,blocked:!affiliate||!product}}
