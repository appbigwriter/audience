export interface ImageProvider { search(query:string):Promise<{url:string;license:string;source:string}> }
export class MockImageProvider implements ImageProvider {async search(query:string){return {url:`mock://${encodeURIComponent(query)}`,license:'mock',source:'local adapter'}}}
