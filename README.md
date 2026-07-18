# medgram

Plataforma de marketing médico para Instagram con **gate de aprobación obligatorio del doctor**. Ver [CLAUDE.md](CLAUDE.md) para el blueprint completo y [docs/COMPLIANCE.md](docs/COMPLIANCE.md) para las reglas de contenido.

## Requisitos

- Node.js 20+
- Docker Desktop (PostgreSQL + Redis)

## Opción A — todo en Docker (recomendado)

```powershell
docker compose up -d --build   # postgres + redis + api (:3001) + dashboard (:3000)
```

La API aplica las migraciones al arrancar. Para poblar datos de demo (opcional):

```powershell
npm install                                    # solo para tener prisma/tsx locales
npm run db:seed:demo -w @medgram/api           # contenido de ejemplo en todos los estados
```

## Opción B — apps en local, infra en Docker (dev)

```powershell
Copy-Item .env.example .env   # opcional: completar ANTHROPIC_API_KEY / SMTP
npm install
npm run db:up                 # solo PostgreSQL (5434) y Redis (6379)
npm run db:migrate -w @medgram/api   # aplica migraciones + seed de usuarios
npm run db:seed:demo -w @medgram/api # opcional: contenido de demo
npm run dev                   # dashboard :3000 + api :3001
```

## Estructura

```
apps/dashboard        Next.js — generación, cola por estado, aprobación, programación y calendario

apps/api              NestJS — API REST + jobs
packages/shared-types Tipos compartidos + reglas de compliance como código
packages/content-pipeline  Generación IA + validador de compliance
docs/COMPLIANCE.md    Reglas de Meta + Colegio Médico (fuente de verdad)
```

## Estado — Fase 1 (MVP)

- [x] Paso 1: estructura del monorepo, docker-compose, compliance documentado
- [x] Paso 2: schema PostgreSQL + migraciones (Prisma)
- [x] Paso 3: API REST (NestJS) + reglas de compliance en código + E2E (`npm run test:e2e`)
- [x] Paso 4: dashboard de aprobación (Next.js) — cola en `/`, detalle con preview + checklist + acciones en `/content/[id]`
- [x] Paso 5: pipeline de generación IA (`POST /content/generate`) — Claude API (`claude-opus-4-8`) con reintentos ante blockers; stub sin API key

## Fase 2 (andamiaje, sin publicar aún)

Preparado para enchufar la Instagram Content Publishing API cuando Meta apruebe la app:

- `POST /content/:id/schedule { scheduledFor? }` — `approved → scheduled` y encola el job (BullMQ + Redis).
- Worker (`PublishWorker`) consume la cola y llama a un **publicador STUB** que simula el flujo container→publish y marca `scheduled → published` con un `ig_media_id` ficticio.
- Desde el dashboard: pantalla de detalle de un ítem `approved` ofrece "Publicar ahora" o programar una fecha; el estado pasa a `scheduled` y luego a `published` (con el `ig_media_id` simulado visible).
- Para producción real: reemplazar `StubInstagramPublisher` (única clase a cambiar) — requiere cuenta Business + Meta App Review (fuera de nuestro control de tiempos).

## Calendario

`/calendar` — vista mensual (navegable) que ubica cada pieza en su día: **programadas** por `scheduledFor` (celeste) y **publicadas** por `publishedAt` (verde). Cada chip enlaza al detalle. Alimentado por `GET /content?status=scheduled|published`.

## Roles (separación de funciones)

El dashboard tiene un selector de rol en la cabecera (**Agencia / Doctor**, persistido en el navegador) que refleja la tesis del producto:

- **Agencia** (`admin@medgram.local`): genera, regenera contenido en `needs_changes`, y programa/publica lo aprobado.
- **Doctor** (`doctor_approver`): aprueba, rechaza o pide cambios. Es el único que puede aprobar (el backend devuelve 403 a otros roles).

Cada acción viaja con `x-user-email` según el rol, y queda atribuida en la auditoría (quién generó, quién aprobó, quién regeneró, quién publicó).

## Robustez

- **Email al doctor**: con SMTP configurado (`SMTP_HOST`…) se envía un email real con enlace al detalle; sin SMTP se loguea. Un fallo de envío no rompe el flujo.
- **Regenerar**: un ítem en `needs_changes` se puede regenerar (`POST /content/:id/regenerate`) usando el comentario del doctor como feedback; vuelve a `pending_approval` si pasa el gate.
- **Pipeline resiliente**: el generador reintenta errores transitorios (429/5xx vía SDK) y ante refusal / respuesta vacía / error no recuperable degrada al stub sin lanzar (el doctor revisa igual).

## Tests

- `npm test -w @medgram/shared-types` — 11 tests unitarios del validador de compliance (una regla por vez).
- `npm run test:e2e` — flujo completo contra la API + DB + Redis (requiere `npm run db:up` y la API corriendo): generación → compliance → aprobación → programación → publicación (stub) → regeneración.

La **Fase 3** (Meta Marketing API / ads) no está incluida.
