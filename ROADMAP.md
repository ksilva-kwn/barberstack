# Barberstack — Roadmap

> SaaS Multi-tenant para gestão de barbearias com assinaturas e controle operacional.
> Última atualização: 2026-04-05 (v0.2 — SSM + pipelines por serviço)

---

## Status por Fase

| Símbolo | Significado |
|---------|-------------|
| ✅ | Concluído |
| 🔧 | Em progresso |
| ⬜ | Pendente |
| 🔴 | Bloqueado |

---

## FASE 0 — Fundação e Infraestrutura ✅

### 0.1 Estrutura do Projeto
- [x] Monorepo com pnpm workspaces
- [x] `tsconfig.base.json` compartilhado
- [x] `.gitignore`, `.env.example`
- [x] `docker-compose.yml` (produção local)
- [x] `docker-compose.dev.yml` (apenas infra: postgres + redis)

### 0.2 Banco de Dados (Prisma)
- [x] Schema multi-tenant completo (`packages/database/prisma/schema.prisma`)
- [x] Entidades: `Barbershop`, `User`, `Professional`, `Service`, `Appointment`, `Product`, `Subscription`
- [x] Isolamento via `barbershop_id` em todas as tabelas operacionais
- [x] Enums: `UserRole`, `SaasPlan`, `AppointmentStatus`, etc.
- [x] Seed de dados de demonstração
- [ ] Migrations iniciais executadas no banco

### 0.3 Microserviços — Scaffold
- [x] `api-gateway` (porta 3000) — Proxy + JWT Auth middleware
- [x] `auth-service` (porta 3001) — Login, Registro, Refresh Token
- [x] `barbershop-service` (porta 3002) — CRUD + KPIs + Quota middleware
- [x] `appointment-service` (porta 3003) — Agenda, Comandas, Heatmap
- [x] `subscription-service` (porta 3004) — Planos de clientes, Recobrança
- [x] `payment-service` (porta 3005) — Integração Asaas (subconta, saldo, saque)
- [x] `notification-service` (porta 3006) — WhatsApp lembretes/confirmações
- [x] Dockerfiles para todos os serviços

### 0.4 Frontend
- [x] Next.js 14 (App Router) com TypeScript
- [x] Dark Mode com CSS variables (Tailwind)
- [x] Sidebar de navegação
- [x] Dashboard com KPI Cards
- [x] Gráfico de Faturamento (AreaChart)
- [x] Gráfico de Origem dos Agendamentos (PieChart)

### 0.5 Infraestrutura AWS (Terraform)
- [x] Módulo VPC (2 subnets públicas + 2 privadas, IGW, Route Tables)
- [x] Módulo Security Groups (EC2 + RDS)
- [x] Módulo RDS PostgreSQL 16 (db.t3.micro, encrypted, backup 7 dias)
- [x] Módulo EC2 Ubuntu 22.04 (t3.small, Elastic IP, userdata)
- [x] Módulo Amplify (frontend Next.js, auto-deploy do GitHub)
- [x] `terraform.tfvars.example`

### 0.6 CI/CD (GitHub Actions)
- [x] `_service-build-push.yml` — Workflow **reutilizável** (build→ECR→deploy EC2)
- [x] `svc-api-gateway.yml` — Pipeline independente (dispara só com mudança no serviço)
- [x] `svc-auth-service.yml`
- [x] `svc-barbershop-service.yml`
- [x] `svc-appointment-service.yml`
- [x] `svc-subscription-service.yml`
- [x] `svc-payment-service.yml`
- [x] `svc-notification-service.yml`
- [x] `svc-frontend.yml` — Valida build; deploy via Amplify webhook automático
- [x] `ci-infrastructure.yml` — Terraform Plan (PR) + Apply (main) com S3 backend

### 0.7 Secrets & Configuração
- [x] **AWS SSM Parameter Store** — todos os secrets armazenados como `SecureString`
- [x] EC2 com IAM role — lê SSM em boot, renova secrets diariamente via systemd timer
- [x] S3 backend para Terraform state (criptografado, versionado)
- [x] DynamoDB para state locking
- [x] `infrastructure/bootstrap/` — cria S3 + DynamoDB + IAM user para CI (roda 1x manualmente)
- [ ] Migrations executadas no banco (rodar após primeiro `terraform apply`)

---

## FASE 1 — Core Business ⬜

### 1.1 Autenticação Completa
- [ ] Middleware de auth em todos os serviços (verificar header `x-user-id`)
- [ ] Página de login no frontend (`/login`)
- [ ] Proteção de rotas (middleware Next.js)
- [ ] Fluxo de reset de senha por email

### 1.2 Agenda Visual (Grade Multiprofissional)
- [ ] Página `/agenda` com visualização dia/semana
- [ ] Grade lado a lado por profissional
- [ ] Status visual: Bloqueado (Rosa), Agendado (Cinza), Finalizado (Azul)
- [ ] Modal de Comanda (seleção de serviços, duração, valor)
- [ ] Ações rápidas: Faltou, Chegou, Confirmar WhatsApp

### 1.3 Módulo de Clientes
- [ ] Página `/clientes` — listagem com busca
- [ ] Perfil do cliente (histórico, assinaturas, preferências)
- [ ] Cadastro de cliente via recepção

### 1.4 Módulo Financeiro
- [ ] Página `/financeiro` — extrato por período
- [ ] Cálculo automático de comissões por atendimento
- [ ] Fluxo de saque (UI → payment-service → Asaas)
- [ ] Separação bruto/líquido/taxas Asaas

---

## FASE 2 — Assinaturas e Recorrência ⬜

### 2.1 Planos de Clientes
- [ ] Página `/assinaturas` — listagem de planos e assinantes
- [ ] Formulário de criação de plano (nome, preço, serviços incluídos)
- [ ] Indicadores: Ativo, Inadimplente, Cancelado

### 2.2 Gestão de Inadimplência
- [ ] Botão "Forçar Recobrança" (chama Asaas)
- [ ] Bloqueio automático de agendamento para inadimplentes
- [ ] Webhook Asaas para atualizar status de pagamento

### 2.3 Recorrência SaaS (Planos Bronze/Prata/Ouro)
- [ ] Página de upgrade de plano
- [ ] Cobrança automática via Asaas conta master
- [ ] Bloqueio automático ao atingir quota

---

## FASE 3 — Estoque e Marketing ⬜

### 3.1 Estoque
- [ ] Página `/estoque` — listagem com filtro por categoria
- [ ] Cadastro de produto (nome, preço, custo, estoque mínimo)
- [ ] Alerta visual de estoque abaixo do mínimo
- [ ] Baixa automática de estoque ao finalizar comanda

### 3.2 WhatsApp Automation
- [ ] Lembretes automáticos D-1 antes do agendamento
- [ ] Confirmação por WhatsApp (resposta SIM/NÃO)
- [ ] Campanha de reativação para clientes inativos

---

## FASE 4 — Kubernetes e Escala ⬜

### 4.1 Kubernetes (k8s)
- [ ] Helm charts para cada microserviço
- [ ] ConfigMaps e Secrets
- [ ] HorizontalPodAutoscaler por serviço
- [ ] Ingress com SSL (cert-manager)
- [ ] Migrar para Amazon EKS

### 4.2 Observabilidade
- [ ] Health checks em todos os serviços
- [ ] Logs centralizados (CloudWatch ou ELK)
- [ ] Métricas (Prometheus + Grafana)
- [ ] Alertas de quota e inadimplência

### 4.3 Multi-região / DR
- [ ] RDS Multi-AZ
- [ ] Read Replicas para relatórios
- [ ] Backup cross-region

---

## Secrets necessários no GitHub

Configure em `Settings > Secrets and variables > Actions`.
Os valores com * são gerados pelo `infrastructure/bootstrap` (`terraform output`).

| Secret | Descrição | Fonte |
|--------|-----------|-------|
| `AWS_ACCESS_KEY_ID` * | IAM User para CI/CD | bootstrap output |
| `AWS_SECRET_ACCESS_KEY` * | IAM Secret | bootstrap output |
| `AWS_REGION` | Ex: `us-east-1` | manual |
| `TF_BACKEND_BUCKET` * | Bucket S3 para Terraform state | bootstrap output |
| `TF_BACKEND_DYNAMODB_TABLE` * | Tabela DynamoDB para lock | bootstrap output |
| `DB_PASSWORD` | Senha do banco RDS | manual (forte) |
| `JWT_SECRET` | Segredo JWT (mínimo 32 chars) | manual |
| `ASAAS_MASTER_API_KEY` | API Key da conta master Asaas | Asaas dashboard |
| `GITHUB_REPO` | URL do repo para o Amplify | manual |
| `GH_TOKEN` | GitHub PAT com permissão `repo` | GitHub settings |
| `EC2_HOST` | IP do EC2 EIP (após terraform apply) | terraform output |
| `EC2_SSH_KEY` | Chave privada SSH do key pair | manual |
| `DATABASE_URL` | URL completa do RDS (para migrations) | terraform output |
| `NEXT_PUBLIC_API_URL` | URL pública da API (EC2 EIP) | terraform output |

> **Obs:** `JWT_SECRET`, `ASAAS_MASTER_API_KEY` e `DB_PASSWORD` são salvos automaticamente
> no SSM Parameter Store pelo Terraform. O EC2 os lê via IAM role — nunca ficam
> em texto claro no código, logs ou state.

---

## Comandos Rápidos

```bash
# Dev local (apenas infra)
docker compose -f docker-compose.dev.yml up -d

# Instalar dependências
pnpm install

# Gerar Prisma client
pnpm db:generate

# Executar migrations
pnpm db:migrate

# Seed
pnpm db:seed

# Dev frontend
pnpm dev:frontend

# Terraform
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# editar terraform.tfvars
terraform init
terraform plan
terraform apply
```
