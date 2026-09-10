export { MockFbrAds as FbrAdsClient } from '../index'
export function validateAd(type:string,width:number,height:number){if(!['affiliate','product'].includes(type))throw new Error('invalid ad type');if(!((width===1250&&height===150)||(width===350&&height===350)))throw new Error('invalid ad size');return true}
