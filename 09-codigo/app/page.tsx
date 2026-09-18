'use client'

import { FormEvent, useState } from 'react'

const stages = [
  ['01', 'Intake', 'briefing recebido'],
  ['02', 'Gestor Editorial', 'validado antes do banco'],
  ['03', 'Control Tower', 'provisionamento controlado'],
  ['04', 'Handoffs', 'entregas rastreáveis'],
  ['05', 'Draft', 'sem publicação automática'],
]

export default function Home() {
  const [message, setMessage] = useState('')
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = { name: String(form.get('name') ?? ''), slug: String(form.get('slug') ?? ''), niche: String(form.get('niche') ?? '') }
    const res = await fetch('/api/blogs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...data, language: 'pt', voice: 'neutro' }) })
    const json = await res.json()
    setMessage(res.ok ? `Blog criado: ${json.schemaName}` : `Bloqueado: ${json.error}`)
  }

  return <div className="app">
    <aside className="side">
      <div className="brand">FBR<span>Blogs</span></div>
      <div className="eyebrow">Editorial control room</div>
      <nav className="nav">
        <a className="active" href="/">Overview</a>
        <a href="#novo-blog">Novo blog</a>
        <a href="/admin/workflow">Workflow / Kora</a>
      </nav>
      <div className="side-foot"><span className="dot" />runtime local conectado</div>
    </aside>
    <main className="main">
      <header className="top">
        <div><div className="eyebrow">Portfolio / Blogs</div><h1>FBR Blogs</h1><p>Crie e opere blogs temáticos para personas de autoridade sem publicar por acidente.</p></div>
        <a className="btn primary" href="#novo-blog">+ Novo blog</a>
      </header>
      <section className="cards">
        <div className="card"><div className="eyebrow">Blogs</div><div className="metric">0</div><div className="muted">provisionados nesta sessão</div></div>
        <div className="card"><div className="eyebrow">Gestor</div><div className="metric">Gate</div><div className="muted">validação obrigatória</div></div>
        <div className="card"><div className="eyebrow">Conteúdo</div><div className="metric">Draft</div><div className="muted">saída padrão segura</div></div>
        <div className="card"><div className="eyebrow">Publicação</div><div className="metric">Bloq.</div><div className="muted">aprovação humana</div></div>
      </section>
      <section className="section"><h2>Pipeline de provisionamento</h2><p className="muted">A identidade da persona entra como configuração; a plataforma comum permanece reutilizável.</p><div className="flow">{stages.map(([num, title, detail], i) => <>{<div className="stage" key={title}><div className="eyebrow">{num}</div><strong>{title}</strong><span className="muted">{detail}</span></div>}{i < stages.length - 1 && <span className="arrow" key={`${title}-arrow`}>→</span>}</>)}</div></section>
      <div className="grid" style={{ marginTop: 14 }}>
        <section className="section" id="novo-blog"><h2>Novo blog</h2><p className="muted">O gestor é criado e validado antes de qualquer provisionamento.</p><form className="form" onSubmit={submit}><label>Nome do blog<input name="name" placeholder="Ex.: After Forty" required /></label><label>Slug<input name="slug" placeholder="slug_do_blog" required /></label><label>Nicho<input name="niche" placeholder="Ex.: saúde e bem-estar" required /></label><button className="btn primary" type="submit">Criar com gestor validado</button></form><div className="status-box muted">{message}</div></section>
        <section className="section"><h2>Governança</h2><div className="list"><div className="row"><span>Gestor Editorial</span><span className="tag green">pré-requisito</span></div><div className="row"><span>Handoffs</span><span className="tag blue">rastreáveis</span></div><div className="row"><span>Conteúdo</span><span className="tag amber">draft</span></div><div className="row"><span>Publicação e gasto</span><span className="tag red">Sergio aprova</span></div></div><div className="info" style={{ marginTop: 14 }}>Nenhum conteúdo sai automaticamente. QA, SEO e mídia permanecem sob os gates do projeto.</div></section>
      </div>
    </main>
  </div>
}
