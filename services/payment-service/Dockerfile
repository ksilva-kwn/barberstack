# Build from monorepo root: docker build -f services/payment-service/Dockerfile .
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
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
COPY package.json pnpm-workspace.yaml ./
COPY --from=deps /app/pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/services/payment-service/node_modules ./services/payment-service/node_modules
COPY tsconfig.base.json ./
COPY packages/database ./packages/database
COPY services/payment-service ./services/payment-service
RUN cd packages/database && npx prisma generate
RUN pnpm --filter @barberstack/database build
RUN pnpm --filter @barberstack/payment-service build
RUN pnpm --filter @barberstack/payment-service deploy --prod /deploy --ignore-scripts
RUN cp -r services/payment-service/dist /deploy/dist
# Copia o cliente Prisma gerado do virtual store do builder para o do deploy
RUN find /app/node_modules/.pnpm -name ".prisma" -type d |     while read src; do       dst=$(echo "$src" | sed 's|/app/node_modules/|/deploy/node_modules/|');       mkdir -p "$(dirname "$dst")";       cp -r "$src" "$(dirname "$dst")/";     done

# ─── Runtime ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=builder /deploy/node_modules ./node_modules
COPY --from=builder /deploy/dist ./dist
EXPOSE 3005
CMD ["node", "dist/index.js"]
