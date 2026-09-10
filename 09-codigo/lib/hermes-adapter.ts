import { execFile } from 'node:child_process'
import type { BlogInput, HermesAdapter } from './index'

export class ConfigurableHermesAdapter implements HermesAdapter {
  constructor(private readonly options: { apiUrl?: string; apiKey?: string; cliCommand?: string; fetcher?: (input: string | URL | Request, init?: RequestInit) => Promise<Response> } = {}) {}
  async createManager(input: BlogInput): Promise<{ profileId: string; validated: boolean }> {
    if (this.options.apiUrl && this.options.apiKey) {
      const path = process.env.HERMES_CREATE_PATH
      if (!path) throw new Error('HERMES_CREATE_PATH is required; no remote Hermes endpoint is assumed')
      const response = await (this.options.fetcher || fetch)(`${this.options.apiUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, { method: 'POST', headers: { Authorization: `Bearer ${this.options.apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'gestor_editorial', blog: input }) })
      if (!response.ok) throw new Error(`Hermes manager creation failed (${response.status})`)
      const body = await response.json() as { id?: string; profileId?: string; validated?: boolean }
      if (!body.id && !body.profileId) throw new Error('Hermes response did not include a manager id')
      return { profileId: body.id || body.profileId as string, validated: body.validated === true }
    }
    if (this.options.cliCommand) return new Promise((resolve, reject) => execFile(this.options.cliCommand!, ['create-manager', '--json'], { encoding: 'utf8' }, (error: Error | null, stdout: string) => { if (error) return reject(new Error(`Hermes CLI manager creation failed: ${error.message}`)); try { const body = JSON.parse(stdout) as { id?: string; validated?: boolean }; if (!body.id) throw new Error('Hermes CLI response did not include id'); resolve({ profileId: body.id, validated: body.validated === true }) } catch (reason) { reject(reason) } }))
    throw new Error('Hermes is not configured: set HERMES_API_URL/HERMES_API_KEY plus HERMES_CREATE_PATH, or HERMES_CLI_COMMAND')
  }
  async healthCheck(profileId: string) {
    if (!this.options.apiUrl || !this.options.apiKey) throw new Error('Hermes health check requires configured API transport')
    const path = process.env.HERMES_HEALTH_PATH_TEMPLATE
    if (!path) throw new Error('HERMES_HEALTH_PATH_TEMPLATE is required; no remote Hermes endpoint is assumed')
    const response = await (this.options.fetcher || fetch)(`${this.options.apiUrl.replace(/\/$/, '')}/${path.replace('{id}', encodeURIComponent(profileId)).replace(/^\//, '')}`, { headers: { Authorization: `Bearer ${this.options.apiKey}` } })
    return response.ok && (await response.json() as { status?: string }).status === 'validated'
  }
}
