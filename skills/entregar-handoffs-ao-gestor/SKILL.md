---
name: entregar-handoffs-ao-gestor
description: Persiste e entrega os três handoffs do blog.
version: 0.1.0
author: Sergio Castro, Hermes Agent
license: private
platforms: [windows, linux, macos]
metadata:
  hermes:
    tags: [blogs, handoff, evidência]
    related_skills: []
---
# Entregar handoffs ao gestor
## When to Use
Use depois do readback Control Tower.
## Procedure
1. Salve developer-doc em `03-arquitetura`
2. Salve frontend/AdSense em `06-design`
3. Salve BigWriter em `05-workflows`
4. Entregue BigWriter ao profile validado e registre destinatário
## Pitfalls
Não enviar contexto antes de criar o gestor nem incluir segredos.
## Verification
Três entregas têm artefato, destinatário, timestamp e aceite pendente.
