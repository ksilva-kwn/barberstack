# Build from monorepo root: docker build -f services/appointment-service/Dockerfile .
FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app

# ─── Install all dependencies ────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY services/appointment-service/package.json ./services/appointment-service/
RUN pnpm install --no-frozen-lockfile

# ─── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/services/appointment-service/node_modules ./services/appointment-service/node_modules
COPY tsconfig.base.json ./
COPY packages/database ./packages/database
COPY services/appointment-service ./services/appointment-service
RUN cd packages/database && npx prisma generate
RUN pnpm --filter @barberstack/database build
RUN pnpm --filter @barberstack/appointment-service build

# ─── Runtime ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Root node_modules (pnpm virtual store — symlink target)
COPY --from=builder /app/node_modules ./node_modules

# Shared database package
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/node_modules ./packages/database/node_modules
COPY packages/database/package.json ./packages/database/

# Service — keep at original path so pnpm symlinks resolve correctly
COPY --from=builder /app/services/appointment-service/node_modules ./services/appointment-service/node_modules
COPY --from=builder /app/services/appointment-service/dist ./services/appointment-service/dist
COPY services/appointment-service/package.json ./services/appointment-service/

WORKDIR /app/services/appointment-service
EXPOSE 3003
CMD ["node", "dist/index.js"]
