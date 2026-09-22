# Receipt — Diagnóstico de domínio e runtime do Audience Builder

- **Data:** 2026-09-22
- **Task:** AUDIENCE-RUNTIME-DOMAIN-20260922-001
- **Escopo:** diagnóstico read-only; nenhuma alteração em DNS, Control Tower, Easypanel, deploy, migration, secret ou publicação.
- **Classificação:** `blocked_for_remote_mutation / locally_verified_facts`

## 1. DNS e HTTPS

| Probe | Resultado |
|---|---|
| `nslookup audience.fbr.news` | Resolve para `76.13.168.223` |
| `https://audience.fbr.news/` | HTTP `502 Bad Gateway` |
| `https://audience.fbr.news/health` | HTTP `502 Bad Gateway` |
| Corpo retornado | Página genérica “Not Found” do provider/proxy |
| `sistemas-control-tower.pojxaz.easypanel.host` | Resolve para `76.13.168.223` |

**Interpretação:** existe resolução DNS para a infraestrutura, mas o domínio não está chegando a uma aplicação saudável/roteada. O DNS resolver não é suficiente para considerar o domínio provisionado.

## 2. Control Tower

| Probe | Resultado |
|---|---|
| `GET https://control-tower.fbr.news/api/control-tower/health` | HTTP `200`, `status=healthy`, `database=connected` |
| `GET /api/control-tower/projects/audience` sem sessão | HTTP `401` |
| `GET /api/control-tower/projects/audience-builder` sem sessão | HTTP `401` |
| `GET /api/control-tower/projects/fbr-blogs` sem sessão | HTTP `401` |
| `/control-tower` via browser | Redireciona para `/login`; exige `CONTROL_TOWER_ADMIN_SECRET` |

Não foi possível confirmar o catálogo do projeto ou o serviço EasyPanel porque a sessão administrativa não está disponível neste runtime. Nenhuma credencial foi solicitada ou digitada.

## 3. Repositório e aplicação

- Remote `audience`: `https://github.com/appbigwriter/audience.git`
- Remote `origin`: `https://github.com/appbigwriter/fbrblogs.git`
- `audience/main` e HEAD local apontam para `d43ee819`.
- O root `09-codigo/package.json` ainda possui `name: fbr-blogs`.
- O root `09-codigo/app/page.tsx` ainda apresenta a aplicação como `FBR Blogs`.
- `09-codigo/app/layout.tsx` ainda usa título `FBR Blogs · Editorial Control Room`.
- Os packages `@fbr-audience-builder/*` e `apps/audience-builder` existem, mas a busca de paths não encontrou um `app/` ou `pages/` web dentro de `apps/audience-builder`.
- A surface `apps/audience-builder/src/surface.ts` é uma composição HTML local/determinística sem persistência própria, provider call ou publicação.
- O commit contém os artefatos novos do Audience Builder, mas a aplicação web raiz continua sendo a vertical antiga.

## 4. Diagnóstico provável

Há duas divergências independentes:

1. **Provider/domain routing:** `audience.fbr.news` aponta para o IP da infraestrutura, mas o serviço EasyPanel correto não está associado/saudável nesse host, ou o domínio está registrado no projeto errado. O HTTP `502` impede distinguir, sem readback autenticado, entre serviço ausente, service name incorreto, domínio ligado ao target errado, processo parado ou versão/provider stale.
2. **Entrypoint/release identity:** o repositório `audience` foi criado a partir do FBR Blogs e ainda publica o app raiz legado. O Audience Builder possui lógica/packages, mas não há uma entrypoint web raiz claramente configurada para substituir o app FBR Blogs. Mesmo corrigindo o domínio, o serviço pode continuar exibindo o FBR Blogs antigo.

## 5. Porta interna — divergência confirmada

- O contrato do Control Tower gera `PORT=3400` (`GestaoDB/src/lib/control-tower/project-configuration.ts` e `DOCUMENTO-DE-VERDADE-PROVISIONAMENTO-SISTEMAS-2026-09-21.md`).
- O `09-codigo/Dockerfile` atual força `ENV PORT=3000` e `EXPOSE 3000`.
- O `package.json` não define uma porta própria; o processo Next.js usa a variável `PORT`/default.

**Conclusão corrigida:** para o código atual, `PORT=3000` é coerente com o `Dockerfile`, que força `ENV PORT=3000` e `EXPOSE 3000`. `3400` é o default do contrato central do Control Tower, mas não é correto enquanto a imagem atual continuar escutando/expondo `3000`.

Há duas configurações válidas, que precisam ser aplicadas de forma consistente:

1. **Manter o código atual:** Control Tower/EasyPanel `PORT=3000` + porta interna `3000`.
2. **Adotar o padrão central:** alterar o Dockerfile para `PORT=3400`/`EXPOSE 3400`, commit/deploy correspondente e então configurar/readback `3400` no provider.

Não se deve alterar somente o Environment para `3400`: isso pode causar 502 se o container continuar ouvindo em `3000`. Também não se deve alterar somente o Dockerfile sem confirmar a porta do serviço no EasyPanel.

O `502` continua podendo ser explicado por mismatch de porta, serviço errado, processo parado ou entrypoint legado; o readback autenticado do provider é necessário para distinguir as causas.

## 7. Correção local aplicada

- `09-codigo/app/page.tsx` agora é a superfície raiz do Audience Builder, sem formulário/pipeline visual do FBR Blogs legado.
- `09-codigo/app/layout.tsx` agora usa metadata do Audience Builder.
- `09-codigo/app/health/route.ts` criado com resposta JSON de readiness, sem afirmar integração externa.
- `09-codigo/package.json` e `package-lock.json` agora usam `audience-builder`.
- `PORT=3000` foi mantido, alinhado ao Dockerfile atual e ao Environment informado.

## 8. Verificação local pós-correção

- `npm test`: **27 arquivos / 287 testes PASS**.
- `npm run typecheck`: **PASS**.
- `npm run lint`: **PASS**.
- `npm run build`: **PASS**.
- Smoke com `next start --port 3099`: `GET /health` retornou HTTP `200` e `service=audience-builder`; `GET /` apresentou marcadores `Audience Builder` e nenhum marcador `FBR Blogs`.
- Processo local encerrado após o smoke test.

## 9. Limite atual

A correção é local e ainda não foi publicada no EasyPanel. É necessário deploy/readback autenticado do serviço `audience`, confirmando repository, commit, porta `3000`, command, processo running, domínio e `/health` público.

## 10. Próxima ação segura

Sergio/infra deve abrir sessão administrativa no host exato:

`https://sistemas-control-tower.pojxaz.easypanel.host/control-tower`

E fazer readback sanitizado do projeto `audience`:

- `project_id`;
- slug;
- domain persistido;
- repository URL;
- `repository_path`;
- hosting target/project/service;
- build command;
- start command;
- internal port;
- environment por nome, sem valores;
- deployment commit/release;
- processo/container status;
- domain binding;
- logs do primeiro erro do processo.

Depois disso, David deve reconciliar a aplicação web raiz do Audience Builder e somente então preparar deploy/readback. Não apagar/recriar o projeto e não alterar DNS às cegas.

## Estado final

- DNS: `resolved`
- HTTPS/application: `502 / unverified runtime`
- Control Tower health: `verified healthy`
- Control Tower project catalog: `blocked by 401`
- Audience Builder code: `local packages implemented, web entrypoint legacy`
- Production readiness: `not ready`
