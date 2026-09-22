/**
 * AB-S0-004 — Fixture de Persona aprovada (test-only).
 *
 * Regras da Story:
 * - marcada `testOnly: true`;
 * - versão e hash reproduzíveis (hash recalculado sobre canonical JSON);
 * - representa todos os campos obrigatórios;
 * - fixture incompleta falha na validação (testes cobrem);
 * - sem segredo e sem dado externo inventado como fato.
 *
 * O hash é computado em tempo de carga sobre o snapshot determinístico,
 * garantindo reproducibilidade entre execuções.
 */
import { computeContentHash } from './common'
import type { PersonaIntakePackage } from './persona-intake'

/**
 * Snapshot determinístico de desenvolvimento. Todos os valores são
 * explicitamente fictícios e marcados como tal; nada aqui é apresentado
 * como dado de mercado real.
 */
const fixtureSnapshot: PersonaIntakePackage['snapshot'] = {
  characterBible: {
    name: 'Marina Estelar [fixture]',
    bio: 'Persona fictícia de teste para desenvolvimento local do Audience Builder [fixture]',
    originStory: 'Gerada como fixture determinística; não representa indivíduo real [fixture]',
    mission: 'Provar o contrato de intake com dados completos e falsos [fixture]',
    positioning: 'Referência técnica de validação, não posicionamento de mercado [fixture]',
    centralPromise: 'Contratos testáveis antes de integração real [fixture]',
    values: ['clareza [fixture]', 'rastreabilidade [fixture]', 'moderação [fixture]'],
    tensions: ['velocidade vs rigor [fixture]'],
  },
  physicalIdentityBible: {
    physicalDescription: 'Aparência fictícia descrita apenas para completar o contrato [fixture]',
    continuityAnchors: ['mesmo corte de cabelo em todas as imagens [fixture]'],
    avatarReferenceAssetIds: ['asset-fixture-001', 'asset-fixture-002'],
  },
  visualConsistencyProfile: {
    styleTokens: ['documentary [fixture]', 'soft contrast [fixture]'],
    visualPrompts: ['neutral studio background [fixture]'],
    negativePrompts: ['text overlays [fixture]'],
    aiDisclosure: 'Imagens geradas por IA quando aplicável; persona fictícia de teste [fixture]',
  },
  editorialProfile: {
    voice: 'próxima, didática e confiável [fixture]',
    vocabulary: ['guia [fixture]', 'evidência [fixture]', 'checklist [fixture]'],
    recurringExpressions: ['na prática [fixture]'],
    audience: ['leitores de teste do contrato [fixture]'],
    painPoints: ['dúvida sobre validação de contratos [fixture]'],
    desires: ['integração auditável [fixture]'],
    fears: ['mock confundido com produção [fixture]'],
    objections: ['fixture não é integração [fixture]'],
    editorialPillars: ['contratos primeiro [fixture]', 'evidência antes de conclusão [fixture]'],
    priorityTopics: ['intake [fixture]', 'binding [fixture]'],
    prohibitedTopics: ['promessa sem fonte [fixture]'],
    claims: [
      { text: 'fixture cobre todos os campos obrigatórios', allowed: true },
      { text: 'fixture prova integração real com Authority', allowed: false, condition: 'nunca; fixture é test-only' },
    ],
    guardrails: ['nunca apresentar fixture como dado real [fixture]'],
    qualityCriteria: ['validação completa sem erros [fixture]'],
    reviewCriteria: ['revisão independente obrigatória [fixture]'],
  },
  channelPlans: {
    blog: {
      channel: 'blog',
      objective: 'validar pipeline editorial local [fixture]',
      audience: ['leitores de teste [fixture]'],
      formats: ['guia longo [fixture]'],
      cadence: '2 artigos/semana [fixture]',
      pillars: ['contratos [fixture]'],
      disclosure: 'conteúdo de teste com disclosure de IA [fixture]',
      constraints: ['sem publicação real [fixture]'],
      plan: 'produzir rascunhos locais somente [fixture]',
      planStatus: 'configured',
      versionId: 'fixture-plan-blog-v1',
    },
    social: {
      channel: 'social',
      objective: 'planejar descoberta de canais sem conta real [fixture]',
      audience: ['audiência fictícia [fixture]'],
      formats: ['imagem estática [fixture]'],
      cadence: '3 posts/semana [fixture]',
      pillars: ['adaptação controlada [fixture]'],
      disclosure: 'perfil fictício; nenhuma conta real criada [fixture]',
      constraints: ['criação de conta social exige Gate [fixture]'],
      plan: 'somente hipóteses e planos versionados [fixture]',
      planStatus: 'planned',
      versionId: 'fixture-plan-social-v1',
    },
    youtube: {
      channel: 'youtube',
      objective: 'manter plano registrado sem canal real [fixture]',
      audience: ['espectadores fictícios [fixture]'],
      formats: ['short vertical [fixture]'],
      cadence: '1 vídeo/semana [fixture]',
      pillars: ['demonstrações locais [fixture]'],
      disclosure: 'canal fictício; nenhuma conta criada [fixture]',
      constraints: ['vídeo longo fora do escopo inicial [fixture]',
      ],
      plan: 'nenhum provisionamento nesta fase [fixture]',
      planStatus: 'planned',
      versionId: 'fixture-plan-youtube-v1',
    },
  },
  potentialNiches: [
    {
      nicheId: 'fixture-niche-contratos',
      label: 'Contratos auditáveis [fixture]',
      origin: 'authority-fixture-run [fixture]',
      observedAt: '2026-09-22T12:00:00.000Z',
      confidence: 0.6,
      evidence: ['snapshot fixture completo [fixture]'],
      limitations: ['confiança declarada sem pesquisa real; fixture [fixture]'],
      signals: ['requisito de rastreabilidade nos PRDs [fixture]'],
    },
  ],
  disclosurePolicy: {
    aiDisclosureRequired: true,
    affiliateDisclosureTemplate: 'Este conteúdo de teste pode conter links fictícios. [fixture]',
    sensitiveTopicsPolicy: 'nenhum tema sensível permitido em fixture [fixture]',
  },
}

/** Hash reproduzível do snapshot fixture. */
export const FIXTURE_PERSONA_CONTENT_HASH = computeContentHash(fixtureSnapshot)

/**
 * Pacote canônico aprovado de desenvolvimento (test-only).
 * `contentHash` sempre derivado — nunca hardcodado — para provar igualdade.
 */
export const fixturePersonaIntakePackage: PersonaIntakePackage = {
  contractVersion: 1,
  personaId: 'fixture-persona-ab-001',
  personaVersionId: 'fixture-persona-ab-001@v1',
  personaVersion: 1,
  status: 'approved',
  contentHash: FIXTURE_PERSONA_CONTENT_HASH,
  approval: {
    approvalId: 'fixture-approval-0001',
    approvedBy: 'sergio-fixture',
    approvedAt: '2026-09-22T12:00:00.000Z',
    approvalScope: 'development-only',
    approvedVersions: ['fixture-persona-ab-001@v1'],
    comment: 'aprovação fictícia para fixture; não é Gate real [fixture]',
  },
  snapshot: fixtureSnapshot,
  meta: {
    testOnly: true,
    sourceRunIds: ['fixture-run-001'],
    authorityProjectId: 'fixture-authority-project',
    ownerId: 'fixture-owner',
  },
}

/** Cria cópia mutável para testes negativos. */
export function cloneFixturePackage(): PersonaIntakePackage {
  return structuredClone(fixturePersonaIntakePackage)
}
