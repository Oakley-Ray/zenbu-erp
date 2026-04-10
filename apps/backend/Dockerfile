# ── Stage 1: Build ──
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

# 先複製 lockfile 和 workspace 設定，利用 Docker cache
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/
COPY apps/backend/package.json apps/backend/

RUN pnpm install --frozen-lockfile

# 複製原始碼
COPY packages/shared-types/ packages/shared-types/
COPY packages/shared-utils/ packages/shared-utils/
COPY apps/backend/ apps/backend/
COPY tsconfig.base.json ./

# Build shared packages → backend
RUN pnpm --filter @layerframe/shared-types build && \
    pnpm --filter @layerframe/shared-utils build && \
    pnpm --filter @layerframe/backend build

# ── Stage 2: Production ──
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

# 只複製 production 需要的東西
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json /app/turbo.json ./
COPY --from=builder /app/packages/shared-types/package.json /app/packages/shared-types/dist/ packages/shared-types/
COPY --from=builder /app/packages/shared-utils/package.json /app/packages/shared-utils/dist/ packages/shared-utils/
COPY --from=builder /app/apps/backend/package.json apps/backend/
COPY --from=builder /app/apps/backend/dist/ apps/backend/dist/

RUN pnpm install --frozen-lockfile --prod

# 安全：不用 root 跑
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

EXPOSE 3000

CMD ["node", "apps/backend/dist/main.js"]
