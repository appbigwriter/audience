import { spawn } from 'node:child_process'
import type { BlogInput, HermesAdapter } from './index'

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>
function commandParts(command: string): [string, string[]] {
  const parts = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map(x => x.replace(/^(['"])(.*)\1$/, '$2')) || []
  if (!parts[0]) throw new Error('HERMES_CLI_COMMAND is empty')
  return [parts[0], parts.slice(1)]
}
function runCli(command: string, args: string[], payload: unknown): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const [file, configuredArgs] = commandParts(command)
    const child = spawn(file, [...configuredArgs, ...args], { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''; let stderr = ''
    child.stdout.on('data', chunk => { stdout += String(chunk) }); child.stderr.on('data', chunk => { stderr += String(chunk) })
    child.on('error', error => reject(new Error(`Hermes CLI failed to start: ${error.message}`)))
    child.on('close', code => { if (code !== 0) return reject(new Error(`Hermes CLI failed (exit ${code})${stderr ? `: ${stderr.trim().slice(0, 300)}` : ''}`)); try { resolve(JSON.parse(stdout) as Record<string, unknown>) } catch { reject(new Error('Hermes CLI contract requires one JSON object on stdout')) } })
    child.stdin.end(JSON.stringify(payload))
  })
}

export class ConfigurableHermesAdapter implements HermesAdapter {
  constructor(private readonly options: { apiUrl?: string; apiKey?: string; createPath?: string; healthPathTemplate?: string; cliCommand?: string; fetcher?: Fetcher } = {}) {}
  async createManager(input: BlogInput) {
    if (this.options.apiUrl && this.options.apiKey) {
      if (!this.options.createPath) throw new Error('Hermes HTTP contract requires HERMES_CREATE_PATH')
      const response = await (this.options.fetcher || fetch)(`${this.options.apiUrl.replace(/\/$/, '')}/${this.options.createPath.replace(/^\//, '')}`, { method: 'POST', headers: { Authorization: `Bearer ${this.options.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'gestor_editorial', blog: input }) })
      if (!response.ok) throw new Error(`Hermes manager creation failed (${response.status})`)
      const body = await response.json() as { id?: string; profileId?: string; validated?: boolean }
      if (!body.id && !body.profileId) throw new Error('Hermes response did not include a manager id')
      return { profileId: body.id || body.profileId as string, validated: body.validated === true }
    }
    if (this.options.cliCommand) { const body = await runCli(this.options.cliCommand, ['create-manager', '--json'], { role: 'gestor_editorial', blog: input }); const id = body.id || body.profileId; if (typeof id !== 'string') throw new Error('Hermes CLI response did not include manager id'); return { profileId: id, validated: body.validated === true } }
    throw new Error('Hermes is not configured: set the documented HTTP contract or HERMES_CLI_COMMAND')
  }
  async healthCheck(profileId: string) {
    if (this.options.cliCommand && !this.options.apiUrl) { const body = await runCli(this.options.cliCommand, ['health-check', '--json'], { profileId }); return body.status === 'validated' || body.validated === true }
    if (!this.options.apiUrl || !this.options.apiKey || !this.options.healthPathTemplate) throw new Error('Hermes health check requires the documented HTTP contract or HERMES_CLI_COMMAND')
    const path = this.options.healthPathTemplate.replace('{id}', encodeURIComponent(profileId))
    const response = await (this.options.fetcher || fetch)(`${this.options.apiUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, { headers: { Authorization: `Bearer ${this.options.apiKey}` } })
    return response.ok && (await response.json() as { status?: string }).status === 'validated'
  }
}
