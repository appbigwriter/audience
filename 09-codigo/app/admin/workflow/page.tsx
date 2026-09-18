const steps = [
  ['01', 'Intake', 'briefing e persona recebidos'],
  ['02', 'Gestor validado', 'Redator Chefe pronto'],
  ['03', 'Control Tower', 'blog isolado no schema'],
  ['04', 'Handoffs', 'entregas para operação'],
  ['05', 'Draft', 'revisão antes de publicar'],
]

export default function Workflow() {
  return <div className="app">
    <aside className="side"><div className="brand">FBR<span>Blogs</span></div><div className="eyebrow">Editorial control room</div><nav className="nav"><a href="/">Overview</a><a href="/#novo-blog">Novo blog</a><a className="active" href="/admin/workflow">Workflow / Kora</a></nav><div className="side-foot"><span className="dot" />runtime local conectado</div></aside>
    <main className="main"><header className="top"><div><div className="eyebrow">Operations / Workflow</div><h1>Workflow / Kora</h1><p>Estados editoriais com ownership, evidência e gate explícito.</p></div><a className="btn" href="/">← Voltar ao overview</a></header><section className="section"><h2>Fluxo obrigatório</h2><div className="workflow">{steps.map(([num, title, detail]) => <div className="workflow-step" key={title}><div className="eyebrow">{num}</div><strong>{title}</strong><span>{detail}</span></div>)}</div></section><div className="grid" style={{ marginTop: 14 }}><section className="section"><h2>Regras de transição</h2><div className="list"><div className="row"><span>Publicação automática</span><span className="tag red">bloqueada</span></div><div className="row"><span>Estado operacional</span><span className="tag blue">evidência obrigatória</span></div><div className="row"><span>Ação externa</span><span className="tag amber">gate humano</span></div></div></section><section className="section"><h2>Próximo passo</h2><p className="muted">Conectar cada blog provisionado ao manifesto visual e editorial da persona, mantendo o template comum e a configuração isolada.</p><div className="info">O workflow não substitui o controle de publicação: todo conteúdo termina em <strong>draft</strong> ou <strong>blocked</strong>.</div></section></div></main>
  </div>
}
