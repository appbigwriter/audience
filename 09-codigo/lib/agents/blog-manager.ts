export interface HermesProfileAdapter { create(input:{slug:string;niche:string;voice:string}):Promise<{id:string}>; health(id:string):Promise<boolean> }
export class MockProfileAdapter implements HermesProfileAdapter {async create(x:{slug:string}){return {id:`profile-${x.slug}`}} async health(){return true}}
