# @fbr-audience-builder/template-engine

Registry de templates versionados, catálogo de componentes de nicho e renderizador determinístico (Track B).

- `registry.ts` — AB-S3-003: famílias, versões, capacidades, compatibilidade, deprecação.
- `components.ts` — AB-S3-005: catálogo com schema de entrada, variantes e compatibilidade por família.
- `renderer.ts` — AB-S3-004: render de homepage/categoria/artigo com blocos versionados, estados vazios e landmarks.

Regras: renderização determinística para o mesmo manifesto+conteúdo; nenhuma regra de domínio ou persistência aqui.
