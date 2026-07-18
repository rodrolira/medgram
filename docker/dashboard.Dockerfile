# Frontend Next.js (monorepo). Contexto de build = raíz del repo.
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/shared-types/package.json packages/shared-types/
COPY packages/content-pipeline/package.json packages/content-pipeline/
RUN npm ci
COPY . .
# NEXT_PUBLIC_API_URL se hornea en el build; el navegador llega a la API por el puerto del host.
RUN npm run build --workspace @medgram/dashboard

FROM node:20-slim
WORKDIR /app
COPY --from=build /app /app
WORKDIR /app/apps/dashboard
ENV NODE_ENV=production
CMD ["npm", "run", "start"]
