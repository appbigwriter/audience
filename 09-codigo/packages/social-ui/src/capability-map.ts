/**
 * Capability map de canais (AB-S5-001, AB-S5-002).
 * Cada canal registra formatos, limites, frequência, dependências, métricas, riscos, integração,
 * custos e requisitos operacionais. Dados externos carregam fonte/data; ausência de contrato é bloqueio explícito.
 * IMPORTANTE: nenhum canal é escolhido aqui — este arquivo é dado versionado, não decisão.
 */
export const CHANNEL_CATALOG_VERSION = '2026-09-22.1'

export type ContentFormat = 'short-text' | 'long-text' | 'image' | 'carousel' | 'short-video' | 'long-video' | 'live' | 'audio' | 'link-card' | 'thread' | 'pin' | 'story'

export type IntegrationStatus = 'official-contract' | 'api-available' | 'manual-only' | 'none'

export type ChannelRecord = {
  channelId: string
  label: string
  version: number
  formats: ContentFormat[]
  limits: { maxTextChars?: number; maxDurationSec?: number; maxImagesPerPost?: number; titleChars?: number }
  cadenceGuidance: { healthyPerDay: [number, number]; notes?: string }
  dependencies: string[]
  metricsAvailable: string[]
  risks: string[]
  integration: { status: IntegrationStatus; notes: string }
  operational: {
    requiresAccount: boolean
    requiresVideoProduction: boolean
    requiresDesignAssets: boolean
    requiresApprovalPerPost: boolean
    apiForPublishing: boolean
    estimatedSetupEffortHours: number
    recurringEffortHoursPerWeek: number
    monetaryCostLevel: 'free' | 'low' | 'medium' | 'high'
    costNotes?: string
  }
  audienceShape: { skew: 'young' | 'mixed' | 'adult' | 'professional'; discoveryBias: 'interest-graph' | 'follow-graph' | 'search' | 'news-feed' }
  dataProvenance: { source: string; asOf: string; notes?: string }
}

const prov = { source: 'FBR internal capability research (manual, 2026-09)', asOf: '2026-09-22' }

export const CHANNEL_CATALOG: ChannelRecord[] = [
  {
    channelId: 'instagram', label: 'Instagram', version: 1,
    formats: ['image', 'carousel', 'short-video', 'story', 'live'],
    limits: { maxTextChars: 2200, maxDurationSec: 90, maxImagesPerPost: 10 },
    cadenceGuidance: { healthyPerDay: [1, 3], notes: 'reels favorecem alcance; stories diários suportam cadência alta' },
    dependencies: ['visual-assets', 'video-editing'],
    metricsAvailable: ['reach', 'impressions', 'engagement', 'followers', 'saves', 'profile-views'],
    risks: ['shadowban por comportamento automatizado', 'dependência de produção visual constante'],
    integration: { status: 'api-available', notes: 'Graph API disponível para contas business; contrato oficial FBR pendente' },
    operational: { requiresAccount: true, requiresVideoProduction: true, requiresDesignAssets: true, requiresApprovalPerPost: true, apiForPublishing: true, estimatedSetupEffortHours: 6, recurringEffortHoursPerWeek: 8, monetaryCostLevel: 'free', costNotes: 'custo é de produção, não de plataforma' },
    audienceShape: { skew: 'young', discoveryBias: 'interest-graph' },
    dataProvenance: prov,
  },
  {
    channelId: 'pinterest', label: 'Pinterest', version: 1,
    formats: ['pin', 'image', 'carousel', 'short-video'],
    limits: { maxTextChars: 500, titleChars: 100 },
    cadenceGuidance: { healthyPerDay: [3, 10], notes: 'pins têm meia-vida longa; volume consistente supera viralização' },
    dependencies: ['visual-assets'],
    metricsAvailable: ['impressions', 'saves', 'outbound-clicks', 'pin-views'],
    risks: ['tráfego qualificado mas lento', 'nicho visual-dependente'],
    integration: { status: 'api-available', notes: 'API oficial para pins; contrato FBR pendente' },
    operational: { requiresAccount: true, requiresVideoProduction: false, requiresDesignAssets: true, requiresApprovalPerPost: true, apiForPublishing: true, estimatedSetupEffortHours: 4, recurringEffortHoursPerWeek: 5, monetaryCostLevel: 'free' },
    audienceShape: { skew: 'adult', discoveryBias: 'search' },
    dataProvenance: prov,
  },
  {
    channelId: 'tiktok', label: 'TikTok', version: 1,
    formats: ['short-video', 'live'],
    limits: { maxDurationSec: 600, maxTextChars: 2200 },
    cadenceGuidance: { healthyPerDay: [1, 4], notes: 'constância de vídeo curto domina' },
    dependencies: ['video-editing', 'on-camera-or-voiceover'],
    metricsAvailable: ['views', 'watch-time', 'shares', 'followers'],
    risks: ['curva de produção de vídeo alta', 'moderação sensível a claims de saúde/finança'],
    integration: { status: 'api-available', notes: 'Content Posting API exige aprovação de app; contrato FBR pendente' },
    operational: { requiresAccount: true, requiresVideoProduction: true, requiresDesignAssets: false, requiresApprovalPerPost: true, apiForPublishing: true, estimatedSetupEffortHours: 10, recurringEffortHoursPerWeek: 12, monetaryCostLevel: 'free' },
    audienceShape: { skew: 'young', discoveryBias: 'interest-graph' },
    dataProvenance: prov,
  },
  {
    channelId: 'youtube-shorts', label: 'YouTube Shorts', version: 1,
    formats: ['short-video'],
    limits: { maxDurationSec: 180 },
    cadenceGuidance: { healthyPerDay: [1, 3], notes: 'shorts alimentam canal longo' },
    dependencies: ['video-editing'],
    metricsAvailable: ['views', 'subscribers', 'watch-time', 'ctr'],
    risks: ['monetização exige elegibilidade do canal'],
    integration: { status: 'api-available', notes: 'Data API pública; publicação exige OAuth aprovado; contrato FBR pendente' },
    operational: { requiresAccount: true, requiresVideoProduction: true, requiresDesignAssets: false, requiresApprovalPerPost: true, apiForPublishing: true, estimatedSetupEffortHours: 8, recurringEffortHoursPerWeek: 10, monetaryCostLevel: 'free' },
    audienceShape: { skew: 'mixed', discoveryBias: 'interest-graph' },
    dataProvenance: prov,
  },
  {
    channelId: 'youtube-long', label: 'YouTube (longo)', version: 1,
    formats: ['long-video'],
    limits: { maxDurationSec: 3600 },
    cadenceGuidance: { healthyPerDay: [0, 1], notes: 'semanal costuma ser sustentável' },
    dependencies: ['video-production', 'scripting'],
    metricsAvailable: ['views', 'subscribers', 'watch-time', 'revenue'],
    risks: ['esforço de produção alto', 'tempo até tração longo'],
    integration: { status: 'api-available', notes: 'contrato FBR pendente' },
    operational: { requiresAccount: true, requiresVideoProduction: true, requiresDesignAssets: false, requiresApprovalPerPost: true, apiForPublishing: true, estimatedSetupEffortHours: 16, recurringEffortHoursPerWeek: 15, monetaryCostLevel: 'low', costNotes: 'edição/stock opcionais' },
    audienceShape: { skew: 'mixed', discoveryBias: 'search' },
    dataProvenance: prov,
  },
  {
    channelId: 'x-twitter', label: 'X/Twitter', version: 1,
    formats: ['short-text', 'thread', 'image', 'link-card'],
    limits: { maxTextChars: 280 },
    cadenceGuidance: { healthyPerDay: [2, 8], notes: 'threads puxam alcance' },
    dependencies: ['copywriting'],
    metricsAvailable: ['impressions', 'engagement', 'link-clicks', 'followers'],
    risks: ['meia-vida curtíssima', 'alterações frequentes de API/preço'],
    integration: { status: 'api-available', notes: 'API paga por tier; contrato FBR pendente' },
    operational: { requiresAccount: true, requiresVideoProduction: false, requiresDesignAssets: false, requiresApprovalPerPost: true, apiForPublishing: true, estimatedSetupEffortHours: 3, recurringEffortHoursPerWeek: 6, monetaryCostLevel: 'medium', costNotes: 'tier de API pode custar' },
    audienceShape: { skew: 'mixed', discoveryBias: 'news-feed' },
    dataProvenance: prov,
  },
  {
    channelId: 'linkedin', label: 'LinkedIn', version: 1,
    formats: ['short-text', 'long-text', 'image', 'link-card'],
    limits: { maxTextChars: 3000 },
    cadenceGuidance: { healthyPerDay: [1, 2] },
    dependencies: ['copywriting'],
    metricsAvailable: ['impressions', 'engagement', 'followers'],
    risks: ['audiência B2B; inadequado para nichos consumer'],
    integration: { status: 'api-available', notes: 'contrato FBR pendente' },
    operational: { requiresAccount: true, requiresVideoProduction: false, requiresDesignAssets: false, requiresApprovalPerPost: true, apiForPublishing: true, estimatedSetupEffortHours: 2, recurringEffortHoursPerWeek: 4, monetaryCostLevel: 'free' },
    audienceShape: { skew: 'professional', discoveryBias: 'follow-graph' },
    dataProvenance: prov,
  },
  {
    channelId: 'threads', label: 'Threads', version: 1,
    formats: ['short-text', 'image'],
    limits: { maxTextChars: 500 },
    cadenceGuidance: { healthyPerDay: [2, 6] },
    dependencies: ['copywriting'],
    metricsAvailable: ['views', 'replies', 'followers'],
    risks: ['plataforma jovem; métricas instáveis'],
    integration: { status: 'manual-only', notes: 'sem API de publicação estável para todos os casos; contrato FBR pendente' },
    operational: { requiresAccount: true, requiresVideoProduction: false, requiresDesignAssets: false, requiresApprovalPerPost: true, apiForPublishing: false, estimatedSetupEffortHours: 2, recurringEffortHoursPerWeek: 4, monetaryCostLevel: 'free' },
    audienceShape: { skew: 'young', discoveryBias: 'interest-graph' },
    dataProvenance: prov,
  },
  {
    channelId: 'facebook-page', label: 'Facebook Page', version: 1,
    formats: ['short-text', 'long-text', 'image', 'link-card', 'live'],
    limits: { maxTextChars: 63206 },
    cadenceGuidance: { healthyPerDay: [1, 2] },
    dependencies: ['copywriting'],
    metricsAvailable: ['reach', 'engagement', 'followers', 'link-clicks'],
    risks: ['alcance orgânico baixo sem comunidade'],
    integration: { status: 'api-available', notes: 'Graph API páginas; contrato FBR pendente' },
    operational: { requiresAccount: true, requiresVideoProduction: false, requiresDesignAssets: false, requiresApprovalPerPost: true, apiForPublishing: true, estimatedSetupEffortHours: 3, recurringEffortHoursPerWeek: 4, monetaryCostLevel: 'free' },
    audienceShape: { skew: 'adult', discoveryBias: 'follow-graph' },
    dataProvenance: prov,
  },
  {
    channelId: 'newsletter', label: 'Newsletter (própria)', version: 1,
    formats: ['long-text', 'link-card'],
    limits: {},
    cadenceGuidance: { healthyPerDay: [0, 1], notes: 'semanal ou quinzenal' },
    dependencies: ['email-platform'],
    metricsAvailable: ['subscribers', 'open-rate', 'click-rate', 'unsubs'],
    risks: ['custo por assinante em escala', 'entregabilidade'],
    integration: { status: 'manual-only', notes: 'depende de plataforma de e-mail contratada; sem contrato FBR' },
    operational: { requiresAccount: true, requiresVideoProduction: false, requiresDesignAssets: false, requiresApprovalPerPost: true, apiForPublishing: false, estimatedSetupEffortHours: 5, recurringEffortHoursPerWeek: 4, monetaryCostLevel: 'low' },
    audienceShape: { skew: 'mixed', discoveryBias: 'follow-graph' },
    dataProvenance: prov,
  },
]

export function findChannel(channelId: string): ChannelRecord | undefined {
  return CHANNEL_CATALOG.find(c => c.channelId === channelId)
}

/** Bloqueio explícito: sem contrato oficial, publicação integrada fica bloqueada (descoberta continua permitida). */
export function channelPublishBlocker(channelId: string): { blocked: boolean; reason?: string } {
  const c = findChannel(channelId)
  if (!c) return { blocked: true, reason: `canal "${channelId}" desconhecido no catálogo versionado` }
  if (c.integration.status !== 'official-contract') {
    return { blocked: true, reason: `canal "${channelId}" sem contrato oficial FBR (status: ${c.integration.status}) — publicação requer Gate e contrato` }
  }
  return { blocked: false }
}

/** Validação de provenance: todo canal precisa de fonte e data nos dados externos. */
export function validateCatalogProvenance(catalog: ChannelRecord[] = CHANNEL_CATALOG): { ok: boolean; missing: string[] } {
  const missing = catalog.filter(c => !c.dataProvenance?.source || !c.dataProvenance?.asOf).map(c => c.channelId)
  return { ok: missing.length === 0, missing }
}
