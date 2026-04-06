# Build from monorepo root: docker build -f services/api-gateway/Dockerfile .
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# ─── Install all dependencies ────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY services/api-gateway/package.json ./services/api-gateway/
RUN pnpm install --no-frozen-lockfile

# ─── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/services/api-gateway/node_modules ./services/api-gateway/node_modules
COPY tsconfig.base.json ./
COPY packages/database ./packages/database
COPY services/api-gateway ./services/api-gateway
RUN cd packages/database && npx prisma generate
RUN pnpm --filter @barberstack/database build
RUN pnpm --filter @barberstack/api-gateway build

# ─── Runtime ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules
COPY packages/database/package.json ./packages/database/

COPY --from=builder /app/services/api-gateway/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
