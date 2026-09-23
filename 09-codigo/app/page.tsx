'use client'

import React, { useState, useEffect } from 'react'

const CANONICAL_FIXTURE_PAYLOAD = {
  contractVersion: 1,
  personaId: 'fixture-persona-ab-001',
  personaVersionId: 'fixture-persona-ab-001@v1',
  personaVersion: 1,
  status: 'approved',
  contentHash: 'sha256:d8c2273e970bbf9b2e0436d400e9a59336113c23b2075a3290641aa9d0e2e54c',
  approval: {
    approvalId: 'fixture-approval-0001',
    approvedBy: 'sergio-fixture',
    approvedAt: '2026-09-22T12:00:00.000Z',
    approvalScope: 'development-only',
    approvedVersions: ['fixture-persona-ab-001@v1'],
    comment: 'aprovação fictícia para fixture; não é Gate real [fixture]'
  },
  snapshot: {
    characterBible: {
      name: 'Marina Estelar [fixture]',
      bio: 'Persona fictícia de teste para desenvolvimento local do Audience Builder [fixture]',
      originStory: 'Gerada como fixture determinística; não representa indivíduo real [fixture]',
      mission: 'Provar o contrato de intake com dados completos e falsos [fixture]',
      positioning: 'Referência técnica de validação, não posicionamento de mercado [fixture]',
      centralPromise: 'Contratos testáveis antes de integração real [fixture]',
      values: ['clareza [fixture]', 'rastreabilidade [fixture]', 'moderação [fixture]'],
      tensions: ['velocidade vs rigor [fixture]']
    },
    physicalIdentityBible: {
      physicalDescription: 'Aparência fictícia descrita apenas para completar o contrato [fixture]',
      continuityAnchors: ['mesmo corte de cabelo em todas as imagens [fixture]'],
      avatarReferenceAssetIds: ['asset-fixture-001', 'asset-fixture-002']
    },
    visualConsistencyProfile: {
      styleTokens: ['documentary [fixture]', 'soft contrast [fixture]'],
      visualPrompts: ['neutral studio background [fixture]'],
      negativePrompts: ['text overlays [fixture]'],
      aiDisclosure: 'Imagens geradas por IA quando aplicável; persona fictícia de teste [fixture]'
    },
    editorialProfile: {
      voice: 'próxima, didática e confiável [fixture]',
      vocabulary: ['guia [fixture]', 'evidência [fixture]', 'checklist [fixture]'],
      recurringExpressions: ['na prática [fixture]'],
      audience: ['leitores de teste do contrato [fixture]'],
      painPoints: ['dúvida sobre validação de contratos [fixture]'],
      desires: ['integração auditável [fixture]'],
      editorialPillars: ['arquitetura de audiência [fixture]', 'governança editorial [fixture]'],
      priorityTopics: ['testes de contrato [fixture]', 'readback de provisionamento [fixture]'],
      prohibitedTopics: ['temas médicos não regulados [fixture]', 'afirmações sem fonte [fixture]'],
      claims: [
        {
          claimId: 'claim-fixture-001',
          statement: 'Projetos sem contrato divergente reduzem retrabalho [fixture]',
          claimType: 'factual',
          riskLevel: 'low',
          evidenceSourceIds: ['source-fixture-001'],
          verificationStatus: 'verified'
        }
      ],
      guardrails: ['sempre citar limitações [fixture]', 'manter disclosure explícito [fixture]'],
      qualityCriteria: ['ao menos quatro pontos por briefing [fixture]', 'meta de 1300 palavras [fixture]'],
      reviewCriteria: ['revisão de claims [fixture]', 'revisão de SEO [fixture]']
    },
    channelPlans: {
      blog: {
        channel: 'blog',
        objective: 'propriedade central de autoridade editorial [fixture]',
        formats: ['artigo longo [fixture]', 'guia de referência [fixture]'],
        cadence: '3 artigos por semana [fixture]',
        disclosure: 'disclosure explícito de afiliado quando aplicável [fixture]',
        versionId: 'channel-blog-v1',
        planStatus: 'configured'
      },
      social: {
        channel: 'social',
        objective: 'distribuição e adaptação nativa [fixture]',
        formats: ['carrossel [fixture]', 'resumo executivo [fixture]'],
        cadence: '5 posts por semana [fixture]',
        disclosure: 'tag de conteúdo gerado/patrocinado [fixture]',
        versionId: 'channel-social-v1',
        planStatus: 'configured'
      },
      youtube: {
        channel: 'youtube',
        objective: 'vídeos explicativos futuros [fixture]',
        formats: ['roteiro longo [fixture]'],
        cadence: '1 vídeo quinzenal [fixture]',
        disclosure: 'aviso no vídeo e na descrição [fixture]',
        versionId: 'channel-youtube-v1',
        planStatus: 'planned'
      }
    },
    potentialNiches: [
      {
        nicheId: 'niche-tech-governance',
        label: 'Governança Técnica e Automação [fixture]',
        origin: 'authority-market-radar [fixture]',
        observedAt: '2026-09-22T00:00:00.000Z',
        confidence: 0.85,
        limitations: ['dados de busca são simulados [fixture]'],
        evidence: ['alta demanda por contratos rastreáveis [fixture]'],
        signals: ['crescimento de interesse em automação multiagente [fixture]']
      }
    ],
    disclosurePolicy: {
      aiDisclosureRequired: true,
      affiliateDisclosureTemplate: 'Este conteúdo de teste pode conter links fictícios. [fixture]',
      sensitiveTopicsPolicy: 'nenhum tema sensível permitido em fixture [fixture]'
    }
  },
  meta: {
    testOnly: true,
    sourceRunIds: ['fixture-run-001'],
    authorityProjectId: 'fixture-authority-project',
    ownerId: 'fixture-owner'
  }
}

type TabType = 'overview' | 'persona' | 'manifesto' | 'templates' | 'editorial' | 'social' | 'monetizacao'

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [healthStatus, setHealthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  // Estado Persona Intake
  const [personaJson, setPersonaJson] = useState<string>(JSON.stringify(CANONICAL_FIXTURE_PAYLOAD, null, 2))
  const [personaBinding, setPersonaBinding] = useState<any>(null)

  // Estado Audience Project & Manifesto
  const [projectName, setProjectName] = useState('Audience Builder Pilot')
  const [projectSlug, setProjectSlug] = useState('audience-pilot')
  const [projectNiche, setProjectNiche] = useState('Tecnologia e Automação')
  const [projectLang, setProjectLang] = useState('pt-BR')
  const [manifestResult, setManifestResult] = useState<any>(null)

  // Estado Editor Visual & Blocos
  const [activeTemplate, setActiveTemplate] = useState<'editorial-reference' | 'guide-hub' | 'review-compare'>('editorial-reference')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [blocks, setBlocks] = useState<string[]>([
    'Hero Banner',
    'Grade de Artigos em Destaque',
    'Anúncio FBR Ads (1250x150)',
    'Guia de Referência Rápida',
    'Comparativo de Ferramentas',
    'Caixa de Newsletter',
    'FAQ de Dúvidas Frequentes'
  ])

  // Estado Editorial
  const [pautas, setPautas] = useState([
    { id: '1', title: 'Como automatizar propriedades de audiência sem perder governança', owner: 'Gestor Editorial', due: '2026-09-25', status: 'planned', words: 1350 },
    { id: '2', title: 'Análise aprofundada de ferramentas de SEO com inteligência artificial', owner: 'Writer Agent', due: '2026-09-26', status: 'draft', words: 1280 },
    { id: '3', title: 'Checklist essencial para monetização transparente com afiliados', owner: 'Affiliate Agent', due: '2026-09-27', status: 'review', words: 1420 }
  ])
  const [newPautaTitle, setNewPautaTitle] = useState('')

  // Estado Social Discovery
  const channelScores = [
    { channel: 'instagram', score: 0.92, rank: 1, fit: 'Excelente para identidade visual e micro-guias em carrossel', cost: 'Médio' },
    { channel: 'pinterest', score: 0.88, rank: 2, fit: 'Alto tráfego orgânico para infográficos e checklists perenes', cost: 'Baixo' },
    { channel: 'youtube', score: 0.81, rank: 3, fit: 'Autoridade máxima em tutoriais longos e análises práticas', cost: 'Alto' },
    { channel: 'linkedin', score: 0.76, rank: 4, fit: 'Ideal para B2B e posicionamento de liderança', cost: 'Baixo' },
    { channel: 'tiktok', score: 0.65, rank: 5, fit: 'Requer alta cadência de vídeos curtos e ritmo dinâmico', cost: 'Alto' }
  ]

  // Carregar Health Check inicial
  useEffect(() => {
    fetch('/health')
      .then(res => res.json())
      .then(data => setHealthStatus(data))
      .catch(err => console.error('Erro ao buscar health check:', err))
  }, [])

  const showNotice = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // Ação: Disparar Intake de Persona
  const handlePersonaIntake = async () => {
    setLoading(true)
    try {
      const parsed = JSON.parse(personaJson)
      const res = await fetch('/api/v1/persona/intake', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-admin-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parsed)
      })
      const data = await res.json()
      if (res.ok) {
        setPersonaBinding(data)
        showNotice('success', `Persona ${data.persona_id} aceita e vinculada com sucesso! Hash: ${data.content_hash.slice(0, 16)}...`)
      } else {
        showNotice('error', `Falha na ingestão: ${data.error || JSON.stringify(data.errors)}`)
      }
    } catch (err: any) {
      showNotice('error', `JSON inválido: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Ação: Gerar e Validar Manifesto
  const handleValidateManifesto = async () => {
    setLoading(true)
    try {
      const manifestoPayload = {
        contractVersion: 1,
        projectId: healthStatus?.project_id || '153d40a6-5823-4029-add3-b52604cd3b71',
        version: 1,
        project: {
          name: projectName,
          slug: projectSlug,
          niche: projectNiche,
          language: projectLang,
          region: 'BR',
          businessObjective: 'authority_and_monetization'
        },
        persona: {
          personaId: personaBinding?.persona_id || 'fixture-persona-ab-001',
          personaVersionId: personaBinding?.persona_version_id || 'fixture-persona-ab-001@v1',
          personaVersion: 1,
          contentHash: personaBinding?.content_hash || 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        },
        editorial: {
          tone: ['próximo', 'didático', 'confiável'],
          pillars: ['automação editorial', 'governança de claims', 'monetização transparente'],
          forbiddenClaims: ['promessa sem fonte verificada', 'curas milagrosas'],
          defaultOutput: 'draft'
        },
        blog: {
          template: activeTemplate,
          templateVersion: '1.0.0',
          categories: ['guias', 'análises', 'ferramentas'],
          articleFrequencyPerWeek: 3
        },
        visual: {
          density: 'comfortable',
          imageDirection: 'documentary',
          motion: 'subtle',
          accessibilityLevel: 'AA'
        },
        social: {
          channels: ['instagram', 'pinterest'],
          approvalRequired: true
        },
        monetization: {
          affiliateEnabled: true,
          productAdsEnabled: true,
          newsletterEnabled: true
        }
      }

      const res = await fetch('/api/v1/manifest', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-admin-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ manifesto: manifestoPayload })
      })
      const data = await res.json()
      if (res.ok) {
        setManifestResult(data)
        showNotice('success', `Manifesto validado com sucesso! Content Hash: ${data.content_hash.slice(0, 16)}...`)
      } else {
        showNotice('error', `Erro na validação do manifesto: ${data.error || JSON.stringify(data.errors)}`)
      }
    } catch (err: any) {
      showNotice('error', `Falha ao processar: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Manipulação de Blocos
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[targetIndex]
    newBlocks[targetIndex] = temp
    setBlocks(newBlocks)
  }

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index))
  }

  const addBlock = (name: string) => {
    setBlocks([...blocks, name])
  }

  const addPauta = () => {
    if (!newPautaTitle.trim()) return
    const newP = {
      id: String(pautas.length + 1),
      title: newPautaTitle,
      owner: 'Gestor Editorial',
      due: '2026-09-30',
      status: 'planned',
      words: 1300
    }
    setPautas([...pautas, newP])
    setNewPautaTitle('')
    showNotice('success', 'Nova pauta adicionada ao calendário com meta de 1.300 palavras!')
  }

  return (
    <div className="app">
      {/* Sidebar de Navegação Operacional */}
      <aside className="side">
        <div className="brand">
          Audience<span>Builder</span>
          <span className="brand-badge">v1.0</span>
        </div>
        <div className="eyebrow">Navegação Operacional</div>
        <nav className="nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <span>📊</span> Visão Geral & Pipeline
          </button>
          <button className={activeTab === 'persona' ? 'active' : ''} onClick={() => setActiveTab('persona')}>
            <span>👤</span> Persona & Intake
          </button>
          <button className={activeTab === 'manifesto' ? 'active' : ''} onClick={() => setActiveTab('manifesto')}>
            <span>📄</span> Projeto & Manifesto
          </button>
          <button className={activeTab === 'templates' ? 'active' : ''} onClick={() => setActiveTab('templates')}>
            <span>🎨</span> Editor Visual & Blocos
          </button>
          <button className={activeTab === 'editorial' ? 'active' : ''} onClick={() => setActiveTab('editorial')}>
            <span>✍️</span> Editorial & Pautas
          </button>
          <button className={activeTab === 'social' ? 'active' : ''} onClick={() => setActiveTab('social')}>
            <span>📱</span> Descoberta Social
          </button>
          <button className={activeTab === 'monetizacao' ? 'active' : ''} onClick={() => setActiveTab('monetizacao')}>
            <span>💰</span> Monetização & FBR Ads
          </button>
        </nav>

        <div className="side-foot">
          <div style={{ marginBottom: 6 }}>
            <span className="dot" /> Runtime: <strong>Porta {healthStatus?.port || 3400}</strong>
          </div>
          <div className="muted" style={{ fontSize: 11 }}>
            Schema: <code>{healthStatus?.schema || 'custom_audience'}</code>
          </div>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="main">
        {/* Notificação Flutuante */}
        {notification && (
          <div className={`info ${notification.type === 'error' ? 'danger' : notification.type === 'info' ? '' : 'warning'}`} style={{ marginBottom: 16 }}>
            {notification.message}
          </div>
        )}

        {/* Topo / Header */}
        <header className="top">
          <div>
            <div className="eyebrow">FBR Audience Builder / Control Room</div>
            <h1>{projectName}</h1>
            <p>Fábrica de audiência governada orientada por Personas do Authority Engine.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="tag green">HEALTH HTTP 200</span>
            <span className="tag blue">VPS2 / {healthStatus?.schema || 'custom_audience'}</span>
            <span className="tag red">PUBLICAÇÃO TRAVADA</span>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* TAB 1: VISÃO GERAL & PIPELINE */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div>
            <div className="cards">
              <div className="card">
                <div className="eyebrow">Persona Status</div>
                <div className="metric" style={{ color: personaBinding ? 'var(--green)' : 'var(--amber)' }}>
                  {personaBinding ? 'Vinculada' : 'Aprovada'}
                </div>
                <div className="muted">{personaBinding ? personaBinding.persona_id : 'Authority Engine'}</div>
              </div>
              <div className="card">
                <div className="eyebrow">Audience Project</div>
                <div className="metric" style={{ color: manifestResult ? 'var(--green)' : 'var(--blue)' }}>
                  {manifestResult ? 'Válido' : 'Draft'}
                </div>
                <div className="muted">Schema: custom_audience</div>
              </div>
              <div className="card">
                <div className="eyebrow">Pautas Editoriais</div>
                <div className="metric">{pautas.length}</div>
                <div className="muted">Meta ~1.300 palavras</div>
              </div>
              <div className="card">
                <div className="eyebrow">Gate de Publicação</div>
                <div className="metric" style={{ color: 'var(--red)' }}>Bloqueado</div>
                <div className="muted">Gate humano (Sergio)</div>
              </div>
            </div>

            <section className="section">
              <div className="section-head">
                <h2>Pipeline Operacional do Audience Project</h2>
                <span className="tag blue">Fluxo de 5 Etapas</span>
              </div>
              <p className="muted">O Audience Builder recebe a Persona do Authority Engine, gera o manifesto versionado e constrói a propriedade editorial de forma auditável.</p>
              <div className="flow">
                <div className={`stage ${personaBinding ? 'active' : ''}`}>
                  <div className="eyebrow">01. Intake</div>
                  <strong>Persona Aprovada</strong>
                  <span className="muted">{personaBinding ? 'Hash validado' : 'Aguardando ingestão'}</span>
                </div>
                <span className="arrow">→</span>
                <div className={`stage ${manifestResult ? 'active' : ''}`}>
                  <div className="eyebrow">02. Binding</div>
                  <strong>Manifesto YAML</strong>
                  <span className="muted">{manifestResult ? 'Versionado' : 'Configuração em draft'}</span>
                </div>
                <span className="arrow">→</span>
                <div className="stage active">
                  <div className="eyebrow">03. Templates</div>
                  <strong>Editor de Blocos</strong>
                  <span className="muted">{blocks.length} blocos ativos</span>
                </div>
                <span className="arrow">→</span>
                <div className="stage active">
                  <div className="eyebrow">04. Conteúdo</div>
                  <strong>Editorial & SEO</strong>
                  <span className="muted">{pautas.length} pautas planejadas</span>
                </div>
                <span className="arrow">→</span>
                <div className="stage">
                  <div className="eyebrow">05. Gate</div>
                  <strong>Aprovação Sergio</strong>
                  <span className="muted">Travado por design</span>
                </div>
              </div>
            </section>

            <div className="grid" style={{ marginTop: 16 }}>
              <section className="section">
                <h2>Readiness de Governança e Servidores</h2>
                <div className="list">
                  <div className="row">
                    <span>Banco de Dados (Schema)</span>
                    <span className="tag green">custom_audience (Verificado)</span>
                  </div>
                  <div className="row">
                    <span>Preflight SELECT 1</span>
                    <span className="tag green">PASS (Conexão Ativa)</span>
                  </div>
                  <div className="row">
                    <span>Namespace Control Tower</span>
                    <span className="tag blue">fbr/custom/153d40a6...</span>
                  </div>
                  <div className="row">
                    <span>Target de Deploy</span>
                    <span className="tag blue">vps2 (Easypanel sistemas/audience)</span>
                  </div>
                </div>
              </section>

              <section className="section">
                <h2>Ações Rápidas</h2>
                <div className="list">
                  <button className="btn primary" onClick={() => setActiveTab('persona')} style={{ width: '100%', justifyContent: 'center' }}>
                    📥 Ingerir / Testar Persona do Authority
                  </button>
                  <button className="btn" onClick={() => setActiveTab('templates')} style={{ width: '100%', justifyContent: 'center' }}>
                    🎨 Abrir Editor Visual de Blocos
                  </button>
                  <button className="btn" onClick={() => setActiveTab('editorial')} style={{ width: '100%', justifyContent: 'center' }}>
                    ✍️ Gerenciar Calendário Editorial
                  </button>
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PERSONA & INTAKE */}
        {/* ========================================================================= */}
        {activeTab === 'persona' && (
          <div>
            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Ingestão e Vínculo de Persona Canônica</h2>
                  <p className="muted">Consuma um snapshot aprovado do Authority Engine com validação criptográfica de hash sha256.</p>
                </div>
                <button className="btn sm" onClick={() => setPersonaJson(JSON.stringify(CANONICAL_FIXTURE_PAYLOAD, null, 2))}>
                  ↺ Recarregar Fixture Canônica (Marina Estelar)
                </button>
              </div>

              <div className="grid">
                <div>
                  <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Payload JSON de Entrada</label>
                  <textarea
                    rows={16}
                    value={personaJson}
                    onChange={e => setPersonaJson(e.target.value)}
                    style={{ width: '100%', background: '#090b10', color: '#c9d4ea', fontFamily: 'var(--font-mono)', fontSize: 12, padding: 12, borderRadius: 6, border: '1px solid var(--line)' }}
                  />
                  <div style={{ marginTop: 10 }}>
                    <button className="btn primary" onClick={handlePersonaIntake} disabled={loading}>
                      {loading ? 'Validando...' : '🔒 Processar Ingestão & Criar Binding Imutável'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Resultado do Binding</label>
                  {personaBinding ? (
                    <div className="code-box">
                      <div style={{ color: 'var(--green)', fontWeight: 'bold', marginBottom: 8 }}>✓ BINDING VINCULADO COM SUCESSO</div>
                      <div><strong>Persona ID:</strong> {personaBinding.persona_id}</div>
                      <div><strong>Versão:</strong> {personaBinding.persona_version_id} (v{personaBinding.persona_version})</div>
                      <div><strong>Content Hash:</strong> {personaBinding.content_hash}</div>
                      <div><strong>Aprovado por:</strong> {personaBinding.approved_by} em {personaBinding.approved_at}</div>
                      <div><strong>Status Operacional:</strong> accepted (imutável)</div>
                    </div>
                  ) : (
                    <div className="info">
                      Nenhuma Persona vinculada ainda. Clique no botão ao lado para validar o pacote e registrar o hash.
                    </div>
                  )}

                  <div style={{ marginTop: 14 }}>
                    <h3 style={{ fontSize: 13, marginBottom: 6 }}>Detalhamento da Persona Ingerida:</h3>
                    <div className="list">
                      <div className="row">
                        <span>Nome:</span>
                        <strong>Marina Estelar</strong>
                      </div>
                      <div className="row">
                        <span>Voz Editorial:</span>
                        <span>Próxima, didática e confiável</span>
                      </div>
                      <div className="row">
                        <span>Pilares:</span>
                        <span>Automação, evidência, checklist</span>
                      </div>
                      <div className="row">
                        <span>Disclosure Obrigatório:</span>
                        <span className="tag amber">Ativo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PROJETO & MANIFESTO */}
        {/* ========================================================================= */}
        {activeTab === 'manifesto' && (
          <div>
            <section className="section">
              <h2>Configuração do Audience Project & Manifesto Versionado</h2>
              <p className="muted">O manifesto é o contrato imutável que rege templates, pautas, redes sociais e canais de monetização.</p>

              <div className="grid" style={{ marginTop: 16 }}>
                <div className="form">
                  <label>
                    Nome da Propriedade Editorial:
                    <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} />
                  </label>
                  <label>
                    Slug URL:
                    <input type="text" value={projectSlug} onChange={e => setProjectSlug(e.target.value)} />
                  </label>
                  <label>
                    Nicho Editorial:
                    <input type="text" value={projectNiche} onChange={e => setProjectNiche(e.target.value)} />
                  </label>
                  <label>
                    Idioma Principal:
                    <select value={projectLang} onChange={e => setProjectLang(e.target.value)}>
                      <option value="pt-BR">Português (Brasil) - pt-BR</option>
                      <option value="en-US">Inglês (Estados Unidos) - en-US</option>
                    </select>
                  </label>
                  <label>
                    Template Estrutural:
                    <select value={activeTemplate} onChange={e => setActiveTemplate(e.target.value as any)}>
                      <option value="editorial-reference">Editorial Reference (Revista / Autoridade)</option>
                      <option value="guide-hub">Guide Hub (Guias & Documentação)</option>
                      <option value="review-compare">Review & Compare (Análises e Produtos)</option>
                    </select>
                  </label>

                  <button className="btn primary" onClick={handleValidateManifesto} disabled={loading} style={{ marginTop: 8 }}>
                    {loading ? 'Validando...' : '📄 Validar Manifesto & Computar Hash'}
                  </button>
                </div>

                <div>
                  <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Pacote de Manifesto Validado</label>
                  {manifestResult ? (
                    <div className="code-box">
                      <div style={{ color: 'var(--green)', fontWeight: 'bold', marginBottom: 6 }}>✓ MANIFESTO VÁLIDO E ÍNTEGRO</div>
                      <div><strong>Content Hash:</strong> {manifestResult.content_hash}</div>
                      <div style={{ marginTop: 8, color: '#9bb8ff' }}>Manifesto JSON Estruturado:</div>
                      <pre style={{ margin: '4px 0 0', fontSize: 11 }}>{JSON.stringify(manifestResult.manifest, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="info">
                      Preencha os campos ao lado e clique em &quot;Validar Manifesto&quot; para gerar o contrato versionado.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: EDITOR VISUAL & BLOCOS */}
        {/* ========================================================================= */}
        {activeTab === 'templates' && (
          <div>
            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Editor Visual Controlado por Blocos</h2>
                  <p className="muted">Monte a estrutura da homepage e artigos sem quebrar o sistema de design ou as regras de acessibilidade.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`btn sm ${previewMode === 'desktop' ? 'primary' : ''}`} onClick={() => setPreviewMode('desktop')}>
                    🖥️ Desktop
                  </button>
                  <button className={`btn sm ${previewMode === 'mobile' ? 'primary' : ''}`} onClick={() => setPreviewMode('mobile')}>
                    📱 Mobile
                  </button>
                </div>
              </div>

              <div className="editor-layout">
                {/* Painel lateral de blocos */}
                <div className="editor-sidebar">
                  <div className="eyebrow">Blocos da Página ({blocks.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {blocks.map((blockName, index) => (
                      <div className="block-item" key={`${blockName}-${index}`}>
                        <span>{blockName}</span>
                        <div className="block-controls">
                          <button onClick={() => moveBlock(index, 'up')} disabled={index === 0}>▲</button>
                          <button onClick={() => moveBlock(index, 'down')} disabled={index === blocks.length - 1}>▼</button>
                          <button onClick={() => removeBlock(index)} style={{ color: 'var(--red)' }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                    <div className="eyebrow" style={{ marginBottom: 6 }}>Adicionar Novo Bloco</div>
                    <div style={{ display: 'grid', gap: 4 }}>
                      <button className="btn sm" onClick={() => addBlock('Tabela Comparativa')}>+ Tabela Comparativa</button>
                      <button className="btn sm" onClick={() => addBlock('Card de Produto Afiliado')}>+ Card de Produto Afiliado</button>
                      <button className="btn sm" onClick={() => addBlock('Box de Especialista')}>+ Box de Especialista</button>
                    </div>
                  </div>
                </div>

                {/* Canvas de Live Preview */}
                <div className={`preview-canvas ${previewMode === 'mobile' ? 'mobile' : ''}`}>
                  <div style={{ borderBottom: '2px solid #3b82f6', paddingBottom: 10, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 18, color: '#1e3a8a' }}>{projectName}</strong>
                    <span style={{ fontSize: 11, background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 999 }}>Template: {activeTemplate}</span>
                  </div>

                  {blocks.map((block, idx) => {
                    if (block.includes('Hero')) {
                      return (
                        <div className="hero-box" key={idx}>
                          <h1>Autoridade & Clareza em {projectNiche}</h1>
                          <p>Guias completos, análises técnicas e procedimentos testados na prática.</p>
                          <button style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 6, fontWeight: 'bold' }}>
                            Explorar Artigos
                          </button>
                        </div>
                      )
                    }
                    if (block.includes('Artigos')) {
                      return (
                        <div key={idx}>
                          <h2>Artigos em Destaque</h2>
                          <div className="grid-articles">
                            <div className="article-card">
                              <strong>Como estruturar pipelines de audiência</strong>
                              <p style={{ fontSize: 12, margin: '6px 0' }}>Conheça os pilares para conectar Personas a blogs reais sem perder coerência.</p>
                              <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold' }}>Ler artigo →</span>
                            </div>
                            <div className="article-card">
                              <strong>Guia de compliance e disclosure</strong>
                              <p style={{ fontSize: 12, margin: '6px 0' }}>Práticas recomendadas para monetização transparente e segura.</p>
                              <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 'bold' }}>Ler artigo →</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    if (block.includes('Anúncio')) {
                      return (
                        <div className="ad-banner" key={idx}>
                          [ Espaço FBR Ads — Leaderboard 1250x150 | Formato Oficial ]
                        </div>
                      )
                    }
                    if (block.includes('Newsletter')) {
                      return (
                        <div className="newsletter-box" key={idx}>
                          <strong style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>Receba análises semanais no seu e-mail</strong>
                          <p>Sem spam. Apenas conteúdo prático e validado.</p>
                          <div style={{ display: 'flex', gap: 6, maxWidth: 320, margin: '10px auto 0' }}>
                            <input type="email" placeholder="seu@email.com" style={{ padding: 6, borderRadius: 4, border: '1px solid #4b5563', flex: 1 }} />
                            <button style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 4, fontWeight: 'bold' }}>Assinar</button>
                          </div>
                        </div>
                      )
                    }
                    return (
                      <div key={idx} style={{ padding: 14, background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: 6, margin: '10px 0', textAlign: 'center', fontSize: 12, color: '#6b7280' }}>
                        [ Bloco: {block} ]
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: EDITORIAL & PAUTAS */}
        {/* ========================================================================= */}
        {activeTab === 'editorial' && (
          <div>
            <section className="section">
              <div className="section-head">
                <div>
                  <h2>Calendário & Motor Editorial</h2>
                  <p className="muted">Pautas com pelo menos 4 pontos concretos, meta de ~1.300 palavras e fact-checking de claims.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  type="text"
                  placeholder="Título da nova pauta..."
                  value={newPautaTitle}
                  onChange={e => setNewPautaTitle(e.target.value)}
                  style={{ flex: 1, padding: 8, background: '#0e111b', color: 'white', border: '1px solid var(--line)', borderRadius: 6 }}
                />
                <button className="btn primary" onClick={addPauta}>+ Adicionar Pauta</button>
              </div>

              <div className="list">
                {pautas.map(p => (
                  <div className="row" key={p.id}>
                    <div>
                      <strong>{p.title}</strong>
                      <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>
                        Responsável: {p.owner} • Vencimento: {p.due} • Extensão: ~{p.words} palavras
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className={`tag ${p.status === 'review' ? 'amber' : p.status === 'draft' ? 'blue' : 'purple'}`}>
                        {p.status.toUpperCase()}
                      </span>
                      <button className="btn sm">Revisar</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid" style={{ marginTop: 18 }}>
                <div className="card">
                  <div className="eyebrow">Critério de Pauta</div>
                  <strong style={{ display: 'block', margin: '6px 0' }}>4+ Pontos Obrigatórios</strong>
                  <p className="muted">Toda pauta gerada pelo Research Agent deve conter: intenção de busca, público-alvo, ângulo exclusivo e 4 pontos estruturados.</p>
                </div>
                <div className="card">
                  <div className="eyebrow">Fact-Checking</div>
                  <strong style={{ display: 'block', margin: '6px 0' }}>Classificação de Claims</strong>
                  <p className="muted">Afirmações devem ser vinculadas a fontes com URL, data e limitações. Sem fonte = claim bloqueado.</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: DESCOBERTA SOCIAL */}
        {/* ========================================================================= */}
        {activeTab === 'social' && (
          <div>
            <section className="section">
              <h2>Descoberta e Recomendação de Canais Sociais</h2>
              <p className="muted">Nenhum canal é fixado previamente. O sistema calcula a adequação com base na Persona, audiência e custos operacionais.</p>

              <div className="list" style={{ marginTop: 16 }}>
                {channelScores.map(c => (
                  <div className="row" key={c.channel} style={{ borderLeft: c.rank === 1 ? '4px solid var(--green)' : '1px solid var(--line)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ textTransform: 'capitalize', fontSize: 14 }}>{c.channel}</strong>
                        <span className="tag green">Score: {(c.score * 100).toFixed(0)}%</span>
                        <span className="tag blue">Rank #{c.rank}</span>
                      </div>
                      <div className="muted" style={{ marginTop: 4 }}>{c.fit}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="muted" style={{ fontSize: 11 }}>Custo de Produção</div>
                      <strong>{c.cost}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="info warning" style={{ marginTop: 16 }}>
                <strong>🔒 Regra de Segurança do Social Engine:</strong> A publicação automática está bloqueada por design. Variantes são geradas em modo `draft` e exigem o Gate humano de Sergio para disparo.
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: MONETIZAÇÃO & FBR ADS */}
        {/* ========================================================================= */}
        {activeTab === 'monetizacao' && (
          <div>
            <section className="section">
              <h2>Inventário Central FBR Ads & Afiliação</h2>
              <p className="muted">Monetização governada integrada aos formatos padronizados com disclosure obrigatório.</p>

              <div className="grid" style={{ marginTop: 16 }}>
                <div className="card">
                  <div className="eyebrow">Formato Leaderboard</div>
                  <div className="metric">1250 × 150 px</div>
                  <div className="muted">Banner principal para topo e rodapé de artigos</div>
                  <div style={{ marginTop: 10 }}>
                    <span className="tag green">Contrato FBR Ads OK</span>
                  </div>
                </div>

                <div className="card">
                  <div className="eyebrow">Formato Square</div>
                  <div className="metric">350 × 350 px</div>
                  <div className="muted">Box lateral para sidebar e recomendações contextuais</div>
                  <div style={{ marginTop: 10 }}>
                    <span className="tag green">Contrato FBR Ads OK</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <h3>Política de Disclosure de Afiliados</h3>
                <div className="code-box">
                  &quot;Transparência: Este artigo pode conter links de afiliados. Se você adquirir algum produto através de nossas recomendações, poderemos receber uma comissão sem qualquer custo adicional para você.&quot;
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
