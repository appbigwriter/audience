# Receipt — Servidores locais de projetos encerrados

- **Task:** OPS-20260918-SERVERS-CLOSE-001
- **Data:** 2026-09-18
- **Owner:** David
- **Objetivo:** encerrar servidores/processos de desenvolvimento ativos antes da auditoria completa.

## Estado anterior

Foram identificados listeners de aplicações nas portas:

```text
3000, 3001, 3002, 3003, 3015, 3040, 3400
```

Os processos correspondentes eram `node.exe`, com wrappers npm/dev/start associados em alguns casos.

## Ação executada

Processos de aplicação identificados foram encerrados com `taskkill /PID /T /F`:

```text
6380, 23468, 33472, 18788, 2192, 18252, 25400, 23100,
8484, 8505, 38467, 10539
```

## Verificação posterior

Após o encerramento:

- nenhuma porta `3000`, `3001`, `3002`, `3003`, `3015`, `3040` ou `3400` permaneceu em `LISTENING`;
- nenhum processo `node`, `npm`, `next`, `vite` ou `tsx` de projeto permaneceu identificado;
- listeners restantes foram classificados como infraestrutura/sistema: Docker backend, WSL relay, `svchost.exe` e Kilo.

Docker/WSL e serviços do Windows não foram encerrados porque não foram classificados como servidores de aplicação dos projetos e a ação não autorizava desligamento da infraestrutura da máquina.
