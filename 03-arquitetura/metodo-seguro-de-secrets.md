# Método seguro de entrega de variáveis por blog

## Objetivo

Garantir que cada blog novo receba automaticamente as configurações necessárias sem expor chaves no chat, nos handoffs, no Git, no browser ou nos profiles dos agentes.

## Princípio

O FBR Blogs não distribui valores de secrets. Ele distribui referências a secrets e configura a injeção no ambiente correto de execução.

```text
Control Tower gera/identifica credenciais
→ Secret Manager grava por namespace do blog
→ FBR Blogs registra apenas secret_ref
→ Easypanel injeta em runtime
→ Dev recebe .env.example e referências, nunca valores
→ Agentes usam apenas o escopo autorizado
```

## Namespace por blog

Cada blog recebe um namespace imutável baseado no ID do projeto, não apenas no nome:

```text
fbr/blogs/<control_tower_project_id>/
```

Exemplo conceitual:

```text
fbr/blogs/67065bd9-bef2-4c3c-ac8e-80aa3cb40080/
```

O slug pode aparecer como metadado, mas não deve ser a única identidade do secret para evitar colisões após renomeações.

## Classificação das variáveis

### Públicas

Podem ser entregues ao frontend quando necessário:

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou publishable key, quando aplicável

Mesmo as variáveis públicas devem ser geradas a partir do projeto correto e registradas no manifesto do blog.

### Privadas de runtime

Somente backend, worker ou serviço autorizado:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CONTROL_TOWER_API_KEY`
- `HERMES_API_KEY`
- `FBR_ADS_API_KEY`
- `IMAGE_PROVIDER_API_KEY`

Nunca entram no frontend, no `SOUL.md`, em skills, em handoffs ou em commits.

## Fluxo obrigatório para cada blog

### 1. Criar e validar o Gestor Editorial

O profile Hermes do Gestor Editorial é criado e validado antes do banco. O gestor recebe apenas contexto operacional e referências, não secrets mestres.

### 2. Provisionar o Control Tower

Théo executa o provisionamento após o gate do gestor. O sistema lê o projeto por `project_id` e `schema_name`, valida o readback e obtém os documentos de integração.

### 3. Criar o namespace de secrets

O FBR Blogs chama um adapter de Secret Manager com:

- `project_id`
- `slug`
- `schema_name`
- lista de nomes de variáveis necessárias
- origem de cada variável
- ambiente: `development`, `staging` ou `production`
- política de rotação

O payload nunca contém valores em logs ou em artefatos editoriais.

### 4. Gravar ou vincular secrets

O adapter deve preferir, nesta ordem:

1. Secret Manager nativo do Easypanel, para serviços hospedados nele
2. Bitwarden Secrets Manager ou 1Password, quando adotado como fonte central
3. Secret Manager compatível com Vault, quando disponível
4. Arquivo local somente em desenvolvimento, com `.gitignore`, permissões restritas e expiração definida

O banco registra apenas:

- `secret_ref`
- provider
- namespace
- nomes das variáveis
- versão
- timestamp
- responsável
- status de rotação

### 5. Gerar pacote seguro para o Dev

O `developer-doc` deve conter:

- `project_id`
- `schema_name`
- `template_key`
- nomes das variáveis
- referência do namespace
- instruções de injeção no Easypanel
- checklist de validação

O documento deve usar placeholders:

```env
SUPABASE_URL=<secret-manager:fbr/blogs/<project_id>/SUPABASE_URL>
SUPABASE_SERVICE_ROLE_KEY=<secret-manager:fbr/blogs/<project_id>/SUPABASE_SERVICE_ROLE_KEY>
```

O Dev acessa o valor somente pelo ambiente seguro do serviço ou por um fluxo de leitura autenticado e temporário.

### 6. Injetar no Easypanel

O FBR Blogs usa um adapter de deploy para associar o namespace ao serviço do blog. A aplicação recebe secrets no processo de runtime, sem gravá-los na imagem Docker ou no repositório.

A configuração deve ser idempotente: repetir o workflow atualiza a mesma referência, não cria cópias concorrentes.

### 7. Entregar handoffs ao Gestor Editorial

O `bigwriter-handoff` e o `frontend-adsense-handoff` são entregues ao Gestor Editorial como contexto operacional. Eles nunca carregam secrets. O Gestor usa apenas referências e solicita ao Théo qualquer operação técnica que exija acesso privado.

## Acesso dos agentes

- **Íris:** metadados do projeto, estados e referências; não lê secrets
- **Kora:** status, cards, owners, dependências e evidências; não lê secrets
- **Théo:** pode solicitar configuração de runtime e validar conectividade; acesso privado somente durante job autorizado e no escopo do blog
- **Gestor Editorial:** usa APIs do blog e contexto editorial; não recebe service role key
- **Gabe:** valida configuração, não precisa visualizar valores secretos
- **FBR Ads/Rafa:** usa integração própria e escopo de campanha; não recebe secrets do banco do blog
- **Email Guardian/Second Brain:** nunca recebem secrets de aplicação

## Rotação e revogação

- Secrets devem ter versão e data de criação
- Rotação deve criar nova versão antes de revogar a anterior
- O serviço deve ser reiniciado ou revalidado após a rotação
- A antiga referência deve ser revogada somente após health check
- Blog arquivado deve ter secrets desativados conforme política de retenção
- Qualquer vazamento suspeito exige revogação imediata e registro de incidente

## Gates de segurança

- Não criar secret sem `project_id` e `schema_name` confirmados
- Não entregar valores por mensagem, arquivo ou handoff
- Não registrar valores em logs, receipts ou eventos
- Não permitir que agentes leiam o namespace inteiro
- Não permitir que um blog acesse secrets de outro blog
- Não publicar o blog se a injeção de runtime não passar no health check
- Mudanças de provider, escopo, rotação ou produção exigem aprovação operacional de Sergio

## Variáveis do FBR Blogs

Os valores devem ser configurados no ambiente do próprio FBR Blogs, nunca neste documento:

```env
SECRETS_PROVIDER=easypanel
SECRETS_NAMESPACE_PREFIX=fbr/blogs
EASYPANEL_API_URL=<secret-manager-or-deploy-config>
EASYPANEL_API_TOKEN=<secret-manager>
```

A implementação deve aceitar providers por interface, sem fixar Easypanel como dependência irreversível.

## Critério de aceite

O critério de aceite da entrega de um novo blog é referência segura e health check de runtime autorizado. Neste commit, a entrega implementada é a referência/manifest local; o contrato oficial Easypanel e a validação de deployment real continuam pendentes
