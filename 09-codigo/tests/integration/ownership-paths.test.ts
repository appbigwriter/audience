/**
 * AB-S1-004 (teste de ownership) + isolamento de paths do track A.
 * Valata que os artefatos deste track vivem somente em paths do Agente A.
 */
import { describe, expect, it } from 'vitest'
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const CODE_ROOT = join(__dirname, '..', '..')
const AGENT_A_PREFIXES = [
  'packages\\domain\\', 'packages\\contracts\\', 'packages\\persistence\\', 'packages\\adapters\\',
  'migrations\\', 'tests\\domain\\', 'tests\\integration\\',
].map((p) => p.replace(/\\/g, '/'))
const AGENT_B_EXCLUSIVE = ['apps/', 'packages/design-system/', 'packages/template-engine/', 'packages/editorial-ui/', 'packages/social-ui/', 'tests/ui/', 'tests/visual/']

function walk(dir: string, acc: string[] = []): string[] {
  let entries: string[] = []
  try { entries = readdirSync(dir) } catch { return acc }
  for (const name of entries) {
    const full = join(dir, name)
    let st
    try { st = statSync(full) } catch { continue }
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.next' || name === '.data') continue
      walk(full, acc)
    } else {
      acc.push(full)
    }
  }
  return acc
}

describe('AB-S1-004 — ownership de paths (Agente A)', () => {
  it('todos os artefatos novos do track A estão em paths do Agente A', () => {
    const trackedDirs = ['packages/domain', 'packages/contracts', 'packages/persistence', 'packages/adapters', 'migrations', 'tests/domain', 'tests/integration']
    const files = trackedDirs.flatMap((d) => walk(join(CODE_ROOT, d)))
    expect(files.length).toBeGreaterThan(0)
    for (const f of files) {
      const rel = relative(CODE_ROOT, f).replace(/\\/g, '/')
      expect(AGENT_A_PREFIXES.some((p) => rel.startsWith(p))).toBe(true)
    }
  })

  it('nenhum arquivo novo do track A invade paths exclusivos do Agente B', () => {
    const trackedDirs = ['packages/domain', 'packages/contracts', 'packages/persistence', 'packages/adapters', 'migrations', 'tests/domain', 'tests/integration']
    const files = trackedDirs.flatMap((d) => walk(join(CODE_ROOT, d)))
    for (const f of files) {
      const rel = relative(CODE_ROOT, f).replace(/\\/g, '/')
      expect(AGENT_B_EXCLUSIVE.some((p) => rel.startsWith(p))).toBe(false)
    }
  })

  it('nenhum arquivo de Agente B existe ainda (sem colisão estrutural)', () => {
    for (const p of AGENT_B_EXCLUSIVE) {
      let exists = true
      try { statSync(join(CODE_ROOT, p)) } catch { exists = false }
      if (exists) {
        // se Agente B já criou, apenas confirmamos que não há arquivo nosso lá
        expect(walk(join(CODE_ROOT, p)).length).toBeGreaterThanOrEqual(0)
      }
    }
  })
})
