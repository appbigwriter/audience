---
name: criar-e-validar-gestor-editorial
description: Cria e valida o gestor editorial do blog.
version: 0.1.0
author: Sergio Castro, Hermes Agent
license: private
platforms: [windows, linux, macos]
metadata:
  hermes:
    tags: [blogs, gestor, intake]
    related_skills: []
---
# Criar e validar gestor editorial
## When to Use
Use após intake e antes de qualquer Control Tower.
## Procedure
1. Valide nome, slug, nicho, idioma e voz
2. Crie profile por adapter e associe bundle editorial
3. Execute health check com identidade do blog e status aguardando banco
4. Marque `validated` somente com evidência registrada
## Pitfalls
Nunca provisionar banco para compensar gestor ausente; nunca guardar segredo.
## Verification
Receipt contém profile id, validação e evento anterior ao provisionamento.
