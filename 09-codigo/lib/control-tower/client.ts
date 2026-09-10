export interface ControlTowerClient { provision(payload:{name:string;slug:string;businessType:'custom';templateKey:'custom_base'}):Promise<{projectId:string;schemaName:string}> }
export { MockControlTower } from '../index'
