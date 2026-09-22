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

**Conclusão:** `3400` é a porta interna padronizada/correta para o contrato do Control Tower, mas o código atualmente publicado está configurado para `3000`. Se o EasyPanel estiver configurado para encaminhar `3400`, essa divergência explica diretamente o `502 Bad Gateway`.

A correção deve alinhar Dockerfile/provider para uma única porta. A recomendação é manter `3400`, porque é o contrato central já usado pelo Control Tower, alterando o Dockerfile para `ENV PORT=3400` e `EXPOSE 3400`, e depois fazer deploy/readback do mesmo commit. Não basta mudar a porta no painel sem reconciliar o Dockerfile, nem mudar somente o Dockerfile sem confirmar o target EasyPanel.

## 6. Próxima ação segura

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
