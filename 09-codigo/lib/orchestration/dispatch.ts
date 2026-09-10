export type AgentRole='Iris'|'Kora'|'Theo'|'Caio'|'Lia'|'Vito'|'Rick'|'Rafa'|'Gabe'|'Gestor'
export type Evidence={agent:AgentRole;action:string;timestamp:string;artifact?:string}
export function dispatch(agent:AgentRole,action:string,artifact?:string):Evidence{return {agent,action,artifact,timestamp:new Date().toISOString()}}
export class KoraKanban {events:Evidence[]=[]; record(agent:AgentRole,action:string,artifact?:string){if(agent!=='Kora')throw new Error('Kora owns Kanban state');const event=dispatch(agent,action,artifact);this.events.push(event);return event}}
