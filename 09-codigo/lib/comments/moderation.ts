export function moderateComment(text:string){const risky=/ ameaça|dox|senha|violên/i.test(text);return {status:risky?'needs_review':'approved',reason:risky?'risco público':'sem sinal de risco'}}
