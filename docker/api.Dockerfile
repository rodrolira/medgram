# Backend NestJS (monorepo). Contexto de build = raíz del repo.
FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
# package.json de raíz + de cada workspace (npm ci los necesita todos)
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/content-pipeline/package.json packages/content-pipeline/
RUN npm ci
COPY . .
# Generar el cliente Prisma ANTES de compilar: nest build necesita sus tipos.
RUN npx prisma generate --schema apps/api/prisma/schema.prisma \
 && npm run build:packages \
 && npm run build --workspace @medgram/api

FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build /app /app
WORKDIR /app/apps/api
ENV NODE_ENV=production
# Aplica migraciones pendientes y arranca la API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
