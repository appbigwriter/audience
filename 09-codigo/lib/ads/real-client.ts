import type { FbrAdsAdapter } from '../index'
export class ConfigurableFbrAdsAdapter implements FbrAdsAdapter {
  constructor(private readonly options: { apiUrl?: string; apiKey?: string; fetcher?: typeof fetch } = {}) {}
  validateCreative(width: number, height: number) { return (width === 1250 && height === 150) || (width === 350 && height === 350) }
  async inventory(_query: string): Promise<never> { if (!this.options.apiUrl || !this.options.apiKey) throw new Error('FBR Ads is not configured: set FBR_ADS_API_URL and FBR_ADS_API_KEY'); throw new Error('FBR Ads inventory endpoint is not configured; inject a provider contract instead of assuming paths') }
  async selectCreative(_query: string): Promise<never> { if (!this.options.apiUrl || !this.options.apiKey) throw new Error('FBR Ads is not configured: set FBR_ADS_API_URL and FBR_ADS_API_KEY'); throw new Error('FBR Ads creative endpoint is not configured; inject a provider contract instead of assuming paths') }
}
