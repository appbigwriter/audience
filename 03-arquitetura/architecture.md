# Arquitetura

```text
Dashboard/API → application services → domínio puro
                         ├─ Repository (mock/local; Postgres futuro)
                         ├─ Workflow/Kora authority
                         └─ Adapters: Hermes, Control Tower, FBR Ads, Image
```

Integrações não inventam endpoints externos. Interfaces internas permitem substituição segura. O Control Tower recebe `business_type=custom` e `template_key=custom_base` somente após health check do gestor.

Handoffs: developer doc em `03-arquitetura`, frontend/AdSense em `06-design`, BigWriter em `05-workflows`. Skills do projeto ficam em `skills/`.
