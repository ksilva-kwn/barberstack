FROM node:20-alpine AS base
RUN npm install -g pnpm
WORKDIR /app
FROM base AS deps
COPY package.json ./
RUN pnpm install --frozen-lockfile --prod
FROM base AS builder
COPY package.json tsconfig.json ./
RUN pnpm install --frozen-lockfile
COPY src ./src
RUN pnpm build
FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3002
CMD ["node", "dist/index.js"]
