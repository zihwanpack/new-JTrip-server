# =====================
# 1️⃣ Build stage
# =====================
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

# Prisma Client 생성
RUN pnpm prisma generate

# TypeScript 빌드
RUN pnpm build


# ... (앞부분 Builder stage는 동일) ...

# =====================
# 2️⃣ Run stage
# =====================
FROM node:20-alpine

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

COPY prisma ./prisma
RUN pnpm prisma generate


COPY --from=builder /app/src/swagger ./dist/swagger


COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]