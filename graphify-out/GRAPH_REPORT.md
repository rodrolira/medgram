# Graph Report - C:\Users\rlira\Desktop\Rorro\Programacion\medgram  (2026-07-18)

## Corpus Check
- 40 files · ~23,967 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 295 nodes · 315 edges · 45 communities detected
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 39 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]

## God Nodes (most connected - your core abstractions)
1. `ContentService` - 18 edges
2. `ContentController` - 12 edges
3. `Gate de Aprobación Obligatorio del Doctor` - 9 edges
4. `runGenerationPipeline()` - 8 edges
5. `generateCopy()` - 7 edges
6. `PublishWorker` - 5 edges
7. `Colegio Médico de Chile — Código de Ética` - 5 edges
8. `Dashboard de Aprobación del Doctor` - 5 edges
9. `ContentItem (modelo de datos)` - 5 edges
10. `createDemo()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `runGenerationPipeline()` --calls--> `generateCopy()`  [INFERRED]
  C:\Users\rlira\Desktop\Rorro\Programacion\medgram\packages\content-pipeline\src\pipeline.ts → C:\Users\rlira\Desktop\Rorro\Programacion\medgram\packages\content-pipeline\src\generator.ts
- `Severidades blocker/warning` --conceptually_related_to--> `Gate de Aprobación Obligatorio del Doctor`  [INFERRED]
  docs/COMPLIANCE.md → CLAUDE.md
- `apps/dashboard (Next.js — dashboard de aprobación del doctor)` --conceptually_related_to--> `Dashboard de Aprobación del Doctor`  [INFERRED]
  README.md → CLAUDE.md
- `createDemo()` --calls--> `runComplianceChecks()`  [INFERRED]
  C:\Users\rlira\Desktop\Rorro\Programacion\medgram\apps\api\prisma\seed-demo.ts → C:\Users\rlira\Desktop\Rorro\Programacion\medgram\packages\shared-types\src\compliance.ts
- `RoleSwitcher()` --calls--> `useRole()`  [INFERRED]
  C:\Users\rlira\Desktop\Rorro\Programacion\medgram\apps\dashboard\app\role-switcher.tsx → C:\Users\rlira\Desktop\Rorro\Programacion\medgram\apps\dashboard\lib\session.tsx

## Hyperedges (group relationships)
- **Reglas blocker que rechazan borradores antes del doctor** — docs_compliance_no_personal_attributes, docs_compliance_no_diagnostic_language, docs_compliance_no_guaranteed_claims, docs_compliance_no_before_after, docs_compliance_no_remote_diagnosis, docs_compliance_no_misleading_testimonials [EXTRACTED 1.00]
- **Flujo de generación, aprobación y publicación de contenido** — claude_content_pipeline, claude_compliance_check, claude_approval_dashboard, claude_publish_scheduler, claude_instagram_graph_api [EXTRACTED 1.00]
- **Marco regulatorio del contenido médico (Meta + Chile)** — claude_meta_personal_attributes_policy, claude_meta_health_ads_policy, claude_colegio_medico_codigo_etica, claude_ley_20584 [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
_Manages the lifecycle of content, handling creation, review, scheduling, regeneration, and status updates within a rule‑based system._
Cohesion: 0.06
Nodes (30): API_URL, FALLBACK_EMAIL, getContent(), regenerateContent(), review(), RULE_LABELS, scheduleContent(), STATUS_LABELS (+22 more)

### Community 1 - "Community 1"

Cohesion: 0.07
Nodes (24): ADMIN, API, approval, badCopy, blockers, check, created, detail (+16 more)

### Community 2 - "Community 2"

Cohesion: 0.19
Nodes (3): ContentService, RECHECKABLE_STATUSES, bootstrap()

### Community 3 - "Community 3"

Cohesion: 0.13
Nodes (19): Dashboard de Aprobación del Doctor, Log Inmutable de Auditoría de Aprobaciones, Campaign (modelo de datos, fase 3), Chequeo Automático de Compliance, ComplianceCheck (modelo de datos), Generador IA de Contenido (copy, imagen, guion video), ContentItem (modelo de datos), Instagram Graph API (Content Publishing) (+11 more)

### Community 4 - "Community 4"
_Ensures generated content complies with defined rules, assembles the final copy, formats blocker feedback, and supports demos such as agency or doctor messages._
Cohesion: 0.14
Nodes (13): COMPLIANCE_RULES, hasBlockerFailures(), runComplianceChecks(), composeFullCopy(), formatBlockerFeedback(), runGenerationPipeline(), AGENCY, createDemo() (+5 more)

### Community 5 - "Community 5"

Cohesion: 0.13
Nodes (5): PUBLISH_QUEUE, PublishQueueService, redisConnection(), PublishWorker, PublishingService

### Community 6 - "Community 6"

Cohesion: 0.13
Nodes (2): ContentController, DEFAULT_REVIEWER

### Community 7 - "Community 7"

Cohesion: 0.17
Nodes (15): Colegio Médico de Chile — Código de Ética, Gate de Aprobación Obligatorio del Doctor, Ley 20.584 (Chile) — Derechos y Deberes de los Pacientes, Meta Health & Wellness Ads Policy (2026), Meta Personal Attributes Policy, User (modelo de datos: agency_admin | doctor_approver), NO_BEFORE_AFTER (blocker), NO_DIAGNOSTIC_LANGUAGE (blocker) (+7 more)

### Community 8 - "Community 8"

Cohesion: 0.15
Nodes (9): GeneratePage(), SUGGESTIONS, TYPES, ROLES, RoleSwitcher(), ROLE_META, RoleContext, STORAGE_KEY (+1 more)

### Community 9 - "Community 9"

Cohesion: 0.17
Nodes (7): CHIP_STYLE, dayItems, inMonth, isToday, key, MONTHS, WEEKDAYS

### Community 10 - "Community 10"

Cohesion: 0.18
Nodes (8): BLOCKER_VIOLATIONS, blockers, check, CLEAN, failed, results, { runComplianceChecks, hasBlockerFailures, COMPLIANCE_RULES }, warnings

### Community 11 - "Community 11"
_Handles fetching, caching, and presenting data items with status, errors, warnings, and customizable styles._
Cohesion: 0.2
Nodes (9): EMPTY_HINT, [error, setError], [items, setItems], load, stamp, [status, setStatus], TABS, TYPE_STYLES (+1 more)

### Community 12 - "Community 12"

Cohesion: 0.39
Nodes (7): buildSystemPrompt(), buildUserPrompt(), DEFAULT_MODEL, generateCopy(), parseCopy(), stubCopy(), TYPE_GUIDANCE

### Community 13 - "Community 13"

Cohesion: 0.5
Nodes (3): ApproveContentDto, RejectContentDto, RequestChangesDto

### Community 14 - "Community 14"

Cohesion: 0.67
Nodes (1): NotificationService

### Community 15 - "Community 15"

Cohesion: 0.5
Nodes (1): PrismaService

### Community 16 - "Community 16"

Cohesion: 0.5
Nodes (2): INSTAGRAM_PUBLISHER, StubInstagramPublisher

### Community 17 - "Community 17"

Cohesion: 0.5
Nodes (1): PublishingController

### Community 18 - "Community 18"
_Manages active network links and path selection for routing._
Cohesion: 0.5
Nodes (3): active, LINKS, path

### Community 19 - "Community 19"

Cohesion: 0.5
Nodes (3): CONTENT_STATUSES, CONTENT_TYPES, USER_ROLES

### Community 20 - "Community 20"
_Manages database interactions through an ORM, providing data access and schema migrations._
Cohesion: 0.67
Nodes (1): prisma

### Community 21 - "Community 21"
_Handles availability and health status checks for the application._
Cohesion: 0.67
Nodes (1): HealthController

### Community 22 - "Community 22"
_Collects, stores, and exposes descriptive information about data assets for discovery, lineage, and governance purposes._
Cohesion: 0.67
Nodes (1): metadata

### Community 23 - "Community 23"
_Bootstraps and configures the main Angular application, providing top-level services and the root component._
Cohesion: 1.0
Nodes (1): AppModule

### Community 24 - "Community 24"

Cohesion: 1.0
Nodes (1): ContentModule

### Community 25 - "Community 25"

Cohesion: 1.0
Nodes (1): CreateContentDto

### Community 26 - "Community 26"
_This domain manages the process of generating textual or media content, using DTOs like GenerateContentDto to capture and validate user requests._
Cohesion: 1.0
Nodes (1): GenerateContentDto

### Community 27 - "Community 27"
_Provides a Prisma-based interface for performing database operations._
Cohesion: 1.0
Nodes (1): PrismaModule

### Community 28 - "Community 28"
_Handles creation, editing, and distribution of digital content._
Cohesion: 1.0
Nodes (1): PublishingModule

### Community 29 - "Community 29"

Cohesion: 1.0
Nodes (1): ScheduleContentDto

### Community 30 - "Community 30"
_Defines build‑time and runtime settings for a Next.js application, such as environment variables, routing, and transpilation options._
Cohesion: 1.0
Nodes (1): nextConfig

### Community 31 - "Community 31"
_Manages RESTful API requests, orchestrates background job processing, and persists data in PostgreSQL._
Cohesion: 1.0
Nodes (2): Stack Recomendado (Next.js, NestJS, PostgreSQL, BullMQ+Redis), apps/api (NestJS — API REST + jobs)

### Community 32 - "Community 32"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
_Unable to determine domain due to missing code entities._
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
_Provides a type‑safe interface to perform CRUD operations against a relational database._
Cohesion: 1.0
Nodes (1): @prisma/client

### Community 36 - "Community 36"
_Manages database interactions through an ORM, providing data access and schema migrations._
Cohesion: 1.0
Nodes (1): prisma

### Community 37 - "Community 37"
_Builds interactive user interface components with React and TypeScript._
Cohesion: 1.0
Nodes (1): tsx

### Community 38 - "Community 38"
_It provides optional static typing, transpilation to JavaScript, and tooling support to improve code safety and developer experience._
Cohesion: 1.0
Nodes (1): typescript

### Community 39 - "Community 39"
_Provides type declarations for Node.js core modules, enabling TypeScript to type-check Node runtime APIs._
Cohesion: 1.0
Nodes (1): @types/node

### Community 40 - "Community 40"
_Facilitates user interaction by coordinating requests to use case services and returning responses._
Cohesion: 1.0
Nodes (1): apps/*

### Community 41 - "Community 41"

Cohesion: 1.0
Nodes (1): packages/*

### Community 42 - "Community 42"
_Ensures that multiple processes or threads execute in parallel without conflict, handling synchronization, resource sharing, and scheduling._
Cohesion: 1.0
Nodes (1): concurrently

### Community 43 - "Community 43"
_It provides optional static typing, transpilation to JavaScript, and tooling support to improve code safety and developer experience._
Cohesion: 1.0
Nodes (1): typescript

### Community 44 - "Community 44"
_All core application logic for the system is organized within the src directory._
Cohesion: 1.0
Nodes (1): src/**/*

## Knowledge Gaps
- **130 isolated node(s):** `prisma`, `DOCTOR`, `AGENCY`, `DISCLAIMER`, `DEMO` (+125 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 23`** (2 nodes): `AppModule`, `app.module.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `content.module.ts`, `ContentModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `create-content.dto.ts`, `CreateContentDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `generate-content.dto.ts`, `GenerateContentDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `prisma.module.ts`, `PrismaModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `publishing.module.ts`, `PublishingModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `schedule-content.dto.ts`, `ScheduleContentDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `next.config.mjs`, `nextConfig`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `Stack Recomendado (Next.js, NestJS, PostgreSQL, BullMQ+Redis)`, `apps/api (NestJS — API REST + jobs)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `@prisma/client`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `prisma`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `typescript`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `@types/node`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `apps/*`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `packages/*`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `concurrently`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `typescript`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `src/**/*`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.