---
name: provisionar-blog-com-control-tower
description: Provisiona schema custom após gate do gestor.
version: 0.1.0
author: Sergio Castro, Hermes Agent
license: private
platforms: [windows, linux, macos]
metadata:
  hermes:
    tags: [blogs, control-tower, schema]
    related_skills: []
---
# Provisionar blog com Control Tower
## When to Use
Use somente com gestor `validated`.
## Procedure
1. Valide slug único
2. Confirme o evento de validação da Kora
3. Chame o adapter com `custom/custom_base`
4. Leia project id, schema e status
5. Persista receipt e handoffs
## Pitfalls
Não invente endpoint ou credencial externa.
## Verification
Não há chamada quando o gate falha e o readback coincide com o slug.
