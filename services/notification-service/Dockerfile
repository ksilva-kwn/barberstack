# Build from monorepo root: docker build -f services/notification-service/Dockerfile .
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# ─── Install all dependencies ────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY services/notification-service/package.json ./services/notification-service/
RUN pnpm install --no-frozen-lockfile

# ─── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/services/notification-service/node_modules ./services/notification-service/node_modules
COPY tsconfig.base.json ./
COPY packages/database ./packages/database
COPY services/notification-service ./services/notification-service
RUN cd packages/database && npx prisma generate
RUN pnpm --filter @barberstack/database build
RUN pnpm --filter @barberstack/notification-service build

# ─── Runtime ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules
COPY packages/database/package.json ./packages/database/

COPY --from=builder /app/services/notification-service/node_modules ./node_modules
COPY --from=builder /app/services/notification-service/dist ./dist
EXPOSE 3006
CMD ["node", "dist/index.js"]
