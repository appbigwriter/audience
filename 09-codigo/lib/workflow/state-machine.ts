export const ORDER=['intake','manager_created','manager_validated','control_tower_provisioned','handoffs_persisted','bigwriter_delivered','launch_jobs_created','daily_jobs'] as const
export function canTransition(from:string,to:string){return ORDER.indexOf(to as never)===ORDER.indexOf(from as never)+1}
export function transition(from:string,to:string,actor='kora'){if(actor!=='kora'||!canTransition(from,to))throw new Error('Kora must authorize ordered transition');return to}
