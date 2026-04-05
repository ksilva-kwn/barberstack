# Barberstack — Especificações Técnicas

---

## 1. Visão Geral

**Barberstack** é um SaaS Multi-tenant para gestão de barbearias com foco em:
- Recorrência (assinaturas de clientes)
- Controle operacional (agenda, comandas, estoque)
- Banking integrado (Asaas White Label)
- Monetização em tiers (Bronze/Prata/Ouro)

---

## 2. Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Shadcn/UI, Recharts |
| Backend | Node.js + TypeScript, Express |
| ORM | Prisma 5 |
| Banco | PostgreSQL 16 |
| Auth | JWT (access 7d + refresh 30d) |
| Pagamentos | Asaas API v3 (White Label / Subcontas) |
| Notificações | WhatsApp API (configurável) |
| Cache | Redis (sessions, filas futuras) |
| Infra | AWS: Amplify + EC2 + RDS |
| IaC | Terraform 1.7+ |
| CI/CD | GitHub Actions |
| Containers | Docker + docker-compose |
| Monorepo | pnpm workspaces |

---

## 3. Planos SaaS (Quotas)

| Plano | Profissionais | Cortes/mês | Preço sugerido |
|-------|--------------|------------|----------------|
| Bronze | 1 | 80 | R$ 49/mês |
| Prata | 4 | 400 | R$ 99/mês |
| Ouro | Ilimitado | Ilimitado | R$ 199/mês |

A verificação de quota ocorre no `barbershop-service` antes de:
- Criar um novo profissional (`checkProfessionalQuota`)
- Registrar um novo agendamento (`checkAppointmentQuota`)

---

## 4. Arquitetura de Microserviços

```
                    ┌─────────────────┐
  Client (Browser)  │   Amplify CDN   │  Next.js 14
       ──────────── │  (frontend/web) │
                    └────────┬────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │   API Gateway   │  :3000
                    │ (auth + proxy)  │
                    └────────┬────────┘
                             │ HTTP (VPC interno)
         ┌───────────────────┼────────────────────┐
         │                   │                    │
  ┌──────▼──────┐    ┌───────▼──────┐   ┌────────▼──────┐
  │    auth     │    │  barbershop  │   │  appointment  │
  │  :3001      │    │    :3002     │   │    :3003      │
  └─────────────┘    └──────────────┘   └───────────────┘
         │                   │                    │
  ┌──────▼──────┐    ┌───────▼──────┐   ┌────────▼──────┐
  │subscription │    │   payment    │   │ notification  │
  │  :3004      │    │   (Asaas)    │   │  (WhatsApp)   │
  │             │    │    :3005     │   │    :3006      │
  └─────────────┘    └──────────────┘   └───────────────┘
         │                   │
  ┌──────▼───────────────────▼──────┐
  │           PostgreSQL RDS         │
  │      (private subnet, AWS)       │
  └──────────────────────────────────┘
```

---

## 5. Multi-tenancy

- Todas as tabelas operacionais possuem `barbershop_id` como foreign key
- O `api-gateway` extrai o `barbershopId` do JWT e propaga via header `x-barbershop-id`
- Cada query nos microserviços filtra por `barbershopId` — dados nunca se cruzam

---

## 6. Integração Asaas

### Fluxo de Cadastro
1. Barbearia se cadastra no Barberstack
2. `barbershop-service` cria o registro no banco
3. `payment-service` chama `POST /accounts` na API Asaas (conta master)
4. Asaas retorna `id`, `apiKey`, `walletId` da subconta
5. Dados armazenados em `barbershops.asaas_api_key` e `asaas_wallet_id`

### Fluxo de Pagamento (cliente da barbearia)
- Barbearia usa sua `asaasApiKey` para cobrar clientes (Pix/Boleto)
- Taxas transacionais descontadas do saldo da subconta
- Barberstack cobra mensalidade via conta master

### Fluxo de Saque
1. Dono acessa Financeiro → Solicitar Saque
2. Frontend chama `POST /api/payments/withdraw`
3. `payment-service` chama `POST /transfers` na subconta Asaas
4. Saldo transferido para conta bancária cadastrada

---

## 7. Variáveis de Ambiente

Ver [.env.example](.env.example) para referência completa.

Secrets sensíveis em produção devem ser gerenciados via:
- **Desenvolvimento**: `.env` local
- **CI/CD**: GitHub Actions Secrets
- **Produção**: AWS Secrets Manager (roadmap)

---

## 8. Infraestrutura AWS

```
┌─────────────────────────────────────────────┐
│                   AWS VPC                    │
│  10.0.0.0/16                                │
│                                             │
│  ┌──────────────┐   ┌──────────────────┐    │
│  │ Public Subnet│   │  Private Subnet  │    │
│  │ 10.0.0.0/24  │   │  10.0.10.0/24   │    │
│  │ 10.0.1.0/24  │   │  10.0.11.0/24   │    │
│  │              │   │                  │    │
│  │  ┌────────┐  │   │  ┌───────────┐  │    │
│  │  │  EC2   │  │   │  │   RDS     │  │    │
│  │  │t3.small│──┼───┼──│PostgreSQL │  │    │
│  │  │ (EIP)  │  │   │  │ db.t3.micro│ │    │
│  │  └────────┘  │   │  └───────────┘  │    │
│  └──────────────┘   └──────────────────┘    │
│                            IGW               │
└─────────────────────────────────────────────┘

Frontend: AWS Amplify (CDN, não dentro da VPC)
```

---

## 9. Caminho para Kubernetes

O projeto já está estruturado para migração futura:

1. **Agora**: docker-compose em EC2 único
2. **Fase 4**: Helm charts + EKS
   - Cada `services/*` vira um Deployment
   - `packages/database` roda como Job de migration
   - RDS permanece externo ao cluster
   - Amplify permanece para o frontend (ou migrar para CloudFront + S3)

Referências futuras:
- `k8s/` — Helm charts (a criar na Fase 4)
- HPA por serviço baseado em CPU/requests
