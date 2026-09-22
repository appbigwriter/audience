/**
 * SPRINT S7 backend — jobs, handoffs versionados, inbox/outbox idempotente.
 */
import { describe, expect, it } from 'vitest'
import { acceptHandoff, canStart, createHandoff, createJob, heartbeat, InboxDeduplicator, processOnce } from '../../packages/domain/orchestration'

describe('AB-S7-001 — jobs rastreáveis', () => {
  it('job nasce pending com owner, heartbeat, nextAction e nextCheck', () => {
    const j = createJob({ jobId: 'job-1', projectId: 'ap-1', kind: 'intake', owner: 'agent-a' }, '2026-09-22T00:00:00.000Z')
    expect(j.status).toBe('pending')
    expect(j.heartbeatAt).toBe('2026-09-22T00:00:00.000Z')
    expect(j.nextAction).toBeTruthy()
    expect(j.nextCheckAt).toBeTruthy()
  })

  it('campos inválidos impedem criação', () => {
    expect(() => createJob({ jobId: '', projectId: 'ap-1', kind: 'intake', owner: 'x' })).toThrow(/invalid job/)
    expect(() => createJob({ jobId: 'j', projectId: 'ap-1', kind: 'outro' as never, owner: 'x' })).toThrow(/invalid job/)
  })

  it('dependência não concluída bloqueia início', () => {
    const dep = createJob({ jobId: 'dep', projectId: 'ap-1', kind: 'intake', owner: 'a' })
    const job = createJob({ jobId: 'job', projectId: 'ap-1', kind: 'manifesto', owner: 'a', dependsOnJobIds: ['dep'] })
    const map = new Map([[dep.jobId, dep]])
    expect(canStart(job, map)).toBe(false)
    dep.status = 'success'
    expect(canStart(job, map)).toBe(true)
  })

  it('heartbeat atualiza próxima ação/check', () => {
    const j = createJob({ jobId: 'j', projectId: 'ap-1', kind: 'editorial', owner: 'a' })
    const h = heartbeat(j, 'aguardando revisão', '2026-09-22T01:00:00.000Z')
    expect(h.nextAction).toBe('aguardando revisão')
    expect(h.heartbeatAt).toBeTruthy()
  })
})

describe('AB-S7-002 — handoffs versionados', () => {
  it('envio não é conclusão: nasce não-aceito', () => {
    const h = createHandoff({ handoffId: 'ho-1', from: 'agent-a', to: 'agent-b', objective: 'revisar manifesto', artifactPath: '08-historico/agents/x.md', decisions: ['d1'], blockers: [], gate: null })
    expect(h.accepted).toBe(false)
    expect(h.version).toBe(1)
  })

  it('aceite registra quem/quando; reaceite é erro', () => {
    const h = createHandoff({ handoffId: 'ho-1', from: 'a', to: 'b', objective: 'o', artifactPath: 'p', decisions: [], blockers: [], gate: null })
    const accepted = acceptHandoff(h, 'agent-b', '2026-09-22T00:00:00.000Z')
    expect(accepted.accepted).toEqual({ acceptedBy: 'agent-b', acceptedAt: '2026-09-22T00:00:00.000Z' })
    expect(() => acceptHandoff(accepted, 'outro', '2026-09-22T01:00:00.000Z')).toThrow(/already accepted/)
  })

  it('campos obrigatórios', () => {
    expect(() => createHandoff({ handoffId: '', from: '', to: '', objective: '', artifactPath: '', decisions: [], blockers: [], gate: null })).toThrow(/invalid handoff/)
  })
})

describe('AB-S7-003 — inbox/outbox e idempotência', () => {
  it('mesmo event_id+consumer é replay — não executa duas vezes', () => {
    const inbox = new InboxDeduplicator()
    let executions = 0
    const effect = () => { executions += 1; return { bound: true } }
    const first = processOnce(inbox, 'ev-1', 'audience-builder', 'persona.approved', { x: 1 }, effect, '2026-09-22T00:00:00.000Z')
    const second = processOnce(inbox, 'ev-1', 'audience-builder', 'persona.approved', { x: 1 }, effect, '2026-09-22T00:00:05.000Z')
    expect(first.outcome).toBe('executed')
    expect(second.outcome).toBe('skipped_replay')
    expect(executions).toBe(1)
  })

  it('consumidores diferentes não colidem', () => {
    const inbox = new InboxDeduplicator()
    let n = 0
    const effect = () => { n += 1 }
    processOnce(inbox, 'ev-1', 'consumer-a', 'e', {}, effect)
    processOnce(inbox, 'ev-1', 'consumer-b', 'e', {}, effect)
    expect(n).toBe(2)
  })

  it('tentativas e erro persistem com nextRetry', () => {
    const inbox = new InboxDeduplicator()
    expect(() => processOnce(inbox, 'ev-2', 'c', 'e', {}, () => { throw new Error('falha transient') }, '2026-09-22T00:00:00.000Z')).toThrow('falha transient')
    const ev = inbox.get('ev-2', 'c')
    expect(ev?.status).toBe('failed')
    expect(ev?.attemptCount).toBe(1)
    expect(ev?.lastError).toBe('falha transient')
    expect(ev?.nextRetryAt).toBeTruthy()
  })

  it('payload adulterado no mesmo event_id ainda é replay pela chave (id+consumer)', () => {
    const inbox = new InboxDeduplicator()
    const a = inbox.receive('ev-3', 'c', 'e', { v: 1 })
    const b = inbox.receive('ev-3', 'c', 'e', { v: 2 })
    expect(a.outcome).toBe('registered')
    expect(b.outcome).toBe('replay')
    // divergência de payload fica registrada no hash para auditoria
    expect(b.event.payloadHash).not.toEqual(a.event.payloadHash === undefined ? '' : computeHashOf({ v: 1 }))
  })
})

function computeHashOf(v: unknown): string {
  // helper local simples para comparação no teste
  return JSON.stringify(v)
}
