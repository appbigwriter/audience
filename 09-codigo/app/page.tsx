const capabilities = [
  ['01', 'Persona aprovada', 'Authority Engine é a fonte canônica'],
  ['02', 'Audience Project', 'binding versionado e manifesto'],
  ['03', 'Design e templates', 'visual orientado ao nicho'],
  ['04', 'Descoberta social', 'canais avaliados por evidência'],
  ['05', 'Editorial', 'pesquisa, SEO e drafts'],
]

const gates = [
  ['Persona', 'Aguardando API/readback oficial', 'amber'],
  ['Runtime', 'Health e persistência ainda não verificados', 'amber'],
  ['Publicação', 'Bloqueada por design', 'red'],
  ['Canal social', 'TBD — recomendação data-driven', 'blue'],
]

export default function Home() {
  return (
    <div className="app">
      <aside className="side">
        <div className="brand">Audience<span>Builder</span></div>
        <div className="eyebrow">Audience operations</div>
        <nav className="nav">
          <a className="active" href="/">Overview</a>
          <a href="#persona">Persona</a>
          <a href="#templates">Templates</a>
          <a href="#social">Canais sociais</a>
          <a href="#editorial">Editorial</a>
        </nav>
        <div className="side-foot"><span className="dot" />runtime local / integração pendente</div>
      </aside>
      <main className="main">
        <header className="top">
          <div>
            <div className="eyebrow">Audience Project / control room</div>
            <h1>Audience Builder</h1>
            <p>Transforme Personas aprovadas em propriedades editoriais coerentes, sem publicar por acidente.</p>
          </div>
          <span className="tag amber">LOCAL / READINESS</span>
        </header>

        <section className="cards">
          <div className="card"><div className="eyebrow">Persona</div><div className="metric">Gate</div><div className="muted">somente Authority aprovado</div></div>
          <div className="card"><div className="eyebrow">Projeto</div><div className="metric">Draft</div><div className="muted">manifesto versionado</div></div>
          <div className="card"><div className="eyebrow">Social</div><div className="metric">TBD</div><div className="muted">canal recomendado por evidência</div></div>
          <div className="card"><div className="eyebrow">Publicação</div><div className="metric">Bloq.</div><div className="muted">aprovação humana</div></div>
        </section>

        <section className="section" id="persona">
          <h2>Pipeline do Audience Project</h2>
          <p className="muted">A aplicação não cria Persona. Ela consome uma versão aprovada, registra o hash e constrói a propriedade de audiência.</p>
          <div className="flow">{capabilities.map(([num, title, detail], i) => <div className="stage" key={title}><div className="eyebrow">{num}</div><strong>{title}</strong><span className="muted">{detail}</span>{i < capabilities.length - 1 && <span className="arrow">→</span>}</div>)}</div>
        </section>

        <div className="grid" style={{ marginTop: 14 }}>
          <section className="section" id="templates">
            <h2>Templates e visual</h2>
            <p className="muted">Design tokens, componentes de nicho e editor controlado. Esta superfície é local e não persiste alterações.</p>
            <div className="info">O template será derivado da Persona, do nicho potencial e da proposta editorial. Nenhum clone de blog é criado.</div>
          </section>
          <section className="section" id="social">
            <h2>Descoberta de canais</h2>
            <p className="muted">Nenhum canal é escolhido automaticamente. O projeto compara audiência, formatos, esforço, risco, custo e capacidade.</p>
            <div className="info">Próximo Gate: receber dados completos da Persona e executar a recomendação de canais.</div>
          </section>
        </div>

        <section className="section" id="editorial" style={{ marginTop: 14 }}>
          <h2>Gates e readiness</h2>
          <div className="list">{gates.map(([name, status, tone]) => <div className="row" key={name}><span>{name}</span><span className={`tag ${tone}`}>{status}</span></div>)}</div>
        </section>
      </main>
    </div>
  )
}
