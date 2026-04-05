# Barberstack — Histórico de Decisões

> Registro de decisões arquiteturais e progresso do projeto.

---

## 2026-04-05 — Fundação do Projeto (v0.1.0)

### Decisões Arquiteturais

**Monorepo com pnpm workspaces**
- Escolhido para manter coesão entre serviços enquanto permite deploy independente
- Estrutura: `packages/` (shared libs), `services/` (microserviços), `frontend/`

**Microserviços vs Monolito**
- Iniciando com microserviços separados desde o início para facilitar a migração futura para Kubernetes (EKS)
- Cada serviço é um processo Node.js independente com seu próprio Dockerfile
- Comunicação interna via HTTP (não gRPC neste momento — simplifica desenvolvimento)

**Multi-tenancy via barbershop_id**
- Decisão: Row-level tenancy (todas as tabelas têm `barbershop_id`) ao invés de schema-per-tenant
- Motivo: mais simples de gerenciar com Prisma, suficiente para o volume inicial
- Futuro: avaliar migração para schema-per-tenant se houver isolamento de performance crítico

**API Gateway como único entry point**
- Todo tráfego passa pelo `api-gateway` (porta 3000)
- JWT validado uma vez no gateway; contexto propagado via headers `x-user-id`, `x-barbershop-id`, `x-user-role`
- Elimina necessidade de re-validar JWT em cada microserviço

**Quota Middleware no barbershop-service**
- Lógica centralizada em `quota.middleware.ts`
- Planos: Bronze (1 profissional / 80 cortes), Prata (4 / 400), Ouro (ilimitado)
- Verificação antes de criar profissional ou agendamento
- Resposta padronizada com `limit`, `current` e `upgrade` URL

**Integração Asaas — White Label**
- Subconta criada automaticamente no cadastro da barbearia (fire-and-forget para não bloquear o onboarding)
- `asaasApiKey` e `asaasWalletId` armazenados criptografados no banco (TODO: usar AWS Secrets Manager)
- Conta Master cobra o SaaS; subconta da barbearia recebe pagamentos dos clientes

**AWS Infrastructure**
- Frontend: Amplify (deploy automático do GitHub, CDN global, SSL grátis)
- Backend: EC2 t3.small com Elastic IP (simples, custo baixo para MVP)
- Database: RDS PostgreSQL 16 db.t3.micro (private subnet, encrypted, backup 7 dias)
- Evolução planejada: ECS Fargate → EKS conforme crescimento

**CI/CD — GitHub Actions**
- 3 pipelines independentes: backend, frontend, infrastructure
- Backend: build → Docker push ECR → deploy EC2 via SSH
- Infrastructure: plan em PRs, apply automático em push para main (com environment protection)

### Estrutura de Arquivos Criados

```
barberstack/
├── packages/database/        # Prisma schema + client compartilhado
├── services/
│   ├── api-gateway/          # Proxy + auth
│   ├── auth-service/         # JWT, login, registro
│   ├── barbershop-service/   # CRUD + quotas + KPIs
│   ├── appointment-service/  # Agenda, comandas, heatmap
│   ├── subscription-service/ # Planos e recorrência de clientes
│   ├── payment-service/      # Asaas integration
│   └── notification-service/ # WhatsApp
├── frontend/web/             # Next.js 14, Dark Mode, Dashboard
├── infrastructure/terraform/ # AWS VPC+EC2+RDS+Amplify
└── .github/workflows/        # CI/CD pipelines
```
