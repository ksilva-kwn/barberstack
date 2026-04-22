# Build from monorepo root: docker build -f services/auth-service/Dockerfile .
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN npm install -g pnpm
WORKDIR /app

# ─── Install all dependencies ────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/logger/package.json ./packages/logger/
COPY services/auth-service/package.json ./services/auth-service/
RUN pnpm install --no-frozen-lockfile

# ─── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
COPY package.json pnpm-workspace.yaml ./
COPY --from=deps /app/pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/services/auth-service/node_modules ./services/auth-service/node_modules
COPY tsconfig.base.json ./
COPY packages/database ./packages/database
COPY packages/logger ./packages/logger
COPY services/auth-service ./services/auth-service
RUN cd packages/database && npx prisma generate
RUN pnpm --filter @barberstack/database build
RUN pnpm --filter @barberstack/logger build
RUN pnpm --filter @barberstack/auth-service build
RUN pnpm --filter @barberstack/auth-service deploy --prod /deploy
RUN cp -r services/auth-service/dist /deploy/dist
# Copia o cliente Prisma gerado do virtual store do builder para o do deploy
RUN find /app/node_modules/.pnpm -name ".prisma" -type d | \
    while read src; do \
      dst=$(echo "$src" | sed 's|/app/node_modules/|/deploy/node_modules/|'); \
      mkdir -p "$(dirname "$dst")"; \
      cp -r "$src" "$(dirname "$dst")/"; \
    done

# ─── Runtime ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /deploy/dist ./dist
EXPOSE 3001
CMD ["node", "dist/index.js"]
