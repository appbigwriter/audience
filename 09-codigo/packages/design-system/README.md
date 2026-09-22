# @fbr-audience-builder/design-system

Camada de tokens visuais do Audience Builder (Track B / Agente B).

- `theme-manifest.ts` — schema versionado do ThemeManifest + validação por campo (AB-S3-001).
- `contrast.ts` — cálculo WCAG de contraste (detectável → validado).
- `presets.ts` — presets por nicho (dados, não decisão).
- `token-resolution.ts` — herança explícita template → nicho → Persona → overrides aprovados (AB-S3-002).
- `css-variables.ts` — geração determinística de CSS variables para preview/surfaces.

Regras:
- Nenhuma regra de domínio, persistência ou segredo nesta package.
- Alterações visuais são dados versionados; contraste inválido bloqueia.
