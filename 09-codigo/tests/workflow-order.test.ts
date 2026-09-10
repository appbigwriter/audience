import { describe, expect, it } from 'vitest'
import { canTransition, transition } from '../lib/workflow/state-machine'
describe('Kora state machine',()=>{it('accepts only adjacent ordered states',()=>{expect(canTransition('manager_validated','control_tower_provisioned')).toBe(true);expect(canTransition('intake','control_tower_provisioned')).toBe(false);expect(()=>transition('intake','control_tower_provisioned')).toThrow()})})
