# Build from monorepo root: docker build -f services/payment-service/Dockerfile .
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# ─── Install all dependencies ────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY services/payment-service/package.json ./services/payment-service/
RUN pnpm install --no-frozen-lockfile

# ─── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ./
COPY packages/database ./packages/database
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY services/payment-service ./services/payment-service
RUN cd packages/database && npx prisma generate
RUN pnpm --filter @barberstack/database build
RUN pnpm --filter @barberstack/payment-service build

# ─── Runtime ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules
COPY packages/database/package.json ./packages/database/
COPY --from=builder /app/services/payment-service/dist ./dist
EXPOSE 3005
CMD ["node", "dist/index.js"]
