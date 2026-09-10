# Código FBR Blogs

A aplicação Next fica em `09-codigo` por exigência do framework. Execute `npm install`, `npm test`, `npm run typecheck`, `npm run lint` e `npm run build` nesse diretório.

A vertical usa adapters mockados: não requer Control Tower, Hermes ou FBR Ads externos. APIs: `POST /api/blogs` para criar e `POST /api/editorial/daily-run` para criar os três jobs de uma execução. O mock é deliberadamente efêmero e deve ser substituído por Postgres/Supabase apenas com contratos confirmados.
