import type { FbrAdsAdapter } from '../index'

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>
export class ConfigurableFbrAdsAdapter implements FbrAdsAdapter {
  constructor(private readonly options: { apiUrl?: string; apiKey?: string; inventoryPath?: string; creativePath?: string; fetcher?: Fetcher } = {}) {}
  validateCreative(width: number, height: number) { return (width === 1250 && height === 150) || (width === 350 && height === 350) }
  private async call(path: string | undefined, query: string) {
    if (!this.options.apiUrl || !this.options.apiKey) throw new Error('FBR Ads is not configured: set FBR_ADS_API_URL and FBR_ADS_API_KEY')
    if (!path) throw new Error('FBR Ads contract is not configured: set the provider inventory/creative path')
    const separator = path.includes('?') ? '&' : '?'
    const response = await (this.options.fetcher || fetch)(`${this.options.apiUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}${separator}query=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${this.options.apiKey}` } })
    if (!response.ok) throw new Error(`FBR Ads provider error (${response.status})`)
    return response.json()
  }
  inventory(query: string) { return this.call(this.options.inventoryPath, query) }
  selectCreative(query: string) { return this.call(this.options.creativePath, query) }
}
